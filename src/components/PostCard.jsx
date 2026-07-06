import { useState } from 'react'
import EditPostForm from './EditPostForm'
import { deletePost } from '../services/posts'

/**
 * Formats a Firestore Timestamp (or null) to a localised Spanish date+time string.
 * Returns null if the timestamp hasn't resolved yet (serverTimestamp() is null
 * until the server acknowledges the write).
 */
function formatDate(timestamp) {
  if (!timestamp) return null
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Renders a single post card.
 *
 * Props:
 *   post        — Firestore post document with id, type, content, imageUrl,
 *                 authorId, authorUsername, createdAt, updatedAt
 *   currentUser — Firebase Auth User object (from AuthContext)
 */
export default function PostCard({ post, currentUser }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const isOwner = currentUser && post.authorId === currentUser.uid
  const createdLabel = formatDate(post.createdAt)
  const updatedLabel = post.updatedAt ? formatDate(post.updatedAt) : null

  async function handleConfirmDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await deletePost(post.id)
      // Card disappears from feed via onSnapshot — no local state reset needed
    } catch (err) {
      setDeleteError('Error al eliminar. Intentá de nuevo.')
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
      {/* Author + timestamps */}
      <div style={{ marginBottom: 8 }}>
        <strong>{post.authorUsername}</strong>
        {createdLabel && (
          <span style={{ marginLeft: 8, fontSize: '0.85em', color: '#666' }}>
            {createdLabel}
          </span>
        )}
        {updatedLabel && (
          <span style={{ marginLeft: 8, fontSize: '0.8em', color: '#999', fontStyle: 'italic' }}>
            editado el {updatedLabel}
          </span>
        )}
      </div>

      {/* Post body */}
      {post.type === 'text' && (
        <p style={{ margin: 0 }}>{post.content}</p>
      )}
      {post.type === 'photo' && (
        <img
          src={post.imageUrl}
          alt="post"
          style={{ maxWidth: '100%', borderRadius: 4 }}
        />
      )}

      {/* Inline edit form — shown when owner clicks Editar */}
      {editing && (
        <EditPostForm post={post} onClose={() => setEditing(false)} />
      )}

      {/* Inline delete confirmation — shown when owner clicks Eliminar (FR-022) */}
      {confirming && (
        <div style={{ marginTop: 10, padding: '8px 10px', background: '#fff3f3', borderRadius: 6 }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.9em' }}>¿Eliminar este posteo?</p>
          {deleteError && <p style={{ color: 'red', margin: '0 0 6px', fontSize: '0.85em' }}>{deleteError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Confirmar'}
            </button>
            <button onClick={() => { setConfirming(false); setDeleteError('') }} disabled={deleting}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Owner controls — absent for foreign posts (FR-018 / FR-023) */}
      {isOwner && !editing && !confirming && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button onClick={() => setEditing(true)}>Editar</button>
          <button onClick={() => setConfirming(true)}>Eliminar</button>
        </div>
      )}
    </div>
  )
}
