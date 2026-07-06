import { useState } from 'react'
import { updateTextPost } from '../services/posts'
import InlineError from './InlineError'

/**
 * Inline form for editing an existing post.
 *
 * Props:
 *   post    — the Firestore post document (id, type, content, imageUrl, authorId)
 *   onClose — called with no arguments on successful save or cancel
 */
export default function EditPostForm({ post, onClose }) {
  const [content, setContent] = useState(post.content ?? '')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setLoading(true)
    try {
      await updateTextPost(post.id, content.trim())
      onClose()
    } catch (err) {
      setSubmitError(err.message || 'Error al guardar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const textTooLong = content.length > 100
  const textEmpty = content.trim().length === 0
  const submitDisabled = loading || textEmpty || textTooLong

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ marginTop: 10, padding: '10px 12px', background: '#f9f9f9', borderRadius: 6 }}
    >
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={200}
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

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="submit" disabled={submitDisabled}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onClose} disabled={loading}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
