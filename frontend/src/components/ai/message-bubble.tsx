// frontend/src/components/ai/message-bubble.tsx
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { AIMessage } from '@/lib/types'

interface MessageBubbleProps {
  message: AIMessage
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      {!isUser && (
        <span className="text-xl shrink-0 self-end mb-1">🤖</span>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
          isUser
            ? 'bg-accent-amber/20 border border-accent-amber/30 text-text-primary rounded-tr-sm'
            : 'glass-card text-text-primary rounded-tl-sm',
          isStreaming && 'border-accent-amber/50'
        )}
      >
        {/* Simple markdown-like rendering */}
        <MessageContent content={message.content} />
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-accent-amber ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>
    </motion.div>
  )
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
