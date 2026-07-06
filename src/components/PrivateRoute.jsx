import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function PrivateRoute() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
