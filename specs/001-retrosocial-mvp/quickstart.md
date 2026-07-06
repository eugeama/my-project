# Quickstart Validation Guide: RetroSocial MVP

**Branch**: `001-retrosocial-mvp` | **Date**: 2026-07-06 | **Phase**: 1

This guide documents the end-to-end validation scenarios that prove the feature works as specified. It is not an implementation guide — it describes what to run and what to expect.

---

## Prerequisites

1. A Firebase project with Authentication (email/password), Firestore, and Storage enabled.
2. Node.js (v18+) and npm installed.
3. Firebase CLI installed: `npm install -g firebase-tools` and `firebase login`.
4. `.env` file at the project root populated from `.env.example` with real Firebase credentials.
5. Firestore and Storage Security Rules deployed: `firebase deploy --only firestore:rules,storage`.

---

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

App runs at `http://localhost:5173` (default Vite port).

---

## Scenario 1 — Unauthenticated access is blocked

| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate directly to `http://localhost:5173/feed` | Immediately redirected to `/` (login screen) |
| 2 | Attempt to navigate to any other protected path | Redirected to `/` |
| 3 | Verify only `/` and `/register` are reachable without a session | ✅ Both load; all other paths redirect |

---

## Scenario 2 — User Registration

| Step | Action | Expected result |
|---|---|---|
| 1 | Go to `/register` via the link on the login screen | Registration form shown with email, password, username fields |
| 2 | Submit with all fields empty | Submission blocked; error messages shown for each empty field |
| 3 | Submit with an invalid email format | Submission blocked; email error shown |
| 4 | Submit with valid email, password, and a unique username | Account created; user redirected to `/feed` |
| 5 | Open a second browser session; try to register with the **same email** | Error: "email already in use" (FR-002) |
| 6 | Try to register with the **same username** (different email) | Error: "username already taken" (FR-028) |

---

## Scenario 3 — User Login & Logout

| Step | Action | Expected result |
|---|---|---|
| 1 | Submit login form with wrong password | Error message shown; user stays on `/` |
| 2 | Submit login form with correct credentials | Redirected to `/feed` |
| 3 | Click logout | Redirected to `/`; navigating to `/feed` redirects back to `/` |
| 4 | Close the browser tab, reopen, navigate to `/feed` | Redirected to `/` (session-scoped persistence) |

---

## Scenario 4 — Empty Feed State

| Step | Action | Expected result |
|---|---|---|
| 1 | Log in with a freshly registered account (no posts exist) | Feed shows an empty-state message (e.g., "No posts yet…") — not a blank screen (FR-030) |

---

## Scenario 5 — Create a Text Post

| Step | Action | Expected result |
|---|---|---|
| 1 | On `/feed`, attempt to submit a post without selecting a type | Submission blocked; prompted to choose a type (FR-011) |
| 2 | Click "Publicar texto" | Text textarea and character counter appear; photo picker is absent |
| 3 | Type 101+ characters | Live counter shows > 100; submit button disabled or form blocks submission (FR-010) |
| 4 | Reduce to ≤ 100 characters and submit | Post appears in feed immediately with author username and timestamp (FR-014, FR-015) |
| 5 | Verify via Firebase Console | Post document in `posts` collection has `type: 'text'`, `content` ≤ 100 chars, `imageUrl: null`, correct `authorId` |

---

## Scenario 6 — Create a Photo Post

| Step | Action | Expected result |
|---|---|---|
| 1 | Click "Publicar foto" | File picker appears; no text input shown |
| 2 | Attempt to submit without selecting a file | Submission blocked; error shown (FR-013) |
| 3 | Select a `.txt` file | Submission blocked; "unsupported format" error (FR-027) |
| 4 | Select a valid image file > 5 MB | Submission blocked; "file too large" error (FR-027) |
| 5 | Select a valid JPEG/PNG/GIF/WebP ≤ 5 MB and submit | Upload progress shown; post appears in feed with image displayed (FR-012) |
| 6 | Verify via Firebase Console | Storage object at `posts/{uid}/{postId}`; Firestore doc has `type: 'photo'`, `imageUrl` (HTTPS), `content: null` |

---

## Scenario 7 — Feed Read-Only (foreign posts)

| Step | Action | Expected result |
|---|---|---|
| 1 | Log in as User A; create a post | Post appears in feed |
| 2 | Log in as User B (different browser/incognito) | User A's post is visible in User B's feed |
| 3 | Inspect User A's post as User B | No edit or delete controls rendered (FR-018) |
| 4 | As User B, attempt to update User A's post directly via Firestore SDK (browser console) | Firestore returns a permission-denied error; post unchanged (FR-025) |

---

## Scenario 8 — Edit Own Post

| Step | Action | Expected result |
|---|---|---|
| 1 | Log in as the post author; find own text post in feed | Edit and delete controls are visible |
| 2 | Click Edit; change content to > 100 chars; try to save | Save blocked; error shown (FR-019) |
| 3 | Reduce to ≤ 100 chars and save | Post updated in feed; `updatedAt` timestamp visible (FR-021) |
| 4 | Click Edit on own photo post; select a new image; save | Post updated with new image; `updatedAt` timestamp visible (FR-020) |

---

## Scenario 9 — Delete Own Post (with confirmation)

| Step | Action | Expected result |
|---|---|---|
| 1 | Click Delete on own post | Confirmation dialog appears: "¿Eliminar este posteo?" (FR-022) |
| 2 | Click Cancel | Dialog closes; post remains in feed (spec edge case: deletion cancelled) |
| 3 | Click Delete again; click Confirm | Post removed from feed immediately; if photo post, Storage object also deleted |

---

## Scenario 10 — Security Rules (data-layer enforcement)

These scenarios require direct Firestore/Storage SDK access (e.g., browser console with Firebase SDK loaded).

| Scenario | Attempt | Expected result |
|---|---|---|
| Create post with wrong `authorId` | `addDoc(postsRef, { ..., authorId: 'other-uid' })` as authenticated user | Permission denied (FR-024) |
| Edit foreign post | `updateDoc(foreignPostRef, { content: 'hacked' })` | Permission denied (FR-025) |
| Delete foreign post | `deleteDoc(foreignPostRef)` | Permission denied (FR-025) |
| Upload image to another user's path | Write to `posts/{other-uid}/{postId}` | Permission denied |
| Read posts unauthenticated | `getDocs(postsRef)` without signing in | Permission denied (FR-026) |

---

## Build & Deploy Validation

### Prerequisites for deploy

- Firebase CLI installed and authenticated:

  ```bash
  npm install -g firebase-tools
  firebase login
  ```

- `firebase.json` and `.firebaserc` present at project root (see `contracts/hosting.md`).
- `firestore.rules` and `storage.rules` present at project root (see `contracts/security-rules.md`).
- `.env.production` at project root with all `VITE_FIREBASE_*` values set (never committed to git).
- Hosting domain added to Firebase Auth → Settings → **Authorized domains**.

---

### Step-by-step deploy

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Production build — Vite reads .env.production automatically
npm run build
# Expected: dist/ folder created with index.html + hashed JS/CSS assets

# 3. Deploy everything (hosting + Firestore rules + Storage rules)
firebase deploy
# Expected output includes:
#   ✔  Deploy complete!
#   Hosting URL: https://<project-id>.web.app

# To deploy rules only (faster when code hasn't changed):
firebase deploy --only firestore:rules,storage

# To deploy hosting only (faster when rules haven't changed):
firebase deploy --only hosting
```

---

### Post-deploy checklist

| Check | How to verify | Expected |
|---|---|---|
| Site loads | Open `https://<project-id>.web.app` | Login screen renders |
| SPA routing works | Navigate directly to `https://<project-id>.web.app/feed` while unauthenticated | Redirected to `/` (not a 404) |
| Auth works on live URL | Register a new account | Account created; redirected to feed |
| Auth domain authorized | Sign in on live URL | No "unauthorized domain" error from Firebase Auth |
| Firestore rules live | Attempt foreign-post edit from browser console | Permission denied |
| Storage rules live | Attempt upload to another user's path | Permission denied |
| Photo post displays | Create a photo post on live URL | Image loads from `*.appspot.com` Storage URL |

---

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Blank page after deploy | `dist/` not generated or wrong `public` path in `firebase.json` | Run `npm run build`; confirm `firebase.json` has `"public": "dist"` |
| 404 on direct URL navigation (e.g., `/feed`) | SPA rewrite missing in `firebase.json` | Add `"rewrites": [{"source":"**","destination":"/index.html"}]` |
| `auth/unauthorized-domain` error on live URL | Hosting domain not in Firebase Auth Authorized Domains | Add `<project-id>.web.app` in Firebase Console → Auth → Settings → Authorized domains |
| Firebase SDK not initializing (console errors) | `VITE_FIREBASE_*` vars not present at build time | Create `.env.production` with real values; rebuild and redeploy |
| Permission denied on all Firestore reads | Rules not deployed or deployed to wrong project | Run `firebase deploy --only firestore:rules`; verify `.firebaserc` project ID |

