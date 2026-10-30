DocuClear website - multi-file project

docuclear/
  index.html        Landing page
  about.html        About + contact
  pricing.html      Pricing
  login.html        Login (Google + phone OTP)
  workspace.html    Upload and analyze (login required)
  css/styles.css    All styling
  js/firebase-config.js   <- PASTE YOUR FIREBASE KEYS HERE (only file to edit)
  js/common.js      Firebase loading, session, page guards, nav
  js/auth.js        Login page logic
  js/workspace.js   Upload, privacy scan, results, dashboard
  js/home.js, about.js, data.js   Page content
  assets/favicon.svg

Firebase setup
1. console.firebase.google.com -> Add project.
2. Authentication -> Sign-in method: enable Google and Phone.
3. Authentication -> Settings -> Authorized domains: add YOURNAME.github.io
4. Project settings -> Your apps -> Web (</>) -> copy the config.
5. Paste the values into js/firebase-config.js.
6. Push to GitHub. Until keys are added the site runs in demo mode (OTP 123456).

Run: host it (GitHub Pages) or use a local server, e.g. "python -m http.server" in this
folder, then open http://localhost:8000. Google login does not work from file:// addresses.
