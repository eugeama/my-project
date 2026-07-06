# Contract: Firebase Hosting Configuration

**Branch**: `001-retrosocial-mvp` | **Date**: 2026-07-06

Canonical content for the three Firebase project config files that must exist at the repository root before running `firebase deploy`. Copy these verbatim; replace only `<your-firebase-project-id>`.

---

## `firebase.json`

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

**Key decisions**:

| Field | Value | Reason |
|---|---|---|
| `hosting.public` | `"dist"` | Vite outputs the production build here |
| `rewrites` catch-all | `"**"` → `"/index.html"` | Required for React Router SPA — any deep-link must serve `index.html` and let the client handle routing |
| `firestore.rules` | `"firestore.rules"` | Points to the rules file at the repo root (see `contracts/security-rules.md`) |
| `storage.rules` | `"storage.rules"` | Points to the Storage rules file at the repo root |

---

## `.firebaserc`

```json
{
  "projects": {
    "default": "<your-firebase-project-id>"
  }
}
```

Replace `<your-firebase-project-id>` with the project ID from the Firebase Console.  
To look it up: `firebase projects:list` (requires CLI login).

---

## `.env.example`

Committed to git as a safe reference — **never** put real values here.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## `.env` / `.env.production` (gitignored, real values)

These files are **never committed**. Both must be in `.gitignore`:

```
.env
.env.production
```

**`.env`** — used by `npm run dev`:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
```

**`.env.production`** — used by `npm run build` (Vite loads it automatically for production builds):

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
```

> ⚠️ `VITE_FIREBASE_*` variables are embedded **at build time**, not at runtime. If these variables are missing or empty when `npm run build` runs, the deployed app will fail to connect to Firebase. Always verify the env file is present before building.

---

## `vite.config.js`

Minimal Vite config for a React SPA:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

---

## `package.json` scripts (minimum required)

```json
{
  "scripts": {
    "dev":     "vite",
    "build":   "vite build",
    "preview": "vite preview"
  }
}
```

`firebase deploy` does **not** run `npm run build` automatically — you must build first, then deploy.

---

## Firebase Console: Authorized Domains

After the first `firebase deploy`, add the hosting URL to Firebase Auth's authorized domain list:

1. Open [Firebase Console](https://console.firebase.google.com) → select project.
2. **Authentication** → **Settings** → **Authorized domains**.
3. Click **Add domain** and add:
   - `<project-id>.web.app`
   - `<project-id>.firebaseapp.com` (usually already present)
4. If using a custom domain: add it here too.

Without this step, `signInWithEmailAndPassword` (and other Auth operations) will throw `auth/unauthorized-domain` on the live URL.

---

## Deployment Commands Reference

```bash
# Full deploy: hosting + Firestore rules + Storage rules
firebase deploy

# Rules only (no hosting change)
firebase deploy --only firestore:rules,storage

# Hosting only (rules already deployed)
firebase deploy --only hosting

# Preview channel (temporary URL for testing, doesn't affect production)
firebase hosting:channel:deploy preview --expires 1d
```
