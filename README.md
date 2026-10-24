# Fake News Detector (SG / MY / ID)

Languages: English, Bahasa Malaysia, Bahasa Indonesia, 中文. One codebase: web app, installable PWA, and native wrapper (Capacitor).

## 1. Keys (Netlify > Site settings > Environment variables)
- (Google key no longer needed)
- ANTHROPIC_API_KEY
- CLAUDE_MODEL (optional)

## 2. Deploy (fastest path to a phone)
Push this folder to GitHub and connect it to Netlify (or `npx netlify deploy --prod`).
Open the site on Android Chrome > Add to Home screen. It installs like an app and appears in the Share menu, so users can share a WhatsApp message straight into it.

## 3. Native app (Play Store / App Store)
1. Set `CONFIG.API_BASE` in public/index.html to your live Netlify URL.
2. `npm install`
3. `npx cap add android` (and/or `npx cap add ios`)
4. `npx cap sync` then `npx cap open android` (or `ios`) and build from Android Studio / Xcode.
Edit app id/name in capacitor.config.json first.

## Before launch
- Check every feed URL and terms of use in netlify/functions/feed.js; add Singapore and more sources.
- Add rate limiting (every check costs an AI call).
- Get legal advice (POFMA in Singapore, CMA in Malaysia, ITE law in Indonesia).
- Add a privacy policy (required by both app stores).
