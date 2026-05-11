import React, { useState, useEffect, useRef } from 'react'
import { useTimetableStore } from '../store'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { format, isSameDay } from 'date-fns'
import { Plus, Trash2, Clock, MapPin, Repeat, X } from 'lucide-react'
import type { TimetableBlock } from '../types'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7am to 9pm
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type ViewMode = 'weekdays' | 'fullweek'

interface BlockFormProps {
  block?: TimetableBlock
  onSave: (block: Omit<TimetableBlock, 'id'>) => void
  onDelete?: () => void
  onClose: () => void
}

function BlockForm({ block, onSave, onDelete, onClose }: BlockFormProps) {
  const [title, setTitle] = useState(block?.title || '')
  const [dayOfWeek, setDayOfWeek] = useState<number>(block?.dayOfWeek ?? new Date().getDay())
  const [startTime, setStartTime] = useState(block?.startTime || '09:00')
  const [endTime, setEndTime] = useState(block?.endTime || '10:00')
  const [color, setColor] = useState(block?.color || '#7c3aed')
  const [location, setLocation] = useState(block?.location || '')
  const [recurring, setRecurring] = useState(block?.recurring ?? true)

  const handleSubmit = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      dayOfWeek: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      startTime,
      endTime,
      color,
      location: location || undefined,
      recurring,
    })
  }

  const colorOptions = [
    '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6'
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-6 w-96 max-w-[90vw]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{block ? 'Edit Block' : 'Add Block'}</h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            autoFocus
          />

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Day</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md text-sm text-[var(--text-primary)]"
            >
              {DAY_FULL.map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Start</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">End</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Color</label>
            <div className="flex gap-2">
              {colorOptions.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
          />

          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <Repeat className="w-4 h-4" />
            Repeats weekly
          </label>
        </div>

        <div className="flex justify-between mt-6">
          {block && onDelete && (
            <Button variant="danger" size="sm" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Timetable() {
  const { items, loading, fetchAll, add, update, delete: deleteBlock } = useTimetableStore()
  const [viewMode, setViewMode] = useState<ViewMode>('weekdays')
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimetableBlock | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const today = new Date().getDay()
  const todayDate = new Date()

  const visibleDays = viewMode === 'weekdays' 
    ? [1, 2, 3, 4, 5] as const  // Mon-Fri
    : [0, 1, 2, 3, 4, 5, 6] as const  // Full week

  const getBlocksForDay = (day: number) => {
    return items.filter(b => b.dayOfWeek === day)
  }

  const getBlockPosition = (block: TimetableBlock) => {
    const [startHour, startMin] = block.startTime.split(':').map(Number)
    const [endHour, endMin] = block.endTime.split(':').map(Number)
    const start = startHour + startMin / 60
    const end = endHour + endMin / 60
    const top = (start - 7) * 48 // 48px per hour
    const height = (end - start) * 48
    return { top, height: Math.max(height, 24) }
  }

  const handleSlotClick = (day: number, time: string) => {
    setSelectedSlot({ day, time })
    setEditingBlock(null)
    setShowForm(true)
  }

  const handleBlockClick = (e: React.MouseEvent, block: TimetableBlock) => {
    e.stopPropagation()
    setEditingBlock(block)
    setSelectedSlot(null)
    setShowForm(true)
  }

  const handleSave = async (blockData: Omit<TimetableBlock, 'id'>) => {
    if (editingBlock?.id) {
      await update(editingBlock.id, blockData)
    } else {
      await add(blockData)
    }
    setShowForm(false)
    setEditingBlock(null)
    setSelectedSlot(null)
  }

  const handleDelete = async () => {
    if (editingBlock?.id) {
      await deleteBlock(editingBlock.id)
      setShowForm(false)
      setEditingBlock(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Timetable</h1>
          <Button onClick={() => {
            setEditingBlock(null)
            setSelectedSlot(null)
            setShowForm(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Block
          </Button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('weekdays')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'weekdays'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            Weekdays (Mon–Fri)
          </button>
          <button
            onClick={() => setViewMode('fullweek')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'fullweek'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            Full Week (Mon–Sun)
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center text-[var(--text-secondary)] py-8">Loading...</div>
        ) : (
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid gap-px bg-[var(--border)] mb-px" style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, 1fr)` }}>
              <div className="bg-[var(--bg-surface)] p-2"></div>
              {visibleDays.map(day => (
                <div 
                  key={day} 
                  className={`bg-[var(--bg-surface)] p-2 text-center text-sm font-medium ${
                    day === today ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {DAYS[day]}
                  {day === today && (
                    <span className="ml-1 text-xs opacity-75">(Today)</span>
                  )}
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="grid gap-px bg-[var(--border)]" style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, 1fr)` }}>
              {HOURS.map(hour => (
                <React.Fragment key={hour}>
                  {/* Time label */}
                  <div className="bg-[var(--bg-surface)] p-1 text-xs text-[var(--text-tertiary)] text-right pr-2">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  
                  {/* Day cells */}
                  {visibleDays.map(day => {
                    const dayBlocks = getBlocksForDay(day)
                    const isToday = day === today
                    
                    return (
                      <div 
                        key={`${day}-${hour}`}
                        className={`bg-[var(--bg-surface)] min-h-[48px] relative cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors ${
                          isToday ? 'bg-[var(--accent-soft)]/30' : ''
                        }`}
                        onClick={() => handleSlotClick(day, `${hour.toString().padStart(2, '0')}:00`)}
                      >
                        {dayBlocks
                          .filter(block => {
                            const [blockHour] = block.startTime.split(':').map(Number)
                            return blockHour === hour
                          })
                          .map(block => {
                            const { top, height } = getBlockPosition(block)
                            return (
                              <div
                                key={block.id}
                                className="absolute left-1 right-1 rounded-md px-2 py-1 text-xs text-white cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                                style={{ 
                                  backgroundColor: block.color || '#7c3aed',
                                  top: `${top % 48}px`,
                                  height: `${height}px`,
                                }}
                                onClick={(e) => handleBlockClick(e, block)}
                              >
                                <div className="font-medium truncate">{block.title}</div>
                                {height > 30 && block.location && (
                                  <div className="opacity-75 truncate">{block.location}</div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <BlockForm
          block={editingBlock || undefined}
          onSave={handleSave}
          onDelete={editingBlock?.id ? handleDelete : undefined}
          onClose={() => {
            setShowForm(false)
            setEditingBlock(null)
            setSelectedSlot(null)
          }}
        />
      )}
    </div>
  )
}