// frontend/src/redux/csrf.js
let csrfToken = null; // Store token in memory

export async function csrfFetch(url, options = {}) {
  options.method = options.method || 'GET';
  options.headers = options.headers || {};

  // For non-GET requests, add CSRF token if available
  if (options.method.toUpperCase() !== 'GET') {
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    if (csrfToken) {
      options.headers['XSRF-Token'] = csrfToken;
    } else {
      console.warn('CSRF token not available, attempting to fetch');
      await restoreCSRF(); // Fetch token if not set
      if (csrfToken) {
        options.headers['XSRF-Token'] = csrfToken;
      } else {
        console.error('CSRF token still not available after restore');
      }
    }
  }

  try {
    const res = await window.fetch(url, options);
    if (res.status >= 400) {
      const errorData = await res.json();
      throw new Error(errorData.message || `Request failed with status ${res.status}`);
    }
    return res;
  } catch (err) {
    console.error('csrfFetch error:', err.message);
    throw err;
  }
}

export async function restoreCSRF() {
  console.log('Fetching CSRF token from /api/csrf/restore');
  try {
    const response = await fetch('/api/csrf/restore'); // Use plain fetch to avoid recursion
    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }
    // Backend sets cookie, extract it from document.cookie
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const xsrfCookie = cookies.find(cookie => cookie.startsWith('XSRF-TOKEN='));
    if (xsrfCookie) {
      csrfToken = xsrfCookie.split('=')[1];
      console.log('CSRF token restored:', csrfToken);
    } else {
      console.warn('XSRF-TOKEN cookie not found in response');
    }
    return response;
  } catch (err) {
    console.error('Failed to restore CSRF:', err.message);
    throw err;
  }
}