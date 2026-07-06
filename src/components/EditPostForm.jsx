import { useState } from 'react'
import { updateTextPost, replacePostImage } from '../services/posts'
import InlineError from './InlineError'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Inline form for editing an existing post.
 *
 * Props:
 *   post    — the Firestore post document (id, type, content, imageUrl, authorId)
 *   onClose — called with no arguments on successful save or cancel
 */
export default function EditPostForm({ post, onClose }) {
  // text-post state
  const [content, setContent] = useState(post.type === 'text' ? post.content : '')

  // photo-post state
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')

  // shared state
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── photo file validation ───────────────────────────────────────────────────

  function handleFileChange(e) {
    const selected = e.target.files[0] || null
    setFile(null)
    setFileError('')

    if (!selected) return

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFileError('Formato no soportado. Usá JPEG, PNG, GIF o WebP.')
      return
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setFileError('El archivo supera los 5 MB permitidos.')
      return
    }
    setFile(selected)
  }

  // ── submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setLoading(true)

    try {
      if (post.type === 'text') {
        await updateTextPost(post.id, content.trim())
      } else {
        await replacePostImage(post.authorId, post.id, file)
      }
      onClose()
    } catch (err) {
      setSubmitError(err.message || 'Error al guardar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── derived validation ──────────────────────────────────────────────────────

  const textTooLong = content.length > 100
  const textEmpty = content.trim().length === 0
  const textInvalid = post.type === 'text' && (textEmpty || textTooLong)
  const photoInvalid = post.type === 'photo' && (!file || !!fileError)
  const submitDisabled = loading || textInvalid || photoInvalid

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ marginTop: 10, padding: '10px 12px', background: '#f9f9f9', borderRadius: 6 }}
    >
      {post.type === 'text' && (
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
      )}

      {post.type === 'photo' && (
        <div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            disabled={loading}
          />
          <InlineError message={fileError} />
        </div>
      )}

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
