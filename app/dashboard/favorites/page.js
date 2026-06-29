'use client'

import { useState } from 'react'
import Link from 'next/link'

const mockFavorites = [
  {
    id: 1,
    name: 'Neon Cyber HUD',
    creator: 'Neon_Pulse',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRsoob6EkT2hqOtaJ2aqT-HZjRQHrXml3ymGd5BPAG0mp0cFLA3pVMrmKNCeKSpoWuYt_Nw3PEmFt4FxiIJAykRV9X301bzo9x77mT0HKcCb70Qf6xGmoeKfEJaLURGnfyUryuXuAwKVmhbk5np9qO6FUA_RTWCz86YWnsIN7Y5z8VRohuqBWWVC9yHhtq9589vVzOTuv-G7jNDDhATPYJJC5-pH4l1SLTFxKy9qeL-RUJrye8RwSIJm9Nsr9oYzuEWbJHtVi0UtI',
    price: '$24.99',
    free: false,
    rating: '4.9',
    category: 'Cyberpunk',
  },
  {
    id: 2,
    name: 'Glass Minimal Pack',
    creator: 'GlassWork',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_bxEV0uLzRvYnNSct039kpxFNDPkKgjV6sfAk3Yvqn_A7gONLfe0EAIv9xU5wb2EF2lkqWmePbG5t4zkzjAdUbB5JaRJDGlDdC1JFuLgOwWPPQeC6DJIoUobilbr3SY1xGpeo07vW3zMGzuWA3ztCOt3Qh04--rd-Knq2NBW0rjYt6yc92nfZLhsyRZlYrPpYC9fASmSS9YYi_oKkXKBuHqnnUEjfW7-sn07BhuRxsmugZt36dOe3-tlePebjo0XJbFkEP1SDxnE',
    price: 'FREE',
    free: true,
    rating: '4.7',
    category: 'Minimalist',
  },
  {
    id: 3,
    name: 'Anime Battle Scene',
    creator: 'Senpai_Visuals',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC08YRV3W5FjHMf-6LAQxRL1vVOmBfW9csE4pnMB70p3qZoycGwDRdgbjOZrxcj2PsMuJubW7FUhiA48tcF4a8HkEZCrbUz5YrUtwrQpcUDCUN7Go-AjnUdukIG-BTLpVSUe1BgniRkR6CAuux0pL5LCKVxSQQnMlU3Y5zOJkCaTW2bM-79ZE6qM4JO6XTk6yDa5A2nuTjzQP7Rl3ejc2ZbvKG3tohCGV8Rp0qFLVfycva57TNUQWP480kOSnG-ZPgiOYBIUcbttEI',
    price: '$19.00',
    free: false,
    rating: '5.0',
    category: 'Anime',
  },
  {
    id: 4,
    name: 'Synthwave Retro',
    creator: 'RetroGrid_Labs',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-YtbttTe4j3ofG7ImSDNzfoYAGo41rcfRRtCvd_WX5kbemVDeG7sd2hFx069phKDafmdUFZyD1TLNCz-jFsP0FvxRBNIxF1SuZnGwNPSIw_0kzPKWGVZwEE451n3eIEwMoFKoIYGCFEZ6YoxQq5Rh6TKluOO116ifLkFXqJYGFuYipKp2t85nW_Rz7ddbeeFv2bfOu9tRonTEolxR-RVyy8IO6MxMwEQrzu7XChQXFmxvEbyXxpuDbxU3FyhwP2Dh99JGTaGjfT8',
    price: '$12.50',
    free: false,
    rating: '4.8',
    category: 'Retro',
  },
]

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState(mockFavorites)

  const removeFavorite = (id) => {
    setFavorites(favorites.filter((f) => f.id !== id))
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg text-white font-bold">My Favorites</h1>
          <p className="text-on-surface-variant text-body-md mt-1">
            {favorites.length} overlays liked
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full glass-surface text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all text-label-md"
        >
          <span className="material-symbols-outlined text-[20px]">explore</span>
          Discover More
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full glass-surface flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
          </div>
          <h3 className="text-headline-md text-white font-bold mb-2">No favorites yet</h3>
          <p className="text-on-surface-variant text-body-md mb-6">
            Browse overlays and click the ♥ to save them here
          </p>
          <Link href="/" className="primary-gradient px-8 py-3 rounded-full text-white text-label-md font-bold hover:scale-105 transition-transform">
            Explore Overlays
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {favorites.map((item) => (
            <div
              key={item.id}
              className="glass-surface rounded-xl overflow-hidden group hover:border-primary/30 hover:shadow-[0_0_20px_rgba(124,58,237,0.1)] transition-all duration-300"
            >
              {/* Image */}
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Remove favorite button */}
                <button
                  onClick={() => removeFavorite(item.id)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-error hover:bg-error-container/50 transition-colors"
                  title="Remove from favorites"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </button>
                {/* Category badge */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] text-white font-bold">
                  {item.category}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-white font-bold text-label-md">{item.name}</h3>
                  <p className="text-on-surface-variant text-label-sm mt-0.5">by {item.creator}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-[14px] text-tertiary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="text-label-sm text-on-surface-variant">{item.rating}</span>
                  </div>
                  {item.free ? (
                    <span className="text-[11px] font-bold text-secondary bg-secondary/10 border border-secondary/30 px-2 py-0.5 rounded-full">
                      FREE
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-white bg-primary-container px-2 py-0.5 rounded">
                      {item.price}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/overlays/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="flex-1 py-2 rounded-lg glass-surface text-center text-on-surface-variant text-label-sm hover:text-primary hover:border-primary/20 transition-colors"
                  >
                    View
                  </Link>
                  <button className="flex-1 py-2 rounded-lg primary-gradient-btn text-white text-label-sm font-bold hover:scale-[1.02] transition-transform">
                    {item.free ? 'Download' : 'Buy Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
