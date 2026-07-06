import { useState } from 'react'
import { createTextPost } from '../services/posts'
import InlineError from './InlineError'

/**
 * Props:
 *   currentUser     — Firebase Auth User object
 *   currentUsername — string from AuthContext
 */
export default function CreatePostForm({ currentUser, currentUsername }) {
  const [mode, setMode] = useState(null)
  const [content, setContent] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  function selectMode(newMode) {
    setMode(newMode)
    setContent('')
    setSubmitError('')
  }

  // ── submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    if (!mode) return

    setLoading(true)
    try {
      await createTextPost(currentUser.uid, currentUsername, content.trim())
      setMode(null)
      setContent('')
    } catch (err) {
      setSubmitError(err.message || 'Error al publicar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── derived validation ──────────────────────────────────────────────────────

  const textTooLong = content.length > 100
  const textEmpty = content.trim().length === 0
  const submitDisabled = loading || !mode || textEmpty || textTooLong

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '16px', marginBottom: 24 }}>
      <p style={{ margin: '0 0 10px', fontWeight: 600 }}>Nueva publicación</p>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => selectMode('text')}
          disabled={loading}
          style={{ fontWeight: mode === 'text' ? 700 : 400 }}
        >
          Publicar texto
        </button>
      </div>

      {/* Text post form */}
      {mode === 'text' && (
        <form onSubmit={handleSubmit} noValidate>
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="¿Qué estás pensando? (máx. 100 caracteres)"
              disabled={loading}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.85em', color: textTooLong ? 'red' : '#666' }}>
              {content.length}/100
            </div>
            {textTooLong && (
              <InlineError message="El texto supera los 100 caracteres permitidos." />
            )}
          </div>

          <InlineError message={submitError} />

          <button type="submit" disabled={submitDisabled} style={{ marginTop: 8 }}>
            {loading ? 'Publicando...' : 'Publicar'}
          </button>
        </form>
      )}
    </div>
  )
}
