# Research: RetroSocial MVP

**Branch**: `001-retrosocial-mvp` | **Date**: 2026-07-06 | **Phase**: 0

All decisions below resolve the unknowns identified in the Technical Context section of `plan.md`. No NEEDS CLARIFICATION items remain.

---

## Decision 1 — Firebase SDK Version

**Decision**: Firebase modular SDK v9+ (tree-shakable, function-based imports).

**Rationale**: The existing `package.json` already declares `"firebase": "^12.15.0"`, which is a v9+ modular SDK. Using the legacy namespaced SDK (`firebase.auth()`, `firebase.firestore()`) would be incompatible. The modular SDK also reduces bundle size by allowing Vite to tree-shake unused Firebase features.

**Alternatives considered**:
- Legacy namespaced SDK — rejected: incompatible with installed version; larger bundle.
- Firebase Admin SDK — rejected: server-side only, no custom server in scope.

---

## Decision 2 — Auth Session Persistence Mode

**Decision**: `browserSessionPersistence` from `firebase/auth`.

**Rationale**: Spec clarification Q3 explicitly requires sessions to be cleared when the browser is closed. Firebase Auth offers three persistence modes: `LOCAL` (IndexedDB, survives browser close), `SESSION` (sessionStorage, cleared on browser close), and `NONE` (in-memory only). `browserSessionPersistence` maps to `SESSION` and satisfies the requirement.

**Implementation**: Call `setPersistence(auth, browserSessionPersistence)` once during Firebase init in `src/firebase/firebase.js`.

**Alternatives considered**:
- `browserLocalPersistence` (default) — rejected: survives browser close, violates Q3.
- `inMemoryPersistence` — rejected: cleared on page refresh, too aggressive for UX.

---

## Decision 3 — Username Uniqueness Enforcement

**Decision**: Firestore transaction on registration — query the `users` collection for an existing document with `username == chosenUsername`; abort and return error if found; otherwise create the `users/{uid}` document atomically.

**Rationale**: Firebase Authentication has no native username field with uniqueness enforcement. `auth.currentUser.displayName` exists but is not queryable for uniqueness. The only reliable approach is a dedicated `users` collection in Firestore, queried before account creation. A transaction prevents race conditions where two users register the same username simultaneously.

**Implementation**:
1. `runTransaction` that reads a sentinel document (or queries the collection) and writes only if no conflict.
2. Alternatively, use a secondary `usernames/{username}` collection as a uniqueness lock (simpler transaction target). Either approach is valid.

**Alternatives considered**:
- Firebase Auth `displayName` — rejected: not queryable, not enforceable for uniqueness.
- Cloud Function trigger — rejected: introduces server-side code outside the allowed stack (Art. VI).

---

## Decision 4 — Post Data Denormalisation

**Decision**: Store `authorUsername` directly in each post document.

**Rationale**: The feed requires displaying the author's username on every post. Without denormalisation, every feed render would require N additional Firestore reads (one per post) to resolve usernames. Storing `authorUsername` at write time costs one extra field per post but eliminates all read-time lookups. This is standard Firestore practice.

**Tradeoff**: If a user changes their username after posting (not in scope for MVP), existing posts would show the old username. Since username changes are out of scope, this tradeoff is acceptable.

**Alternatives considered**:
- Joining `users` collection on every read — rejected: N+1 reads, worse performance, higher cost.
- Firebase Extensions for denormalisation — rejected: unnecessary complexity (Art. VIII).

---

## Decision 5 — Image Upload Flow

**Decision**: `uploadBytesResumable` → `getDownloadURL` → Firestore write.

**Rationale**: `uploadBytesResumable` (vs `uploadBytes`) provides a `UploadTask` with progress events, enabling a loading indicator during upload. The Firestore document is only written after `getDownloadURL` succeeds, preventing orphaned posts with broken image URLs.

**Flow**:
1. Client validates file format (JPEG/PNG/GIF/WebP) and size (≤ 5 MB) before upload.
2. Generate a `postId` client-side with `doc(collection(db, 'posts')).id`.
3. Upload to `posts/{authorId}/{postId}` using `uploadBytesResumable`.
4. On upload completion, call `getDownloadURL` to get the public URL.
5. Write Firestore document with the URL.

**Alternatives considered**:
- `uploadBytes` (one-shot) — rejected: no progress events, harder to show loading state.
- Pre-signed URL approach — rejected: requires a custom server (Art. VI violation).

---

## Decision 6 — Real-Time Feed

**Decision**: `onSnapshot` Firestore listener on the `posts` collection.

**Rationale**: React state updated via `onSnapshot` gives real-time feed updates without polling. The listener is attached on component mount and unsubscribed on unmount via the returned unsubscribe function. This is idiomatic Firestore usage in React.

**Alternatives considered**:
- `getDocs` (one-time fetch) — rejected: no real-time updates; user must refresh to see new posts.
- Polling with `setInterval` — rejected: wasteful, adds complexity (Art. VIII).

---

## Decision 7 — Routing Strategy

**Decision**: `react-router-dom` v6 with `createBrowserRouter` + `<Outlet>` pattern for `PrivateRoute`.

**Rationale**: v6 is the current major version. The nested route pattern (`<Route element={<PrivateRoute />}><Route path="/feed" element={<FeedPage />} /></Route>`) cleanly separates the auth guard from the protected page without prop drilling. `<Navigate to="/" replace />` in `PrivateRoute` handles unauthenticated redirection.

**Alternatives considered**:
- Manual `window.location` redirect — rejected: bypasses React Router history, causes full page reload.
- Higher-order component (HOC) wrapping — rejected: more boilerplate than the v6 nested route pattern.

---

## Decision 8 — No TypeScript

**Decision**: JavaScript (ES2022+) only.

**Rationale**: Explicitly out of scope per the user's technical instructions. Adding TypeScript would require changes to `vite.config.js`, `tsconfig.json`, and every source file — violating Art. VIII (simplicity).

---

## All NEEDS CLARIFICATION Items Resolved

| Item | Resolution |
|---|---|
| Firebase SDK version | v9+ modular (already in package.json) |
| Auth session persistence | `browserSessionPersistence` — cleared on browser close |
| Username uniqueness | Firestore transaction on registration |
| Image formats/size | JPEG/PNG/GIF/WebP, ≤ 5 MB (from spec clarification Q1) |
| Feed empty state | Friendly message displayed (from spec clarification Q4) |
| Deletion confirmation | Required before delete executes (from spec clarification Q5) |
