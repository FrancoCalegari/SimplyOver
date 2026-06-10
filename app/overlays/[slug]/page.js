'use client'

import { useState } from 'react'
import Link from 'next/link'

// Mock data — en producción se buscaría con: GET /api/overlays/[slug]
const mockOverlay = {
  slug: 'neon-cyber-hud-pack',
  title: 'Neon Cyber HUD Pack',
  creator: {
    username: 'neon_pulse',
    displayName: 'Neon_Pulse',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9w3ZvMYXKAV1LFJa6K-b-kkeOsZxN8xs8LjpTeUNVvYzglDuyC8aCeLmGuF30jMysBG7g8coA2mbiiSvbKCJ_oxpqtqWmjtedtecqk4_FcISjEtI9QSUGzA7mBJkdoLULHJvvY9yGGti4YNVyQhNfhGDfiUeAExnp9PJeCLpbIwP6BcKJQ2BferpU7O-mSjL5uk08ElzSQIx8G0jDjo9WXqc-BMaCm-9h53OQosIUAe2FkIrn7YeQeGqTxClQ4jIhxP6zoK-Qqok',
    socials: ['twitch', 'instagram'],
  },
  price: 24.99,
  free: false,
  rating: 4.9,
  reviewCount: 1247,
  tags: ['Cyberpunk', 'Neon', 'Gaming', 'HUD', 'Purple'],
  description: 'A complete, professionally designed cyberpunk-themed overlay package for OBS and Streamlabs. Features animated neon border effects, dynamic alert zones, a customizable webcam frame, and a full starting-soon screen. Perfect for high-energy gaming and esports streams.',
  specs: {
    resolution: '1920 × 1080 (Full HD)',
    format: 'OBS / Streamlabs Scene Collection',
    fileSize: '48 MB',
    lastUpdated: 'Jun 2024',
    fileType: 'ZIP Bundle',
  },
  images: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDRsoob6EkT2hqOtaJ2aqT-HZjRQHrXml3ymGd5BPAG0mp0cFLA3pVMrmKNCeKSpoWuYt_Nw3PEmFt4FxiIJAykRV9X301bzo9x77mT0HKcCb70Qf6xGmoeKfEJaLURGnfyUryuXuAwKVmhbk5np9qO6FUA_RTWCz86YWnsIN7Y5z8VRohuqBWWVC9yHhtq9589vVzOTuv-G7jNDDhATPYJJC5-pH4l1SLTFxKy9qeL-RUJrye8RwSIJm9Nsr9oYzuEWbJHtVi0UtI',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC-YtbttTe4j3ofG7ImSDNzfoYAGo41rcfRRtCvd_WX5kbemVDeG7sd2hFx069phKDafmdUFZyD1TLNCz-jFsP0FvxRBNIxF1SuZnGwNPSIw_0kzPKWGVZwEE451n3eIEwMoFKoIYGCFEZ6YoxQq5Rh6TKluOO116ifLkFXqJYGFuYipKp2t85nW_Rz7ddbeeFv2bfOu9tRonTEolxR-RVyy8IO6MxMwEQrzu7XChQXFmxvEbyXxpuDbxU3FyhwP2Dh99JGTaGjfT8',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBGNG0YddqWgk_gYB9oftw5AOKjIjALYA4hy_4XPn1QAnh3MmYN5bzMO_QyitcSpmRYVmDAnvzkoJsxi1R8h2GwqAIxVpXaDaKnhpGNaj2soNexi1lKQnMoUi0xzMqoLbR5x954UbNEL6JMHkre4tWXeB8khYWzfr-h45Jy_YMbhsTiG_F_rTZFNEwLsfVC415p0yaA7dVq4Oi4AgW4vL073pfikGDxEGYq3aaNVF7ejfYZcS_6RTnXuKIK_Z6mStOeNuh8DsN7k_k',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAaEdrAR25uzw0kEnFBix3lLK4r3t-wCBRLNCHLCiWJrRxUU8RxEC_1sXQ4Hr5Ga4Tof4OyfB0gF068e0fqYwrFuQ-FvfiK0qrNk5PD6qzIkTFnVgEihSL9a7yrSKafClKWbsCCc1XAuK7JcLdgw82f6y3xYdhVIGIAoSh0synZYCt7-jwOHFB0Tgo8xq0nlSq-u6pF2nZBo5eh8KWUEpUjuFRGmCrG5yit3JLgZJttKThclbzX5dw4twShQkE3vhHXVDvvezIifgM',
  ],
  reviews: [
    { user: 'StreamerPro', avatar: null, rating: 10, comment: 'Absolutely stunning pack! The animations are smooth and the colors are perfect. My viewers love the new look.', date: '2 days ago' },
    { user: 'GamerDark', avatar: null, rating: 9, comment: "Best overlay I've found on the platform. Setup was super easy with the scene collection import.", date: '1 week ago' },
    { user: 'CyborgCast', avatar: null, rating: 10, comment: 'Premium quality at a great price. The alert animations are incredible.', date: '2 weeks ago' },
  ],
}

function StarRating({ rating, max = 10, size = 'md' }) {
  const filled = Math.round(rating / 2)
  return (
    <div className={`flex items-center gap-0.5 ${size === 'lg' ? 'text-[20px]' : 'text-[14px]'}`}>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className="material-symbols-outlined text-tertiary"
          style={{ fontVariationSettings: i < filled ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      ))}
    </div>
  )
}

export default function OverlayDetailPage({ params }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showBoardModal, setShowBoardModal] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(0)

  const overlay = mockOverlay // En producción: fetch de /api/overlays/[slug]

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied!')
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 bg-surface/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg primary-gradient flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-white font-bold">SimplyOver</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth" className="text-on-surface-variant hover:text-primary text-label-md transition-colors">Login</Link>
          <Link href="/auth?tab=register" className="primary-gradient px-4 py-2 rounded-full text-white text-label-md font-bold">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="px-6 md:px-12 pt-6 flex items-center gap-2 text-label-sm text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <Link href="/" className="hover:text-primary transition-colors">Overlays</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-white">{overlay.title}</span>
      </div>

      {/* Main Content */}
      <div className="px-6 md:px-12 py-8 flex flex-col lg:flex-row gap-10">
        {/* LEFT — Preview */}
        <div className="flex-1 min-w-0">
          {/* Main Image */}
          <div className="rounded-2xl overflow-hidden glass-surface mb-4">
            <img
              src={overlay.images[selectedImage]}
              alt={overlay.title}
              className="w-full object-cover"
              style={{ maxHeight: '480px' }}
            />
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {overlay.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === i ? 'border-primary shadow-[0_0_10px_rgba(124,58,237,0.5)]' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Reviews Section */}
          <div className="mt-10">
            <h2 className="text-headline-md text-white font-bold mb-6">Reviews & Ratings</h2>

            {/* Write Review */}
            <div className="glass-surface rounded-xl p-6 mb-6">
              <h3 className="text-white font-bold text-label-md mb-4">Write a Review</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-on-surface-variant text-label-sm">Your rating:</span>
                {[...Array(10)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewRating(i + 1)}
                    className={`w-7 h-7 rounded text-label-sm font-bold transition-colors ${
                      reviewRating >= i + 1 ? 'bg-primary-container text-white' : 'glass-surface text-on-surface-variant hover:bg-white/5'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full p-4 rounded-lg glass-input text-white text-body-md resize-none"
                rows={3}
                placeholder="Share your experience with this overlay..."
              />
              <button className="mt-3 primary-gradient-btn px-6 py-2.5 rounded-lg text-white text-label-md font-bold hover:scale-[1.02] transition-transform">
                Submit Review
              </button>
            </div>

            {/* Review List */}
            <div className="space-y-4">
              {overlay.reviews.map((r, i) => (
                <div key={i} className="glass-surface rounded-xl p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-full primary-gradient flex-shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[20px]">person</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold text-label-md">{r.user}</span>
                      <span className="text-on-surface-variant text-label-sm">{r.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={r.rating} />
                      <span className="text-tertiary text-label-sm font-bold">{r.rating}/10</span>
                    </div>
                    <p className="text-on-surface-variant text-body-md">{r.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Purchase Panel */}
        <div className="w-full lg:w-[380px] flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            {/* Main Purchase Card */}
            <div className="glass-panel rounded-2xl p-6 space-y-5">
              {/* Creator */}
              <Link href={`/profile/${overlay.creator.username}`} className="flex items-center gap-3 group">
                <img
                  src={overlay.creator.avatar}
                  alt={overlay.creator.displayName}
                  className="w-10 h-10 rounded-full border border-primary/20 group-hover:border-primary/60 transition-colors"
                />
                <div>
                  <p className="text-white font-bold text-label-md group-hover:text-primary transition-colors">
                    {overlay.creator.displayName}
                  </p>
                  <p className="text-on-surface-variant text-label-sm">@{overlay.creator.username}</p>
                </div>
              </Link>

              {/* Title */}
              <div>
                <h1 className="text-headline-md text-white font-bold">{overlay.title}</h1>
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {overlay.tags.map((tag) => (
                    <span key={tag} className="text-[11px] px-2 py-1 rounded-full glass-surface text-on-surface-variant border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <StarRating rating={overlay.rating} size="lg" />
                <span className="text-white font-bold text-label-md">{overlay.rating}</span>
                <span className="text-on-surface-variant text-label-sm">({overlay.reviewCount.toLocaleString()} reviews)</span>
              </div>

              {/* Price */}
              <div className="py-4 border-t border-b border-white/10">
                {overlay.free ? (
                  <span className="text-[#10B981] text-headline-lg font-bold">FREE</span>
                ) : (
                  <span className="text-headline-lg text-white font-bold">${overlay.price.toFixed(2)}</span>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                {overlay.free ? (
                  <button className="w-full py-3.5 rounded-xl bg-[#10B981] text-white text-label-md font-bold hover:bg-[#0ea574] transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Download for Free
                  </button>
                ) : (
                  <button className="w-full py-3.5 rounded-xl primary-gradient-btn text-white text-label-md font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                    Buy Now — ${overlay.price.toFixed(2)}
                  </button>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsFavorited(!isFavorited)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl glass-surface text-label-md transition-all ${
                      isFavorited ? 'text-error border-error/30 bg-error-container/10' : 'text-on-surface-variant hover:text-primary hover:border-primary/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    {isFavorited ? 'Saved' : 'Favorite'}
                  </button>
                  <button
                    onClick={() => setShowBoardModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl glass-surface text-on-surface-variant hover:text-primary hover:border-primary/30 text-label-md transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">push_pin</span>
                    Save to Board
                  </button>
                </div>
              </div>

              {/* Share row */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-on-surface-variant text-label-sm">Share:</span>
                <button onClick={handleCopyLink} className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">link</span>
                </button>
                <button className="text-on-surface-variant hover:text-[#1da1f2] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">share</span>
                </button>
              </div>
            </div>

            {/* Tech Specs */}
            <div className="glass-surface rounded-xl p-5 space-y-3">
              <h3 className="text-white font-bold text-label-md">Technical Specs</h3>
              {Object.entries(overlay.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-on-surface-variant text-label-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-white text-label-sm font-bold">{value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="glass-surface rounded-xl p-5">
              <h3 className="text-white font-bold text-label-md mb-3">Description</h3>
              <p className="text-on-surface-variant text-body-md leading-relaxed">{overlay.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
