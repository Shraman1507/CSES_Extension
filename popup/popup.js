document.addEventListener('DOMContentLoaded', function() {
  const templateManagerBtn = document.getElementById('template-manager-btn');
  const settingsBtn = document.getElementById('settings-btn');

  if (templateManagerBtn) {
    templateManagerBtn.addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
    });
  }
});