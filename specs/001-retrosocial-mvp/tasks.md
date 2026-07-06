# Tasks: RetroSocial MVP

**Input**: Design documents from `specs/001-retrosocial-mvp/`

**Prerequisites**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/service-api.md](./contracts/service-api.md) · [contracts/security-rules.md](./contracts/security-rules.md) · [contracts/hosting.md](./contracts/hosting.md)

**Tests**: No test tasks generated — automated testing is out of scope for this MVP per plan.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2 — maps to spec.md priorities P1, P2…)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Turn the existing repository stub into a runnable Vite + React SPA with Firebase connected via environment variables.

**Note on existing file**: `src/firebaseConfig.js` contains hardcoded Firebase credentials. T007–T008 replace it with an env-var–driven module.

- [x] T001 Update `package.json`: add `react-dom`, `react-router-dom` to `dependencies`; add `vite` and `@vitejs/plugin-react` to `devDependencies`; add `scripts`: `"dev": "vite"`, `"build": "vite build"`, `"preview": "vite preview"`
- [x] T002 Create `vite.config.js` at project root using content from `contracts/hosting.md` (minimal Vite config with `@vitejs/plugin-react` plugin)
- [x] T003 Create `index.html` at project root as the Vite entry point: `<div id="root"></div>` + `<script type="module" src="/src/main.jsx"></script>`
- [x] T004 Create `src/main.jsx`: import React, ReactDOM and `App`; call `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`
- [x] T005 [P] Create `.env.example` at project root with six empty `VITE_FIREBASE_*` keys: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- [x] T006 [P] Create/update `.gitignore` at project root: add entries for `.env`, `.env.production`, `dist/`, `node_modules/`
- [x] T007 Create `src/firebase/firebase.js`: call `initializeApp` using `import.meta.env.VITE_FIREBASE_*` values; call `setPersistence(auth, browserSessionPersistence)`; export `auth`, `db` (getFirestore), `storage` (getStorage). Import only modular SDK functions (`firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/storage`)
- [x] T008 Migrate credentials: (a) create `.env` at project root copying the six Firebase values from `src/firebaseConfig.js`; (b) add `src/firebaseConfig.js` to `.gitignore`; (c) delete `src/firebaseConfig.js`

**Checkpoint**: `npm install && npm run dev` starts without errors; `src/firebase/firebase.js` exports are importable; no hardcoded credentials remain in tracked files.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core wiring that MUST be complete before any user story can be implemented — auth state management, routing skeleton, protected route guard, and Security Rules files.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [x] T009 Create `src/context/AuthContext.jsx`: define `AuthContext`; export `AuthProvider` component that subscribes to `onAuthStateChanged(auth, user => …)`; when `user` is non-null, immediately fetch `getDoc(doc(db, 'users', user.uid))` to retrieve the username, then set state to `{ currentUser: user, currentUsername: docSnap.data().username, loading: false }`; when `user` is null set `{ currentUser: null, currentUsername: null, loading: false }`; expose `{ currentUser, currentUsername, loading }` via context; export `useAuth` hook that calls `useContext(AuthContext)`. **Rationale**: Firebase Auth `User` object has no `username` field — `currentUsername` must come from Firestore; `CreatePostForm`, `PostCard`, and `FeedPage` all need it to populate `authorUsername` on new posts.
- [x] T010 Create `src/components/PrivateRoute.jsx`: call `useAuth()`; if `loading === true` return a loading spinner; if `currentUser` is null return `<Navigate to="/" replace />`; otherwise return `<Outlet />`
- [x] T011 Create `src/App.jsx`: wrap everything in `<AuthProvider>`; use `createBrowserRouter` with three top-level routes — `/` → `<LoginPage>`, `/register` → `<RegisterPage>`, and a parent route with `element={<PrivateRoute />}` containing `/feed` → `<FeedPage>`; render with `<RouterProvider>`. **All three page imports must reference actual component files, not placeholders.** This task fully wires the routing — T018 adds only the "Registrarse" link inside `LoginPage.jsx`; T021 and T026 are absorbed by this task.
- [x] T012 [P] Write `firestore.rules` at project root using the exact content from `contracts/security-rules.md` (users + posts collections)
- [x] T013 [P] Write `storage.rules` at project root using the exact content from `contracts/security-rules.md` (posts/{userId}/{postId} path)
- [x] T014 [P] Create `firebase.json` at project root using the exact content from `contracts/hosting.md` (hosting public=dist, SPA rewrite, firestore rules, storage rules)
- [x] T015 [P] Create `.firebaserc` at project root using the exact content from `contracts/hosting.md`, replacing `<your-firebase-project-id>` with the project ID from the Firebase project

**Checkpoint**: App renders at `localhost:5173`; navigating to `/feed` without being logged in redirects to `/`; `AuthContext` provides `currentUser` and `loading` to all components.

---

## Phase 3: User Story 1 — User Registration (Priority: P1) 🎯 MVP

**Goal**: A visitor can create a new account with email, password, and a unique username.

**Independent Test**: Navigate to `/register`; submit valid email, password, and unused username → redirected to `/feed`. Repeat with same email → error shown. Repeat with same username (different email) → error shown. All empty → blocked.

- [x] T016 [US1] Create `src/services/auth.js`: implement `registerUser(email, password, username)` — **(1)** call `createUserWithEmailAndPassword(auth, email, password)` first (user is now authenticated — Firestore rules require `request.auth != null` for all reads); **(2)** inside a `runTransaction`, read the `users` collection with a query for `username` equality; if a document with that username already exists, call `deleteUser(auth.currentUser)` to roll back the Auth account and throw `{ code: 'username-already-taken' }`; **(3)** still inside the transaction, write `users/{uid}` document with `{ uid, username, email, createdAt: serverTimestamp() }` using `setDoc` — the transaction guarantees atomicity of check + write. **Important**: do NOT query Firestore before step (1); unauthenticated reads are rejected by the security rules.
- [x] T017 [US1] Create `src/pages/RegisterPage.jsx`: form with `email`, `password`, `username` fields; **validate all three fields are non-empty before calling `registerUser` — show a per-field inline error for any empty field and block submission** (spec US1 acceptance scenario 3, FR-001); on submit call `registerUser`; handle `auth/email-already-in-use` → inline error "Este email ya está en uso"; handle `username-already-taken` → inline error "Este nombre de usuario ya está en uso"; on success `navigate('/feed')`; include link to `/` (login)
- [x] T018 [US1] Add a "Registrarse" link inside `src/pages/LoginPage.jsx` pointing to `/register` (FR-001 UX requirement — the registration screen must be reachable from the login screen)

**Checkpoint**: Full registration flow works end-to-end. `users/{uid}` document exists in Firestore after successful registration. Duplicate email and duplicate username are each rejected with specific messages.

---

## Phase 4: User Story 2 — User Login (Priority: P2)

**Goal**: A registered user can sign in with email and password and land on the feed.

**Independent Test**: Submit valid credentials → redirected to `/feed`. Submit wrong password → error shown, user stays on `/`. Close browser tab, reopen, navigate to `/feed` → redirected to `/` (session cleared).

- [x] T019 [US2] Extend `src/services/auth.js`: add `loginUser(email, password)` calling `signInWithEmailAndPassword(auth, email, password)`; add `logoutUser()` calling `signOut(auth)`
- [x] T020 [US2] Create `src/pages/LoginPage.jsx`: form with `email` and `password` fields; **validate both fields are non-empty before calling `loginUser` — block submission and show an inline error if either field is empty**; on submit call `loginUser`; on error show inline message (map Firebase error codes to user-friendly Spanish text, e.g., `auth/wrong-password` → "Credenciales incorrectas"); on success `navigate('/feed')`; include link to `/register`
- ~~T021~~ *(absorbed into T011)* — the `/` route to `<LoginPage>` is fully and explicitly wired in T011; no additional work is required here.

**Checkpoint**: Login and logout both work. Unauthenticated access to `/feed` redirects to `/`. Closing the browser and reopening requires login again (session-scoped persistence from T007 `browserSessionPersistence`).

---

## Phase 5: User Story 5 — View the Post Feed (Priority: P5 — moved ahead of P3/P4 as technical dependency)

**Goal**: Authenticated users see all posts in reverse-chronological order; foreign posts are read-only; empty feed shows a message.

**Independent Test**: Log in with two accounts. No posts exist → empty-state message shown. Account A publishes a post → appears in Account B's feed without edit/delete controls.

**Note on ordering**: US5 is implemented before US3/US4 (which have higher spec priority) because the feed display is a required technical dependency to verify post creation. US3 and US4 cannot be independently tested without a working feed.

- [x] T022 [US5] Create `src/services/posts.js`: implement `getPosts(callback)` — attach `onSnapshot` to `collection(db, 'posts')` with `orderBy('createdAt', 'desc')`; map each doc to `{ id: doc.id, ...doc.data() }`; invoke `callback(posts)` on each update; return the unsubscribe function
- [x] T023 [P] [US5] Create `src/components/PostCard.jsx`: accept `post` and `currentUser` props; if `post.type === 'text'` render content text; if `post.type === 'photo'` render `<img src={post.imageUrl} alt="post" />`; always render `authorUsername`, formatted `createdAt`, and — **if `post.updatedAt` is non-null** — an "editado el {date}" label (FR-021); render Edit and Delete buttons only when `post.authorId === currentUser.uid` (controls absent otherwise — FR-018/FR-023)
- [x] T024 [US5] Create `src/components/PostFeed.jsx`: call `getPosts` on mount, store posts in state, unsubscribe on unmount; if posts array is empty render empty-state message "Todavía no hay posteos — ¡sé el primero en publicar!" (FR-030); otherwise render a `<PostCard>` for each post passing `post` and `currentUser`
- [x] T025 [US5] Create `src/pages/FeedPage.jsx`: import and render `<PostFeed>` and `<CreatePostForm>`; call `useAuth()` to get `currentUser` and `currentUsername`; pass `currentUser` to `<PostFeed>` and `<CreatePostForm>`; include a fully-functional logout button that calls `logoutUser()` then `navigate('/', { replace: true })` (FR-006, FR-007 — **not a placeholder**: implement the full navigate call here)
- ~~T026~~ *(absorbed into T011)* — the `/feed` protected route inside `<PrivateRoute>` is fully and explicitly wired in T011; no additional work is required here.

**Checkpoint**: Authenticated users see the feed. Empty-state message shows when no posts exist. Two accounts can see each other's posts. Foreign post cards have no edit/delete controls.

---

## Phase 6: User Story 3 — Create a Text Post (Priority: P3)

**Goal**: An authenticated user can publish a plain-text post of up to 100 characters.

**Independent Test**: Log in, click "Publicar texto", type ≤100 chars, submit → post appears in feed with author username and timestamp. Type >100 chars → submit blocked with inline error.

- [x] T027 [US3] Add `createTextPost(authorId, authorUsername, content)` to `src/services/posts.js`: validate `content.length <= 100` (throw if not); call `addDoc(collection(db, 'posts'), { type: 'text', content, imageUrl: null, authorId, authorUsername, createdAt: serverTimestamp(), updatedAt: null })`
- [x] T028 [US3] Create `src/components/CreatePostForm.jsx`: render two explicit action buttons "Publicar texto" and "Publicar foto" with no default selection (FR-008/FR-011); when "Publicar texto" is selected show a `<textarea>` with a live character counter (`{content.length}/100`); disable/block submit if content is empty or exceeds 100 chars (FR-010); on submit call `createTextPost` with `currentUser.uid` and `authorUsername` (read from Firestore `users/{uid}` doc or stored in context); show loading state during submit; show inline error on failure; reset form on success
- [x] T029 [US3] Mount `<CreatePostForm>` inside `src/pages/FeedPage.jsx` above `<PostFeed>`, passing `currentUser`

**Checkpoint**: Text posts appear in the feed in real-time after submission. Posts >100 chars are rejected with an inline error before any Firestore write. Attempting to submit without selecting a type is blocked.

---

## Phase 7: User Story 4 — Create a Photo Post (Priority: P4)

**Goal**: An authenticated user can publish a single image (JPEG/PNG/GIF/WebP, ≤ 5 MB).

**Independent Test**: Log in, click "Publicar foto", select a valid image, submit → post appears in feed with the image. Select an unsupported format → blocked. Select a file >5 MB → blocked. Submit without selecting file → blocked.

- [x] T030 [US4] Add `uploadImage(authorId, postId, file)` and `createPhotoPost(authorId, authorUsername, imageUrl)` to `src/services/posts.js`: `uploadImage` uses `uploadBytesResumable(ref(storage, \`posts/${authorId}/${postId}\`), file)` and resolves with `getDownloadURL` on completion; `createPhotoPost` calls `addDoc` with `{ type: 'photo', imageUrl, content: null, authorId, authorUsername, createdAt: serverTimestamp(), updatedAt: null }`
- [x] T031 [US4] Extend `src/components/CreatePostForm.jsx` with the photo-post path: when "Publicar foto" is selected render `<input type="file" accept="image/jpeg,image/png,image/gif,image/webp">`; on file selection validate MIME type against allowed list and size ≤ 5 MB — show inline error for format (FR-027) or size (FR-027) violations before any upload; generate a `postId` via `doc(collection(db, 'posts')).id`; on submit call `uploadImage` then `createPhotoPost`; show upload progress indicator during `uploadBytesResumable`; show inline error on network/permission failure; block submit if no file selected (FR-013)
- [x] T032 [P] [US4] Verify `src/components/PostCard.jsx` renders photo posts correctly (type=`'photo'` → `<img src={imageUrl}>` with alt text); update if the implementation from T023 used a placeholder

**Checkpoint**: Photo posts appear in the feed with the image displayed. Invalid format and oversized files are rejected before upload starts. No file selected blocks submission. The photo card has no text field.

---

## Phase 8: User Story 6 — Edit Own Post (Priority: P6)

**Goal**: An authenticated user can edit their own text or photo posts; the 100-char limit applies on edit; all edits record `updatedAt`.

**Independent Test**: Create a text post; edit to valid content → feed shows updated text + "editado" label. Edit to >100 chars → blocked. Create a photo post; replace image → feed shows new image.

- [x] T033 [US6] Add `updateTextPost(postId, content)` and `replacePostImage(authorId, postId, newFile)` to `src/services/posts.js`: `updateTextPost` validates `content.length <= 100` then calls `updateDoc(doc(db, 'posts', postId), { content, updatedAt: serverTimestamp() })`; `replacePostImage` re-uploads to the same Storage path `posts/${authorId}/${postId}` (overwrites), gets the new download URL, then calls `updateDoc` with `{ imageUrl: newUrl, updatedAt: serverTimestamp() }`
- [x] T034 [US6] Create `src/components/EditPostForm.jsx`: accept `post` and `onClose` props; for `type='text'` render a textarea pre-filled with `post.content`, live counter, same ≤100 char validation, submit calls `updateTextPost`; for `type='photo'` render a file picker with the same format/size validation as CreatePostForm, submit calls `replacePostImage`; show loading during save; show inline error on failure; call `onClose` on success
- [x] T035 [US6] Wire the Edit button in `src/components/PostCard.jsx` (rendered only for `post.authorId === currentUser.uid`): clicking shows `<EditPostForm>` (inline or via a local `editing` state toggle); passing `post` and an `onClose` that resets `editing` to false
- ~~T036~~ *(absorbed into T023)* — the `updatedAt` "editado el {date}" label (FR-021) is fully specified in T023; no additional work on `PostCard.jsx` is required here.

**Checkpoint**: Own posts can be edited. Edited text posts respect the 100-char limit. Edited photo posts show the new image. `updatedAt` appears in the card after editing. Edit controls are absent for foreign posts.

---

## Phase 9: User Story 7 — Delete Own Post (Priority: P7)

**Goal**: An authenticated user can permanently delete their own posts after confirming; cancelling leaves the post intact.

**Independent Test**: Click Delete on own post → confirmation dialog appears. Click Cancel → post remains. Click Delete again → Confirm → post gone from feed. Repeat for a photo post and verify the Storage object is also deleted.

- [x] T037 [US7] Add `deletePost(postId, authorId, imageUrl)` to `src/services/posts.js`: call `deleteDoc(doc(db, 'posts', postId))`; if `imageUrl` is non-null also call `deleteObject(ref(storage, \`posts/${authorId}/${postId}\`))` to remove the Storage file
- [x] T038 [US7] Add Delete button + confirmation flow to `src/components/PostCard.jsx`: render Delete button only for `post.authorId === currentUser.uid`; clicking sets local state `confirming = true` and shows an inline confirmation message "¿Eliminar este posteo?" with "Confirmar" and "Cancelar" buttons (FR-022); "Confirmar" calls `deletePost(post.id, post.authorId, post.imageUrl)` and resets state; "Cancelar" resets `confirming` to false with no side effects

**Checkpoint**: Own posts deletable with confirmation. Cancelling the dialog leaves the post unchanged. Photo post deletion removes both the Firestore document and the Storage object. Delete controls absent for foreign posts.

---

## Phase 10: User Story 8 — Logout (Priority: P8)

**Goal**: An authenticated user can end their session; all protected screens become inaccessible immediately.

**Independent Test**: Log in; click logout → redirected to `/`. Navigate to `/feed` → redirected to `/`.

- [x] T039 [US8] Verify logout is fully wired in `src/pages/FeedPage.jsx` (implemented in T025): confirm the logout button calls `logoutUser()` then `navigate('/', { replace: true })`; confirm that after logout `PrivateRoute` (T010) blocks re-entry to `/feed`; no new code should be required if T025 was implemented correctly — this task is a functional checkpoint, not a new implementation.

**Checkpoint**: Logout button ends the session. Navigating to any protected route after logout redirects to `/`. Closing the browser without logging out also clears the session (verified by browserSessionPersistence from T007).

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Consistency, UX finish, and production deployment.

- [x] T040 [P] Add a reusable inline error display element to all forms (`LoginPage`, `RegisterPage`, `CreatePostForm`, `EditPostForm`): consistent red error text rendered below the submit button using a shared CSS class or inline style — ensures all FR error messages (FR-002, FR-004, FR-010, FR-013, FR-027, FR-028) are visually consistent
- [x] T041 [P] Add a reusable loading spinner or disabled-state indicator: used in `PrivateRoute` (auth state resolving), `CreatePostForm` (image upload), `EditPostForm` (save in progress) — prevents double-submit and communicates async operations to the user
- [ ] T042 Deploy Security Rules: run `firebase deploy --only firestore:rules,storage`; verify in Firebase Console that Firestore rules and Storage rules show the correct last-deployed timestamp
- [x] T043 Create `.env.production` at project root (gitignored): copy the six `VITE_FIREBASE_*` values from `.env`; this file is read automatically by `vite build` and must be present before T044
- [ ] T044 Production build and deploy to Firebase Hosting: run `npm run build` (outputs to `dist/`); run `firebase deploy --only hosting`; confirm the Hosting URL printed by the CLI loads the app
- [ ] T045 Configure Firebase Auth Authorized Domains: open Firebase Console → Authentication → Settings → Authorized domains; add `<project-id>.web.app` if not already listed; without this step `signInWithEmailAndPassword` will fail on the live URL with `auth/unauthorized-domain`
- [ ] T046 Run quickstart.md validation: execute all 10 scenarios from `specs/001-retrosocial-mvp/quickstart.md` against the live `*.web.app` URL; mark each scenario pass/fail; any failure is a blocker before the MVP is considered complete

**Checkpoint**: App is live at `https://<project-id>.web.app`; Security Rules deployed; all quickstart.md scenarios pass; no hardcoded credentials in tracked files.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **blocks all user stories**
- **US1 Registration (Phase 3)**: Depends on Phase 2
- **US2 Login (Phase 4)**: Depends on Phase 2; integrates with US1 (`auth.js` shared module)
- **US5 Feed (Phase 5)**: Depends on Phase 2; **technical dependency for US3 and US4**
- **US3 Text Post (Phase 6)**: Depends on Phase 5 (feed must exist to verify posts)
- **US4 Photo Post (Phase 7)**: Depends on Phase 5; extends work from US3 (`CreatePostForm.jsx`)
- **US6 Edit (Phase 8)**: Depends on US3 and US4 (needs posts to exist)
- **US7 Delete (Phase 9)**: Depends on US3 and US4 (needs posts to exist)
- **US8 Logout (Phase 10)**: Depends on Phase 2 (logoutUser already in auth.js from US2)
- **Polish (Phase 11)**: Depends on all user story phases

### User Story Dependencies

| Story | Can start after | Notes |
|---|---|---|
| US1 Registration | Phase 2 | Independent |
| US2 Login | Phase 2 | Shares `auth.js` with US1 |
| US5 Feed | Phase 2 | Technical dependency: must precede US3, US4 |
| US3 Text Post | Phase 5 | Requires feed to verify |
| US4 Photo Post | Phase 5 | Extends US3's `CreatePostForm.jsx` |
| US6 Edit | Phase 7 | Requires posts from US3/US4 |
| US7 Delete | Phase 7 | Requires posts from US3/US4 |
| US8 Logout | Phase 4 | `logoutUser` already in auth.js; just wires the button |

### Note on spec priority vs. implementation order

US5 (View Feed) has spec priority P5 but is implemented in Phase 5 (before US3/P3 and US4/P4) because it is a technical dependency: US3 and US4 cannot be independently tested without a working feed to observe the published post. All other priorities follow spec order.

### Within Each User Story

- Service function → Component → Page wire-up
- Core implementation before error handling / loading states
- Each phase complete and independently testable before moving to the next

### Parallel Opportunities

- All `[P]` tasks within a phase can be worked on simultaneously (different files)
- US3 and US8 can be parallelised once Phase 5 is complete (different files)
- US4 and US6 share `CreatePostForm.jsx` — cannot be fully parallelised

---

## Parallel Example: Phase 2 (Foundational)

```bash
# These four tasks touch independent files — run in parallel:
Task T012: "Write firestore.rules at project root"
Task T013: "Write storage.rules at project root"
Task T014: "Create firebase.json at project root"
Task T015: "Create .firebaserc at project root"

# These three are sequential (each depends on the previous):
Task T009: "Create src/context/AuthContext.jsx"
Task T010: "Create src/components/PrivateRoute.jsx"  ← needs AuthContext
Task T011: "Create src/App.jsx"                       ← needs PrivateRoute
```

## Parallel Example: User Story 5 (Feed)

```bash
# T022 and T023 are independent — run in parallel:
Task T022: "Create getPosts in src/services/posts.js"
Task T023: "Create src/components/PostCard.jsx"

# T024 depends on both T022 and T023:
Task T024: "Create src/components/PostFeed.jsx"

# T025 depends on T024:
Task T025: "Create src/pages/FeedPage.jsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US5 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL** — blocks everything)
3. Complete Phase 3: US1 Registration
4. Complete Phase 4: US2 Login
5. Complete Phase 5: US5 Feed (empty state + read-only display)
6. **STOP and VALIDATE**: user can register, log in, see empty feed, log out
7. Deploy to Firebase Hosting — app is live with auth working

### Incremental Delivery

| Increment | Phases | Value delivered |
|---|---|---|
| MVP Auth | 1 → 2 → 3 → 4 | Register + Login + empty feed |
| Content read | + Phase 5 | View all posts (empty state) |
| Text posting | + Phase 6 | Publish and view text posts |
| Photo posting | + Phase 7 | Publish and view photo posts |
| Self-service | + Phases 8–9 | Edit and delete own posts |
| Full product | + Phase 10 | Logout flow complete |
| Production | + Phase 11 | Live on Firebase Hosting |

### Single Developer — Recommended Sequence

Follow phases 1 → 11 sequentially. Each phase checkpoint validates independently before proceeding.

---

## Notes

- `[P]` tasks = touch different files, no unresolved dependencies — safe to implement concurrently
- `[Story]` label maps each task to its user story for traceability back to `spec.md`
- Each phase ends with an independently verifiable checkpoint
- Commit after each phase checkpoint (or each task if preferred)
- `src/firebaseConfig.js` (existing hardcoded file) must be replaced in T007–T008 before any other work — it is a security risk
- No TypeScript — all files use `.jsx` / `.js` extensions
- No automated tests — validation is manual via `quickstart.md`
