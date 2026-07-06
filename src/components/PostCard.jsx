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
 *   onEdit      — called when the Edit button is clicked (wired in Phase 8 / T035)
 *   onDelete    — called when Delete → Confirm is clicked (wired in Phase 9 / T038)
 */
export default function PostCard({ post, currentUser, onEdit, onDelete }) {
  const isOwner = currentUser && post.authorId === currentUser.uid
  const createdLabel = formatDate(post.createdAt)
  const updatedLabel = post.updatedAt ? formatDate(post.updatedAt) : null

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
      {/* Author + timestamps */}
      <div style={{ marginBottom: 8 }}>
        <strong>@{post.authorUsername}</strong>
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

      {/* Owner controls — absent for foreign posts (FR-018 / FR-023) */}
      {isOwner && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button onClick={() => onEdit && onEdit(post)}>Editar</button>
          <button onClick={() => onDelete && onDelete(post)}>Eliminar</button>
        </div>
      )}
    </div>
  )
}
