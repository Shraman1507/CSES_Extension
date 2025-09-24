( () => {
  // 1. Prevent multiple injections
  if (document.getElementById('cses-editor-container')) {
    return;
  }

  

  // 2. Create and inject CSS styles
  const styles = `
    #cf-lite-toolbar {
      background-color: #252526;
      padding: 8px;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    #cf-lite-toolbar select, #cf-lite-toolbar button {
      border: 1px solid #444;
      background-color: #3c3c3c;
      color: #CCC;
      padding: 5px 10px;
      border-radius: 3px;
      font-family: inherit;
    }
    #cf-lite-toolbar button:hover:not(:disabled) {
      background-color: #555;
    }
    #cf-lite-submit-btn {
      background-color: #4CAF50;
      color: white;
      border: none;
      margin-left: auto; /* Pushes it to the right */
    }
    #cf-lite-run-btn {
      background-color: #2196F3;
      color: white;
      border: none;
    }
    #cf-lite-run-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    #cses-editor-container {
      height: 500px;
      width: 100%;
      border: 1px solid #333;
      border-top: none; /* Toolbar acts as top border */
    }
    #cses-companion-samples-container {
      margin-top: 20px;
    }
    .sample-case {
      margin-bottom: 20px;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 10px;
    }
    .sample-io {
      display: flex;
      gap: 20px;
    }
    .sample-io > div {
      flex: 1;
    }
    .sample-io h5 {
      margin-top: 0;
    }
    .sample-io pre {
      background-color:rgb(200, 200, 200);
      padding: 10px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    #cses-companion-output-container {
      margin-top: 20px;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 10px;
    }
    #cses-companion-output-content {
      background-color:rgb(200, 200, 200);
      padding: 10px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
      min-height: 50px;
    }
  `;
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  // 3. Create UI elements
  const mainContainer = document.createElement('div');
  mainContainer.style.marginTop = '20px';

  const toolbar = document.createElement('div');
  toolbar.id = 'cf-lite-toolbar';

  const languageSelector = document.createElement('select');
  const languages = {
    'cpp': { name: 'C++', monacoLang: 'cpp', filename: 'solution.cpp', judge0Id: 54 },
    'java': { name: 'Java', monacoLang: 'java', filename: 'Solution.java', judge0Id: 62 },
    'python': { name: 'Python', monacoLang: 'python', filename: 'solution.py', judge0Id: 71 }
  };
  for (const [value, { name }] of Object.entries(languages)) {
    languageSelector.options.add(new Option(name, value));
  }

  chrome.storage.local.get(['language', 'fontSize'], (result) => {
    if (!chrome.runtime?.id) return;
    if (result.language) {
        languageSelector.value = result.language;
    }
    if (result.fontSize) {
        fontSizeSelector.value = result.fontSize;
    }
    // After setting the initial values, get the templates
    getTemplatesForCurrentLanguage();
    // Set initial editor settings
    window.postMessage({ type: 'cses-companion-set-lang', language: languages[languageSelector.value].monacoLang }, '*');
    window.postMessage({ type: 'cses-companion-set-font', fontSize: parseInt(fontSizeSelector.value) }, '*');
  });

  const fontSizeSelector = document.createElement('select');
  const fontSizes = ['12px', '14px', '16px', '18px', '20px'];
  fontSizes.forEach(size => fontSizeSelector.options.add(new Option(size, size)));
  fontSizeSelector.value = '16px';

  const templateSelector = document.createElement('select');
  templateSelector.id = 'cf-lite-template-selector';
  templateSelector.options.add(new Option('Select a template', ''));

  const runButton = document.createElement('button');
  runButton.id = 'cf-lite-run-btn';
  runButton.textContent = 'Run';
  runButton.disabled = false;
  console.log('Run button created:', runButton);

  const submitButton = document.createElement('button');
  submitButton.id = 'cf-lite-submit-btn';
  submitButton.textContent = 'Submit';
  console.log('Submit button created:', submitButton);

  toolbar.append(languageSelector, fontSizeSelector, templateSelector, runButton, submitButton);

  const editorContainer = document.createElement('div');
  editorContainer.id = 'cses-editor-container';

  const outputContainer = document.createElement('div');
  outputContainer.id = 'cses-companion-output-container';
  outputContainer.innerHTML = `
    <h4>Run Results</h4>
    <div id="cses-companion-output-content"></div>
  `;

  mainContainer.append(toolbar, editorContainer, outputContainer);

  // 4. Inject UI into the page
  const contentArea = document.querySelector('.content') || document.body;
  contentArea.prepend(mainContainer);

  const originalForm = document.querySelector('form[action^="/problemset/"]');
  if (originalForm) {
      originalForm.style.display = 'none';
  }

  const problemId = window.location.href.match(/task\/(\d+)/)[1];
  const savedCodeKey = `savedCode-${problemId}`;

  let sampleCases = [];

  function scrapeAndDisplaySampleCases() {
    const samplesContainer = document.createElement('div');
    samplesContainer.id = 'cses-companion-samples-container';
    
    const md = document.querySelector('.md');
    if (!md) return;
  
    const children = Array.from(md.children);
    let currentSample = {};
  
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      if (el.tagName === 'P' && el.textContent.trim() === 'Input:') {
        if (children[i+1] && children[i+1].tagName === 'PRE') {
          currentSample.input = children[i+1].textContent;
          i++; // skip the <pre>
        }
      }
      if (el.tagName === 'P' && el.textContent.trim() === 'Output:') {
        if (children[i+1] && children[i+1].tagName === 'PRE') {
          currentSample.output = children[i+1].textContent;
          i++; // skip the <pre>
          if (currentSample.input) {
            sampleCases.push(currentSample);
            currentSample = {};
          }
        }
      }
    }
  
    if (sampleCases.length > 0) {
      sampleCases.forEach((sample, index) => {
        const sampleCaseDiv = document.createElement('div');
        sampleCaseDiv.className = 'sample-case';
        sampleCaseDiv.innerHTML = `
          <h4>Sample ${index + 1}</h4>
          <div class="sample-io">
            <div>
              <h5>Input</h5>
              <pre>${sample.input}</pre>
            </div>
            <div>
              <h5>Output</h5>
              <pre>${sample.output}</pre>
            </div>
          </div>
        `;
        samplesContainer.appendChild(sampleCaseDiv);
      });
      mainContainer.insertBefore(samplesContainer, outputContainer);
    }
  }

  scrapeAndDisplaySampleCases();

  // Load saved code
  chrome.storage.local.get(savedCodeKey, (result) => {
    if (!chrome.runtime?.id) return;
    if (result[savedCodeKey]) {
        window.postMessage({ type: 'cses-companion-insert-code', code: result[savedCodeKey] }, '*');
    }
  });

  // Auto-save code
  setInterval(() => {
    window.postMessage({ type: 'cses-companion-get-code-for-save' }, '*');
  }, 5000);

  function updateTemplateSelector(templates) {
    templateSelector.innerHTML = '<option value="">Select a template</option>';
    templates.forEach(template => {
        const option = new Option(template.name, template.code);
        templateSelector.options.add(option);
    });
  }

  function getTemplatesForCurrentLanguage() {
    const currentLanguage = languageSelector.value;
    if (!chrome.runtime?.id) {
      return;
    }
    chrome.runtime.sendMessage({ type: 'get-templates', language: currentLanguage }, (response) => {
        if (chrome.runtime?.id && response && response.templates) {
            updateTemplateSelector(response.templates);
        }
    });
  }

  // 5. Set up listeners
  languageSelector.addEventListener('change', (e) => {
    if (!chrome.runtime?.id) return;
    const newLanguage = e.target.value;
    window.postMessage({ type: 'cses-companion-set-lang', language: languages[newLanguage].monacoLang }, '*');
    getTemplatesForCurrentLanguage();
    chrome.storage.local.set({ language: newLanguage });
  });

  fontSizeSelector.addEventListener('change', (e) => {
    if (!chrome.runtime?.id) return;
    const newFontSize = e.target.value;
    window.postMessage({ type: 'cses-companion-set-font', fontSize: parseInt(newFontSize) }, '*');
    chrome.storage.local.set({ fontSize: newFontSize });
  });

  templateSelector.addEventListener('change', (e) => {
    if (e.target.value) {
        window.postMessage({ type: 'cses-companion-insert-code', code: e.target.value }, '*');
    }
  });

  submitButton.addEventListener('click', () => {
    window.postMessage({ type: 'cses-companion-get-code-for-submit' }, '*');
  });

  runButton.addEventListener('click', () => {
    console.log('Run button clicked!');
    window.postMessage({ type: 'cses-companion-get-code-for-run' }, '*');
  });

  // 6. Listen for messages from the injected script
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!chrome.runtime?.id) return;

    const { type, code } = event.data;

    if (type === 'cses-companion-response-code-for-submit') {
      const selectedLanguage = languageSelector.value;
      const problemId = window.location.href.match(/task\/(\d+)/)[1];
      const submitUrl = `https://cses.fi/problemset/submit/${problemId}/`;

      chrome.storage.local.set({
        'codeToSubmit': {
          code: code,
          language: selectedLanguage,
          filename: languages[selectedLanguage].filename
        }
      }, () => {
        window.location.href = submitUrl;
      });
    } else if (type === 'cses-companion-response-code-for-save') {
      chrome.storage.local.set({ [savedCodeKey]: code });
    } else if (type === 'cses-companion-response-code-for-run') {
      runCode(code);
    }
  });

  async function runCode(code) {
    const outputContent = document.getElementById('cses-companion-output-content');
    if (!outputContent) return;

    outputContent.textContent = 'Running...';

    // Get API Key from storage
    chrome.storage.local.get(['judge0ApiKey'], async (result) => {
        if (chrome.runtime.lastError || !result.judge0ApiKey) {
            const optionsUrl = chrome.runtime.getURL('options/options.html');
            outputContent.innerHTML = `Error: Judge0 API Key not found. Please set it in the <a href="${optionsUrl}" target="_blank">extension options</a>.`;
            return;
        }

        const JUDGE0_API_KEY = result.judge0ApiKey;

        if (sampleCases.length === 0) {
            outputContent.textContent = 'No sample cases found to run against.';
            return;
        }

        const selectedLanguage = languageSelector.value;
        const languageId = languages[selectedLanguage].judge0Id;
        const sourceCode = code;
        const stdin = sampleCases[0].input;

        const options = {
            method: 'POST',
            headers: {
                'x-rapidapi-key': JUDGE0_API_KEY,
                'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                language_id: languageId,
                source_code: sourceCode,
                stdin: stdin
            })
        };

        try {
            const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', options);
            const result = await response.json();

            if (response.ok) {
                displayResult(result);
            } else {
                let errorText = `Error: ${result.message || 'Failed to create submission.'}`;
                 switch (response.status) {
                    case 401:
                        const optionsUrl = chrome.runtime.getURL('options/options.html');
                        errorText = `Error: Invalid API key. Please check your Judge0 API key in the <a href="${optionsUrl}" target="_blank">extension options</a>.`;
                        break;
                    case 402:
                        errorText = "Error: API key quota exceeded. Please check your Judge0 plan and billing details.";
                        break;
                    case 429:
                        errorText = "Error: Rate limit exceeded. Please wait a moment and try again.";
                        break;
                }
                console.error('Judge0 API Error:', result);
                outputContent.innerHTML = `${errorText} (Status: ${response.status}). See https://rapidapi.com/judge0-official/api/judge0-ce/details for more information.`;
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            outputContent.textContent = `Error: ${error.message}`;
        }
    });
  }

  function displayResult(result) {
    console.log('Displaying result:', result);
    const outputContent = document.getElementById('cses-companion-output-content');
    let output = '';

    if (result.status.id === 3) { // Accepted
      const actualOutput = (result.stdout || '').trim();
      const expectedOutput = (sampleCases[0].output || '').trim();
      if (actualOutput === expectedOutput) {
        output = `Sample 1: PASSED\n\nOutput:\n${result.stdout}`;
      } else {
        output = `Sample 1: FAILED\n\nExpected Output:\n${expectedOutput}\n\nYour Output:\n${result.stdout}`;
      }
    } else if (result.status.id === 4) { // Wrong Answer
        output = `Sample 1: WRONG ANSWER\n\nOutput:\n${result.stdout}`;
    } else if (result.status.id === 5) { // Time Limit Exceeded
        output = `Sample 1: TIME LIMIT EXCEEDED`;
    } else if (result.status.id === 6) { // Compilation Error
        output = `COMPILATION ERROR\n\n${result.compile_output}`;
    } else { // Other errors
        output = `ERROR: ${result.status.description}\n\n${result.stderr || ''}`;
    }

    console.log('Final output text:', output);
    outputContent.textContent = output;
  }

  // 7. Inject scripts in the correct order
  if (chrome.runtime?.id) {
    const envScript = document.createElement('script');
    envScript.src = chrome.runtime.getURL('content/monaco-environment.js');
    envScript.dataset.baseUrl = chrome.runtime.getURL('lib/monaco/');
    envScript.dataset.workerMainUrl = chrome.runtime.getURL('lib/monaco/vs/base/worker/workerMain.js');
    envScript.onload = () => {
      // After the environment is set up, load the Monaco loader
      const loaderScript = document.createElement('script');
      loaderScript.src = chrome.runtime.getURL('lib/monaco/loader.js');
      loaderScript.onload = () => {
        // After the loader is ready, load the initializer
        if (!chrome.runtime?.id) return;
        const vsUrl = chrome.runtime.getURL('lib/monaco/vs');
        const initializerScript = document.createElement('script');
        initializerScript.src = chrome.runtime.getURL('content/initializer.js');
        initializerScript.dataset.vsUrl = vsUrl;
        document.head.appendChild(initializerScript);
      };
      document.head.appendChild(loaderScript);
    };
    document.head.appendChild(envScript);
  }
})();
