import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logoutUser } from '../services/auth'
import CreatePostForm from '../components/CreatePostForm'
import ChangeCredentialsForm from '../components/ChangeCredentialsForm'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { currentUser, currentUsername } = useAuth()

  async function handleLogout() {
    await logoutUser()
    navigate('/', { replace: true })
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => navigate('/feed')}>← Volver al feed</button>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </header>

      <h2 style={{ margin: '0 0 20px' }}>{currentUsername}</h2>

      <CreatePostForm currentUser={currentUser} currentUsername={currentUsername} />

      <ChangeCredentialsForm />
    </div>
  )
}
