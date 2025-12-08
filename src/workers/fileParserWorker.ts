self.onmessage = (event: MessageEvent) => {
  void event;
  postMessage({ type: 'error', message: 'fileParserWorker not yet implemented' });
};
