# SF Password Manager — Salesforce Login Manager

> One-click login to any Salesforce org — Production, Sandbox, or custom My Domain — directly from your browser toolbar.

<img width="1154" height="359" alt="Screenshot 2026-05-27 at 12 24 57 PM" src="https://github.com/user-attachments/assets/1ad24f6d-7e1e-4814-9448-17844b325405" />
<img width="1154" height="359" alt="Screenshot 2026-05-27 at 12 25 12 PM" src="https://github.com/user-attachments/assets/6218b44f-b5ae-4794-8e7f-b395e1d53c08" />
<img width="1154" height="359" alt="Screenshot 2026-05-27 at 12 25 18 PM" src="https://github.com/user-attachments/assets/efaa4a8c-933d-456d-8efb-e4ed4fb55829" />


---

## What It Does

SF Password Manager stores your Salesforce org credentials locally and logs you in automatically — no typing, no redirects, no waiting on the login page. Click **Login** and you land directly inside the org.

It works with:
- **Production** orgs (`login.salesforce.com`)
- **Sandbox** orgs (`test.salesforce.com`)
- **Custom My Domain** sandboxes (e.g. `company--dev.sandbox.my.salesforce.com`)
- Any other Salesforce / Force.com URL

---

## Installation

> Chrome does not allow loading `.zip` files directly. You must unzip first, then load the folder.

### Steps

1. **Download** `sf-Password-Manager.zip` and **unzip** it — you'll get a folder called `SF Password Manager`
2. Open Chrome and go to: `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `SF Password Manager` folder
6. The SF Password Manager icon will appear in your Chrome toolbar (pin it for easy access)

---

## How to Add an Org

1. Click the SF Password Manager icon in your toolbar to open the popup
2. Click the **+** button (top right)
3. Fill in the drawer form:

| Field | What to enter |
|---|---|
| **Org Name** | A friendly label, e.g. `Gaurav Dev Sandbox` |
| **Login URL** | Your org's full URL — see section below |
| **Username** | Your Salesforce username / email |
| **Password** | Your password (+ security token if required) |
| **Label Color** | Pick a color to visually identify the org |

4. Click **Save Org**

---

## Setting the Login URL

### Production
Use the preset button **Production** → fills `https://login.salesforce.com`

### Standard Sandbox
Use the preset button **Sandbox** → fills `https://test.salesforce.com`

### Custom My Domain Sandbox (most common for enterprise orgs)
Paste your org's full URL from the browser address bar, for example:
```
https://gaurav--dev.sandbox.my.salesforce.com
```
Use the **Custom URL ↑** chip to indicate you're using a custom domain.

> **Tip:** The URL in the address bar when you're already logged in works perfectly. Just copy it and strip anything after `.com`.

---

## Security Token

If your Salesforce org requires a **security token** (common for sandbox orgs accessed from unrecognized networks), append the token directly to your password in the Password field:

```
yourpassword + YOUR_SECURITY_TOKEN
```

**Example:** if your password is `Summer2024!` and your token is `xKz9ABC123`, enter:
```
Summer2024!xKz9ABC123
```

To get or reset your security token: Salesforce → *Settings → Personal Information → Reset My Security Token*

---

## How Login Works

When you click **Login** on an org card:

1. The background service worker opens a new tab to your org's URL
2. It watches that tab until the page fully loads
3. Once loaded, it injects a script that:
   - Finds the username and password fields on the Salesforce login page
   - Fills them using native input events (so Salesforce's JavaScript accepts the values)
   - Clicks the **Log In** button automatically
4. You land directly inside the org — no manual steps required

This approach works on **all** Salesforce login pages, including custom My Domain URLs, because it uses Chrome's `scripting.executeScript` API rather than content scripts with fixed URL patterns.

---

## Features

- **Multi-org support** — store as many orgs as you need
- **One-click login** — directly into the org, no form filling
- **Light & Dark theme** — toggle with the sun/moon button, persists across sessions
- **Search** — filter orgs by name or username instantly
- **Color labels** — 8 colors to visually distinguish orgs at a glance
- **Auto env detection** — badges show Production / Sandbox / Custom automatically
- **Edit & Delete** — hover any card to reveal edit and remove buttons
- **Local storage only** — credentials never leave your browser

---

## File Structure

```
SF Password Manager/
├── manifest.json     # Chrome Extension manifest (v3)
├── background.js     # Service worker — handles login injection
├── popup.html        # Extension popup UI
├── popup.css         # Styles (light + dark theme)
├── popup.js          # Popup logic — org CRUD, search, drawer
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Permissions Explained

| Permission | Why it's needed |
|---|---|
| `storage` | Save org credentials locally in Chrome |
| `tabs` | Open a new tab to the org login URL |
| `scripting` | Inject the auto-fill script into the login page |
| `host_permissions: *.salesforce.com` | Required for `scripting` to work on Salesforce pages |

No data is sent to any external server. Everything stays in your local Chrome storage.

---

## Troubleshooting

**Login page opens but doesn't auto-fill**
- Make sure the Login URL you saved is the exact URL of the login page (not the home page after login)
- For custom sandboxes, use the full My Domain URL including `sandbox.my.salesforce.com`
- If your org uses SSO (Single Sign-On), auto-fill won't work — SSO redirects to an identity provider outside Salesforce's login page

**"Invalid username or password" on the page**
- Double-check the username includes the sandbox suffix if required (e.g. `user@company.com.devbox`)
- Verify the security token is appended correctly to the password

**Extension not injecting on custom domain**
- Go to `chrome://extensions` → SF Vault → *Details* → confirm that *Site access* includes your org's domain
- You may need to click the extension icon on the login page and grant access the first time

**Tab opens but nothing happens**
- Reload the extension: `chrome://extensions` → SF Vault → the refresh icon
- Check the browser console on the login page for any errors

---

## Development

To modify the extension:

1. Edit any file in the `SF Password Manager/` folder
2. Go to `chrome://extensions`
3. Click the **refresh icon** on the SF Vault card to reload changes
4. Reopen the popup to see updates

---

## Limitations

- **MFA / 2FA** — if your org enforces multi-factor authentication, you'll still need to complete the MFA step manually after the form is auto-submitted
- **SSO** — orgs using Okta, Azure AD, or other identity providers redirect away from the Salesforce login page; auto-fill does not work for SSO flows
- **Captcha** — if Salesforce shows a CAPTCHA due to repeated failed logins, auto-fill will be blocked until the CAPTCHA is solved manually

---

## License

MIT — free to use, modify, and distribute.
