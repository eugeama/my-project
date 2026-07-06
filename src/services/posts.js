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
import { db } from '../firebase/firebase'

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
 * Replaces the image of a photo post — disabled, Storage not available.
 */
export async function replacePostImage() {
  throw new Error('Las publicaciones de foto no están disponibles.')
}

/**
 * Deletes a post document.
 * @param {string} postId
 */
export async function deletePost(postId) {
  await deleteDoc(doc(db, 'posts', postId))
}
