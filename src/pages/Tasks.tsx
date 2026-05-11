import { useState, useEffect } from 'react'
import { useTasksStore } from '../store'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { formatDate, getTodayDateString } from '../lib/utils'
import { Plus, Check, Circle, Trash2, ChevronDown, ChevronRight, Tag as TagIcon } from 'lucide-react'
import type { Task } from '../types'

type FilterType = 'all' | 'today' | 'week' | 'tag'

interface TaskItemProps {
  task: Task
  onToggle: (id: number) => void
  onUpdate: (id: number, updates: Partial<Task>) => void
  onDelete: (id: number) => void
  onTagClick: (tag: string) => void
}

function TaskItem({ task, onToggle, onUpdate, onDelete, onTagClick }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [editDueDate, setEditDueDate] = useState(task.dueDate || '')
  const [editPriority, setEditPriority] = useState(task.priority)
  const [editTags, setEditTags] = useState(task.tags?.join(', ') || '')

  const isDone = task.status === 'done'
  const priorityColors = {
    low: 'bg-[var(--text-tertiary)]',
    medium: 'bg-[var(--amber)]',
    high: 'bg-[var(--red)]',
  }

  const handleSave = () => {
    if (task.id) {
      const tags = editTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
      onUpdate(task.id, {
        title: editTitle,
        description: editDescription || undefined,
        dueDate: editDueDate || undefined,
        priority: editPriority,
        tags: tags.length > 0 ? tags : undefined,
      })
      setExpanded(false)
    }
  }

  return (
    <div className={`group border border-[var(--border)] rounded-lg bg-[var(--bg-surface)] overflow-hidden transition-all ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => task.id && onToggle(task.id)}
          className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
        >
          {isDone ? (
            <Check className="w-5 h-5 text-[var(--green)]" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <span className={`flex-1 truncate ${isDone ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
            {task.title}
          </span>
          {task.dueDate && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              task.dueDate < getTodayDateString() && !isDone 
                ? 'bg-[var(--red)]/20 text-[var(--red)]' 
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}>
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.priority !== 'low' && (
            <span className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
          )}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {task.tags.slice(0, 3).map(tag => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTagClick(tag)
                  }}
                  className="px-1.5 py-0.5 text-xs bg-[var(--accent-soft)] text-[var(--accent)] rounded hover:bg-[var(--accent)]/20 transition-colors"
                >
                  {tag}
                </button>
              ))}
              {task.tags.length > 3 && (
                <span className="text-xs text-[var(--text-tertiary)]">+{task.tags.length - 3}</span>
              )}
            </div>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          )}
        </button>

        <button
          onClick={() => task.id && onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-tertiary)] hover:text-[var(--red)] transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-[var(--border)] space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
            className="mt-3"
          />
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add details..."
              className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Due Date</label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Task['priority'])}
                className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md text-sm text-[var(--text-primary)]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Tags (comma separated)</label>
            <Input
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="e.g. work, urgent, project"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setExpanded(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface AddTaskFormProps {
  onAdd: (task: Omit<Task, 'id'>) => void
  onCancel: () => void
}

function AddTaskForm({ onAdd, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [tagsInput, setTagsInput] = useState('')

  const handleSubmit = () => {
    if (!title.trim()) return
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    onAdd({
      title: title.trim(),
      description: '',
      status: 'todo',
      priority,
      dueDate: dueDate || undefined,
      tags: tags.length > 0 ? tags : undefined,
      createdAt: new Date(),
    })
  }

  return (
    <div className="p-3 border border-[var(--border)] rounded-lg bg-[var(--bg-surface)] space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            placeholder="Due date"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Task['priority'])}
          className="px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md text-sm text-[var(--text-primary)]"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <Input
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="Tags (comma separated, e.g. work, urgent)"
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>Add Task</Button>
      </div>
    </div>
  )
}

interface TaskGroupProps {
  title: string
  tasks: Task[]
  onToggle: (id: number) => void
  onUpdate: (id: number, updates: Partial<Task>) => void
  onDelete: (id: number) => void
  onAddClick: () => void
  onTagClick: (tag: string) => void
  showAddButton?: boolean
  emptyMessage?: string
}

function TaskGroup({ title, tasks, onToggle, onUpdate, onDelete, onAddClick, onTagClick, showAddButton = true, emptyMessage }: TaskGroupProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">{title}</h3>
        {showAddButton && (
          <button
            onClick={onAddClick}
            className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add task
          </button>
        )}
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">{emptyMessage || 'No tasks'}</p>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onTagClick={onTagClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Tasks() {
  const { items, loading, fetchAll, add, update, delete: deleteTask, toggleComplete } = useTasksStore()
  const [filter, setFilter] = useState<FilterType>('all')
  const [addingGroup, setAddingGroup] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const today = getTodayDateString()
  const nextWeekDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const nextWeek = nextWeekDate.toISOString().split('T')[0]

  // Get unique tags from all tasks
  const allTags = Array.from(
    new Set(items.flatMap(t => t.tags || []))
  ).sort()

  // Filter tasks by date
  const todayTasks = items.filter(t => t.dueDate === today && t.status !== 'done')
  const upcomingTasks = items.filter(t => t.dueDate && t.dueDate > today && t.dueDate <= nextWeek && t.status !== 'done')
  const somedayTasks = items.filter(t => !t.dueDate && t.status !== 'done')
  const doneTasks = items.filter(t => t.status === 'done')

  // Filter by selected tag
  const taggedTasks = selectedTag 
    ? items.filter(t => t.tags && t.tags.includes(selectedTag) && t.status !== 'done')
    : items.filter(t => t.tags && t.tags.length > 0 && t.status !== 'done')

  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    await add(task)
    setAddingGroup(null)
  }

  const handleToggle = async (id: number) => {
    await toggleComplete(id)
  }

  const handleUpdate = async (id: number, updates: Partial<Task>) => {
    await update(id, updates)
  }

  const handleDelete = async (id: number) => {
    await deleteTask(id)
  }

  const handleTagClick = (tag: string) => {
    setFilter('tag')
    setSelectedTag(tag)
  }

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'By Tag', value: 'tag' },
  ]

  const getFilterTitle = () => {
    switch (filter) {
      case 'today': return 'Today'
      case 'week': return 'This Week'
      case 'tag': return selectedTag ? `Tag: ${selectedTag}` : 'All Tags'
      default: return 'All Tasks'
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <span className="text-sm text-[var(--text-secondary)]">
            {items.filter(t => t.status !== 'done').length} remaining
          </span>
        </div>

        <div className="flex gap-2">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => {
                setFilter(btn.value)
                if (btn.value !== 'tag') setSelectedTag(null)
              }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === btn.value
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-[var(--text-secondary)] py-8">Loading...</div>
        ) : filter === 'tag' ? (
          // By Tag View
          <div className="space-y-4">
            {selectedTag ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    ← Back to tags
                  </button>
                </div>
                {taggedTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[var(--text-secondary)]">No tasks with this tag</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {taggedTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onTagClick={handleTagClick}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Select a tag</h3>
                {allTags.length === 0 ? (
                  <div className="text-center py-8">
                    <TagIcon className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                    <p className="text-[var(--text-secondary)]">No tags yet</p>
                    <p className="text-sm text-[var(--text-tertiary)]">Add tags to your tasks to organize them</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-full text-sm text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
                      >
                        {tag}
                        <span className="ml-1.5 text-xs text-[var(--text-tertiary)]">
                          ({items.filter(t => t.tags?.includes(tag)).length})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : filter === 'today' ? (
          // Today Filter View
          <div className="space-y-4">
            {addingGroup ? (
              <AddTaskForm onAdd={handleAddTask} onCancel={() => setAddingGroup(null)} />
            ) : todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--text-secondary)]">No tasks due today</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setAddingGroup('today')}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add a task
                </Button>
              </div>
            )}
          </div>
        ) : filter === 'week' ? (
          // This Week Filter View
          <div className="space-y-4">
            {upcomingTasks.length > 0 ? (
              <div className="space-y-2">
                {upcomingTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--text-secondary)]">No tasks due this week</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setAddingGroup('upcoming')}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add a task
                </Button>
              </div>
            )}
          </div>
        ) : (
          // All Tasks View (default)
          <div className="space-y-6">
            {addingGroup === 'today' ? (
              <AddTaskForm onAdd={handleAddTask} onCancel={() => setAddingGroup(null)} />
            ) : (
              <TaskGroup
                title="Today"
                tasks={todayTasks}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onAddClick={() => setAddingGroup('today')}
                onTagClick={handleTagClick}
                emptyMessage="No tasks due today"
              />
            )}

            {addingGroup === 'upcoming' ? (
              <AddTaskForm onAdd={handleAddTask} onCancel={() => setAddingGroup(null)} />
            ) : (
              <TaskGroup
                title="Upcoming"
                tasks={upcomingTasks}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onAddClick={() => setAddingGroup('upcoming')}
                onTagClick={handleTagClick}
                emptyMessage="No upcoming tasks"
              />
            )}

            {addingGroup === 'someday' ? (
              <AddTaskForm onAdd={handleAddTask} onCancel={() => setAddingGroup(null)} />
            ) : (
              <TaskGroup
                title="Someday"
                tasks={somedayTasks}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onAddClick={() => setAddingGroup('someday')}
                onTagClick={handleTagClick}
                emptyMessage="No tasks without a due date"
              />
            )}

            {addingGroup === 'done' ? (
              <AddTaskForm onAdd={handleAddTask} onCancel={() => setAddingGroup(null)} />
            ) : (
              <TaskGroup
                title="Done"
                tasks={doneTasks}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onTagClick={handleTagClick}
                showAddButton={false}
                emptyMessage="No completed tasks"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}