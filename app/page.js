'use client'

const endpoints = [
  { method: 'POST',   path: '/api/auth/register',                 desc: 'Registro de usuario' },
  { method: 'POST',   path: '/api/auth/login',                    desc: 'Inicio de sesión' },
  { method: 'GET',    path: '/api/auth/me',                       desc: 'Perfil del usuario autenticado' },
  { method: 'GET',    path: '/api/overlays',                      desc: 'Listar overlays aprobados' },
  { method: 'GET',    path: '/api/overlays/featured',             desc: 'Overlays destacados' },
  { method: 'GET',    path: '/api/overlays/search?q=...',         desc: 'Buscador de overlays' },
  { method: 'GET',    path: '/api/overlays/[slug]',               desc: 'Detalle de overlay por slug' },
  { method: 'GET',    path: '/api/overlays/[slug]/reviews',       desc: 'Reseñas de un overlay' },
  { method: 'POST',   path: '/api/overlays/[slug]/reviews',       desc: 'Crear reseña' },
  { method: 'GET',    path: '/api/categories',                    desc: 'Listar categorías' },
  { method: 'GET',    path: '/api/users/[username]',              desc: 'Perfil público de un usuario' },
  { method: 'GET',    path: '/api/users/me',                      desc: 'Perfil propio' },
  { method: 'PATCH',  path: '/api/users/me',                      desc: 'Actualizar perfil' },
  { method: 'POST',   path: '/api/users/me/avatar',               desc: 'Subir avatar' },
  { method: 'GET',    path: '/api/users/me/purchases',            desc: 'Historial de compras' },
  { method: 'GET',    path: '/api/favorites',                     desc: 'Favoritos del usuario' },
  { method: 'POST',   path: '/api/favorites/[overlayId]',         desc: 'Añadir/quitar favorito' },
  { method: 'GET',    path: '/api/boards',                        desc: 'Tableros del usuario' },
  { method: 'POST',   path: '/api/boards',                        desc: 'Crear tablero' },
  { method: 'GET',    path: '/api/boards/[boardId]',              desc: 'Detalle de tablero' },
  { method: 'POST',   path: '/api/checkout',                      desc: 'Iniciar pago (Mercado Pago)' },
  { method: 'GET',    path: '/api/download',                      desc: 'Descargar overlay' },
  { method: 'GET',    path: '/api/ia/models',                     desc: 'Modelos de IA disponibles' },
  { method: 'POST',   path: '/api/ia/chat',                       desc: 'Chat con SpiderIA' },
  { method: 'GET',    path: '/api/admin/audit-log',               desc: 'Log de auditoría (admin)' },
  { method: 'GET',    path: '/api/admin/overlays/pending',        desc: 'Overlays pendientes (admin)' },
  { method: 'POST',   path: '/api/admin/overlays/[id]/moderate',  desc: 'Moderar overlay (admin)' },
  { method: 'POST',   path: '/api/webhooks/mercadopago',          desc: 'Webhook de Mercado Pago' },
]

const methodColor = {
  GET:    { bg: '#1a3a4a', text: '#38bdf8' },
  POST:   { bg: '#1a3a25', text: '#4ade80' },
  PATCH:  { bg: '#3a2f0a', text: '#fbbf24' },
  PUT:    { bg: '#3a2f0a', text: '#fbbf24' },
  DELETE: { bg: '#3a1a1a', text: '#f87171' },
}

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a1a 100%)',
      padding: '0',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 48px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(10,10,10,0.85)',
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800,
        }}>S</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-0.3px' }}>SimplyOver</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>REST API · v1.0.0</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 8px #4ade80',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 500 }}>Online</span>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-1px',
            lineHeight: 1.1,
            marginBottom: 16,
          }}>
            SimplyOver{' '}
            <span style={{
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>API</span>
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Backend de la plataforma de streaming overlays. Todos los endpoints disponibles están documentados abajo.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
            {[
              { label: `${endpoints.length} Endpoints`, color: '#6366f1' },
              { label: 'MariaDB', color: '#38bdf8' },
              { label: 'Next.js 14', color: '#e2e8f0' },
              { label: 'JWT Auth', color: '#4ade80' },
            ].map(({ label, color }) => (
              <span key={label} style={{
                padding: '6px 14px',
                borderRadius: 99,
                border: `1px solid ${color}33`,
                color,
                fontSize: 12,
                fontWeight: 600,
                background: `${color}11`,
              }}>{label}</span>
            ))}
          </div>
        </div>

        {/* Base URL */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>Base URL</span>
          <code style={{
            background: 'rgba(99,102,241,0.15)',
            color: '#a5b4fc',
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 13,
            fontFamily: 'monospace',
          }}>
            {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
          </code>
        </div>

        {/* Endpoints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {endpoints.map((ep, i) => {
            const colors = methodColor[ep.method] || { bg: '#1a1a2e', text: '#a78bfa' }
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                transition: 'all 0.15s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
              }}>
                <span style={{
                  minWidth: 54,
                  padding: '3px 0',
                  textAlign: 'center',
                  borderRadius: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                  background: colors.bg,
                  color: colors.text,
                }}>{ep.method}</span>
                <code style={{
                  flex: 1,
                  fontSize: 13,
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{ep.path}</code>
                <span style={{
                  fontSize: 12,
                  color: '#6b7280',
                  whiteSpace: 'nowrap',
                  display: 'window' in globalThis ? 'block' : 'none',
                }}>{ep.desc}</span>
              </div>
            )
          })}
        </div>

        <p style={{ textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 48 }}>
          SimplyOver · {new Date().getFullYear()} · Todos los endpoints requieren autenticación JWT excepto los públicos.
        </p>
      </div>
    </main>
  )
}
