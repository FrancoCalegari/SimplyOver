import './globals.css'

export const metadata = {
  title: 'SimplyOver — OBS Overlay Marketplace',
  description: 'The world\'s premier marketplace for high-performance OBS overlays and artistic stream assets. Discover, buy, and create stunning stream overlays.',
  keywords: 'OBS overlays, stream overlays, twitch overlays, streaming assets, overlay marketplace',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-background text-on-background min-h-screen">
        {children}
      </body>
    </html>
  )
}
