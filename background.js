importScripts('lib/templates.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'get-templates') {
        getTemplatesForLanguage(request.language).then(templates => {
            sendResponse({ templates });
        });
        return true; // Indicates that the response is sent asynchronously
    }
});