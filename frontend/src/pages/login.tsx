// frontend/src/pages/login.tsx
import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { TokenResponse } from '@/lib/types'

export default function LoginPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const errs: typeof errors = {}
    if (!email) errs.email = t('errors.required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t('errors.invalid_email')
    if (!password) errs.password = t('errors.required')
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      const data = await api.post<TokenResponse>('/v1/auth/login', { email, password })
      setAuth(data)
      toast.success(t('auth.login_success'))
      void navigate({ to: '/' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.server_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg-primary p-4">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-amber/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-copper/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="Beergate" className="w-20 h-20 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(212,160,74,0.3)]" />
          <h1 className="text-2xl font-bold amber-text">Beergate</h1>
          <p className="text-sm text-text-secondary mt-1">Craft Brewery Control Room</p>
        </div>

        {/* Form */}
        <div className="glass-card rounded-2xl p-6 shadow-glass">
          <h2 className="text-lg font-semibold text-text-primary mb-6">{t('auth.login')}</h2>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
                  autoComplete="email"
                  className={cn(
                    'w-full pl-9 pr-4 py-2.5 text-sm rounded-lg bg-bg-elevated border text-text-primary',
                    'focus:outline-none focus:ring-1 focus:ring-accent-amber/50 transition-all',
                    errors.email ? 'border-status-danger' : 'border-white/[0.08]'
                  )}
                />
              </div>
              {errors.email && <p className="text-xs text-status-danger">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                  autoComplete="current-password"
                  className={cn(
                    'w-full pl-9 pr-10 py-2.5 text-sm rounded-lg bg-bg-elevated border text-text-primary',
                    'focus:outline-none focus:ring-1 focus:ring-accent-amber/50 transition-all',
                    errors.password ? 'border-status-danger' : 'border-white/[0.08]'
                  )}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-status-danger">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-2.5 rounded-lg font-semibold text-sm text-bg-primary transition-all',
                'bg-amber-gradient hover:shadow-glow',
                loading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {loading ? t('auth.logging_in') : t('auth.login')}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-4">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-accent-amber hover:text-accent-amber-bright underline-offset-2 hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
