import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { db, storage } from '../firebase/firebase'

/**
 * Attaches a real-time listener to the posts collection ordered by createdAt descending.
 * @param {(posts: object[]) => void} callback  Called on every snapshot with the full array.
 * @returns {() => void} Unsubscribe function — call on component unmount.
 */
export function getPosts(callback) {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    callback(posts)
  })
}

/**
 * Creates a new text post.
 * @param {string} authorId
 * @param {string} authorUsername
 * @param {string} content  Must be 1–100 characters.
 */
export async function createTextPost(authorId, authorUsername, content) {
  if (!content || content.length > 100) {
    throw new Error('El contenido debe tener entre 1 y 100 caracteres')
  }
  return addDoc(collection(db, 'posts'), {
    type: 'text',
    content,
    imageUrl: null,
    authorId,
    authorUsername,
    createdAt: serverTimestamp(),
    updatedAt: null,
  })
}

/**
 * Uploads an image file to Storage and resolves with the download URL.
 * @param {string} authorId
 * @param {string} postId  Pre-generated Firestore doc ID used as the Storage filename.
 * @param {File} file
 * @returns {Promise<string>} Download URL.
 */
export function uploadImage(authorId, postId, file) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `posts/${authorId}/${postId}`)
    const uploadTask = uploadBytesResumable(storageRef, file)
    uploadTask.on(
      'state_changed',
      null,
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(url)
      }
    )
  })
}

/**
 * Creates a new photo post after the image has been uploaded.
 * @param {string} authorId
 * @param {string} authorUsername
 * @param {string} imageUrl  Download URL from uploadImage.
 */
export async function createPhotoPost(authorId, authorUsername, imageUrl) {
  return addDoc(collection(db, 'posts'), {
    type: 'photo',
    imageUrl,
    content: null,
    authorId,
    authorUsername,
    createdAt: serverTimestamp(),
    updatedAt: null,
  })
}

/**
 * Updates the text content of an existing text post.
 * @param {string} postId
 * @param {string} content  Must be 1–100 characters.
 */
export async function updateTextPost(postId, content) {
  if (!content || content.length > 100) {
    throw new Error('El contenido debe tener entre 1 y 100 caracteres')
  }
  return updateDoc(doc(db, 'posts', postId), {
    content,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Replaces the image of a photo post (overwrites the same Storage path).
 * @param {string} authorId
 * @param {string} postId
 * @param {File} newFile
 */
export async function replacePostImage(authorId, postId, newFile) {
  const newUrl = await uploadImage(authorId, postId, newFile)
  return updateDoc(doc(db, 'posts', postId), {
    imageUrl: newUrl,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Deletes a post document and, for photo posts, its Storage object.
 * @param {string} postId
 * @param {string} authorId
 * @param {string|null} imageUrl  If non-null the Storage file is also deleted.
 */
export async function deletePost(postId, authorId, imageUrl) {
  await deleteDoc(doc(db, 'posts', postId))
  if (imageUrl) {
    const storageRef = ref(storage, `posts/${authorId}/${postId}`)
    await deleteObject(storageRef)
  }
}
