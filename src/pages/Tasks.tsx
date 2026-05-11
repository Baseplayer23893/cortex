import { useState, useEffect } from 'react'
import { useTasksStore } from '../store'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { format } from 'date-fns'
import { Plus, Check, Circle, Calendar, Tag, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import type { Task } from '../types'

type FilterType = 'all' | 'today' | 'week' | 'tag'

interface TaskItemProps {
  task: Task
  onToggle: (id: number) => void
  onUpdate: (id: number, updates: Partial<Task>) => void
  onDelete: (id: number) => void
}

function TaskItem({ task, onToggle, onUpdate, onDelete }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [editDueDate, setEditDueDate] = useState(task.dueDate || '')
  const [editPriority, setEditPriority] = useState(task.priority)

  const isDone = task.status === 'done'
  const priorityColors = {
    low: 'bg-[var(--text-tertiary)]',
    medium: 'bg-[var(--amber)]',
    high: 'bg-[var(--red)]',
  }

  const handleSave = () => {
    if (task.id) {
      onUpdate(task.id, {
        title: editTitle,
        description: editDescription || undefined,
        dueDate: editDueDate || undefined,
        priority: editPriority,
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
              new Date(task.dueDate) < new Date() && !isDone 
                ? 'bg-[var(--red)]/20 text-[var(--red)]' 
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}>
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.priority !== 'low' && (
            <span className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
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

  const handleSubmit = () => {
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      description: '',
      status: 'todo',
      priority,
      dueDate: dueDate || undefined,
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
  showAddButton?: boolean
}

function TaskGroup({ title, tasks, onToggle, onUpdate, onDelete, onAddClick, showAddButton = true }: TaskGroupProps) {
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
        <p className="text-sm text-[var(--text-tertiary)] py-4 text-center">No tasks</p>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
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
  const [newTaskGroup, setNewTaskGroup] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const todayTasks = items.filter(t => t.dueDate === today && t.status !== 'done')
  const upcomingTasks = items.filter(t => t.dueDate && t.dueDate > today && t.dueDate <= nextWeek && t.status !== 'done')
  const somedayTasks = items.filter(t => !t.dueDate && t.status !== 'done')
  const doneTasks = items.filter(t => t.status === 'done')

  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    await add(task)
    setAddingGroup(null)
    setNewTaskGroup('')
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

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'By Tag', value: 'tag' },
  ]

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
              onClick={() => setFilter(btn.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === btn.value
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="text-center text-[var(--text-secondary)] py-8">Loading...</div>
        ) : (
          <>
            {addingGroup === 'today' ? (
              <AddTaskForm onAdd={handleAddTask} onCancel={() => setAddingGroup(null)} />
            ) : (
              <TaskGroup
                title="Today"
                tasks={filter === 'today' ? todayTasks : filter === 'all' ? todayTasks : []}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onAddClick={() => setAddingGroup('today')}
              />
            )}

            {filter === 'all' && (
              <>
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
                    showAddButton={false}
                  />
                )}
              </>
            )}

            {filter === 'today' && todayTasks.length === 0 && !addingGroup && (
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

            {filter === 'week' && upcomingTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[var(--text-secondary)]">No tasks due this week</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}