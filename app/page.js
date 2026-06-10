'use client'

import { useState } from 'react'
import Link from 'next/link'

const overlayCards = [
  {
    id: 1,
    featured: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRsoob6EkT2hqOtaJ2aqT-HZjRQHrXml3ymGd5BPAG0mp0cFLA3pVMrmKNCeKSpoWuYt_Nw3PEmFt4FxiIJAykRV9X301bzo9x77mT0HKcCb70Qf6xGmoeKfEJaLURGnfyUryuXuAwKVmhbk5np9qO6FUA_RTWCz86YWnsIN7Y5z8VRohuqBWWVC9yHhtq9589vVzOTuv-G7jNDDhATPYJJC5-pH4l1SLTFxKy9qeL-RUJrye8RwSIJm9Nsr9oYzuEWbJHtVi0UtI',
    height: 320,
    creator: 'Neon_Pulse',
    creatorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9w3ZvMYXKAV1LFJa6K-b-kkeOsZxN8xs8LjpTeUNVvYzglDuyC8aCeLmGuF30jMysBG7g8coA2mbiiSvbKCJ_oxpqtqWmjtedtecqk4_FcISjEtI9QSUGzA7mBJkdoLULHJvvY9yGGti4YNVyQhNfhGDfiUeAExnp9PJeCLpbIwP6BcKJQ2BferpU7O-mSjL5uk08ElzSQIx8G0jDjo9WXqc-BMaCm-9h53OQosIUAe2FkIrn7YeQeGqTxClQ4jIhxP6zoK-Qqok',
    price: '$24.99',
    free: false,
    rating: '4.9',
    reviews: '1.2k',
  },
  {
    id: 2,
    featured: false,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_bxEV0uLzRvYnNSct039kpxFNDPkKgjV6sfAk3Yvqn_A7gONLfe0EAIv9xU5wb2EF2lkqWmePbG5t4zkzjAdUbB5JaRJDGlDdC1JFuLgOwWPPQeC6DJIoUobilbr3SY1xGpeo07vW3zMGzuWA3ztCOt3Qh04--rd-Knq2NBW0rjYt6yc92nfZLhsyRZlYrPpYC9fASmSS9YYi_oKkXKBuHqnnUEjfW7-sn07BhuRxsmugZt36dOe3-tlePebjo0XJbFkEP1SDxnE',
    height: 240,
    creator: 'GlassWork',
    creatorAvatar: null,
    creatorIcon: 'brush',
    price: 'FREE',
    free: true,
    rating: '4.7',
    reviews: '840',
  },
  {
    id: 3,
    featured: false,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC08YRV3W5FjHMf-6LAQxRL1vVOmBfW9csE4pnMB70p3qZoycGwDRdgbjOZrxcj2PsMuJubW7FUhiA48tcF4a8HkEZCrbUz5YrUtwrQpcUDCUN7Go-AjnUdukIG-BTLpVSUe1BgniRkR6CAuux0pL5LCKVxSQQnMlU3Y5zOJkCaTW2bM-79ZE6qM4JO6XTk6yDa5A2nuTjzQP7Rl3ejc2ZbvKG3tohCGV8Rp0qFLVfycva57TNUQWP480kOSnG-ZPgiOYBIUcbttEI',
    height: 400,
    creator: 'Senpai_Visuals',
    creatorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmXfJAlxX6H0DMiUPaNYeToEPEbS8YTm-u--4OEGt_M7nWzhxKibJ6UvPTS_X5XEbFTNAEHdzy5svLs4efvm7CkEVyOXV2xfmzhVE1ua1rckHYr9KsAq5j7tpm2Z2uM922IoZV3aN49xzut6DdXJCWYf7MUvMFe-jjZFWgchJBKGxgbqmEWkNM7Ta0qbhoHmwwA9CgiLm4ufnXBl3AivbWXF8lKyFgq3GxiZF1GECM-tT6NCIF-iLRCQnt9m6wep5NnEwcg1MaR_U',
    price: '$19.00',
    free: false,
    rating: '5.0',
    reviews: '310',
  },
  {
    id: 4,
    featured: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-YtbttTe4j3ofG7ImSDNzfoYAGo41rcfRRtCvd_WX5kbemVDeG7sd2hFx069phKDafmdUFZyD1TLNCz-jFsP0FvxRBNIxF1SuZnGwNPSIw_0kzPKWGVZwEE451n3eIEwMoFKoIYGCFEZ6YoxQq5Rh6TKluOO116ifLkFXqJYGFuYipKp2t85nW_Rz7ddbeeFv2bfOu9tRonTEolxR-RVyy8IO6MxMwEQrzu7XChQXFmxvEbyXxpuDbxU3FyhwP2Dh99JGTaGjfT8',
    height: 280,
    creator: 'RetroGrid_Labs',
    creatorAvatar: null,
    creatorIcon: 'joystick',
    price: '$12.50',
    free: false,
    rating: '4.8',
    reviews: '156',
  },
  {
    id: 5,
    featured: false,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBGNG0YddqWgk_gYB9oftw5AOKjIjALYA4hy_4XPn1QAnh3MmYN5bzMO_QyitcSpmRYVmDAnvzkoJsxi1R8h2GwqAIxVpXaDaKnhpGNaj2soNexi1lKQnMoUi0xzMqoLbR5x954UbNEL6JMHkre4tWXeB8khYWzfr-h45Jy_YMbhsTiG_F_rTZFNEwLsfVC415p0yaA7dVq4Oi4AgW4vL073pfikGDxEGYq3aaNVF7ejfYZcS_6RTnXuKIK_Z6mStOeNuh8DsN7k_k',
    height: 360,
    creator: 'Mono_Studio',
    creatorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByVyUG0tIfp-y5Dg4x6zQDuV320QtfqB2qosTVhuMhQrrgkxMKVkPKhKocHELYRftkabSd42Jev13F7KRup0q9tUT7h56ay_-ho7mKT24I07rY15OwjZuqeed_HxB0DyLbTJgbSX0NCREQ-6yW5APQhsLRdyR-kvmN46UaroiuUyCHyVM3FsesWEVJ5DRIZ2lGlQQ6kp-F4s5KZ2T9n5SNUbl9_fZEDfhSVn7LySJcvMlo8ukvwly18gfGAQeNS6Vj1t9pXwKSUio',
    price: '$30.00',
    free: false,
    rating: '4.9',
    reviews: '42',
  },
  {
    id: 6,
    featured: false,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaEdrAR25uzw0kEnFBix3lLK4r3t-wCBRLNCHLCiWJrRxUU8RxEC_1sXQ4Hr5Ga4Tof4OyfB0gF068e0fqYwrFuQ-FvfiK0qrNk5PD6qzIkTFnVgEihSL9a7yrSKafClKWbsCCc1XAuK7JcLdgw82f6y3xYdhVIGIAoSh0synZYCt7-jwOHFB0Tgo8xq0nlSq-u6pF2nZBo5eh8KWUEpUjuFRGmCrG5yit3JLgZJttKThclbzX5dw4twShQkE3vhHXVDvvezIifgM',
    height: 220,
    creator: 'Fluid_Motion',
    creatorAvatar: null,
    creatorIcon: 'water_drop',
    price: 'FREE',
    free: true,
    rating: '4.6',
    reviews: '1.9k',
  },
]

function OverlayCard({ card }) {
  return (
    <div
      className={`masonry-item group cursor-pointer relative overflow-hidden rounded-xl glass-surface transition-all duration-300 hover:scale-[1.02] ${
        card.featured
          ? 'border-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.15)]'
          : 'border-white/10'
      }`}
    >
      <div className="relative overflow-hidden">
        <img
          src={card.image}
          alt={`${card.creator} overlay`}
          className="w-full object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-105"
          style={{ height: `${card.height}px` }}
        />
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-white text-[20px]">favorite</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-white text-[20px]">push_pin</span>
          </button>
          <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-white text-[20px]">shopping_cart</span>
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {card.creatorAvatar ? (
              <img src={card.creatorAvatar} alt={card.creator} className="w-8 h-8 rounded-full border border-primary/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary text-[16px]">{card.creatorIcon}</span>
              </div>
            )}
            <span className="text-label-md font-label-md">{card.creator}</span>
          </div>
          {card.free ? (
            <span className="bg-secondary-container/20 text-secondary border border-secondary/30 px-2 py-1 rounded text-[12px] font-bold">
              FREE
            </span>
          ) : (
            <span className="bg-primary-container text-white px-2 py-1 rounded text-[12px] font-bold">
              {card.price}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="text-label-sm font-label-sm">{card.rating} ({card.reviews})</span>
        </div>
      </div>
    </div>
  )
}

const categories = ['All', 'Anime', 'Esports', 'Neon', 'Gaming', 'Horror', 'Minimalist']

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="bg-background text-on-background min-h-screen">
      {/* Top Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-surface/30 backdrop-blur-md border-b border-white/10 shadow-sm flex items-center justify-between px-6 h-20">
        <div className="flex items-center gap-8 flex-1">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">SimplyOver</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-xl relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
            <input
              className="w-full bg-surface-container-highest/50 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-body-md focus:ring-2 focus:ring-primary-container outline-none transition-all text-on-background"
              placeholder="Search overlays, artists, styles..."
              type="text"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="hidden xl:flex items-center gap-6 px-8">
          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-label-md font-label-md transition-colors ${
                activeCategory === cat
                  ? 'text-secondary border-b-2 border-secondary pb-1'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-4">
          <Link href="/auth" className="hidden md:block text-on-surface-variant hover:text-primary transition-colors text-label-md font-label-md">
            Login
          </Link>
          <Link
            href="/auth?tab=register"
            className="primary-gradient text-white px-6 py-2.5 rounded-full text-label-md font-bold hover:scale-105 transition-transform"
          >
            Start Creating
          </Link>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed left-0 h-full bg-surface-container/40 backdrop-blur-xl border-r border-white/10 flex flex-col py-8 sidebar-transition z-40 hidden md:flex ${sidebarOpen ? 'w-[280px]' : 'w-[80px]'}`}>
          <div className="px-6 mb-8">
            <h2 className="text-headline-md font-bold text-primary">Filters</h2>
            <p className="text-on-surface-variant text-body-md">Refine your search</p>
          </div>
          <nav className="flex-1 space-y-2">
            {[
              { icon: 'category', label: 'Categories', active: true },
              { icon: 'payments', label: 'Price: Free' },
              { icon: 'attach_money', label: 'Price: Paid' },
              { icon: 'star', label: 'Ratings' },
              { icon: 'trending_up', label: 'Trending' },
            ].map(({ icon, label, active }) => (
              <div key={label} className="px-3">
                <a
                  href="#"
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'border-l-4 border-primary bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined">{icon}</span>
                  {sidebarOpen && <span className="text-label-md font-label-md">{label}</span>}
                </a>
              </div>
            ))}
          </nav>
          <div className="px-6 mt-auto">
            <button className="w-full bg-secondary-container/20 border border-secondary text-secondary py-3 rounded-xl text-label-md font-label-md hover:bg-secondary-container/30 transition-all">
              {sidebarOpen ? 'Apply Filters' : '✓'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-[280px] px-5 md:px-12 pt-12 pb-24">
          {/* Hero Section */}
          <section className="max-w-4xl mx-auto text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-surface border-white/20 text-secondary mb-4">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="text-label-sm font-label-sm">Official Stream Marketplace</span>
            </div>

            <h1 className="text-headline-xl text-gradient leading-tight">
              Discover Stunning Stream Overlays
            </h1>

            <p className="text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              The world's premier marketplace for high-performance OBS overlays and artistic stream assets. High-tech aesthetics for modern creators.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="px-6 py-2 rounded-full glass-surface border-white/10 animate-float">
                <span className="text-label-md font-bold text-primary">10k+</span>
                <span className="text-label-md ml-1">Overlays</span>
              </div>
              <div className="px-6 py-2 rounded-full glass-surface border-white/10 animate-float-delayed">
                <span className="text-label-md font-bold text-secondary">3k+</span>
                <span className="text-label-md ml-1">Artists</span>
              </div>
              <div className="px-6 py-2 rounded-full glass-surface border-white/10">
                <span className="text-label-md font-bold text-tertiary">Free & Premium</span>
              </div>
            </div>
          </section>

          {/* Masonry Grid */}
          <div className="masonry-grid">
            {overlayCards.map((card) => (
              <OverlayCard key={card.id} card={card} />
            ))}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-white/5 flex flex-col md:flex-row justify-between items-center py-12 px-12">
        <div className="flex flex-col gap-4 mb-8 md:mb-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded primary-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold opacity-80">SimplyOver</span>
          </div>
          <p className="text-on-surface-variant text-body-md max-w-xs">
            Empowering streamers with the world's most advanced visual assets and creative overlays.
          </p>
          <p className="text-on-surface-variant text-label-sm">
            © 2024 SimplyOver Marketplace. All rights reserved.
          </p>
        </div>
        <div className="flex gap-12">
          <div className="flex flex-col gap-2">
            <span className="text-white font-bold text-label-md mb-2">Platform</span>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-label-sm">Artists</a>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-label-sm">Sell Overlays</a>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-label-sm">Support</a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-white font-bold text-label-md mb-2">Legal</span>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-label-sm">Terms</a>
            <a href="#" className="text-on-surface-variant hover:text-primary transition-colors text-label-sm">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
