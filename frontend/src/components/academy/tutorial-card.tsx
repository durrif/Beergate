// src/components/academy/tutorial-card.tsx — Tutorial card with video player
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Bookmark, BookmarkCheck, Clock, Check, X, ChevronDown } from 'lucide-react'
import type { Tutorial } from '@/data/tutorials'
import { CATEGORY_META } from '@/data/tutorials'
import { useAcademyStore } from '@/stores/academy-store'

interface Props {
  tutorial: Tutorial
}

export default function TutorialCard({ tutorial }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { watchHistory, bookmarks, markWatched, toggleBookmark } = useAcademyStore()

  const isWatched = watchHistory.some((w) => w.tutorialId === tutorial.id)
  const isBookmarked = bookmarks.includes(tutorial.id)
  const cat = CATEGORY_META[tutorial.category]

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl overflow-hidden border border-white/[0.07] hover:border-white/[0.12] transition-colors"
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        {/* Thumbnail/Emoji */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${cat.color}15` }}
        >
          {tutorial.thumbnail}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ color: cat.color, background: `${cat.color}15` }}
            >
              {cat.label}
            </span>
            {isWatched && (
              <span className="text-[10px] text-green-400 flex items-center gap-0.5">
                <Check size={10} /> Visto
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-text-primary leading-snug">
            {tutorial.title}
          </h3>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">
            {tutorial.description}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-text-tertiary flex items-center gap-1">
              <Clock size={11} />
              {formatDuration(tutorial.duration)}
            </span>
            {tutorial.lang === 'both' && (
              <span className="text-[10px] text-text-tertiary">🇪🇸 🇬🇧</span>
            )}
            {tutorial.relatedPhase && (
              <span className="text-[10px] text-text-tertiary capitalize">
                📍 {tutorial.relatedPhase}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleBookmark(tutorial.id)
            }}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
          >
            {isBookmarked ? (
              <BookmarkCheck size={16} className="text-accent-amber" />
            ) : (
              <Bookmark size={16} className="text-text-tertiary" />
            )}
          </button>
          <ChevronDown
            size={14}
            className={`text-text-tertiary transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded content — Video player + details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Video placeholder area */}
              <div className="relative aspect-video bg-bg-deep rounded-lg flex items-center justify-center border border-white/[0.05] overflow-hidden">
                <div className="text-center">
                  <div className="text-4xl mb-2">{tutorial.thumbnail}</div>
                  <button
                    onClick={() => markWatched(tutorial.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-bg-deep transition-colors"
                    style={{ background: 'linear-gradient(135deg, #F5A623, #D4723C)' }}
                  >
                    <Play size={16} fill="currentColor" />
                    Reproducir
                  </button>
                  <p className="text-xs text-text-tertiary mt-2">
                    {formatDuration(tutorial.duration)}
                  </p>
                </div>
                {/* Simulated progress bar */}
                {isWatched && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500/30">
                    <div className="h-full bg-green-500 w-full" />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {tutorial.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-text-secondary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* AI trigger conditions */}
              {tutorial.triggerConditions && tutorial.triggerConditions.length > 0 && (
                <div className="p-3 rounded-lg bg-accent-purple/[0.08] border border-accent-purple/20">
                  <p className="text-[11px] font-medium text-accent-purple mb-1">
                    🤖 Auto-sugerido por IA cuando:
                  </p>
                  <ul className="text-[11px] text-text-secondary space-y-0.5">
                    {tutorial.triggerConditions.map((c) => (
                      <li key={c} className="flex items-center gap-1">
                        <span className="text-accent-purple">•</span>
                        {c.replace(/_/g, ' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
