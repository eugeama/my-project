import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logoutUser } from '../services/auth'
import PostFeed from '../components/PostFeed'

export default function FeedPage() {
  const navigate = useNavigate()
  const { currentUser, currentUsername, refreshProfile } = useAuth()

  // Re-read users/{uid} every time this page mounts — ensures currentUsername
  // is always up to date (covers fresh registration and username changes)
  useEffect(() => {
    refreshProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogout() {
    await logoutUser()
    navigate('/', { replace: true })
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>RetroSocial</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {currentUsername && (
            <button onClick={() => navigate('/profile')} style={{ fontWeight: 600 }}>
              {currentUsername}
            </button>
          )}
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <PostFeed currentUser={currentUser} />
    </div>
  )
}
