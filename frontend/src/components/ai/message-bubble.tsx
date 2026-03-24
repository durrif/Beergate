// frontend/src/components/ai/message-bubble.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AIMessage } from '@/lib/types'

interface MessageBubbleProps {
  message: AIMessage
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Detect action suggestions in assistant messages (format: [ACTION:label:route])
  const { text, actions } = isUser ? { text: message.content, actions: [] } : parseActions(message.content)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-2 group', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="shrink-0 self-end mb-1">
          <div className="w-7 h-7 rounded-full bg-accent-amber/15 flex items-center justify-center">
            <Sparkles size={14} className="text-accent-amber" />
          </div>
        </div>
      )}

      {/* Bubble */}
      <div className="max-w-[85%] min-w-0">
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm leading-relaxed',
            isUser
              ? 'bg-accent-amber/20 border border-accent-amber/30 text-text-primary rounded-tr-sm'
              : 'glass-card text-text-primary rounded-tl-sm',
            isStreaming && 'border-accent-amber/50'
          )}
        >
          <MessageContent content={text} />
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-accent-amber ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>

        {/* Action chips */}
        {actions.length > 0 && !isStreaming && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {actions.map((action, i) => (
              <button
                key={i}
                className="px-3 py-1 rounded-full text-[11px] font-medium border border-accent-amber/25 bg-accent-amber/[0.06] text-accent-amber hover:bg-accent-amber/15 transition-colors cursor-pointer"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Copy button for assistant messages */}
        {!isUser && !isStreaming && message.content.length > 20 && (
          <button
            onClick={handleCopy}
            className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[#5A6B80] hover:text-text-secondary p-0.5"
            aria-label="Copiar"
          >
            {copied ? <Check size={12} className="text-accent-hop" /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </motion.div>
  )
}

interface ParsedAction {
  label: string
  route?: string
}

function parseActions(content: string): { text: string; actions: ParsedAction[] } {
  const actions: ParsedAction[] = []
  const text = content.replace(/\[ACTION:([^:\]]+)(?::([^\]]+))?\]/g, (_, label, route) => {
    actions.push({ label, route })
    return ''
  }).trim()
  return { text, actions }
}

function MessageContent({ content }: { content: string }) {
  // Minimal markdown: bold, code blocks, newlines
  const lines = content.split('\n')
  return (
    <div className="whitespace-pre-wrap break-words">
      {lines.map((line, i) => (
        <span key={i}>
          {renderLine(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </div>
  )
}

function renderLine(line: string): React.ReactNode {
  // Handle **bold**
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-accent-foam">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="font-mono text-xs bg-bg-hover px-1 py-0.5 rounded">{part.slice(1, -1)}</code>
    }
    return <span key={i}>{part}</span>
  })
}
