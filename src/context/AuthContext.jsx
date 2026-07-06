import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentUsername, setCurrentUsername] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid))
        setCurrentUser(user)
        setCurrentUsername(docSnap.exists() ? docSnap.data().username : null)
        setLoading(false)
      } else {
        setCurrentUser(null)
        setCurrentUsername(null)
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  async function refreshProfile() {
    if (!currentUser) return
    const docSnap = await getDoc(doc(db, 'users', currentUser.uid))
    setCurrentUsername(docSnap.exists() ? docSnap.data().username : null)
  }

  const value = { currentUser, currentUsername, loading, refreshProfile }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
