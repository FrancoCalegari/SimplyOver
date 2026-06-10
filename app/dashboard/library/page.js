'use client'

import { useState, useEffect } from 'react'

const mockPurchases = [
  {
    id: 1,
    name: 'Cyberpunk HUD Pack',
    creator: 'Neon_Pulse',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRsoob6EkT2hqOtaJ2aqT-HZjRQHrXml3ymGd5BPAG0mp0cFLA3pVMrmKNCeKSpoWuYt_Nw3PEmFt4FxiIJAykRV9X301bzo9x77mT0HKcCb70Qf6xGmoeKfEJaLURGnfyUryuXuAwKVmhbk5np9qO6FUA_RTWCz86YWnsIN7Y5z8VRohuqBWWVC9yHhtq9589vVzOTuv-G7jNDDhATPYJJC5-pH4l1SLTFxKy9qeL-RUJrye8RwSIJm9Nsr9oYzuEWbJHtVi0UtI',
    purchaseDate: '2024-05-12',
    price: '$24.99',
    hasReview: false,
  },
  {
    id: 2,
    name: 'Anime Stream Pack',
    creator: 'Senpai_Visuals',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC08YRV3W5FjHMf-6LAQxRL1vVOmBfW9csE4pnMB70p3qZoycGwDRdgbjOZrxcj2PsMuJubW7FUhiA48tcF4a8HkEZCrbUz5YrUtwrQpcUDCUN7Go-AjnUdukIG-BTLpVSUe1BgniRkR6CAuux0pL5LCKVxSQQnMlU3Y5zOJkCaTW2bM-79ZE6qM4JO6XTk6yDa5A2nuTjzQP7Rl3ejc2ZbvKG3tohCGV8Rp0qFLVfycva57TNUQWP480kOSnG-ZPgiOYBIUcbttEI',
    purchaseDate: '2024-04-28',
    price: '$19.00',
    hasReview: true,
  },
  {
    id: 3,
    name: 'Synthwave Retro Kit',
    creator: 'RetroGrid_Labs',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-YtbttTe4j3ofG7ImSDNzfoYAGo41rcfRRtCvd_WX5kbemVDeG7sd2hFx069phKDafmdUFZyD1TLNCz-jFsP0FvxRBNIxF1SuZnGwNPSIw_0kzPKWGVZwEE451n3eIEwMoFKoIYGCFEZ6YoxQq5Rh6TKluOO116ifLkFXqJYGFuYipKp2t85nW_Rz7ddbeeFv2bfOu9tRonTEolxR-RVyy8IO6MxMwEQrzu7XChQXFmxvEbyXxpuDbxU3FyhwP2Dh99JGTaGjfT8',
    purchaseDate: '2024-03-10',
    price: '$12.50',
    hasReview: false,
  },
]

export default function LibraryPage() {
  const [purchases, setPurchases] = useState(mockPurchases)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = purchases.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.creator.toLowerCase().includes(search.toLowerCase())
  )

  const handleDownload = async (purchaseId, overlayName) => {
    try {
      const res = await fetch(`/api/download?purchaseId=${purchaseId}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${overlayName.replace(/\s+/g, '_')}.zip`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Download not available yet. Coming soon!')
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg text-white font-bold">My Library</h1>
          <p className="text-on-surface-variant text-body-md mt-1">{purchases.length} overlays purchased</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my library..."
            className="w-full h-11 pl-12 pr-4 rounded-lg glass-input text-white text-body-md"
          />
        </div>
        <select className="h-11 px-4 rounded-lg glass-input text-white text-label-md bg-transparent">
          <option value="latest">Sort: Latest</option>
          <option value="az">Sort: A–Z</option>
          <option value="price">Sort: Price Paid</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full glass-surface flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-primary text-[40px]">library_books</span>
          </div>
          <h3 className="text-headline-md text-white font-bold mb-2">Your library is empty</h3>
          <p className="text-on-surface-variant text-body-md mb-6">Discover amazing overlays and start building your collection</p>
          <a href="/" className="primary-gradient px-8 py-3 rounded-full text-white text-label-md font-bold hover:scale-105 transition-transform">
            Explore the Marketplace
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div key={item.id} className="glass-surface rounded-xl overflow-hidden group hover:border-primary/30 transition-all duration-300">
              {/* Preview Image */}
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Owned Badge */}
                <div className="absolute top-3 right-3 bg-secondary/90 text-[#003640] px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Owned
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-white font-bold text-label-md">{item.name}</h3>
                  <p className="text-on-surface-variant text-label-sm mt-1">by {item.creator}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant text-label-sm">
                    Purchased {new Date(item.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-primary text-label-sm font-bold">{item.price}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleDownload(item.id, item.name)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-secondary/20 border border-secondary/30 text-secondary text-label-md font-bold hover:bg-secondary/30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Download .zip
                  </button>

                  {!item.hasReview && (
                    <button className="w-full py-2 text-on-surface-variant text-label-sm hover:text-primary transition-colors">
                      + Leave a Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
