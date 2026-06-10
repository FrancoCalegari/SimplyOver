import './globals.css'

export const metadata = {
  title: 'SimplyOver API',
  description: 'SimplyOver — Streaming overlays marketplace API',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
