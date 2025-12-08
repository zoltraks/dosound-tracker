self.onmessage = (event: MessageEvent) => {
  void event;
  postMessage({ type: 'error', message: 'audioProcessorWorker not yet implemented' });
};
