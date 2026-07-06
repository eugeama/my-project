# Contract: Service API

**Branch**: `001-retrosocial-mvp` | **Date**: 2026-07-06

Service functions exposed by `src/services/auth.js` and `src/services/posts.js`. These are the contracts that UI components must use — no component imports Firebase SDK functions directly.

---

## `src/services/auth.js`

### `registerUser(email, password, username)`

Creates a new Firebase Auth account and writes the corresponding `users/{uid}` document.

**Parameters**:
| Name | Type | Description |
|---|---|---|
| `email` | `string` | User's email address |
| `password` | `string` | User's chosen password |
| `username` | `string` | Display name; must be unique platform-wide |

**Returns**: `Promise<UserCredential>`

**Throws**:
| Code | Condition |
|---|---|
| `'auth/email-already-in-use'` | Firebase Auth: email already registered |
| `'username-already-taken'` | Custom: username exists in `users` collection |
| Any Firebase Auth error code | Propagated as-is from `createUserWithEmailAndPassword` |

**Side effects**:
- Creates `users/{uid}` document in Firestore with `{ uid, username, email, createdAt }`.

---

### `loginUser(email, password)`

Signs in an existing user with email/password.

**Parameters**:
| Name | Type | Description |
|---|---|---|
| `email` | `string` | User's email address |
| `password` | `string` | User's password |

**Returns**: `Promise<UserCredential>`

**Throws**: Firebase Auth error codes (e.g., `'auth/wrong-password'`, `'auth/user-not-found'`).

---

### `logoutUser()`

Signs out the current user.

**Parameters**: none

**Returns**: `Promise<void>`

---

## `src/services/posts.js`

### `getPosts(callback)`

Attaches a real-time Firestore listener on the `posts` collection ordered by `createdAt` descending.

**Parameters**:
| Name | Type | Description |
|---|---|---|
| `callback` | `(posts: Post[]) => void` | Called on every snapshot update with the full post array |

**Returns**: `() => void` — unsubscribe function; must be called on component unmount.

---

### `createTextPost(authorId, authorUsername, content)`

Creates a new text post document in Firestore.

**Parameters**:
| Name | Type | Constraints |
|---|---|---|
| `authorId` | `string` | Firebase Auth UID of the caller |
| `authorUsername` | `string` | Caller's display name |
| `content` | `string` | 1–100 characters; plain text only |

**Returns**: `Promise<DocumentReference>`

**Throws**: Firestore permission error if `authorId !== request.auth.uid`; client should validate length before calling.

---

### `uploadImage(authorId, postId, file)`

Uploads an image file to Firebase Storage at `posts/{authorId}/{postId}`.

**Parameters**:
| Name | Type | Constraints |
|---|---|---|
| `authorId` | `string` | Firebase Auth UID of the caller |
| `postId` | `string` | Pre-generated Firestore document ID |
| `file` | `File` | JPEG/PNG/GIF/WebP; ≤ 5 MB |

**Returns**: `Promise<string>` — the public download URL.

**Throws**: Storage permission error; network error; file constraint violation (caught in Storage Rules).

**Progress**: Uses `uploadBytesResumable`; callers may attach a progress handler if needed (optional for MVP).

---

### `createPhotoPost(authorId, authorUsername, imageUrl)`

Creates a new photo post document in Firestore after image upload completes.

**Parameters**:
| Name | Type | Description |
|---|---|---|
| `authorId` | `string` | Firebase Auth UID of the caller |
| `authorUsername` | `string` | Caller's display name |
| `imageUrl` | `string` | Download URL returned by `uploadImage` |

**Returns**: `Promise<DocumentReference>`

---

### `updateTextPost(postId, content)`

Updates the `content` and `updatedAt` fields of an existing text post.

**Parameters**:
| Name | Type | Constraints |
|---|---|---|
| `postId` | `string` | Firestore document ID |
| `content` | `string` | 1–100 characters |

**Returns**: `Promise<void>`

**Throws**: Firestore permission error if caller is not the post author.

---

### `replacePostImage(authorId, postId, newFile)`

Uploads a replacement image (same Storage path, overwriting) and updates the post's `imageUrl` and `updatedAt`.

**Parameters**:
| Name | Type | Constraints |
|---|---|---|
| `authorId` | `string` | Firebase Auth UID of the caller |
| `postId` | `string` | Firestore document ID |
| `newFile` | `File` | JPEG/PNG/GIF/WebP; ≤ 5 MB |

**Returns**: `Promise<void>`

**Throws**: Storage permission error; Firestore permission error if caller is not the post author.

---

### `deletePost(postId, authorId, imageUrl)`

Deletes the Firestore post document and, if `imageUrl` is set, the corresponding Storage object.

**Parameters**:
| Name | Type | Description |
|---|---|---|
| `postId` | `string` | Firestore document ID |
| `authorId` | `string` | Firebase Auth UID of the caller (used to build Storage path) |
| `imageUrl` | `string \| null` | If non-null, the Storage object is also deleted |

**Returns**: `Promise<void>`

**Throws**: Firestore permission error if caller is not the post author.

---

## Post Object Shape (returned by `getPosts`)

```js
{
  id: string,             // Firestore document ID
  type: 'text' | 'photo',
  content: string | null, // non-null only for type='text'
  imageUrl: string | null,// non-null only for type='photo'
  authorId: string,
  authorUsername: string,
  createdAt: Timestamp,
  updatedAt: Timestamp | null
}
```
