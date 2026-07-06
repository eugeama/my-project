import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../services/auth'
import InlineError from '../components/InlineError'

// Maps Firebase Auth error codes to Spanish user-facing messages
function mapAuthError(code) {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
      return 'Credenciales incorrectas'
    case 'auth/invalid-email':
      return 'El email no es válido'
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Intentá más tarde.'
    default:
      return 'Ocurrió un error al iniciar sesión. Intentá de nuevo.'
  }
}

export default function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const newErrors = {}
    if (!email.trim()) newErrors.email = 'El email es obligatorio'
    if (!password.trim()) newErrors.password = 'La contraseña es obligatoria'
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
      await loginUser(email.trim(), password)
      navigate('/feed')
    } catch (err) {
      setSubmitError(mapAuthError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit} noValidate>
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
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>

      <p>
        ¿No tenés cuenta? <Link to="/register">Registrarse</Link>
      </p>
    </div>
  )
}
