chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'save_video') {
    // You would typically get the auth token from chrome.storage here
    const token = 'YOUR_SUPABASE_TOKEN'; // To be implemented with proper auth flow
    const apiUrl = 'http://localhost:5000/api/reels';

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ url: request.url })
    })
    .then(res => {
      if (!res.ok) throw new Error('API Error');
      return res.json();
    })
    .then(data => {
      sendResponse({ success: true, data });
    })
    .catch(error => {
      sendResponse({ success: false, error: error.message });
    });

    return true; // Keep message channel open for async response
  }
});
