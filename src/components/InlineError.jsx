/**
 * Consistent inline error message used across all forms.
 * Renders nothing when message is falsy.
 *
 * Props:
 *   message — string | null | undefined
 */
export default function InlineError({ message }) {
  if (!message) return null
  return (
    <span
      role="alert"
      style={{
        display: 'block',
        color: '#c0392b',
        fontSize: '0.85em',
        marginTop: 4,
      }}
    >
      {message}
    </span>
  )
}
