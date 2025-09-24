( () => {
  try {
    const vsUrl = document.currentScript.dataset.vsUrl;

    if (!vsUrl) {
      throw new Error('CSES Companion: vsUrl not found');
    }

    require.config({ paths: { 'vs': vsUrl } });

    require(['vs/editor/editor.main'], () => {
      setTimeout(() => {
        const editorContainer = document.getElementById('cses-editor-container');
        if (!editorContainer) { return; }

        const editor = monaco.editor.create(editorContainer, {
          value: '// Editor is back. Features will be re-added step-by-step.',
          theme: 'vs-dark',
          language: 'cpp',
          fontSize: 16,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false
        });

        window.addEventListener('message', (event) => {
          if (event.source !== window || !event.data.type?.startsWith('cses-companion-')) return;

          const { type, language, fontSize, code } = event.data;
          if (type === 'cses-companion-set-lang') {
            monaco.editor.setModelLanguage(editor.getModel(), language);
          } else if (type === 'cses-companion-set-font') {
            editor.updateOptions({ fontSize: fontSize });
          } else if (type === 'cses-companion-get-code') {
            console.log('Getting code for submission...');
            const value = editor.getValue();
            window.postMessage({ type: 'cses-companion-response-code', code: value }, '*');
          } else if (type === 'cses-companion-insert-code') {
            editor.setValue(code);
          } else if (type === 'cses-companion-get-code-for-save') {
            const value = editor.getValue();
            window.postMessage({ type: 'cses-companion-response-code-for-save', code: value }, '*');
          } else if (type === 'cses-companion-get-code-for-run') {
            const value = editor.getValue();
            window.postMessage({ type: 'cses-companion-response-code-for-run', code: value }, '*');
          } else if (type === 'cses-companion-get-code-for-submit') {
            const value = editor.getValue();
            window.postMessage({ type: 'cses-companion-response-code-for-submit', code: value }, '*');
          }
        });

      }, 0);
    });
  } catch (err) {
    console.error('CSES Companion: Fatal error in initializer.js', err);
  }
})();