// src/pages/ai-chat.tsx — Beergate v3 Dedicated AI Chat Page
import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Plus, Trash2, MessageSquare, Sparkles,
  Package, Beaker, FlaskConical, ShoppingCart, BarChart3,
  Beer, ChevronLeft,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { MessageBubble } from '@/components/ai/message-bubble'
import type { AIMessage } from '@/lib/types'

// ---- Conversation type (local) ----
interface LocalConversation {
  id: string
  title: string
  contextPage: string
  messages: AIMessage[]
  createdAt: string
}

// ---- Context picker ----
const CONTEXT_OPTIONS = [
  { key: 'dashboard', icon: BarChart3, color: '#8B9BB4' },
  { key: 'inventory', icon: Package, color: '#F5A623' },
  { key: 'brewing', icon: Beaker, color: '#D4723C' },
  { key: 'fermentation', icon: FlaskConical, color: '#42A5F5' },
  { key: 'recipes', icon: Sparkles, color: '#7CB342' },
  { key: 'shop', icon: ShoppingCart, color: '#AB47BC' },
  { key: 'keezer', icon: Beer, color: '#F5A623' },
] as const

// ---- Quick actions per context ----
function useQuickActions(context: string) {
  const { t } = useTranslation('ai')
  const key = ['inventory', 'brewing', 'fermentation', 'shop'].includes(context) ? context : 'default'
  const actions = t(`quick_actions.${key}`, { returnObjects: true }) as string[]
  return Array.isArray(actions) ? actions : []
}

// ---- Main Page ----
export default function AiChatPage() {
  const { t } = useTranslation(['common', 'ai'])
  const { setActivePage } = useUIStore()

  const [conversations, setConversations] = useState<LocalConversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [contextPage, setContextPage] = useState('dashboard')
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamBuffer, setStreamBuffer] = useState('')
  const [showHistory, setShowHistory] = useState(true)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const cancelStreamRef = useRef<(() => void) | null>(null)
  const streamBufferRef = useRef('')

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null
  const messages = activeConv?.messages ?? []
  const quickActions = useQuickActions(contextPage)

  useEffect(() => { setActivePage('ai-chat') }, [setActivePage])

  // Scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamBuffer])

  // Focus input when switching conversations
  useEffect(() => {
    inputRef.current?.focus()
  }, [activeConvId])

  const createConversation = useCallback((firstMessage?: string) => {
    const id = crypto.randomUUID()
    const welcome: AIMessage = {
      id: 'welcome',
      role: 'assistant',
      content: t('ai:welcome'),
      created_at: new Date().toISOString(),
    }
    const conv: LocalConversation = {
      id,
      title: firstMessage?.slice(0, 40) || t('ai:new_chat', 'Nueva conversación'),
      contextPage,
      messages: [welcome],
      createdAt: new Date().toISOString(),
    }
    setConversations(prev => [conv, ...prev])
    setActiveConvId(id)
    return id
  }, [contextPage, t])

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isStreaming) return

    let convId = activeConvId
    if (!convId) {
      convId = createConversation(text.trim())
    }

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    }

    setConversations(prev => prev.map(c =>
      c.id === convId
        ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length <= 1 ? text.trim().slice(0, 40) : c.title }
        : c
    ))

    setInput('')
    setIsStreaming(true)
    setStreamBuffer('')
    streamBufferRef.current = ''

    cancelStreamRef.current = api.streamChat(
      null, // server-side conversation management
      text.trim(),
      contextPage,
      (token) => {
        streamBufferRef.current += token
        setStreamBuffer(prev => prev + token)
      },
      (_newConvId) => {
        const finalContent = streamBufferRef.current
        setConversations(prev => prev.map(c =>
          c.id === convId
            ? {
                ...c,
                messages: [...c.messages, {
                  id: crypto.randomUUID(),
                  role: 'assistant' as const,
                  content: finalContent || t('ai:errors.no_response'),
                  created_at: new Date().toISOString(),
                }],
              }
            : c
        ))
        setIsStreaming(false)
        setStreamBuffer('')
      },
      (err) => {
        setConversations(prev => prev.map(c =>
          c.id === convId
            ? {
                ...c,
                messages: [...c.messages, {
                  id: crypto.randomUUID(),
                  role: 'assistant' as const,
                  content: `⚠️ ${err}`,
                  created_at: new Date().toISOString(),
                }],
              }
            : c
        ))
        setIsStreaming(false)
        setStreamBuffer('')
      }
    )
  }, [activeConvId, contextPage, createConversation, isStreaming, t])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleNewChat = () => {
    if (cancelStreamRef.current) cancelStreamRef.current()
    setIsStreaming(false)
    setStreamBuffer('')
    setActiveConvId(null)
  }

  const handleDeleteConv = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConvId === id) setActiveConvId(null)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Conversation history sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden', flexShrink: 0,
            }}
          >
            {/* History header */}
            <div style={{
              padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E8E0D4' }}>
                {t('ai:chat_history', 'Historial')}
              </span>
              <button
                onClick={handleNewChat}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: 'rgba(245,166,35,0.12)', color: '#F5A623',
                }}
              >
                <Plus size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {t('ai:new_chat', 'Nueva')}
              </button>
            </div>

            {/* Context picker */}
            <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {CONTEXT_OPTIONS.map(opt => {
                const Icon = opt.icon
                const active = contextPage === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => setContextPage(opt.key)}
                    style={{
                      padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 500,
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 3,
                      background: active ? `${opt.color}18` : 'rgba(255,255,255,0.04)',
                      color: active ? opt.color : '#8B9BB4',
                      transition: 'all 0.15s',
                    }}
                    title={t(`ai:context.${opt.key}`, opt.key)}
                  >
                    <Icon size={11} />
                    {opt.key.slice(0, 4)}
                  </button>
                )
              })}
            </div>

            {/* Conversation list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
              {conversations.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '32px 12px', color: '#5A6B80', fontSize: 12,
                }}>
                  <MessageSquare size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  {t('ai:no_conversations', 'Sin conversaciones aún')}
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    style={{
                      padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: activeConvId === conv.id
                        ? 'rgba(245,166,35,0.08)' : 'transparent',
                      border: activeConvId === conv.id
                        ? '1px solid rgba(245,166,35,0.15)' : '1px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 500, color: '#E8E0D4',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {conv.title}
                      </div>
                      <div style={{ fontSize: 10, color: '#5A6B80', marginTop: 2 }}>
                        {conv.messages.length - 1} msgs · {conv.contextPage}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteConv(conv.id) }}
                      style={{
                        padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: 'transparent', color: '#5A6B80',
                        opacity: 0.5, transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Chat header */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)', color: '#8B9BB4',
            }}
          >
            <ChevronLeft size={16} style={{
              transform: showHistory ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.2s',
            }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🤖</span>
            <div>
              <h1 style={{
                fontSize: 16, fontWeight: 700, color: '#E8E0D4', margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {t('ai:assistant_name')}
              </h1>
              <span style={{
                fontSize: 10, fontWeight: 500,
                color: CONTEXT_OPTIONS.find(o => o.key === contextPage)?.color ?? '#8B9BB4',
              }}>
                {t(`ai:context.${contextPage}`, contextPage)}
              </span>
            </div>
          </div>
          {activeConv && (
            <div style={{
              marginLeft: 'auto', fontSize: 12, color: '#5A6B80',
              fontStyle: 'italic',
            }}>
              {activeConv.title}
            </div>
          )}
        </div>

        {/* Messages area */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 24px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* Welcome state (no active conversation) */}
          {!activeConv && messages.length === 0 && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16,
            }}>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 56 }}
              >
                🤖
              </motion.div>
              <h2 style={{
                fontSize: 20, fontWeight: 700, color: '#E8E0D4', margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {t('ai:assistant_name')}
              </h2>
              <p style={{
                fontSize: 13, color: '#8B9BB4', textAlign: 'center',
                maxWidth: 400, lineHeight: 1.6,
              }}>
                {t('ai:welcome')}
              </p>

              {/* Quick action pills */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8,
                justifyContent: 'center', maxWidth: 500, marginTop: 8,
              }}>
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    style={{
                      padding: '8px 16px', borderRadius: 20, fontSize: 12,
                      border: '1px solid rgba(245,166,35,0.2)',
                      background: 'rgba(245,166,35,0.06)',
                      color: '#E8E0D4', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(245,166,35,0.12)'
                      e.currentTarget.style.borderColor = 'rgba(245,166,35,0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(245,166,35,0.06)'
                      e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)'
                    }}
                  >
                    <Sparkles size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: '#F5A623' }} />
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation messages */}
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {/* Streaming */}
          {isStreaming && streamBuffer && (
            <MessageBubble
              message={{ id: 'streaming', role: 'assistant', content: streamBuffer, created_at: '' }}
              isStreaming
            />
          )}
          {isStreaming && !streamBuffer && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px 16px 16px 4px', padding: '8px 14px',
                display: 'flex', gap: 4,
              }}>
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#F5A623',
                      display: 'inline-block',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '12px 24px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 10,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '10px 14px',
            transition: 'border-color 0.2s',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ai:placeholder', 'Pregúntame cualquier cosa sobre tu cervecería...')}
              rows={1}
              disabled={isStreaming}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 14, color: '#E8E0D4', resize: 'none',
                fontFamily: "'Inter', sans-serif", maxHeight: 120,
                overflowY: 'auto', lineHeight: 1.5,
              }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              style={{
                padding: 8, borderRadius: 10, border: 'none', cursor: 'pointer',
                flexShrink: 0,
                background: input.trim() && !isStreaming
                  ? 'linear-gradient(135deg, #F5A623, #D4723C)' : 'rgba(255,255,255,0.05)',
                color: input.trim() && !isStreaming ? '#0A0E14' : '#5A6B80',
                transition: 'all 0.2s',
              }}
            >
              <Send size={16} />
            </button>
          </div>
          <p style={{
            fontSize: 10, color: '#5A6B80', textAlign: 'center', marginTop: 6,
          }}>
            {t('ai:input_hint', 'Enter → send · Shift+Enter → new line')}
          </p>
        </div>
      </div>
    </div>
  )
}
