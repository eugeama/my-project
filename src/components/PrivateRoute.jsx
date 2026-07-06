import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <div>Cargando...</div>
  }

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
