import { useState, useRef } from 'react'
import { collection, doc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { createTextPost, uploadImage, createPhotoPost } from '../services/posts'
import InlineError from './InlineError'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Props:
 *   currentUser     — Firebase Auth User object
 *   currentUsername — string from AuthContext
 */
export default function CreatePostForm({ currentUser, currentUsername }) {
  // 'text' | 'photo' | null — null means no type selected yet
  const [mode, setMode] = useState(null)

  // text-post state
  const [content, setContent] = useState('')

  // photo-post state
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(null)
  const fileInputRef = useRef(null)

  // shared state
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── mode selection ──────────────────────────────────────────────────────────

  function selectMode(newMode) {
    setMode(newMode)
    setContent('')
    setFile(null)
    setFileError('')
    setSubmitError('')
    setUploadProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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

    if (!mode) return // shouldn't happen — button disabled, but guard anyway

    setLoading(true)
    try {
      if (mode === 'text') {
        await createTextPost(currentUser.uid, currentUsername, content.trim())
      } else {
        // Generate a Firestore doc ID before uploading so Storage path matches doc
        const postId = doc(collection(db, 'posts')).id
        const imageUrl = await uploadImage(currentUser.uid, postId, file, (progress) => {
          setUploadProgress(Math.round(progress))
        })
        await createPhotoPost(currentUser.uid, currentUsername, imageUrl)
      }
      // Reset on success
      setMode(null)
      setContent('')
      setFile(null)
      setFileError('')
      setUploadProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setSubmitError(err.message || 'Error al publicar. Intentá de nuevo.')
    } finally {
      setLoading(false)
      setUploadProgress(null)
    }
  }

  // ── derived validation ──────────────────────────────────────────────────────

  const textTooLong = content.length > 100
  const textEmpty = content.trim().length === 0
  const textInvalid = mode === 'text' && (textEmpty || textTooLong)
  const photoInvalid = mode === 'photo' && (!file || !!fileError)
  const submitDisabled = loading || !mode || textInvalid || photoInvalid

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '16px', marginBottom: 24 }}>
      <p style={{ margin: '0 0 10px', fontWeight: 600 }}>Nueva publicación</p>

      {/* Type selector — no default (FR-008 / FR-011) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => selectMode('text')}
          disabled={loading}
          style={{ fontWeight: mode === 'text' ? 700 : 400 }}
        >
          Publicar texto
        </button>
        <button
          type="button"
          onClick={() => selectMode('photo')}
          disabled={loading}
          style={{ fontWeight: mode === 'photo' ? 700 : 400 }}
        >
          Publicar foto
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

      {/* Photo post form (T031 — Phase 7) */}
      {mode === 'photo' && (
        <form onSubmit={handleSubmit} noValidate>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              disabled={loading}
            />
            <InlineError message={fileError} />
          </div>

          {uploadProgress !== null && (
            <p style={{ color: '#555', fontSize: '0.85em' }}>Subiendo… {uploadProgress}%</p>
          )}

          <InlineError message={submitError} />

          <button type="submit" disabled={submitDisabled} style={{ marginTop: 8 }}>
            {loading ? `Subiendo${uploadProgress !== null ? ` (${uploadProgress}%)` : '…'}` : 'Publicar foto'}
          </button>
        </form>
      )}
    </div>
  )
}
