import React from 'react'

interface State {
  error: Error | null
  info: string | null
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null, info: null }

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AetherEdit] Unhandled render error:', error, info)
    this.setState({ info: info.componentStack ?? null })
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div style={{
          height: '100dvh', width: '100dvw',
          background: 'radial-gradient(ellipse at 50% 0%, #0d0d1a 0%, #000 70%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif', padding: '24px', boxSizing: 'border-box',
        }}>
          {/* Logo */}
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20, boxShadow: '0 0 32px rgba(239,68,68,0.3)',
          }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>!</span>
          </div>

          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em', textAlign: 'center' }}>
            Something went wrong
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', maxWidth: 320, lineHeight: 1.6, marginBottom: 24 }}>
            AetherEdit encountered an unexpected error. This is usually a temporary issue.
          </p>

          {/* Error detail */}
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12, padding: '12px 16px', maxWidth: 360, width: '100%', marginBottom: 24,
          }}>
            <p style={{ color: '#ef4444', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-word', margin: 0, lineHeight: 1.5 }}>
              {error.message || 'Unknown error'}
            </p>
          </div>

          {/* Reload button */}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #00F0FF, #6366F1)',
              color: '#000', fontWeight: 800, fontSize: 14,
              border: 'none', borderRadius: 14, padding: '12px 32px',
              cursor: 'pointer', letterSpacing: '-0.02em',
            }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
