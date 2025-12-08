self.onmessage = (event: MessageEvent) => {
  void event;
  postMessage({ type: 'error', message: 'dataValidationWorker not yet implemented' });
};
