// frontend/src/pages/settings.tsx
import React, { useEffect, useState } from 'react'
import { User, Building, Droplets, Key, Globe, Save, Eye, EyeOff } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'

interface SectionProps { icon: React.ReactNode; title: string; children: React.ReactNode }
function Section({ icon, title, children }: SectionProps) {
  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
        {icon}{title}
      </h2>
      <Separator className="bg-zinc-700" />
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { setActivePage, language, setLanguage } = useUIStore()
  const { user, brewery } = useAuthStore()
  useEffect(() => { setActivePage('settings') }, [setActivePage])

  // Brewer's Friend API key
  const [bfKey, setBfKey] = useState(() => localStorage.getItem('bf_api_key') ?? '')
  const [showBfKey, setShowBfKey] = useState(false)

  // Password change
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const saveBfKey = () => {
    localStorage.setItem('bf_api_key', bfKey)
    toast.success('API key guardada localmente')
  }

  const changePassword = async () => {
    if (newPwd !== confirmPwd) { toast.error('Las contraseñas no coinciden'); return }
    if (newPwd.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return }
    try {
      await apiClient.post('/auth/change-password', { current_password: currentPwd, new_password: newPwd })
      toast.success('Contraseña actualizada')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (e: unknown) {
      toast.error((e as Error).message ?? 'Error al cambiar contraseña')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold amber-text">Ajustes</h1>

      {/* Profile */}
      <Section icon={<User className="w-4 h-4 text-amber-400" />} title="Perfil">
        <div className="text-sm text-text-secondary space-y-2">
          <div className="flex justify-between">
            <span className="text-text-primary font-medium">Nombre</span>
            <span>{user?.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-primary font-medium">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-primary font-medium">Rol</span>
            <span className="capitalize">{user?.role}</span>
          </div>
        </div>

        <Separator className="bg-zinc-700" />

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Cambiar contraseña</h3>
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Contraseña actual</Label>
            <Input type="password" value={currentPwd} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPwd(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Nueva contraseña</Label>
            <Input type="password" value={newPwd} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPwd(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Confirmar nueva contraseña</Label>
            <Input type="password" value={confirmPwd} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPwd(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-sm" />
          </div>
          <Button
            size="sm"
            disabled={!currentPwd || !newPwd || !confirmPwd}
            onClick={changePassword}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Save className="w-3.5 h-3.5 mr-1" /> Guardar contraseña
          </Button>
        </div>
      </Section>

      {/* Brewery */}
      {brewery && (
        <Section icon={<Building className="w-4 h-4 text-amber-400" />} title="Cervecería">
          <div className="text-sm text-text-secondary space-y-2">
            <div className="flex justify-between">
              <span className="text-text-primary font-medium">Nombre</span>
              <span>{brewery.name}</span>
            </div>
            {brewery.location && (
              <div className="flex justify-between">
                <span className="text-text-primary font-medium">Ubicación</span>
                <span>{brewery.location}</span>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Language */}
      <Section icon={<Globe className="w-4 h-4 text-amber-400" />} title="Idioma">
        <div className="flex gap-3">
          {(['es', 'en'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                language === lang
                  ? 'bg-amber-gradient text-bg-primary shadow-glow'
                  : 'glass-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {lang === 'es' ? '🇪🇸 Español' : '🇬🇧 English'}
            </button>
          ))}
        </div>
      </Section>

      {/* API Keys */}
      <Section icon={<Key className="w-4 h-4 text-amber-400" />} title="Integraciones">
        <div className="space-y-3">
          <Label className="text-xs text-zinc-400">Brewer's Friend API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showBfKey ? 'text' : 'password'}
                value={bfKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBfKey(e.target.value)}
                placeholder="Tu API key de Brewer's Friend"
                className="bg-zinc-900 border-zinc-700 text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowBfKey((v: boolean) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                {showBfKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button
              size="sm"
              onClick={saveBfKey}
              disabled={!bfKey}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Save className="w-3.5 h-3.5 mr-1" /> Guardar
            </Button>
          </div>
          <p className="text-xs text-zinc-500">
            La API key se guarda en tu navegador (localStorage) y se usa para importar recetas desde Brewer's Friend.
          </p>
        </div>
      </Section>

      {/* Water profiles placeholder */}
      <Section icon={<Droplets className="w-4 h-4 text-blue-400" />} title="Perfil de agua">
        <p className="text-xs text-zinc-400">
          Configura el perfil de agua de tu cervecería en la herramienta de agua del Dashboard.
        </p>
      </Section>
    </div>
  )
}

