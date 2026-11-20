// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const workerSource = readFileSync(new URL('../../public/worker.js', import.meta.url), 'utf8');

const SCOPE = 'https://dosound.test/';

interface FetchRequestLike {
  method: string;
  url: string;
  mode?: string;
}

interface ServiceWorkerEventLike {
  request?: FetchRequestLike;
  respondWith?: (promise: Promise<Response>) => void;
  waitUntil?: (promise: Promise<unknown>) => void;
}

interface PutCall {
  request: unknown;
  response: Response;
}

interface WorkerHarness {
  listeners: Map<string, (event: ServiceWorkerEventLike) => void>;
  cache: { addAll: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
  cachesFake: {
    open: ReturnType<typeof vi.fn>;
    keys: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    match: ReturnType<typeof vi.fn>;
  };
  selfFake: {
    skipWaiting: ReturnType<typeof vi.fn>;
    clients: { claim: ReturnType<typeof vi.fn> };
  };
  fetchFake: ReturnType<typeof vi.fn>;
  putCalls: PutCall[];
  matchResponses: Map<string, Response>;
}

function loadWorker(): WorkerHarness {
  const listeners = new Map<string, (event: ServiceWorkerEventLike) => void>();
  const putCalls: PutCall[] = [];
  const matchResponses = new Map<string, Response>();

  const lookupMatch = (request: unknown): Response | undefined => {
    const key =
      typeof request === 'string' ? request : (request as FetchRequestLike | undefined)?.url;
    return key === undefined ? undefined : matchResponses.get(key);
  };

  const cache = {
    addAll: vi.fn(async (_urls: string[]) => {}),
    put: vi.fn(async (request: unknown, response: Response) => {
      putCalls.push({ request, response });
    }),
  };

  const cachesFake = {
    open: vi.fn(async (_name: string) => cache),
    keys: vi.fn(async () => [] as string[]),
    delete: vi.fn(async (_key: string) => true),
    match: vi.fn(async (request: unknown) => lookupMatch(request)),
  };

  const selfFake = {
    registration: { scope: SCOPE },
    location: { origin: new URL(SCOPE).origin },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
    addEventListener: (type: string, handler: (event: ServiceWorkerEventLike) => void) => {
      listeners.set(type, handler);
    },
  };

  const fetchFake = vi.fn();

  const context = vm.createContext({
    self: selfFake,
    caches: cachesFake,
    fetch: fetchFake,
    Response,
    URL,
  });
  vm.runInContext(workerSource, context, { filename: 'worker.js' });

  return { listeners, cache, cachesFake, selfFake, fetchFake, putCalls, matchResponses };
}

const dispatch = (
  listeners: WorkerHarness['listeners'],
  type: string,
  event: ServiceWorkerEventLike,
) => {
  const handler = listeners.get(type);
  expect(handler).toBeDefined();
  handler?.(event);
};

const dispatchFetch = (listeners: WorkerHarness['listeners'], request: FetchRequestLike) => {
  const respondWith = vi.fn<(promise: Promise<Response>) => void>();
  const waitUntil = vi.fn<(promise: Promise<unknown>) => void>();
  dispatch(listeners, 'fetch', { request, respondWith, waitUntil });
  return { respondWith, waitUntil };
};

const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('service worker fetch handler', () => {
  it('caches a same-origin GET answered with an OK response', async () => {
    const worker = loadWorker();
    const request: FetchRequestLike = {
      method: 'GET',
      url: 'https://dosound.test/js/index.js',
    };
    worker.fetchFake.mockResolvedValue(new Response('body', { status: 200 }));

    const { respondWith } = dispatchFetch(worker.listeners, request);

    try {
      expect(respondWith).toHaveBeenCalledTimes(1);
      const response = await (respondWith.mock.calls[0]?.[0] as Promise<Response>);
      expect(response.status).toBe(200);
      await vi.waitFor(() => expect(worker.putCalls).toHaveLength(1));
      expect(worker.putCalls[0]?.request).toBe(request);
      expect(worker.putCalls[0]?.response.status).toBe(200);
    } catch (error) {
      console.log('cache write mismatch', worker.putCalls);
      throw error;
    }
  });

  it.each([404, 500])(
    'returns but does not cache a same-origin GET answered with %i',
    async (status) => {
      const worker = loadWorker();
      const request: FetchRequestLike = {
        method: 'GET',
        url: 'https://dosound.test/missing.asset',
      };
      worker.fetchFake.mockResolvedValue(new Response('nope', { status }));

      const { respondWith } = dispatchFetch(worker.listeners, request);

      try {
        expect(respondWith).toHaveBeenCalledTimes(1);
        const response = await (respondWith.mock.calls[0]?.[0] as Promise<Response>);
        expect(response.status).toBe(status);
      } catch (error) {
        console.log('error response mismatch', respondWith.mock.calls);
        throw error;
      }

      await flushAsync();
      expect(worker.putCalls).toHaveLength(0);
    },
  );

  it('ignores non-GET requests', () => {
    const worker = loadWorker();
    const { respondWith } = dispatchFetch(worker.listeners, {
      method: 'POST',
      url: 'https://dosound.test/api',
    });

    expect(respondWith).not.toHaveBeenCalled();
    expect(worker.fetchFake).not.toHaveBeenCalled();
  });

  it('ignores cross-origin requests', () => {
    const worker = loadWorker();
    const { respondWith } = dispatchFetch(worker.listeners, {
      method: 'GET',
      url: 'https://other.example.com/asset.js',
    });

    expect(respondWith).not.toHaveBeenCalled();
    expect(worker.fetchFake).not.toHaveBeenCalled();
  });

  it('falls back to the cached response when the network fails', async () => {
    const worker = loadWorker();
    const request: FetchRequestLike = {
      method: 'GET',
      url: 'https://dosound.test/js/index.js',
    };
    const cached = new Response('cached body', { status: 200 });
    worker.matchResponses.set(request.url, cached);
    worker.fetchFake.mockRejectedValue(new Error('offline'));

    const { respondWith } = dispatchFetch(worker.listeners, request);

    try {
      const response = await (respondWith.mock.calls[0]?.[0] as Promise<Response>);
      expect(response).toBe(cached);
    } catch (error) {
      console.log('cache fallback mismatch', respondWith.mock.calls);
      throw error;
    }
  });

  it('falls back to the cached index.html for navigate requests', async () => {
    const worker = loadWorker();
    const request: FetchRequestLike = {
      method: 'GET',
      url: SCOPE,
      mode: 'navigate',
    };
    const indexHtml = new Response('<html></html>', { status: 200 });
    worker.matchResponses.set(`${SCOPE}index.html`, indexHtml);
    worker.fetchFake.mockRejectedValue(new Error('offline'));

    const { respondWith } = dispatchFetch(worker.listeners, request);

    try {
      const response = await (respondWith.mock.calls[0]?.[0] as Promise<Response>);
      expect(response).toBe(indexHtml);
    } catch (error) {
      console.log('navigate fallback mismatch', respondWith.mock.calls);
      throw error;
    }
  });
});

describe('service worker lifecycle handlers', () => {
  it('precaches the app shell on install and claims clients', async () => {
    const worker = loadWorker();
    const waitUntilPromises: Promise<unknown>[] = [];

    dispatch(worker.listeners, 'install', {
      waitUntil: (promise) => {
        waitUntilPromises.push(promise);
      },
    });
    await Promise.all(waitUntilPromises);

    try {
      expect(worker.cache.addAll).toHaveBeenCalledWith([SCOPE, `${SCOPE}index.html`]);
      expect(worker.selfFake.skipWaiting).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('install mismatch', worker.cache.addAll.mock.calls);
      throw error;
    }
  });

  it('drops stale caches on activate and claims clients', async () => {
    const worker = loadWorker();
    worker.cachesFake.keys.mockResolvedValue([
      'dosound-tracker-1.0.0',
      'dosound-tracker-__APP_VERSION__',
    ]);
    const waitUntilPromises: Promise<unknown>[] = [];

    dispatch(worker.listeners, 'activate', {
      waitUntil: (promise) => {
        waitUntilPromises.push(promise);
      },
    });
    await Promise.all(waitUntilPromises);

    try {
      expect(worker.cachesFake.delete).toHaveBeenCalledTimes(1);
      expect(worker.cachesFake.delete).toHaveBeenCalledWith('dosound-tracker-1.0.0');
      expect(worker.selfFake.clients.claim).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('activate mismatch', worker.cachesFake.delete.mock.calls);
      throw error;
    }
  });
});
