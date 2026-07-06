import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateUsername, updateUserPassword } from '../services/auth'
import InlineError from './InlineError'

export default function ChangeCredentialsForm() {
  const { currentUser, currentUsername, refreshProfile } = useAuth()

  // ── username section ──────────────────────────────────────────────────────
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameSuccess, setUsernameSuccess] = useState(false)
  const [usernameLoading, setUsernameLoading] = useState(false)

  async function handleUsernameSubmit(e) {
    e.preventDefault()
    setUsernameError('')
    setUsernameSuccess(false)

    const trimmed = newUsername.trim()
    if (!trimmed) return setUsernameError('Ingresá un nombre de usuario.')
    if (trimmed === currentUsername) return setUsernameError('Es el mismo nombre de usuario actual.')
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed))
      return setUsernameError('Solo letras, números y _ (3–20 caracteres).')

    setUsernameLoading(true)
    try {
      await updateUsername(currentUser.uid, trimmed)
      await refreshProfile()
      setNewUsername('')
      setUsernameSuccess(true)
    } catch (err) {
      setUsernameError(
        err.code === 'username-already-taken'
          ? 'Ese nombre de usuario ya está en uso.'
          : 'Error al actualizar. Intentá de nuevo.'
      )
    } finally {
      setUsernameLoading(false)
    }
  }

  // ── password section ──────────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess(false)

    if (!currentPwd) return setPwdError('Ingresá tu contraseña actual.')
    if (!newPwd) return setPwdError('Ingresá la nueva contraseña.')
    if (newPwd.length < 6) return setPwdError('La nueva contraseña debe tener al menos 6 caracteres.')
    if (newPwd !== confirmPwd) return setPwdError('Las contraseñas no coinciden.')

    setPwdLoading(true)
    try {
      await updateUserPassword(currentUser, currentPwd, newPwd)
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setPwdSuccess(true)
    } catch (err) {
      setPwdError(
        err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? 'La contraseña actual es incorrecta.'
          : 'Error al actualizar. Intentá de nuevo.'
      )
    } finally {
      setPwdLoading(false)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '16px', marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 16px' }}>Configuración de cuenta</h3>

      {/* Change username */}
      <section style={{ marginBottom: 24 }}>
        <h4 style={{ margin: '0 0 6px' }}>Cambiar nombre de usuario</h4>
        <p style={{ margin: '0 0 10px', fontSize: '0.85em', color: '#666' }}>
          Actual: <strong>{currentUsername}</strong>
        </p>
        <form onSubmit={handleUsernameSubmit} noValidate>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => { setNewUsername(e.target.value); setUsernameSuccess(false) }}
              placeholder="Nuevo nombre de usuario"
              disabled={usernameLoading}
              style={{ flex: 1 }}
            />
            <button type="submit" disabled={usernameLoading || !newUsername.trim()}>
              {usernameLoading ? 'Guardando...' : 'Cambiar'}
            </button>
          </div>
          <InlineError message={usernameError} />
          {usernameSuccess && (
            <p style={{ color: 'green', fontSize: '0.85em', margin: '4px 0 0' }}>
              ¡Nombre de usuario actualizado!
            </p>
          )}
        </form>
      </section>

      {/* Change password */}
      <section>
        <h4 style={{ margin: '0 0 10px' }}>Cambiar contraseña</h4>
        <form onSubmit={handlePasswordSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => { setCurrentPwd(e.target.value); setPwdSuccess(false) }}
              placeholder="Contraseña actual"
              disabled={pwdLoading}
            />
            <input
              type="password"
              value={newPwd}
              onChange={(e) => { setNewPwd(e.target.value); setPwdSuccess(false) }}
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              disabled={pwdLoading}
            />
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => { setConfirmPwd(e.target.value); setPwdSuccess(false) }}
              placeholder="Confirmar nueva contraseña"
              disabled={pwdLoading}
            />
          </div>
          <InlineError message={pwdError} />
          {pwdSuccess && (
            <p style={{ color: 'green', fontSize: '0.85em', margin: '4px 0 0' }}>
              ¡Contraseña actualizada!
            </p>
          )}
          <button
            type="submit"
            disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}
            style={{ marginTop: 8 }}
          >
            {pwdLoading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>
    </div>
  )
}
