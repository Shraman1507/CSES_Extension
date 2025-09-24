(() => {
  if (window.location.href.includes('/submit')) {
    chrome.storage.local.get('codeToSubmit', (result) => {
      if (chrome.runtime?.id && result.codeToSubmit) {
        const { code, language, filename } = result.codeToSubmit;

        const csesLanguages = {
          'cpp': 'C++',
          'java': 'Java',
          'python': 'Python 3'
        };
        const csesLanguage = csesLanguages[language];

        // Find the language select first, then get its form
        const languageSelect = document.querySelector('select[name="lang"]');
        if (!languageSelect) {
          console.error('CSES Companion: Language select not found.');
          return;
        }

        const form = languageSelect.form;
        if (!form) {
          console.error('CSES Companion: Submission form not found.');
          return;
        }

        if (csesLanguage) {
          languageSelect.value = csesLanguage;
        }

        try {
          const file = new File([code], filename, { type: 'text/plain' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          const fileInput = form.querySelector('input[type="file"]');

          if (fileInput) {
            fileInput.files = dataTransfer.files;
            chrome.storage.local.remove('codeToSubmit', () => {
              form.submit();
            });
          } else {
            console.error('CSES Companion: File input not found on the form!');
          }
        } catch (error) {
          console.error('CSES Companion: Error during submission process:', error);
        }
      }
    });
  }
})();