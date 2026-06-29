'use client'

import { useState } from 'react'
import Link from 'next/link'

const mockProfile = {
  username: 'neon_pulse',
  displayName: 'Neon_Pulse',
  bio: 'Digital artist specializing in cyberpunk and sci-fi OBS overlays. Creating high-performance visual assets for streamers since 2021.',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9w3ZvMYXKAV1LFJa6K-b-kkeOsZxN8xs8LjpTeUNVvYzglDuyC8aCeLmGuF30jMysBG7g8coA2mbiiSvbKCJ_oxpqtqWmjtedtecqk4_FcISjEtI9QSUGzA7mBJkdoLULHJvvY9yGGti4YNVyQhNfhGDfiUeAExnp9PJeCLpbIwP6BcKJQ2BferpU7O-mSjL5uk08ElzSQIx8G0jDjo9WXqc-BMaCm-9h53OQosIUAe2FkIrn7YeQeGqTxClQ4jIhxP6zoK-Qqok',
  banner: null,
  stats: { overlays: 24, favorites: 3800, boards: 6, since: '2021' },
  socials: {
    twitch: 'https://twitch.tv/neon_pulse',
    instagram: 'https://instagram.com/neon_pulse',
  },
  designs: [
    {
      id: 1, name: 'Cyberpunk HUD Pack', price: '$24.99', free: false, rating: '4.9',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRsoob6EkT2hqOtaJ2aqT-HZjRQHrXml3ymGd5BPAG0mp0cFLA3pVMrmKNCeKSpoWuYt_Nw3PEmFt4FxiIJAykRV9X301bzo9x77mT0HKcCb70Qf6xGmoeKfEJaLURGnfyUryuXuAwKVmhbk5np9qO6FUA_RTWCz86YWnsIN7Y5z8VRohuqBWWVC9yHhtq9589vVzOTuv-G7jNDDhATPYJJC5-pH4l1SLTFxKy9qeL-RUJrye8RwSIJm9Nsr9oYzuEWbJHtVi0UtI',
      height: 280,
    },
    {
      id: 2, name: 'Neon Borders Lite', price: 'FREE', free: true, rating: '4.8',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-YtbttTe4j3ofG7ImSDNzfoYAGo41rcfRRtCvd_WX5kbemVDeG7sd2hFx069phKDafmdUFZyD1TLNCz-jFsP0FvxRBNIxF1SuZnGwNPSIw_0kzPKWGVZwEE451n3eIEwMoFKoIYGCFEZ6YoxQq5Rh6TKluOO116ifLkFXqJYGFuYipKp2t85nW_Rz7ddbeeFv2bfOu9tRonTEolxR-RVyy8IO6MxMwEQrzu7XChQXFmxvEbyXxpuDbxU3FyhwP2Dh99JGTaGjfT8',
      height: 340,
    },
    {
      id: 3, name: 'Alert Pack Pro', price: '$12.00', free: false, rating: '5.0',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGNG0YddqWgk_gYB9oftw5AOKjIjALYA4hy_4XPn1QAnh3MmYN5bzMO_QyitcSpmRYVmDAnvzkoJsxi1R8h2GwqAIxVpXaDaKnhpGNaj2soNexi1lKQnMoUi0xzMqoLbR5x954UbNEL6JMHkre4tWXeB8khYWzfr-h45Jy_YMbhsTiG_F_rTZFNEwLsfVC415p0yaA7dVq4Oi4AgW4vL073pfikGDxEGYq3aaNVF7ejfYZcS_6RTnXuKIK_Z6mStOeNuh8DsN7k_k',
      height: 200,
    },
  ],
  boards: [
    { id: 1, name: 'Cyberpunk Inspo', count: 18, isPublic: true, covers: [] },
    { id: 2, name: 'Minimalist Refs', count: 9, isPublic: true, covers: [] },
  ],
}

const socialIcons = {
  twitch: { icon: '🎮', color: '#6441a5', label: 'Twitch' },
  kick: { icon: '🟩', color: '#53fc18', label: 'Kick' },
  instagram: { icon: '📸', color: '#e1306c', label: 'Instagram' },
  tiktok: { icon: '🎵', color: '#69c9d0', label: 'TikTok' },
  youtube: { icon: '▶️', color: '#ff0000', label: 'YouTube' },
  twitter: { icon: '𝕏', color: '#1da1f2', label: 'Twitter' },
}

export default function ProfilePage({ params }) {
  const [activeTab, setActiveTab] = useState('designs')
  const [isFollowing, setIsFollowing] = useState(false)

  const profile = mockProfile

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

      {/* Banner */}
      <div className="relative h-52 md:h-72 overflow-hidden">
        {profile.banner ? (
          <img src={profile.banner} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: 'linear-gradient(135deg, #0D0D14 0%, #1a0533 40%, #0d2d3d 100%)' }}
          >
            {/* Decorative grid */}
            <div className="w-full h-full opacity-20" style={{
              backgroundImage: 'linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
          </div>
        )}
        {/* Gradient bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="px-6 md:px-12 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-end gap-5">
            {/* Avatar */}
            <img
              src={profile.avatar}
              alt={profile.displayName}
              className="w-24 h-24 rounded-full border-4 border-background shadow-xl flex-shrink-0"
            />
            <div className="pb-2">
              <h1 className="text-headline-lg text-gradient font-bold">{profile.displayName}</h1>
              <p className="text-on-surface-variant text-body-md">@{profile.username}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pb-2">
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-6 py-2.5 rounded-full text-label-md font-bold transition-all hover:scale-[1.02] ${
                isFollowing
                  ? 'glass-surface text-primary border-primary/30'
                  : 'primary-gradient-btn text-white'
              }`}
            >
              {isFollowing ? 'Following ✓' : 'Follow'}
            </button>
            <button className="glass-surface px-5 py-2.5 rounded-full text-on-surface-variant hover:text-white text-label-md transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">share</span>
              Share
            </button>
          </div>
        </div>

        {/* Bio */}
        <p className="text-on-surface-variant text-body-md mt-4 max-w-2xl">{profile.bio}</p>

        {/* Social Links */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          {Object.entries(profile.socials).map(([platform, url]) => {
            const config = socialIcons[platform]
            if (!config || !url) return null
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-surface text-label-sm text-on-surface-variant hover:text-white transition-colors"
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </a>
            )
          })}
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-6 mt-6 py-4 border-t border-white/10">
          {[
            { value: profile.stats.overlays, label: 'Overlays' },
            { value: profile.stats.favorites.toLocaleString(), label: 'Favorites' },
            { value: profile.stats.boards, label: 'Boards' },
            { value: `Since ${profile.stats.since}`, label: 'Member' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-white font-bold text-headline-md">{value}</p>
              <p className="text-on-surface-variant text-label-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-6 md:px-12 mt-6">
        <div className="flex gap-6 border-b border-white/10 mb-8">
          {[
            { key: 'designs', label: 'Designs', icon: 'palette' },
            { key: 'boards', label: 'Boards', icon: 'push_pin' },
            { key: 'about', label: 'About', icon: 'info' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 pb-3 text-label-md font-label-md transition-all border-b-2 ${
                activeTab === key
                  ? 'text-primary border-primary'
                  : 'text-on-surface-variant border-transparent hover:text-white hover:border-white/20'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* DESIGNS TAB — Masonry */}
        {activeTab === 'designs' && (
          <div className="masonry-grid mb-16">
            {profile.designs.map((card) => (
              <Link
                key={card.id}
                href={`/overlays/${card.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="masonry-item block group cursor-pointer relative overflow-hidden rounded-xl glass-surface border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-primary/30"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-105"
                    style={{ height: `${card.height}px` }}
                  />
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-primary-container transition-colors">
                      <span className="material-symbols-outlined text-white text-[20px]">favorite</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-primary-container transition-colors">
                      <span className="material-symbols-outlined text-white text-[20px]">shopping_cart</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-label-md font-bold">{card.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[12px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-label-sm text-on-surface-variant">{card.rating}</span>
                    </div>
                  </div>
                  {card.free ? (
                    <span className="text-[11px] font-bold text-secondary bg-secondary/10 border border-secondary/30 px-2 py-0.5 rounded-full">FREE</span>
                  ) : (
                    <span className="text-[11px] font-bold text-white bg-primary-container px-2 py-0.5 rounded">{card.price}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* BOARDS TAB */}
        {activeTab === 'boards' && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 mb-16">
            {profile.boards.map((board) => (
              <div key={board.id} className="glass-surface rounded-xl overflow-hidden group hover:border-primary/30 transition-all cursor-pointer">
                <div
                  className="h-32 primary-gradient opacity-30 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-white text-[36px]">push_pin</span>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-bold text-label-md">{board.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-on-surface-variant text-label-sm">{board.count} overlays</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      board.isPublic ? 'text-secondary bg-secondary/10 border border-secondary/30' : 'text-on-surface-variant bg-white/5 border border-white/10'
                    }`}>
                      {board.isPublic ? '🌍 Public' : '🔒 Private'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="max-w-2xl mb-16">
            <div className="glass-surface rounded-xl p-8 space-y-6">
              <div>
                <h3 className="text-white font-bold text-label-md mb-2">About</h3>
                <p className="text-on-surface-variant text-body-md leading-relaxed">{profile.bio}</p>
              </div>
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-white font-bold text-label-md mb-4">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {['Cyberpunk', 'Neon', 'Animated Overlays', 'HUD Design', 'Alert Packs', 'Scene Transitions'].map((tag) => (
                    <span key={tag} className="text-label-sm px-3 py-1.5 rounded-full glass-surface text-primary border-primary/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-white font-bold text-label-md mb-4">Social Links</h3>
                <div className="space-y-3">
                  {Object.entries(profile.socials).map(([platform, url]) => {
                    const config = socialIcons[platform]
                    if (!config || !url) return null
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-on-surface-variant hover:text-white transition-colors"
                      >
                        <span className="text-[20px]">{config.icon}</span>
                        <span className="text-body-md">{url}</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
