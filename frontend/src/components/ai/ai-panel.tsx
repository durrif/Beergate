// frontend/src/components/ai/ai-panel.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Plus, X } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { MessageBubble } from './message-bubble'
import { QuickActions } from './quick-actions'
import { ContextBadge } from './context-badge'
import type { AIMessage } from '@/lib/types'

export function AiPanel() {
  const { t } = useTranslation(['common', 'ai'])
  const { closeAiPanel, activePage } = useUIStore()

  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [streamBuffer, setStreamBuffer] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const cancelStreamRef = useRef<(() => void) | null>(null)

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: t('ai:welcome'),
        created_at: new Date().toISOString(),
      }])
    }
  }, [t, messages.length])

  // Scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamBuffer])

  const streamBufferRef = useRef('')

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isStreaming) return
    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)
    setStreamBuffer('')
    streamBufferRef.current = ''

    cancelStreamRef.current = api.streamChat(
      conversationId,
      text.trim(),
      activePage,
      (token) => {
        streamBufferRef.current += token
        setStreamBuffer(prev => prev + token)
      },
      (newConvId) => {
        setConversationId(newConvId)
        const finalContent = streamBufferRef.current
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: finalContent || t('ai:errors.no_response'),
          created_at: new Date().toISOString(),
        }])
        setIsStreaming(false)
        setStreamBuffer('')
      },
      (err) => {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠️ ${err}`,
          created_at: new Date().toISOString(),
        }])
        setIsStreaming(false)
        setStreamBuffer('')
      }
    )
  }, [isStreaming, conversationId, activePage, t])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleNewChat = () => {
    if (cancelStreamRef.current) cancelStreamRef.current()
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: t('ai:welcome'),
      created_at: new Date().toISOString(),
    }])
    setConversationId(null)
    setIsStreaming(false)
    setStreamBuffer('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{t('ai:assistant_name')}</h2>
            <ContextBadge page={activePage} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleNewChat} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all" title={t('ai.new_chat')}>
            <Plus size={16} />
          </button>
          <button onClick={closeAiPanel} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all" title={t('ai.close_panel')}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Streaming in-progress */}
        {isStreaming && streamBuffer && (
          <MessageBubble
            message={{ id: 'streaming', role: 'assistant', content: streamBuffer, created_at: '' }}
            isStreaming
          />
        )}
        {isStreaming && !streamBuffer && (
          <div className="flex gap-2 items-center">
            <span className="text-xl">🤖</span>
            <div className="glass-card rounded-2xl rounded-tl-sm px-3 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-accent-amber"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <QuickActions page={activePage} onSelect={sendMessage} />
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-white/[0.08] shrink-0">
        <div className="flex items-end gap-2 rounded-xl bg-bg-elevated border border-white/[0.08] px-3 py-2 focus-within:ring-1 focus-within:ring-accent-amber/50 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.placeholder')}
            rows={1}
            disabled={isStreaming}
            className={cn(
              'flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary',
              'resize-none focus:outline-none max-h-32 overflow-y-auto no-scrollbar'
            )}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement
              el.style.height = 'auto'
              el.style.height = `${el.scrollHeight}px`
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className={cn(
              'p-1.5 rounded-lg transition-all shrink-0',
              input.trim() && !isStreaming
                ? 'bg-amber-gradient text-bg-primary hover:shadow-glow'
                : 'text-text-secondary cursor-not-allowed'
            )}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-text-secondary mt-1 text-center">Enter para enviar · Shift+Enter nueva línea</p>
      </div>
    </div>
  )
}
