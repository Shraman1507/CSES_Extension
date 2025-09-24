(() => {
  // This script runs in the page context, so it cannot use chrome.* APIs.
  // The URLs are passed to it via data attributes on its own script tag.
  const baseUrl = document.currentScript.dataset.baseUrl;
  const workerMainUrl = document.currentScript.dataset.workerMainUrl;

  if (!baseUrl || !workerMainUrl) {
    throw new Error('CSES Companion: Could not get URLs for Monaco Environment.');
  }

  self.MonacoEnvironment = {
    getWorker: function (workerId, label) {
      // Create a new worker from a blob. This is the most robust way to
      // get workers to load in a cross-origin-isolated environment.
      const workerCode = `
        self.MonacoEnvironment = {
          baseUrl: '${baseUrl}'
        };
        importScripts('${workerMainUrl}');
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      return new Worker(URL.createObjectURL(blob), {
        name: label,
      });
    },
  };
})();