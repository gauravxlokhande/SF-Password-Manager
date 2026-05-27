/*
 * Developed by: Gaurav Lokhande
 * Email: gaurravLokhande@gmail.com
 * Portfolio: https://gauravxlokhande.github.io/gauravxlokhande/
 * Linkedin: www.linkedin.com/in/gauravlokhande
 * GitHub: https://github.com/gauravxlokhande
 * Trailhead: https://www.salesforce.com/trailblazer/gauravlokhande
 * Instagram: gaurravlokhande
 * @Version: 0.1 
 * @Completed on: 20 May 2026
 */

const pendingLogins = new Map(); // tabId → { user, pass }

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SF_DO_LOGIN') {
    startLogin(msg.org, sendResponse);
    return true; // async
  }
});

async function startLogin(org, sendResponse) {
  let url = (org.url || '').trim();
  if (!url.startsWith('http')) url = 'https://' + url;

  // Open the tab
  const tab = await chrome.tabs.create({ url });

  // Watch this specific tab for when it finishes loading the login page
  const tabId = tab.id;
  pendingLogins.set(tabId, { user: org.user, pass: org.pass });

  sendResponse({ ok: true, tabId });
}

// Listen for tab updates — when a pending tab finishes loading, inject the filler
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!pendingLogins.has(tabId)) return;

  const { user, pass } = pendingLogins.get(tabId);
  const tabUrl = tab.url || '';

  // Only inject if this looks like a Salesforce login page
  const isSFLogin = (
    tabUrl.includes('salesforce.com') ||
    tabUrl.includes('force.com') ||
    tabUrl.includes('cloudforce.com')
  );

  if (!isSFLogin) return;

  // Remove from pending so we don't inject again on further navigations
  pendingLogins.delete(tabId);

  // Inject the login script
  chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    func: autoFillAndSubmit,
    args: [user, pass]
  }).catch(err => {
    console.warn('SF Vault inject failed:', err.message);
  });
});

// Clean up if tab is closed before login
chrome.tabs.onRemoved.addListener(tabId => pendingLogins.delete(tabId));

// ── The function injected into the Salesforce login page ────────────
function autoFillAndSubmit(username, password) {
  'use strict';

  function setNative(el, value) {
    try {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, value);
    } catch (_) {
      el.value = value;
    }
    el.dispatchEvent(new Event('focus',  { bubbles: true }));
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur',   { bubbles: true }));
  }

  function findEl(...selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el; // must be visible
    }
    return null;
  }

  function doFill() {
    const uEl = findEl(
      '#username',
      'input[name="username"]',
      'input[type="email"][autocomplete]',
      'input[autocomplete="username"]',
      'input[placeholder*="sername"]',
      'input[placeholder*="mail"]'
    );
    const pEl = findEl(
      '#password',
      'input[name="password"]',
      'input[type="password"]',
      'input[autocomplete="current-password"]'
    );
    const btnEl = findEl(
      '#Login',
      '[name="Login"]',
      'input[type="submit"]',
      'button[type="submit"]',
      '.loginButton',
      'button[id*="login" i]',
      'button[class*="login" i]'
    );

    if (!uEl || !pEl) return false;

    // Fill username
    uEl.focus();
    setNative(uEl, username);

    // Fill password
    pEl.focus();
    setNative(pEl, password);

    // Submit after short delay so SF JS processes the values
    setTimeout(() => {
      if (btnEl) {
        btnEl.click();
      } else {
        const form = pEl.closest('form');
        if (form) form.submit();
      }
    }, 200);

    return true;
  }

  // Try immediately
  if (doFill()) return;

  // If form not ready yet, observe DOM
  let attempts = 0;
  const obs = new MutationObserver(() => {
    attempts++;
    if (doFill() || attempts > 60) obs.disconnect();
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });

  // Final timeout fallback — try once more after 3s then give up
  setTimeout(() => {
    obs.disconnect();
    doFill();
  }, 3000);
}
