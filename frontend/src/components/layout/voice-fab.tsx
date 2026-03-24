// frontend/src/components/layout/voice-fab.tsx
import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useSpeechRecognition, useVoiceCommand } from '@/hooks/use-voice'
import { toast } from 'sonner'

export function VoiceFab() {
  const { t } = useTranslation('common')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<ReturnType<ReturnType<typeof useSpeechRecognition>['start']>>(null)
  const voiceCommand = useVoiceCommand()

  const handleResult = useCallback(
    (transcript: string) => {
      setListening(false)
      toast.info(`"${transcript}"`)
      voiceCommand.mutate(
        { text: transcript },
        {
          onSuccess: (result) => {
            toast.success(result.response_text)
          },
          onError: () => {
            toast.error(t('errors.voice_command_error'))
          },
        }
      )
    },
    [voiceCommand]
  )

  const { start, supported } = useSpeechRecognition({
    lang: 'es-ES',
    onResult: handleResult,
    onError: (err) => {
      setListening(false)
      toast.error(err)
    },
  })

  if (!supported) return null

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
    } else {
      recognitionRef.current = start()
      if (recognitionRef.current) setListening(true)
    }
  }

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-20 right-20 md:bottom-6 md:right-[5.5rem] z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors"
      style={{
        background: listening
          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
          : 'linear-gradient(135deg, #3b82f6, #2563eb)',
      }}
      aria-label={listening ? t('ai.stop_recording', 'Stop recording') : t('ai.voice_command', 'Voice command')}
      title={listening ? t('ai.stop_recording', 'Stop recording') : t('ai.voice_command', 'Voice command')}
    >
      {voiceCommand.isPending ? (
        <Loader2 size={20} className="text-white animate-spin" />
      ) : listening ? (
        <MicOff size={20} className="text-white" />
      ) : (
        <Mic size={20} className="text-white" />
      )}

      <AnimatePresence>
        {listening && (
          <motion.span
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-full bg-red-500/40"
          />
        )}
      </AnimatePresence>
    </motion.button>
  )
}
