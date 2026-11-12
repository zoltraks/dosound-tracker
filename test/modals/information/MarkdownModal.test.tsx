import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MarkdownModal } from '../../../src/modals/information/MarkdownModal.tsx';
import { loadUiState, updateMarkdownScroll } from '../../../src/utils/storage/uiState.ts';

afterEach(() => cleanup());

type MarkdownModalProps = Parameters<typeof MarkdownModal>[0];

const makeProps = (overrides: Partial<MarkdownModalProps> = {}): MarkdownModalProps => ({
  isOpen: true,
  title: 'Manual',
  content: '# Heading\n\nSome **bold** text.',
  downloadHref: 'docs/manual.md',
  onClose: vi.fn(),
  ...overrides,
});

const renderModal = (overrides: Partial<MarkdownModalProps> = {}) =>
  render(<MarkdownModal {...makeProps(overrides)} />);

describe('MarkdownModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('renders the title and the markdown content as HTML', () => {
    const { container } = renderModal();
    const body = container.querySelector('.text-display-body') as HTMLElement;
    try {
      expect(screen.getByText('Manual')).toBeTruthy();
      expect(body.innerHTML).toContain('<h1>Heading</h1>');
      expect(body.innerHTML).toContain('<strong class="markdown-strong">bold</strong>');
    } catch (error) {
      console.log('markdown html', body.innerHTML);
      throw error;
    }
  });

  it('escapes raw markup in the content', () => {
    const { container } = renderModal({ content: 'paragraph with <script>alert(1)</script>' });
    const body = container.querySelector('.text-display-body') as HTMLElement;
    try {
      expect(body.innerHTML).not.toContain('<script>');
      expect(body.innerHTML).toContain('&lt;script&gt;');
    } catch (error) {
      console.log('escaped html', body.innerHTML);
      throw error;
    }
  });

  it('hides the title bar when showTitle is false', () => {
    const { container } = renderModal({ showTitle: false });
    try {
      expect(container.querySelector('.modal-title')).toBeNull();
      expect(container.querySelector('.text-display-body')).not.toBeNull();
    } catch (error) {
      console.log('title mismatch', container.innerHTML);
      throw error;
    }
  });

  it('links DOWNLOAD to downloadHref and routes OK to onClose', () => {
    const onClose = vi.fn();
    renderModal({ downloadHref: 'release/manual.md', onClose });
    const link = screen.getByRole('link', { name: 'DOWNLOAD' });
    try {
      expect(link.getAttribute('href')).toBe('release/manual.md');
      expect(link.hasAttribute('download')).toBe(true);
    } catch (error) {
      console.log('download link', link.outerHTML);
      throw error;
    }
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    try {
      expect(onClose).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('close call', onClose.mock.calls);
      throw error;
    }
  });

  it('restores the persisted scroll offset on open', async () => {
    updateMarkdownScroll(240);
    const { container } = renderModal();
    await act(async () => {});
    const body = container.querySelector('.text-display-body') as HTMLElement;
    try {
      // jsdom has no layout engine, so this can only verify the value the
      // modal assigned to scrollTop - the actual scroll restoration stays a
      // recorded partial-verification boundary.
      expect(body.scrollTop).toBe(240);
    } catch (error) {
      console.log('restored scroll', body.scrollTop);
      throw error;
    }
  });

  it('skips the scroll restore while content is empty', async () => {
    updateMarkdownScroll(240);
    const { container } = renderModal({ content: '' });
    await act(async () => {});
    const body = container.querySelector('.text-display-body') as HTMLElement;
    try {
      expect(body.scrollTop).toBe(0);
    } catch (error) {
      console.log('empty-content scroll', body.scrollTop);
      throw error;
    }
  });

  it('restores again after a close and reopen cycle', async () => {
    updateMarkdownScroll(50);
    const props = makeProps();
    const { container, rerender } = render(<MarkdownModal {...props} />);
    await act(async () => {});
    const firstBody = container.querySelector('.text-display-body') as HTMLElement;
    expect(firstBody.scrollTop).toBe(50);
    updateMarkdownScroll(90);
    rerender(<MarkdownModal {...props} isOpen={false} />);
    await act(async () => {});
    rerender(<MarkdownModal {...props} />);
    await act(async () => {});
    const reopened = container.querySelector('.text-display-body') as HTMLElement;
    try {
      expect(reopened.scrollTop).toBe(90);
      expect(reopened).not.toBe(firstBody);
    } catch (error) {
      console.log('reopened scroll', reopened.scrollTop);
      throw error;
    }
  });

  it('persists the scroll offset after a 150ms debounce', () => {
    vi.useFakeTimers();
    try {
      const { container } = renderModal();
      const body = container.querySelector('.text-display-body') as HTMLElement;
      body.scrollTop = 333;
      fireEvent.scroll(body);
      act(() => {
        vi.advanceTimersByTime(149);
      });
      try {
        expect(loadUiState().markdownScroll).toBe(0);
      } catch (error) {
        console.log('pre-debounce store', loadUiState());
        throw error;
      }
      act(() => {
        vi.advanceTimersByTime(1);
      });
      try {
        expect(loadUiState().markdownScroll).toBe(333);
      } catch (error) {
        console.log('post-debounce store', loadUiState());
        throw error;
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('debounces rapid scrolls into a single persisted value', () => {
    vi.useFakeTimers();
    try {
      const { container } = renderModal();
      const body = container.querySelector('.text-display-body') as HTMLElement;
      body.scrollTop = 100;
      fireEvent.scroll(body);
      act(() => {
        vi.advanceTimersByTime(100);
      });
      body.scrollTop = 200;
      fireEvent.scroll(body);
      act(() => {
        vi.advanceTimersByTime(150);
      });
      try {
        expect(loadUiState().markdownScroll).toBe(200);
      } catch (error) {
        console.log('debounced store', loadUiState());
        throw error;
      }
    } finally {
      vi.useRealTimers();
    }
  });
});
