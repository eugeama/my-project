# Contract: Security Rules

**Branch**: `001-retrosocial-mvp` | **Date**: 2026-07-06

Canonical source for both Firestore and Storage Security Rules. These rules are the **authoritative** implementation — copy them verbatim to `firestore.rules` and `storage.rules` at the project root before deploying.

These rules translate Articles II, IV, and VII of the RetroSocial constitution directly into enforceable data-layer policies.

---

## `firestore.rules`

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ── users/{userId} ────────────────────────────────────────────────────
    // Stores display username and email for each registered user.
    // Document ID equals Firebase Auth UID.
    match /users/{userId} {

      // Any authenticated user may read user documents.
      allow read: if request.auth != null;

      // Only the owner may create their own document.
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.data.username is string
                    && request.resource.data.username.size() > 0
                    && request.resource.data.email is string;

      // Only the owner may update their own document.
      allow update: if request.auth != null
                    && request.auth.uid == userId;

      // Deletion is not permitted.
      allow delete: if false;
    }

    // ── posts/{postId} ────────────────────────────────────────────────────
    // Stores text and photo posts. See data-model.md for field definitions.
    match /posts/{postId} {

      // Any authenticated user may read posts.
      allow read: if request.auth != null;

      // Creation: caller must be authenticated, authorId must match caller's UID,
      // and the post must satisfy exactly one of the two type invariants.
      allow create: if request.auth != null
                    && request.resource.data.authorId == request.auth.uid
                    && request.resource.data.authorUsername is string
                    && request.resource.data.authorUsername.size() > 0
                    && request.resource.data.updatedAt == null
                    && (
                         // Text post invariant
                         (
                           request.resource.data.type == 'text'
                           && request.resource.data.content is string
                           && request.resource.data.content.size() > 0
                           && request.resource.data.content.size() <= 100
                           && request.resource.data.imageUrl == null
                         )
                         ||
                         // Photo post invariant
                         (
                           request.resource.data.type == 'photo'
                           && request.resource.data.imageUrl is string
                           && request.resource.data.imageUrl.size() > 0
                           && request.resource.data.content == null
                         )
                       );

      // Update: only the author may edit; authorId and type are immutable;
      // content invariants re-validated on every update.
      allow update: if request.auth != null
                    && resource.data.authorId == request.auth.uid
                    && request.resource.data.authorId == request.auth.uid
                    && request.resource.data.type == resource.data.type
                    && (
                         (
                           request.resource.data.type == 'text'
                           && request.resource.data.content is string
                           && request.resource.data.content.size() > 0
                           && request.resource.data.content.size() <= 100
                           && request.resource.data.imageUrl == null
                         )
                         ||
                         (
                           request.resource.data.type == 'photo'
                           && request.resource.data.imageUrl is string
                           && request.resource.data.imageUrl.size() > 0
                           && request.resource.data.content == null
                         )
                       );

      // Delete: only the author may delete their own post.
      allow delete: if request.auth != null
                    && resource.data.authorId == request.auth.uid;
    }
  }
}
```

---

## `storage.rules`

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // Images are stored at posts/{authorId}/{postId}.
    // The {userId} wildcard is the Firebase Auth UID embedded in the path.
    match /posts/{userId}/{postId} {

      // Any authenticated user may read (view) images.
      allow read: if request.auth != null;

      // Write (upload or replace): caller must own the path,
      // file must be ≤ 5 MB, MIME type must be a supported image format.
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size <= 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/(jpeg|png|gif|webp)');

      // Delete: only the owner of the path may delete the image.
      allow delete: if request.auth != null
                    && request.auth.uid == userId;
    }
  }
}
```

---

## Deployment

```bash
# Deploy rules only (faster than full deploy)
firebase deploy --only firestore:rules,storage

# Or full deploy (rules + hosting)
firebase deploy
```

---

## Rule-to-Requirement Traceability

| Rule | Spec Requirement(s) |
|---|---|
| `posts` read requires `request.auth != null` | FR-026 |
| `posts` create requires `authorId == request.auth.uid` | FR-024 |
| `posts` text create: `content.size() <= 100` | FR-009, FR-010 |
| `posts` text create: `imageUrl == null` | Art. III (mutual exclusivity) |
| `posts` photo create: `imageUrl` non-empty | FR-012 |
| `posts` photo create: `content == null` | Art. III (mutual exclusivity) |
| `posts` update requires `resource.data.authorId == request.auth.uid` | FR-025 |
| `posts` update: `type` immutable | Art. III (post type cannot change after creation) |
| `posts` delete requires `resource.data.authorId == request.auth.uid` | FR-025 |
| Storage write requires `request.auth.uid == userId` | FR-024, FR-025 |
| Storage write: size ≤ 5 MB | FR-027 (clarification Q1) |
| Storage write: contentType jpeg/png/gif/webp | FR-027 (clarification Q1) |
| Storage delete requires `request.auth.uid == userId` | FR-025 |
