'use client'

import { useState } from 'react'

const mockDrafts = [
  { id: 1, name: 'Neon Gaming Pack v2', status: 'draft', lastEdited: '2 hours ago', thumb: null },
  { id: 2, name: 'Anime Alert Bundle', status: 'review', lastEdited: '1 day ago', thumb: null },
  { id: 3, name: 'Minimalist Pro Set', status: 'approved', lastEdited: '3 days ago', thumb: null },
  { id: 4, name: 'Horror Halloween Kit', status: 'rejected', lastEdited: '5 days ago', thumb: null },
]

const statusConfig = {
  draft: { label: 'Draft', color: 'text-on-surface-variant bg-white/10 border-white/20' },
  review: { label: 'In Review', color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' },
  approved: { label: 'Approved ✓', color: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30' },
  rejected: { label: 'Rejected ✗', color: 'text-error bg-error-container/20 border-error/30' },
}

const layers = [
  { name: 'Alert Zone', icon: 'notification_important', color: 'text-secondary', visible: true, locked: false },
  { name: 'Webcam Frame', icon: 'videocam', color: 'text-primary', visible: true, locked: false },
  { name: 'Background', icon: 'image', color: 'text-tertiary', visible: true, locked: true },
  { name: 'Chat Widget', icon: 'chat', color: 'text-on-surface-variant', visible: false, locked: false },
]

export default function StudioPage() {
  const [drafts, setDrafts] = useState(mockDrafts)
  const [activeDraft, setActiveDraft] = useState(mockDrafts[0])
  const [activePanel, setActivePanel] = useState('layers')
  const [zoom, setZoom] = useState(100)
  const [layerStates, setLayerStates] = useState(layers)

  const toggleVisibility = (idx) => {
    setLayerStates(layerStates.map((l, i) => i === idx ? { ...l, visible: !l.visible } : l))
  }

  return (
    <div className="fixed inset-0 ml-[280px] bg-[#090910] flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-6 h-12 bg-surface-container-low/80 border-b border-white/10 flex-shrink-0">
        {/* Left */}
        <div className="flex items-center gap-4">
          <span className="text-white font-bold text-label-md">Studio</span>
          <div className="w-px h-4 bg-white/10" />
          {/* Draft Title */}
          <input
            className="bg-transparent border-b border-white/20 text-white text-label-md px-2 py-0.5 focus:outline-none focus:border-primary"
            value={activeDraft.name}
            onChange={(e) => setActiveDraft({ ...activeDraft, name: e.target.value })}
          />
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <span className="text-[#10B981] text-label-sm flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Saved
          </span>
          <button className="px-4 py-1.5 rounded-lg glass-surface text-white text-label-sm hover:bg-white/5 transition-colors">
            Preview
          </button>
          <button className="px-4 py-1.5 rounded-lg primary-gradient-btn text-white text-label-sm font-bold hover:scale-[1.02] transition-transform">
            Submit for Review
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Drafts Panel */}
        <div className="w-[240px] flex-shrink-0 bg-surface-container-low/60 border-r border-white/10 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white text-label-md font-bold">My Drafts</span>
            <button
              onClick={() => {
                const newDraft = { id: Date.now(), name: 'New Draft', status: 'draft', lastEdited: 'just now', thumb: null }
                setDrafts([newDraft, ...drafts])
                setActiveDraft(newDraft)
              }}
              className="w-7 h-7 rounded-lg glass-surface flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-[16px]">add</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {drafts.map((draft) => {
              const { label, color } = statusConfig[draft.status]
              return (
                <button
                  key={draft.id}
                  onClick={() => setActiveDraft(draft)}
                  className={`w-full text-left px-4 py-3 transition-all border-l-2 ${
                    activeDraft.id === draft.id
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-6 rounded glass-surface flex-shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[12px]">layers</span>
                    </div>
                    <span className="text-white text-label-sm font-bold truncate">{draft.name}</span>
                  </div>
                  <div className="flex items-center justify-between ml-10">
                    <span className="text-on-surface-variant" style={{ fontSize: '10px' }}>{draft.lastEdited}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color}`}>{label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Center — Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#090910]">
          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
            <div
              className="relative border-2 border-dashed border-white/20 rounded-lg overflow-hidden bg-surface-container-lowest"
              style={{ width: `${Math.min(100, zoom)}%`, maxWidth: '960px', aspectRatio: '16/9' }}
            >
              {/* Zone Markers */}
              <div className="absolute inset-0 flex flex-col p-4 gap-4">
                <div className="flex-1 flex gap-4">
                  <div className="flex-1 rounded-lg border-2 border-dashed border-secondary/50 flex items-center justify-center">
                    <span className="text-secondary text-label-sm font-bold opacity-60">Alert Zone</span>
                  </div>
                  <div className="w-1/3 rounded-lg border-2 border-dashed border-primary/50 flex items-center justify-center">
                    <span className="text-primary text-label-sm font-bold opacity-60">Webcam Frame</span>
                  </div>
                </div>
                <div className="h-1/4 flex gap-4">
                  <div className="flex-1 rounded-lg border-2 border-dashed border-tertiary/50 flex items-center justify-center">
                    <span className="text-tertiary text-label-sm font-bold opacity-60">Chat Box</span>
                  </div>
                  <div className="w-1/3 rounded-lg border-2 border-dashed border-on-surface-variant/30 flex items-center justify-center">
                    <span className="text-on-surface-variant text-label-sm font-bold opacity-40">Info Panel</span>
                  </div>
                </div>
              </div>

              {/* AI Assist Button */}
              <button className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full primary-gradient-btn text-white text-label-sm font-bold shadow-lg shadow-primary-container/30 hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                AI Assist ✨
              </button>
            </div>
          </div>

          {/* Canvas Toolbar */}
          <div className="flex items-center justify-center gap-6 py-3 border-t border-white/10">
            <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="w-8 h-8 glass-surface rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <span className="text-on-surface-variant text-label-sm w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(150, zoom + 25))} className="w-8 h-8 glass-surface rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
            <div className="w-px h-4 bg-white/10" />
            <span className="text-on-surface-variant text-label-sm">1920×1080</span>
            <div className="w-px h-4 bg-white/10" />
            <button className="text-on-surface-variant text-label-sm hover:text-white transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">grid_on</span>
              Grid
            </button>
          </div>
        </div>

        {/* Right — Properties Panel */}
        <div className="w-[280px] flex-shrink-0 bg-surface-container-low/60 border-l border-white/10 flex flex-col">
          {/* Panel Tabs */}
          <div className="flex border-b border-white/10">
            {['Canvas', 'Layers', 'Assets'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePanel(tab.toLowerCase())}
                className={`flex-1 py-3 text-label-sm font-label-sm transition-colors ${
                  activePanel === tab.toLowerCase()
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activePanel === 'canvas' && (
              <div className="space-y-4">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-2">Canvas Size</label>
                  <select className="w-full h-10 px-3 rounded-lg glass-input text-white text-label-sm bg-transparent">
                    <option>1920×1080 (Full HD)</option>
                    <option>2560×1440 (2K)</option>
                    <option>3840×2160 (4K)</option>
                  </select>
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-2">Export Format</label>
                  <select className="w-full h-10 px-3 rounded-lg glass-input text-white text-label-sm bg-transparent">
                    <option>PNG</option>
                    <option>WEBP</option>
                    <option>ZIP Bundle</option>
                  </select>
                </div>
                <button className="w-full py-3 rounded-lg bg-secondary/20 border border-secondary/30 text-secondary text-label-md font-bold hover:bg-secondary/30 transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Export
                </button>
              </div>
            )}

            {activePanel === 'layers' && (
              <div className="space-y-2">
                {layerStates.map((layer, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg glass-surface hover:bg-white/5 transition-colors group">
                    <span className={`material-symbols-outlined text-[20px] ${layer.color}`}>{layer.icon}</span>
                    <span className="flex-1 text-label-sm text-white">{layer.name}</span>
                    <button onClick={() => toggleVisibility(idx)} className="text-on-surface-variant hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">{layer.visible ? 'visibility' : 'visibility_off'}</span>
                    </button>
                    <button className={`text-on-surface-variant transition-colors ${layer.locked ? 'text-primary' : 'hover:text-white'}`}>
                      <span className="material-symbols-outlined text-[18px]">{layer.locked ? 'lock' : 'lock_open'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activePanel === 'assets' && (
              <div>
                <p className="text-on-surface-variant text-label-sm mb-4">Drag assets onto the canvas</p>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square rounded glass-surface flex items-center justify-center hover:border-primary/30 cursor-pointer transition-colors">
                      <span className="material-symbols-outlined text-on-surface-variant/50 text-[24px]">image</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 glass-surface rounded-lg text-on-surface-variant text-label-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  Upload Asset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Timeline */}
      <div className="h-12 bg-surface-container-low/80 border-t border-white/10 flex items-center px-6 gap-4">
        <button className="text-on-surface-variant hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[20px]">play_arrow</span>
        </button>
        <button className="text-on-surface-variant hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[20px]">stop</span>
        </button>
        <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full relative">
          <div className="absolute left-0 h-full w-1/3 bg-primary-container rounded-full" />
          <div className="absolute w-3 h-3 rounded-full bg-white shadow-lg" style={{ left: 'calc(33% - 6px)', top: '-2px' }} />
        </div>
        <span className="text-on-surface-variant text-label-sm">0:00 / 0:10</span>
        <span className="text-on-surface-variant text-label-sm">Timeline (animated overlays)</span>
      </div>
    </div>
  )
}
