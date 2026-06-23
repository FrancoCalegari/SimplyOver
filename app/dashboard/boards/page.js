'use client'

import { useState } from 'react'

const mockBoards = [
  {
    id: 1,
    name: 'Cyberpunk Vibes',
    description: 'Dark neon overlays for high-energy streams',
    isPublic: true,
    count: 14,
    covers: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDRsoob6EkT2hqOtaJ2aqT-HZjRQHrXml3ymGd5BPAG0mp0cFLA3pVMrmKNCeKSpoWuYt_Nw3PEmFt4FxiIJAykRV9X301bzo9x77mT0HKcCb70Qf6xGmoeKfEJaLURGnfyUryuXuAwKVmhbk5np9qO6FUA_RTWCz86YWnsIN7Y5z8VRohuqBWWVC9yHhtq9589vVzOTuv-G7jNDDhATPYJJC5-pH4l1SLTFxKy9qeL-RUJrye8RwSIJm9Nsr9oYzuEWbJHtVi0UtI',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC-YtbttTe4j3ofG7ImSDNzfoYAGo41rcfRRtCvd_WX5kbemVDeG7sd2hFx069phKDafmdUFZyD1TLNCz-jFsP0FvxRBNIxF1SuZnGwNPSIw_0kzPKWGVZwEE451n3eIEwMoFKoIYGCFEZ6YoxQq5Rh6TKluOO116ifLkFXqJYGFuYipKp2t85nW_Rz7ddbeeFv2bfOu9tRonTEolxR-RVyy8IO6MxMwEQrzu7XChQXFmxvEbyXxpuDbxU3FyhwP2Dh99JGTaGjfT8',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC08YRV3W5FjHMf-6LAQxRL1vVOmBfW9csE4pnMB70p3qZoycGwDRdgbjOZrxcj2PsMuJubW7FUhiA48tcF4a8HkEZCrbUz5YrUtwrQpcUDCUN7Go-AjnUdukIG-BTLpVSUe1BgniRkR6CAuux0pL5LCKVxSQQnMlU3Y5zOJkCaTW2bM-79ZE6qM4JO6XTk6yDa5A2nuTjzQP7Rl3ejc2ZbvKG3tohCGV8Rp0qFLVfycva57TNUQWP480kOSnG-ZPgiOYBIUcbttEI',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBGNG0YddqWgk_gYB9oftw5AOKjIjALYA4hy_4XPn1QAnh3MmYN5bzMO_QyitcSpmRYVmDAnvzkoJsxi1R8h2GwqAIxVpXaDaKnhpGNaj2soNexi1lKQnMoUi0xzMqoLbR5x954UbNEL6JMHkre4tWXeB8khYWzfr-h45Jy_YMbhsTiG_F_rTZFNEwLsfVC415p0yaA7dVq4Oi4AgW4vL073pfikGDxEGYq3aaNVF7ejfYZcS_6RTnXuKIK_Z6mStOeNuh8DsN7k_k',
    ],
    featured: true,
  },
  {
    id: 2,
    name: 'Anime Collection',
    description: 'My favorite anime-style stream overlays',
    isPublic: true,
    count: 8,
    covers: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC08YRV3W5FjHMf-6LAQxRL1vVOmBfW9csE4pnMB70p3qZoycGwDRdgbjOZrxcj2PsMuJubW7FUhiA48tcF4a8HkEZCrbUz5YrUtwrQpcUDCUN7Go-AjnUdukIG-BTLpVSUe1BgniRkR6CAuux0pL5LCKVxSQQnMlU3Y5zOJkCaTW2bM-79ZE6qM4JO6XTk6yDa5A2nuTjzQP7Rl3ejc2ZbvKG3tohCGV8Rp0qFLVfycva57TNUQWP480kOSnG-ZPgiOYBIUcbttEI',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA_bxEV0uLzRvYnNSct039kpxFNDPkKgjV6sfAk3Yvqn_A7gONLfe0EAIv9xU5wb2EF2lkqWmePbG5t4zkzjAdUbB5JaRJDGlDdC1JFuLgOwWPPQeC6DJIoUobilbr3SY1xGpeo07vW3zMGzuWA3ztCOt3Qh04--rd-Knq2NBW0rjYt6yc92nfZLhsyRZlYrPpYC9fASmSS9YYi_oKkXKBuHqnnUEjfW7-sn07BhuRxsmugZt36dOe3-tlePebjo0XJbFkEP1SDxnE',
    ],
    featured: false,
  },
  {
    id: 3,
    name: 'Secret Drafts',
    description: "Private board for overlays I'm considering",
    isPublic: false,
    count: 5,
    covers: [],
    featured: false,
  },
]

function CreateBoardModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', isPublic: true })
  const handleSubmit = (e) => {
    e.preventDefault()
    onCreate(form)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-headline-md text-white font-bold mb-6">Create New Board</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-label-sm text-on-surface-variant block mb-1">Board Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-11 px-4 rounded-lg glass-input text-white text-body-md"
              placeholder="e.g. My Esports Collection"
            />
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant block mb-1">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-4 rounded-lg glass-input text-white text-body-md resize-none"
              rows={3}
              placeholder="Describe your board..."
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setForm({ ...form, isPublic: true })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                form.isPublic ? 'border-secondary bg-secondary/10 text-secondary' : 'border-white/10 text-on-surface-variant hover:border-white/20'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">public</span>
              <span className="text-label-md font-label-md">Public</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, isPublic: false })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                !form.isPublic ? 'border-primary-container bg-primary/10 text-primary' : 'border-white/10 text-on-surface-variant hover:border-white/20'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">lock</span>
              <span className="text-label-md font-label-md">Private</span>
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg glass-surface text-on-surface-variant text-label-md hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-3 rounded-lg primary-gradient-btn text-white text-label-md font-bold">
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BoardCard({ board, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`glass-surface rounded-xl overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
        board.featured ? 'border-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.15)]' : 'border-white/10'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover Collage */}
      <div className="relative h-44">
        {board.covers.length >= 4 ? (
          <div className="grid grid-cols-2 h-full">
            {board.covers.slice(0, 4).map((src, i) => (
              <img key={i} src={src} alt="" className="w-full h-full object-cover" />
            ))}
          </div>
        ) : board.covers.length > 0 ? (
          <img src={board.covers[0]} alt={board.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full primary-gradient opacity-30 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[48px]">push_pin</span>
          </div>
        )}

        {/* Hover Actions */}
        {hovered && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg glass-panel text-white text-label-md hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit
            </button>
            <button
              onClick={() => onDelete(board.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error-container/30 border border-error/30 text-error text-label-md hover:bg-error-container/50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Board Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-bold text-label-md">{board.name}</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            board.isPublic
              ? 'bg-secondary/20 text-secondary border border-secondary/30'
              : 'bg-white/10 text-on-surface-variant border border-white/10'
          }`}>
            {board.isPublic ? '🌍 Public' : '🔒 Private'}
          </span>
        </div>
        <p className="text-on-surface-variant text-label-sm">{board.count} overlays</p>
      </div>
    </div>
  )
}

export default function BoardsPage() {
  const [boards, setBoards] = useState(mockBoards)
  const [showModal, setShowModal] = useState(false)

  const handleCreate = (form) => {
    const newBoard = {
      id: Date.now(),
      name: form.name,
      description: form.description,
      isPublic: form.isPublic,
      count: 0,
      covers: [],
      featured: false,
    }
    setBoards([newBoard, ...boards])
  }

  const handleDelete = (id) => {
    if (confirm('Delete this board?')) {
      setBoards(boards.filter((b) => b.id !== id))
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg text-white font-bold">My Boards</h1>
          <p className="text-on-surface-variant text-body-md mt-1">
            {boards.length} boards · {boards.reduce((acc, b) => acc + b.count, 0)} overlays saved
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="primary-gradient flex items-center gap-2 px-5 py-3 rounded-full text-white text-label-md font-bold hover:scale-105 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Create New Board
        </button>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {boards.map((board) => (
          <BoardCard key={board.id} board={board} onDelete={handleDelete} />
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <CreateBoardModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}
