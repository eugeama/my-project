import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logoutUser } from '../services/auth'
import PostFeed from '../components/PostFeed'
// CreatePostForm is mounted here in T029 (Phase 6)

export default function FeedPage() {
  const navigate = useNavigate()
  const { currentUser, currentUsername } = useAuth()

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
            <span style={{ fontSize: '0.9em', color: '#555' }}>@{currentUsername}</span>
          )}
          <button onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      {/* CreatePostForm will be rendered here in Phase 6 (T029) */}

      <PostFeed currentUser={currentUser} />
    </div>
  )
}
