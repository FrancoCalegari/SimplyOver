'use client'

import { useState } from 'react'

const socialPlatforms = [
  { key: 'twitch', label: 'Twitch', icon: '🎮', placeholder: 'https://twitch.tv/username', color: '#6441a5' },
  { key: 'kick', label: 'Kick', icon: '🟩', placeholder: 'https://kick.com/username', color: '#53fc18' },
  { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/username', color: '#e1306c' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@username', color: '#69c9d0' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', placeholder: 'https://youtube.com/@username', color: '#ff0000' },
  { key: 'twitter', label: 'Twitter / X', icon: '𝕏', placeholder: 'https://x.com/username', color: '#1da1f2' },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')

  const [profileForm, setProfileForm] = useState({
    displayName: 'My Display Name',
    username: 'username',
    bio: '',
    location: '',
    website: '',
  })

  const [socials, setSocials] = useState({
    twitch: '',
    kick: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    twitter: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })

  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const sections = [
    { key: 'profile', label: 'Profile', icon: 'person' },
    { key: 'social', label: 'Social Links', icon: 'link' },
    { key: 'security', label: 'Security', icon: 'shield' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications' },
  ]

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-headline-lg text-white font-bold">Account Settings</h1>
        <p className="text-on-surface-variant text-body-md mt-1">Manage your profile and preferences</p>
      </div>

      <div className="flex gap-8">
        {/* Section Nav */}
        <nav className="w-48 flex-shrink-0 space-y-1">
          {sections.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all text-label-md ${
                activeSection === key
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-on-surface-variant hover:bg-white/5 hover:text-white'
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={activeSection === key ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 glass-surface rounded-xl p-8">
          {/* Success toast */}
          {saved && (
            <div className="mb-6 p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-label-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Settings saved successfully!
            </div>
          )}

          {/* PROFILE */}
          {activeSection === 'profile' && (
            <form onSubmit={handleSave} className="space-y-6">
              <h2 className="text-headline-md text-white font-bold mb-6">Public Profile</h2>

              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full primary-gradient flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[36px]">person</span>
                  </div>
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-container flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <span className="material-symbols-outlined text-white text-[14px]">photo_camera</span>
                  </button>
                </div>
                <div>
                  <p className="text-white text-label-md font-bold">Profile Photo</p>
                  <p className="text-on-surface-variant text-label-sm mt-1">JPG, PNG or WEBP. Max 5MB.</p>
                  <button type="button" className="mt-2 text-primary text-label-sm hover:underline">
                    Upload new photo
                  </button>
                </div>
              </div>

              {/* Banner */}
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-2">Profile Banner</label>
                <div className="h-24 rounded-xl primary-gradient opacity-40 flex items-center justify-center border border-dashed border-white/20 cursor-pointer hover:opacity-60 transition-opacity">
                  <div className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                    <span className="text-label-md">Upload banner image</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-2">Display Name</label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg glass-input text-white text-body-md"
                  />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-2">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">@</span>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      className="w-full h-11 pl-9 pr-4 rounded-lg glass-input text-white text-body-md"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant block mb-2">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full p-4 rounded-lg glass-input text-white text-body-md resize-none"
                  rows={3}
                  placeholder="Tell the community about yourself and your work..."
                  maxLength={280}
                />
                <p className="text-on-surface-variant text-label-sm mt-1 text-right">{profileForm.bio.length}/280</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-2">Location</label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg glass-input text-white text-body-md"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-2">Personal Website</label>
                  <input
                    type="url"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg glass-input text-white text-body-md"
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>

              <button type="submit" className="primary-gradient-btn px-8 py-3 rounded-xl text-white text-label-md font-bold hover:scale-[1.02] transition-transform">
                Save Profile
              </button>
            </form>
          )}

          {/* SOCIAL LINKS */}
          {activeSection === 'social' && (
            <form onSubmit={handleSave} className="space-y-6">
              <h2 className="text-headline-md text-white font-bold mb-6">Social Links</h2>
              <p className="text-on-surface-variant text-body-md -mt-4">
                Link your social accounts to show them on your public profile.
              </p>

              {socialPlatforms.map(({ key, label, icon, placeholder }) => (
                <div key={key}>
                  <label className="text-label-sm text-on-surface-variant block mb-2">
                    {icon} {label}
                  </label>
                  <input
                    type="url"
                    value={socials[key]}
                    onChange={(e) => setSocials({ ...socials, [key]: e.target.value })}
                    className="w-full h-11 px-4 rounded-lg glass-input text-white text-body-md"
                    placeholder={placeholder}
                  />
                </div>
              ))}

              <button type="submit" className="primary-gradient-btn px-8 py-3 rounded-xl text-white text-label-md font-bold hover:scale-[1.02] transition-transform">
                Save Social Links
              </button>
            </form>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <form onSubmit={handleSave} className="space-y-6">
              <h2 className="text-headline-md text-white font-bold mb-6">Security</h2>

              <div>
                <label className="text-label-sm text-on-surface-variant block mb-2">Current Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full h-11 pl-12 pr-4 rounded-lg glass-input text-white text-body-md"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant block mb-2">New Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock_reset</span>
                  <input
                    type="password"
                    value={passwordForm.next}
                    onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                    className="w-full h-11 pl-12 pr-4 rounded-lg glass-input text-white text-body-md"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant block mb-2">Confirm New Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">verified_user</span>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full h-11 pl-12 pr-4 rounded-lg glass-input text-white text-body-md"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <h3 className="text-white font-bold text-label-md mb-4">Danger Zone</h3>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-lg bg-error-container/20 border border-error/30 text-error text-label-md hover:bg-error-container/40 transition-colors"
                >
                  Delete Account
                </button>
              </div>

              <button type="submit" className="primary-gradient-btn px-8 py-3 rounded-xl text-white text-label-md font-bold hover:scale-[1.02] transition-transform">
                Update Password
              </button>
            </form>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <form onSubmit={handleSave} className="space-y-6">
              <h2 className="text-headline-md text-white font-bold mb-6">Notifications</h2>

              {[
                { label: 'New purchases of my overlays', desc: 'Get notified when someone buys your overlay' },
                { label: 'New reviews on my designs', desc: 'Get notified when someone reviews your work' },
                { label: 'New followers', desc: 'Get notified when someone follows your profile' },
                { label: 'Platform announcements', desc: 'Important updates from SimplyOver' },
                { label: 'Marketing emails', desc: 'Tips, featured overlays and promotions' },
              ].map(({ label, desc }, i) => (
                <label key={i} className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
                    <div className="w-10 h-6 rounded-full glass-input peer-checked:bg-primary-container transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                  </div>
                  <div>
                    <p className="text-white text-label-md font-bold">{label}</p>
                    <p className="text-on-surface-variant text-label-sm mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}

              <button type="submit" className="primary-gradient-btn px-8 py-3 rounded-xl text-white text-label-md font-bold hover:scale-[1.02] transition-transform">
                Save Preferences
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
