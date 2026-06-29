'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const [activeTab, setActiveTab] = useState(initialTab)
  const router = useRouter()

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirm: '', terms: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      router.push('/dashboard/library')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (registerForm.password !== registerForm.confirm) {
      setError('Passwords do not match')
      return
    }
    if (!registerForm.terms) {
      setError('You must accept the terms')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      router.push('/dashboard/library')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col md:flex-row min-h-screen w-full bg-background text-on-background">
      {/* Left Panel — Visual */}
      <section className="hidden md:flex relative w-full md:w-[60%] h-screen bg-[#0D0D14] overflow-hidden items-center">
        {/* Background */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-60 mix-blend-lighten"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida/AP1WRLv4I8ucRFfhK5bsuHjLuOmsjnXuR40rKcROfKcLAJ5qyPXaEvOBHk6aEebvtU1WZYMxN7nTT2xSQg1nudUj2VMOtGYKRero1CPXYhj0OKw2RDEWGT15iBWVFjPNEQDteUjd6B6QCRFWg3-gZRJM0BNszM186UdqPWJymeqb2sQ8KV_uLXy32m_gR20TpNblsyWJIY25-1Q91ZOvq2Xtm8ce7G4ciwuH1vw9COjgM4wi05-V-AjTDz_03iY')" }}
        />
        {/* Gradient Fade */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0D0D14] via-[#0D0D14]/60 to-transparent" />
        {/* Content */}
        <div className="relative z-20 px-12 w-full h-full flex flex-col justify-between py-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-white font-bold text-xl">SimplyOver</span>
          </Link>

          {/* Tagline */}
          <div className="max-w-xl">
            <h1 className="text-headline-xl text-white mb-8 leading-tight">
              The world's premier <br />
              <span className="gradient-text">OBS overlay</span> marketplace.
            </h1>
            <div className="flex flex-wrap gap-4 mt-12">
              <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3 animate-float border border-white/5 shadow-xl">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>layers</span>
                <span className="text-label-md text-white">10k+ Overlays</span>
              </div>
              <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3 animate-float-delayed border border-white/5 shadow-xl">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>palette</span>
                <span className="text-label-md text-white">3k+ Artists</span>
              </div>
              <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3 animate-float border border-white/5 shadow-xl" style={{ animationDelay: '0.5s' }}>
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="text-label-md text-white">100% Free to Browse</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-on-surface-variant/40">
            <span className="text-label-sm uppercase tracking-widest">Built for creators by artists</span>
          </div>
        </div>
      </section>

      {/* Right Panel — Auth Form */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background relative">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="text-white font-bold text-lg">SimplyOver</span>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center mb-8 gap-8 border-b border-white/10">
            <button
              onClick={() => { setActiveTab('login'); setError('') }}
              className={`pb-3 px-2 text-label-md font-label-md transition-all duration-300 relative ${
                activeTab === 'login' ? 'text-primary' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Login
              <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary-container rounded-full transition-transform duration-300 origin-center ${activeTab === 'login' ? 'scale-x-100' : 'scale-x-0'}`} />
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError('') }}
              className={`pb-3 px-2 text-label-md font-label-md transition-all duration-300 relative ${
                activeTab === 'register' ? 'text-primary' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Register
              <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary-container rounded-full transition-transform duration-300 origin-center ${activeTab === 'register' ? 'scale-x-100' : 'scale-x-0'}`} />
            </button>
          </div>

          {/* Form Card */}
          <div className="glass-panel rounded-xl p-8 md:p-10 shadow-2xl">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-label-sm">
                {error}
              </div>
            )}

            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6">
                <header>
                  <h2 className="text-headline-lg gradient-text mb-2">Welcome back</h2>
                  <p className="text-body-md text-on-surface-variant">Sign in to your SimplyOver account</p>
                </header>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-label-sm text-on-surface-variant block ml-1">Email Address</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                      <input
                        type="email"
                        required
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 rounded-lg glass-input text-white text-body-md"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-label-sm text-on-surface-variant block">Password</label>
                      <a href="#" className="text-label-sm text-primary hover:underline">Forgot password?</a>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                      <input
                        type="password"
                        required
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 rounded-lg glass-input text-white text-body-md"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 primary-gradient-btn rounded-lg text-white text-label-md font-label-md shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="relative flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">or continue with</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className="flex items-center justify-center gap-3 h-12 rounded-lg bg-[#6441a5] hover:bg-[#7d5bbe] transition-colors">
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" /></svg>
                    <span className="text-label-md text-white">Twitch</span>
                  </button>
                  <button type="button" className="flex items-center justify-center gap-3 h-12 rounded-lg glass-panel hover:bg-white/10 transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span className="text-label-md text-white">Google</span>
                  </button>
                </div>

                <p className="text-center text-body-md text-on-surface-variant pt-2">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setActiveTab('register')} className="text-primary font-bold hover:underline">Register</button>
                </p>
              </form>
            )}

            {/* REGISTER FORM */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-6">
                <header>
                  <h2 className="text-headline-lg gradient-text mb-2">Join SimplyOver</h2>
                  <p className="text-body-md text-on-surface-variant">Create your free account</p>
                </header>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-label-sm text-on-surface-variant block ml-1">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">@</span>
                      <input
                        type="text"
                        required
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        className="w-full h-12 pl-10 pr-10 rounded-lg glass-input text-white text-body-md"
                        placeholder="username"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#34A853] shadow-[0_0_8px_rgba(52,168,83,0.5)]" />
                    </div>
                    <p className="text-[11px] text-[#34A853] ml-1">Username is available</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-sm text-on-surface-variant block ml-1">Email Address</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                      <input
                        type="email"
                        required
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="w-full h-12 pl-12 pr-4 rounded-lg glass-input text-white text-body-md"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-label-sm text-on-surface-variant block ml-1">Password</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                        <input
                          type="password"
                          required
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          className="w-full h-12 pl-12 pr-4 rounded-lg glass-input text-white text-body-md"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-label-sm text-on-surface-variant block ml-1">Confirm</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">verified_user</span>
                        <input
                          type="password"
                          required
                          value={registerForm.confirm}
                          onChange={(e) => setRegisterForm({ ...registerForm, confirm: e.target.value })}
                          className="w-full h-12 pl-12 pr-4 rounded-lg glass-input text-white text-body-md"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={registerForm.terms}
                    onChange={(e) => setRegisterForm({ ...registerForm, terms: e.target.checked })}
                    className="mt-1 rounded bg-white/5 border-white/10 text-primary-container focus:ring-primary-container"
                  />
                  <label htmlFor="terms" className="text-label-sm text-on-surface-variant leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-white hover:underline">Terms of Service</a> and{' '}
                    <a href="#" className="text-white hover:underline">Privacy Policy</a>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 primary-gradient-btn rounded-lg text-white text-label-md font-label-md shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>

                <p className="text-center text-body-md text-on-surface-variant pt-2">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setActiveTab('login')} className="text-primary font-bold hover:underline">Sign in</button>
                </p>
              </form>
            )}
          </div>

          <p className="mt-12 text-center text-label-sm text-on-surface-variant/40">
            © 2024 SimplyOver Marketplace. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  )
}

import { Suspense } from 'react'

export default function AuthPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant">Loading...</div>}>
      <AuthPage />
    </Suspense>
  )
}
