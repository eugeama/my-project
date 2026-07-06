/**
 * Reusable loading indicator.
 * Used by PrivateRoute (auth state resolving) and forms during async operations.
 *
 * Props:
 *   message — optional string label (default: "Cargando...")
 *   inline  — if true, renders as inline-flex instead of full-page centered
 */
export default function LoadingSpinner({ message = 'Cargando...', inline = false }) {
  const style = inline
    ? { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9em', color: '#555' }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100px',
        color: '#555',
        gap: 8,
      }

  return (
    <div style={style} aria-label={message}>
      <span
        style={{
          width: 20,
          height: 20,
          border: '3px solid #ddd',
          borderTopColor: '#555',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.9em' }}>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
