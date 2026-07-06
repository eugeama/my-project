import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../services/auth'
import InlineError from '../components/InlineError'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const newErrors = {}
    if (!email.trim()) newErrors.email = 'El email es obligatorio'
    if (!password.trim()) newErrors.password = 'La contraseña es obligatoria'
    if (!username.trim()) newErrors.username = 'El nombre de usuario es obligatorio'
    return newErrors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')

    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    setLoading(true)
    try {
      await registerUser(email.trim(), password, username.trim())
      navigate('/feed')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setErrors((prev) => ({ ...prev, email: 'Este email ya está en uso' }))
      } else if (err.code === 'username-already-taken') {
        setErrors((prev) => ({ ...prev, username: 'Este nombre de usuario ya está en uso' }))
      } else {
        setSubmitError('Ocurrió un error al registrarse. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="username">Nombre de usuario</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          {errors.username && <InlineError message={errors.username} />}
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          {errors.email && <InlineError message={errors.email} />}
        </div>

        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {errors.password && <InlineError message={errors.password} />}
        </div>

        <InlineError message={submitError} />

        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>

      <p>
        ¿Ya tenés cuenta? <Link to="/">Iniciar sesión</Link>
      </p>
    </div>
  )
}
