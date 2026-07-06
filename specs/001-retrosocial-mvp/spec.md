# Feature Specification: RetroSocial MVP

**Feature Branch**: `001-retrosocial-mvp`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description: "Sistema de red social simple donde los usuarios pueden registrarse, iniciar sesión y publicar contenido corto."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — User Registration (Priority: P1)

A visitor can create a new account by providing their email address, a password, and a display username. After successful registration, they have immediate access to the platform.

**Why this priority**: Authentication is the entry point for all other functionality. Without a working registration flow, no other user story can be independently exercised.

**Independent Test**: Navigate to the registration screen, submit a valid email, password, and username. Delivers a fully working account-creation flow that can be demonstrated end-to-end.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on the registration screen, **When** they submit a valid email address, a password, and a username, **Then** a new account is created and they are redirected to the post feed.
2. **Given** an unauthenticated visitor on the registration screen, **When** they submit an email address that is already associated with an existing account, **Then** a clear error message is shown and no new account is created.
3. **Given** an unauthenticated visitor on the registration screen, **When** they attempt to submit with any required field left empty, **Then** submission is blocked and an error message is shown.

---

### User Story 2 — User Login (Priority: P2)

A registered user can sign in using their email address and password to gain access to the platform.

**Why this priority**: Login is the primary access path for returning users and unblocks all authenticated user stories.

**Independent Test**: Using an existing account, submit valid credentials on the login screen. Delivers a working sign-in flow.

**Acceptance Scenarios**:

1. **Given** a registered user on the login screen, **When** they submit their correct email address and password, **Then** they are authenticated and redirected to the post feed.
2. **Given** a registered user on the login screen, **When** they submit incorrect credentials, **Then** an error message is shown and they remain unauthenticated.
3. **Given** an unauthenticated visitor navigating directly to the post feed URL, **When** the page loads, **Then** they are immediately redirected to the login screen.

---

### User Story 3 — Create a Text Post (Priority: P3)

An authenticated user can publish a text post containing up to 100 characters of plain text.

**Why this priority**: Text posts are the core content-creation feature and the simplest path to delivering user value.

**Independent Test**: Log in, select "text post", enter content within the character limit, and submit. Delivers a working text post creation flow visible in the feed.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the post creation interface, **When** they select "text post", enter up to 100 characters, and submit, **Then** the post is published and appears in the feed with the author's username and creation timestamp.
2. **Given** an authenticated user who has selected "text post", **When** they attempt to submit with more than 100 characters, **Then** the submission is rejected and a clear error message indicating the character limit is shown.
3. **Given** an authenticated user on the post creation interface, **When** they attempt to submit without having selected any post type, **Then** the submission is rejected and a message prompts them to choose a type.

---

### User Story 4 — Create a Photo Post (Priority: P4)

An authenticated user can publish a photo post by uploading a single image. No text is associated with a photo post.

**Why this priority**: Completes the two-type content model. Both post types together fulfill the content-creation scope of the MVP.

**Independent Test**: Log in, select "photo post", choose an image file, and submit. Delivers a working photo post creation flow visible in the feed.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the post creation interface, **When** they select "photo post", choose a valid image file, and submit, **Then** the post is published with the image displayed in the feed alongside the author's username and creation timestamp.
2. **Given** an authenticated user who has selected "photo post", **When** they attempt to submit without choosing an image, **Then** the submission is rejected and a clear error message is shown.
3. **Given** an authenticated user on the post creation interface, **When** they select "photo post", **Then** no text input field is presented (the interface enforces mutual exclusivity between post types).

---

### User Story 5 — View the Post Feed (Priority: P5)

An authenticated user can browse all published posts from all users. Posts from other users are visible in read-only mode — no editing or deletion is possible.

**Why this priority**: Publishing content that nobody can read delivers no value. Feed visibility completes the content loop.

**Independent Test**: Log in with two separate accounts. Publish a post with one account. Verify it is visible in the feed of the other account, with no edit or delete controls.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the feed, **When** other users have published posts, **Then** those posts are visible in the feed, showing the author's username and creation date.
2. **Given** an authenticated user viewing a post authored by someone else, **When** they examine the post, **Then** no edit or delete controls are rendered or accessible for that post.
3. **Given** an authenticated user on the feed, **When** they view their own posts, **Then** edit and delete controls are visible only for their own posts.

---

### User Story 6 — Edit Own Post (Priority: P6)

An authenticated user can modify a post they previously created. Editing a text post must respect the 100-character limit; editing a photo post means replacing the image.

**Why this priority**: Completes the post management lifecycle. Users must be able to correct mistakes after publication.

**Independent Test**: Create a post, then edit it. Verify the updated content appears in the feed and an edit timestamp is shown.

**Acceptance Scenarios**:

1. **Given** an authenticated user viewing their own text post, **When** they edit the content (≤ 100 characters) and save, **Then** the post is updated in the feed and the last-edited timestamp is recorded and visible.
2. **Given** an authenticated user editing their own text post, **When** they enter more than 100 characters and attempt to save, **Then** the save is rejected and a clear error message is shown.
3. **Given** an authenticated user viewing their own photo post, **When** they replace the image with a new one and save, **Then** the post is updated with the new image.
4. **Given** an authenticated user attempting to edit another user's post via direct URL manipulation or developer tools, **When** the edit is attempted, **Then** the action is rejected at the data level and produces no changes.

---

### User Story 7 — Delete Own Post (Priority: P7)

An authenticated user can permanently remove a post they authored.

**Why this priority**: Completes full create-read-update-delete capability for posts and gives users control over their own content.

**Independent Test**: Create a post, delete it, and verify it no longer appears in the feed.

**Acceptance Scenarios**:

1. **Given** an authenticated user viewing their own post, **When** they trigger the delete action and confirm the confirmation prompt, **Then** the post is permanently removed and no longer appears in the feed.
2. **Given** an authenticated user viewing their own post, **When** they trigger the delete action but cancel at the confirmation prompt, **Then** the post remains unchanged and visible in the feed.
3. **Given** an authenticated user attempting to delete another user's post via UI manipulation or direct data access, **When** the deletion is attempted, **Then** the action is rejected at the data level and the post remains.

---

### User Story 8 — Logout (Priority: P8)

An authenticated user can end their session, after which all protected screens become inaccessible without re-authentication.

**Why this priority**: Session termination is a fundamental security requirement for any authenticated system.

**Independent Test**: Log in, log out, then attempt to navigate to the feed. Verify redirection to the login screen.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they trigger logout, **Then** their session is ended and they are redirected to the login screen.
2. **Given** a user who has logged out, **When** they attempt to navigate directly to the feed, **Then** they are redirected to the login screen.

---

### Edge Cases

- **Text post over 100 characters**: Submission is blocked before any data is persisted. An inline error message communicates the character limit clearly.
- **Post submission with no type selected**: Submission is blocked. The user is prompted to select either "text post" or "photo post".
- **Photo post submission with no image selected**: Submission is blocked. The user is prompted to select an image.
- **Photo post with an unsupported file format**: If the selected file is not JPEG, PNG, GIF, or WebP, submission is blocked and the user is told which formats are accepted.
- **Photo post with an oversized file (> 5 MB)**: Submission is blocked before any data is uploaded. The user is informed the file exceeds the 5 MB limit.
- **Attempt to edit or delete a foreign post via URL or developer tools**: Rejected visually (controls not rendered for foreign posts) and functionally (the data layer refuses the operation regardless of how it is triggered).
- **Registration with an already-used email**: Registration is rejected. A message clearly indicates the email address is already in use.
- **Registration with an already-taken username**: Registration is rejected. A message clearly indicates the username is already in use.
- **Accessing any protected screen while unauthenticated**: The user is immediately redirected to the login screen.
- **Session expiry mid-use**: If the user's session expires while they are using the app, the next action that requires authentication redirects them to the login screen.
- **Browser close and reopen**: Closing and reopening the browser invalidates the session. The user is redirected to the login screen when they attempt to access any protected screen.
- **Empty feed**: When no posts exist (e.g., on a fresh platform or after all posts are deleted), the feed displays a clear empty-state message rather than a blank screen.
- **Deletion cancelled at confirmation**: If the user triggers delete but dismisses the confirmation prompt, the post remains intact. No data is modified.

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication**

- **FR-001**: The system MUST provide a registration screen with three required fields: email address, password, and username.
- **FR-002**: The system MUST reject a registration attempt where the provided email address is already associated with an existing account, and MUST display a clear, specific error message to the user.
- **FR-028**: The system MUST reject a registration attempt where the chosen username is already in use by another account, and MUST display a clear, specific error message to the user. Usernames are unique across the platform.
- **FR-003**: The system MUST provide a login screen with fields for email address and password.
- **FR-004**: The system MUST reject login attempts with invalid credentials and display an error message.
- **FR-005**: The system MUST redirect any unauthenticated user attempting to access a protected screen to the login screen.
- **FR-006**: The system MUST provide a visible, accessible logout action for authenticated users.
- **FR-007**: After logout, all protected screens MUST be inaccessible without re-authentication; any direct navigation attempt MUST result in redirection to the login screen.
- **FR-029**: The user's session MUST NOT persist across browser close. Opening a new browser session always requires the user to log in again, regardless of whether they previously logged out explicitly.

**Post Creation**

- **FR-008**: An authenticated user MUST be presented with an explicit choice between exactly two mutually exclusive post types — "text post" and "photo post" — before creating a post. No combined or default type exists.
- **FR-009**: A text post MUST accept plain text content of no more than 100 characters. Rich formatting (HTML, Markdown, etc.) is not permitted.
- **FR-010**: The system MUST reject a text post submission where the content exceeds 100 characters and MUST display a clear error message specifying the character limit.
- **FR-011**: The system MUST reject any post submission attempted before a post type has been explicitly selected.
- **FR-012**: A photo post MUST accept exactly one image upload in JPEG, PNG, GIF, or WebP format, with a maximum file size of 5 MB. It MUST NOT include any text content.
- **FR-013**: The system MUST reject a photo post submission where no image has been selected, and MUST display a clear error message.
- **FR-027**: The system MUST reject a photo post submission where the selected file is not in JPEG, PNG, GIF, or WebP format, or exceeds 5 MB in size, and MUST display a clear error message identifying the specific reason for rejection (unsupported format or file too large).
- **FR-014**: Each published post MUST be associated with the authenticated user who created it (the author) and MUST display the author's username.
- **FR-015**: Each post MUST record and display the date and time at which it was created.

**Post Feed**

- **FR-016**: An authenticated user MUST be able to view all published posts from all users in a single feed.
- **FR-017**: Posts in the feed MUST be accessible to any authenticated user regardless of authorship.
- **FR-018**: A post authored by another user MUST be presented in read-only mode; no edit or delete controls may be rendered or accessible for that post.
- **FR-030**: When the feed contains no posts, the system MUST display a clear empty-state message indicating that no content has been published yet. A blank or empty screen is not acceptable.

**Post Editing and Deletion**

- **FR-019**: An authenticated user MUST be able to edit the text content of a text post they authored, subject to the 100-character limit (FR-010 applies to edits).
- **FR-020**: An authenticated user MUST be able to edit a photo post they authored by replacing the existing image with a new one.
- **FR-021**: An edited post MUST record and display the date and time of its most recent edit.
- **FR-022**: An authenticated user MUST be able to permanently delete a post they authored. Before deletion is carried out, the system MUST present an explicit confirmation step (e.g., "Are you sure you want to delete this post?"). The post is only removed after the user confirms; cancelling the confirmation leaves the post intact.
- **FR-023**: Edit and delete controls MUST only be rendered for posts authored by the currently authenticated user.

**Access Control**

- **FR-024**: The system MUST enforce post ownership at the data level: it MUST NOT be possible to create a post attributed to a different user, regardless of how the request is made.
- **FR-025**: The system MUST enforce post ownership at the data level: it MUST NOT be possible to edit or delete a post authored by another user, regardless of UI state or direct data access attempts.
- **FR-026**: A user with no active session MUST NOT be able to access, view, create, edit, or delete any post.

---

### Key Entities

- **User**: A registered person with a unique identifier, an email address (unique across the platform), a securely managed credential, and a display username (unique across the platform). A user may author zero or more posts.

- **Post**: A piece of content published by a User. A post belongs to exactly one of two mutually exclusive types:
  - *Text post*: carries plain text content (maximum 100 characters); carries no image.
  - *Photo post*: carries a reference to a single uploaded image; carries no text content.
  
  Every post stores: its type, its content (text string or image reference, never both), the unique identifier of its author, the author's display username (for efficient display), a creation timestamp, and an optional last-edited timestamp. A post cannot exist independently of its author.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor can complete registration (email, password, username) and arrive at the feed in under 60 seconds.
- **SC-002**: A registered user can log in and view the post feed within 5 seconds of submitting valid credentials.
- **SC-003**: An authenticated user can publish a text post (select type → enter text → submit) in under 30 seconds.
- **SC-004**: An authenticated user can publish a photo post (select type → choose image → submit) in under 60 seconds.
- **SC-005**: 100% of text post submissions that exceed 100 characters are rejected with an inline error message before any data is persisted.
- **SC-006**: 100% of unauthenticated navigation attempts to any protected screen result in immediate redirection to the login screen.
- **SC-007**: Edit and delete controls for posts authored by other users are never rendered in the UI, regardless of the authenticated user's session state.
- **SC-008**: 100% of attempts to edit or delete another user's post — via any mechanism (UI, URL manipulation, direct data access) — are rejected at the data layer with no changes persisted.
- **SC-009**: A registration attempt using an already-registered email address produces a visible, specific error message within 3 seconds.
- **SC-010**: A registration attempt using an already-taken username produces a visible, specific error message within 3 seconds.

---

## Assumptions

- No email verification step is required during registration for this MVP; users gain immediate access to the feed upon successfully registering.
- Sessions are scoped to the browser session (tab/window lifetime). Closing the browser clears the session; the user must log in again on their next visit.
- The post feed displays all posts from all users in reverse chronological order (newest first). Pagination, filtering, and search are out of scope for this MVP.
- There is no dedicated user profile page; the author's username is displayed inline within each post in the feed.
- Image uploads for photo posts are restricted to JPEG, PNG, GIF, and WebP formats with a maximum file size of 5 MB. Files outside these constraints are rejected client-side before any upload begins.
- A single global feed (all users' posts combined) is sufficient; no personal or filtered feed exists.
- The registration screen is accessible via a link from the login screen; no separate navigation path is required.
- Usernames are unique across the platform; the system enforces this at registration time.
- No comment, like, follow, notification, or messaging functionality is in scope (per constitution Article I).
- No administrator role or moderation capability exists; all access control is user-to-own-content only.

---

## Clarifications

### Session 2026-07-06

- Q: What image formats and maximum file size are accepted for photo posts? → A: JPEG, PNG, GIF, WebP; maximum 5 MB.
- Q: Are usernames required to be unique across the platform? → A: Yes — usernames are unique; registration is rejected if the username is already taken.
- Q: Does the user's session persist across browser close/reopen? → A: No — sessions are cleared on browser close; the user must log in again on every new browser session.
- Q: What does the feed display when there are no posts? → A: A clear empty-state message (e.g., "No posts yet — be the first to publish!"); a blank screen is not acceptable.
- Q: Does deleting a post require an explicit confirmation step? → A: Yes — a confirmation prompt is shown before deletion; cancelling leaves the post intact.
