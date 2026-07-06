# Implementation Plan: RetroSocial MVP

**Branch**: `001-retrosocial-mvp` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-retrosocial-mvp/spec.md`

---

## Summary

RetroSocial MVP is a single-page React application that lets registered users publish, view, edit, and delete short posts of two mutually exclusive types: plain text (≤ 100 characters) or a single photo (JPEG/PNG/GIF/WebP, ≤ 5 MB). The entire backend is Firebase — Authentication for identity, Firestore for post and user metadata, Storage for images — with security enforced redundantly in Firebase Security Rules and in the React client. No custom server is introduced.

---

## Technical Context

**Language/Version**: JavaScript (ES2022+). TypeScript is explicitly out of scope for this MVP.

**Build Tool**: Vite (SPA, static output — no SSR)

**Primary Dependencies**:
- `react` + `react-dom` — UI framework
- `react-router-dom` v6 — client-side routing and protected route wrapper
- `firebase` SDK v9+ (modular) — Auth, Firestore, Storage

**Storage**: Firebase Firestore (structured data) + Firebase Storage (image blobs)

**Authentication**: Firebase Authentication — email/password provider only

**Testing**: Not in scope for this plan phase. Manual validation via quickstart.md.

**Target Platform**: Modern web browsers (desktop-first, responsive desirable per constitution Art. V)

**Project Type**: Single-page web application (SPA), served as static files

**Performance Goals**:
- SC-001: Registration → feed in < 60 s
- SC-002: Login → feed in < 5 s
- SC-003: Text post published in < 30 s
- SC-004: Photo post published in < 60 s

**Constraints**:
- No custom backend server (constitution Art. VI)
- Session-scoped auth only (cleared on browser close — clarification Q3)
- Image: JPEG/PNG/GIF/WebP, ≤ 5 MB (clarification Q1)
- Text content: ≤ 100 chars plain text, no HTML/Markdown
- Usernames: unique platform-wide (clarification Q2)

**Scale/Scope**: MVP — single global feed, up to ~8 screens/components, ~30 FRs

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- [x] **Art. I — Scope**: All features (registration, login, text/photo posts, ABM, feed) are within scope. No comments, likes, social graph, notifications, galleries, or profile customisation.
- [x] **Art. VI — Stack**: React SPA + Firebase Auth + Firestore + Storage only. No custom Node/Express server.
- [x] **Art. III — Post model**: Two mutually exclusive types. `type: 'text'` carries content ≤ 100 chars and `imageUrl: null`. `type: 'photo'` carries `imageUrl` (Storage URL) and `content: null`. No mixed posts. UI forces explicit selection before submission.
- [x] **Art. IV + VII — Ownership**: Edit/delete controls rendered only for `post.authorId === currentUser.uid` (UX layer). Firestore rules enforce the same check independently at the data layer. Client-side guard is never the sole barrier.
- [x] **Art. II — Auth guard**: `PrivateRoute` wrapper (React Router) redirects to `/` (login) if `AuthContext` has no current user. Firestore/Storage rules reject all writes from unauthenticated callers. Two independent barriers.
- [x] **Art. VIII — Simplicity**: No Redux, Zustand, or additional state libraries. React Context API is sufficient for a single auth state value. Service layer is plain JS modules with direct Firebase SDK calls.

*All gates pass. No complexity tracking required.*

---

## Project Structure

### Documentation (this feature)

```text
specs/001-retrosocial-mvp/
├── plan.md                    ← this file
├── research.md                ← Phase 0: decisions + rationale
├── data-model.md              ← Phase 1: Firestore schema + Security Rules
├── quickstart.md              ← Phase 1: end-to-end validation guide
├── contracts/
│   ├── service-api.md         ← service function signatures
│   └── security-rules.md     ← Firestore + Storage rules source
├── checklists/
│   └── requirements.md
└── tasks.md                   ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
/
├── .env                        # Firebase credentials (gitignored)
├── .env.example                # Safe template committed to repo
├── .gitignore
├── index.html                  # Vite entry point
├── vite.config.js
├── package.json
├── firestore.rules             # Deployed via firebase deploy
├── storage.rules               # Deployed via firebase deploy
├── firebase.json               # Firebase project config (hosting + rules)
├── .firebaserc                 # Firebase project alias
└── src/
    ├── main.jsx                # Vite bootstrap — renders <App />
    ├── App.jsx                 # Router setup, AuthProvider wrapper
    ├── firebase/
    │   └── firebase.js         # initializeApp + export auth, db, storage
    ├── context/
    │   └── AuthContext.jsx     # AuthProvider + useAuth hook
    ├── components/
    │   ├── PrivateRoute.jsx    # Redirects to / if no session
    │   ├── PostCard.jsx        # Single post — text or photo variant
    │   ├── PostFeed.jsx        # Feed list + empty-state message
    │   ├── CreatePostForm.jsx  # Type selector + conditional text/photo form
    │   └── EditPostForm.jsx    # Edit modal for own posts
    ├── pages/
    │   ├── LoginPage.jsx       # Route: /
    │   ├── RegisterPage.jsx    # Route: /register
    │   └── FeedPage.jsx        # Route: /feed  (protected)
    └── services/
        ├── auth.js             # registerUser, loginUser, logoutUser
        └── posts.js            # createPost, getPosts, updatePost, deletePost, uploadImage
```

**Structure Decision**: Single-project SPA layout. `firebase/` isolates SDK init; `context/` isolates auth state; `services/` decouples data logic from UI; `pages/` maps 1:1 to routes; `components/` holds reusable UI elements. No `tests/` directory in this phase.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Build tool | Vite | Fastest cold-start for React SPA; no SSR needed |
| Routing | react-router-dom v6 | Standard, minimal; `<Navigate>` in PrivateRoute covers auth guard |
| Auth state management | React Context + `onAuthStateChanged` | Single source of truth; no extra library needed (Art. VIII) |
| Session persistence | `browserSessionPersistence` | Aligns with clarification Q3 — session cleared on browser close |
| Username storage | Firestore `users/{uid}` collection | Firebase Auth does not natively store arbitrary fields; `displayName` is insufficient for uniqueness enforcement |
| Username uniqueness | Firestore transaction on registration | Query `users` by username before creating account; reject if exists |
| Post denormalisation | `authorUsername` stored on each post | Avoids per-post lookup of `users` collection on every feed read |
| Feed ordering | `orderBy('createdAt', 'desc')` | Reverse-chronological, simplest default (Assumption in spec) |
| Image upload flow | file → `uploadBytesResumable` → `getDownloadURL` → Firestore | Standard Firebase Storage pattern; progress tracking enabled |
| Image path | `posts/{authorId}/{postId}` | Embeds ownership in path; Storage rules enforce `userId == request.auth.uid` |
| Character limit enforcement | Client (inline counter) + Firestore Rule (`content.size() <= 100`) | Double layer: UX feedback + data-layer enforcement (spec FR-009, FR-010) |
| TypeScript | Not used (JS only) | Explicitly out of scope per user input |
| CI/CD | Not in scope | Deferred per user input |

---

## Implementation Phases

### Phase 1 — Project Scaffold & Firebase Init

**Goal**: Runnable empty app with Firebase connected.

1. Verify/update `package.json` — add `react-router-dom`, confirm `firebase` SDK v9+, confirm `vite` dev dependency.
2. Create `vite.config.js` if absent.
3. Create `index.html` (Vite entry) if absent.
4. Create `src/main.jsx` — mounts `<App />`.
5. Create `.env.example` with all required `VITE_FIREBASE_*` keys (never real values).
6. Create `src/firebase/firebase.js`:
   - `initializeApp` using `import.meta.env.VITE_FIREBASE_*`
   - `browserSessionPersistence` applied to Auth instance
   - Export `auth`, `db` (Firestore), `storage`
7. **Delete/replace** existing `src/firebaseConfig.js` (hardcoded credentials → move to env).

**Deliverable**: `npm run dev` starts without errors; Firebase services are importable.

---

### Phase 2 — Authentication

**Goal**: Working registration, login, logout with session-scoped persistence.

1. Create `src/context/AuthContext.jsx`:
   - `AuthProvider` subscribes to `onAuthStateChanged(auth, ...)`
   - Exposes `{ currentUser, loading }` via context
   - `loading` prevents rendering protected routes before auth state resolves
2. Create `src/services/auth.js`:
   - `registerUser(email, password, username)`: checks username uniqueness in Firestore → `createUserWithEmailAndPassword` → writes `users/{uid}` document.
   - `loginUser(email, password)`: `signInWithEmailAndPassword`
   - `logoutUser()`: `signOut(auth)`
3. Create `src/components/PrivateRoute.jsx`:
   - Returns `<Outlet />` if `currentUser` exists; `<Navigate to="/" replace />` otherwise
   - Returns loading spinner while `loading === true`
4. Create `src/pages/LoginPage.jsx` — form: email + password; calls `loginUser`; navigates to `/feed` on success; shows inline error on failure.
5. Create `src/pages/RegisterPage.jsx` — form: email + password + username; calls `registerUser`; shows inline errors for duplicate email (FR-002) and duplicate username (FR-028).
6. Wire `src/App.jsx`:
   - `<AuthProvider>` wraps everything
   - Routes: `/` → `<LoginPage>`, `/register` → `<RegisterPage>`, `/feed` → `<PrivateRoute>` → `<FeedPage>`

**Deliverable**: Registration creates account + `users` doc; login/logout works; unauthenticated navigation to `/feed` redirects to `/`.

---

### Phase 3 — Post Feed (Read-Only)

**Goal**: Authenticated users can see all posts.

1. Create `src/services/posts.js` — `getPosts(callback)`: `onSnapshot` query on `posts` collection ordered by `createdAt desc`; returns unsubscribe function.
2. Create `src/components/PostCard.jsx`:
   - Renders `type === 'text'` → text content + author + timestamp
   - Renders `type === 'photo'` → `<img>` from `imageUrl` + author + timestamp
   - Shows edited indicator if `updatedAt` is set
   - Shows edit/delete controls only if `post.authorId === currentUser.uid`
3. Create `src/components/PostFeed.jsx`:
   - Calls `getPosts` on mount; unsubscribes on unmount
   - Renders list of `<PostCard>` or empty-state message (FR-030)
4. Create `src/pages/FeedPage.jsx` — renders `<PostFeed>` + `<CreatePostForm>` + logout button.

**Deliverable**: Feed loads and updates in real-time; empty state shows when no posts; foreign posts have no edit/delete controls.

---

### Phase 4 — Post Creation

**Goal**: Authenticated users can create text or photo posts.

1. Extend `src/services/posts.js`:
   - `createTextPost(authorId, authorUsername, content)` — validates length ≤ 100 client-side, then writes to Firestore.
   - `uploadImage(authorId, postId, file)` — `uploadBytesResumable` to `posts/{authorId}/{postId}`; returns `getDownloadURL`.
   - `createPhotoPost(authorId, authorUsername, imageUrl)` — writes Firestore doc with `imageUrl`.
2. Create `src/components/CreatePostForm.jsx`:
   - Step 1: Two explicit buttons — "Publicar texto" / "Publicar foto" (no default selected — FR-008, FR-011).
   - If text selected: `<textarea>` with live character counter (100 max); submit blocked if > 100 (FR-010) or empty.
   - If photo selected: `<input type="file" accept="image/jpeg,image/png,image/gif,image/webp">`; client-side validation for format and size ≤ 5 MB (FR-027); upload progress indicator; submit blocked if no file selected (FR-013).
   - On submit: calls appropriate service function; shows loading state during Firestore/Storage operations; shows inline error on failure; resets form on success.

**Deliverable**: Both post types publish and appear in feed immediately (real-time listener); all rejection cases show inline errors.

---

### Phase 5 — Post Editing & Deletion

**Goal**: Users can edit and delete their own posts; foreign post operations are rejected at both UI and data layers.

1. Extend `src/services/posts.js`:
   - `updateTextPost(postId, content)` — validates ≤ 100 chars; `updateDoc` with `{ content, updatedAt: serverTimestamp() }`.
   - `replacePostImage(authorId, postId, newFile)` — upload new image to same path (overwrites); update Firestore `imageUrl` + `updatedAt`.
   - `deletePost(postId, authorId, imageUrl)` — `deleteDoc`; if `imageUrl` present, also `deleteObject` from Storage.
2. Create `src/components/EditPostForm.jsx`:
   - For text posts: editable textarea pre-filled with current content; same 100-char validation.
   - For photo posts: file picker to replace image; same format/size validation.
3. Wire edit/delete into `PostCard.jsx`:
   - Edit button → shows `<EditPostForm>`.
   - Delete button → shows confirmation dialog ("¿Eliminar este posteo?") — FR-022; on confirm calls `deletePost`; on cancel does nothing.

**Deliverable**: Own posts editable and deletable; edit respects 100-char limit; deletion requires confirmation; foreign post controls are never rendered; Firestore rules independently reject any foreign-post write.

---

### Phase 6 — Security Rules

**Goal**: Data-layer enforcement independent of client state.

1. Write `firestore.rules` (full source in `contracts/security-rules.md`):
   - `users/{userId}`: read by any authenticated user; create/update only by owner.
   - `posts/{postId}`: read by any authenticated user; create only if `authorId == request.auth.uid` + type-specific field validation; update only if `resource.data.authorId == request.auth.uid`; delete only if `resource.data.authorId == request.auth.uid`.
2. Write `storage.rules`:
   - `posts/{userId}/{postId}`: read by any authenticated user; write only if `request.auth.uid == userId`, size ≤ 5 MB, contentType is jpeg/png/gif/webp; delete only by owner.
3. Write `firebase.json` referencing both rule files and configuring static hosting from `dist/`.

**Deliverable**: `firebase deploy --only firestore:rules,storage` succeeds; any attempt to write a foreign post via Firestore SDK is rejected with a permission error.

---

### Phase 7 — Build & Deploy to Firebase Hosting

**Goal**: App live on Firebase Hosting with a public `*.web.app` URL and all Security Rules deployed.

#### 7.1 — Install Firebase CLI (once per machine)

```bash
npm install -g firebase-tools
firebase login          # opens browser OAuth flow; authorizes the CLI
```

Verify:

```bash
firebase --version      # must be ≥ 13.x
```

#### 7.2 — Create hosting config files

Two files must exist at the project root before deploying. Their canonical content is in [`contracts/hosting.md`](./contracts/hosting.md).

**`firebase.json`** — tells the CLI what to deploy and how:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
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

- `"public": "dist"` — Vite's output folder.
- The `rewrites` catch-all is mandatory for SPA routing: any path the browser requests directly (e.g., `/feed`) must serve `index.html` and let React Router handle it.

**`.firebaserc`** — maps the project alias to the Firebase project ID:

```json
{
  "projects": {
    "default": "<your-firebase-project-id>"
  }
}
```

Replace `<your-firebase-project-id>` with the value from the Firebase Console URL or `firebase projects:list`.

#### 7.3 — Add security rule files

Create `firestore.rules` and `storage.rules` at the project root using the exact content from [`contracts/security-rules.md`](./contracts/security-rules.md).

#### 7.4 — Add Vite build script to `package.json`

Confirm `package.json` contains at minimum:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

#### 7.5 — Set environment variables for production

`VITE_FIREBASE_*` variables are **embedded at build time** by Vite — they are not available at runtime. This means:

- For local dev: values come from `.env` (gitignored).
- For production: values must be present in the shell **before** running `npm run build`. Options:
  1. Create a `.env.production` file at the project root (gitignored) with real values; Vite loads it automatically during `vite build`.
  2. Export variables in the shell before building: `export VITE_FIREBASE_API_KEY=...` etc.

`.env.production` template (same keys as `.env.example`):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> ⚠️ Never commit `.env` or `.env.production` to git. Ensure both are listed in `.gitignore`.

#### 7.6 — Add Authorized Domain in Firebase Console

After the first deploy, Firebase Auth needs the hosting domain whitelisted:

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**.
2. Add `<project-id>.web.app` and `<project-id>.firebaseapp.com` (usually auto-added).
3. If using a custom domain, add it here too.

Without this step, `signInWithEmailAndPassword` will be blocked on the live URL.

#### 7.7 — Build and deploy

```bash
# 1. Production build (reads .env.production automatically)
npm run build

# 2. Deploy hosting + Firestore rules + Storage rules in one command
firebase deploy

# Selective deploy (skip hosting, rules only):
firebase deploy --only firestore:rules,storage

# Selective deploy (hosting only, rules already deployed):
firebase deploy --only hosting
```

After deploy, the CLI prints the live URL:

```
Hosting URL: https://<project-id>.web.app
```

#### 7.8 — Verify live deployment

Open `https://<project-id>.web.app` in a browser and run through all scenarios in [`quickstart.md`](./quickstart.md) against the production URL.

**Deliverable**: Public `*.web.app` URL serves the app; all Security Rules are live; Firebase Auth Authorized Domains configured; `npm run build` output in `dist/` is fully functional.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Username uniqueness race condition (two users register same username simultaneously) | Low | Medium | Use a Firestore transaction when writing `users/{uid}` to atomically check and create |
| Firebase Storage upload interrupted mid-way (network error) | Medium | Low | `uploadBytesResumable` exposes progress/error events; show error to user; do not write Firestore doc until `getDownloadURL` succeeds |
| `onAuthStateChanged` fires after route renders (flash of unauthenticated content) | Low | Low | `loading` flag in `AuthContext` prevents rendering `PrivateRoute` until auth state is resolved |
| Hardcoded Firebase config in existing `src/firebaseConfig.js` committed to git | High (already exists) | High | Replace with env-var module in Phase 1; add original `firebaseConfig.js` to `.gitignore` |
| `VITE_FIREBASE_*` vars absent at build time | Medium | High | Document `.env.production` requirement in Phase 7; deploy will produce a working-but-unconfigured app if vars are missing |
| Firestore rule denies legitimate edit because `authorId` not preserved on update | Low | High | Rule for update checks `request.resource.data.authorId == request.auth.uid` in addition to `resource.data.authorId` |
| Firebase Auth blocks sign-in on live URL (unauthorized domain) | Medium | High | Add `*.web.app` to Authorized Domains in Firebase Console after first deploy (Phase 7.6) |

---

## Open Decisions

| Decision | Status | Notes |
|---|---|---|
| TypeScript adoption | Deferred — JS only | Explicitly out of scope per user input |
| Automated testing (unit/integration) | Deferred | Not in scope for this plan phase |
| CI/CD pipeline (automated deploy on push) | Deferred | Manual `firebase deploy` documented in Phase 7; automated GitHub Actions pipeline deferred |
| Feed pagination | Deferred | Out of scope for MVP (Assumption in spec) |
| Email verification on registration | Deferred | Out of scope for MVP (Assumption in spec) |
| Custom domain for Firebase Hosting | Deferred | Default `*.web.app` domain sufficient for MVP; custom domain setup via Firebase Console if needed |
