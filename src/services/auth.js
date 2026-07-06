import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'

/**
 * Registers a new user.
 *
 * Order of operations (important for Firestore security rules):
 *   1. Create the Firebase Auth account FIRST — this establishes request.auth,
 *      which is required by our Firestore rules for any read or write.
 *   2. Query the users collection for an existing document with the same username.
 *      (Firestore transactions do not support collection queries — we use getDocs
 *      with the newly-established auth token instead.)
 *   3. If the username is taken: delete the just-created Auth account (rollback)
 *      and throw a custom error.
 *   4. Otherwise write users/{uid} with the username and email.
 *
 * @param {string} email
 * @param {string} password
 * @param {string} username
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function registerUser(email, password, username) {
  // Step 1 — create Auth account (establishes request.auth for subsequent Firestore ops)
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const { user } = userCredential

  try {
    // Step 2 — check username uniqueness (requires auth, which is now established)
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '==', username)
    )
    const snapshot = await getDocs(usernameQuery)

    if (!snapshot.empty) {
      // Step 3 — username taken: roll back the Auth account
      await deleteUser(user)
      throw { code: 'username-already-taken' }
    }

    // Step 4 — write the user profile document
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      username,
      email,
      createdAt: serverTimestamp(),
    })
  } catch (err) {
    // If the error is our custom one, rethrow as-is
    if (err.code === 'username-already-taken') throw err
    // For any other Firestore error: also roll back the Auth account
    try { await deleteUser(user) } catch (_) { /* best effort */ }
    throw err
  }

  return userCredential
}

/**
 * Signs in an existing user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

/**
 * Signs out the current user.
 * @returns {Promise<void>}
 */
export async function logoutUser() {
  return signOut(auth)
}

/**
 * Updates the username of an existing user.
 * Checks uniqueness first, then updates the Firestore users/{uid} document.
 * @param {string} uid
 * @param {string} newUsername
 */
export async function updateUsername(uid, newUsername) {
  const usernameQuery = query(collection(db, 'users'), where('username', '==', newUsername))
  const snapshot = await getDocs(usernameQuery)
  if (!snapshot.empty) throw { code: 'username-already-taken' }
  await updateDoc(doc(db, 'users', uid), { username: newUsername })
}

/**
 * Re-authenticates the user with their current password, then sets a new password.
 * @param {import('firebase/auth').User} user
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export async function updateUserPassword(user, currentPassword, newPassword) {
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}
