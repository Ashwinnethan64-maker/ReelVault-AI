document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  const saveBtn = document.getElementById('saveBtn');
  const statusMessage = document.getElementById('statusMessage');

  // Get current tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    urlInput.value = activeTab.url;
  });

  saveBtn.addEventListener('click', async () => {
    const url = urlInput.value;
    saveBtn.disabled = true;
    saveBtn.innerText = 'Saving...';

    try {
      // Send message to background script to handle auth/API call
      chrome.runtime.sendMessage({ action: 'save_video', url }, (response) => {
        if (response.success) {
          statusMessage.innerText = '✅ Saved successfully!';
          statusMessage.style.color = '#10b981';
          saveBtn.innerText = 'Saved';
        } else {
          statusMessage.innerText = '❌ Failed to save: ' + (response.error || 'Unknown error');
          statusMessage.style.color = '#ef4444';
          saveBtn.disabled = false;
          saveBtn.innerText = 'Try Again';
        }
      });
    } catch (err) {
      statusMessage.innerText = '❌ Failed to send request.';
      statusMessage.style.color = '#ef4444';
      saveBtn.disabled = false;
      saveBtn.innerText = 'Try Again';
    }
  });
});
