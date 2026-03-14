import { supabase } from './supabaseClient'
import type { Task } from '../types/database'

export interface TaskWithPlant extends Task {
  plants: {
    plant_name: string
    scientific_name: string
    image_url: string | null
  }
}

export async function fetchTasks(userId: string): Promise<TaskWithPlant[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, plants(plant_name, scientific_name, image_url)')
    .eq('user_id', userId)
    .eq('completed', false)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data as TaskWithPlant[]
}

export async function completeTask(task: TaskWithPlant): Promise<void> {
  const { error } = await supabase.from('tasks').update({ completed: true }).eq('id', task.id)
  if (error) throw error

  // Guard: don't create a duplicate next-task if one already exists
  const { data: existing } = await supabase
    .from('tasks')
    .select('id')
    .eq('plant_id', task.plant_id)
    .eq('task_type', task.task_type)
    .eq('completed', false)
    .limit(1)
    .maybeSingle()

  if (existing) return  // next task already exists, skip creation

  const nextDueDays = getNextDueDays(task.task_type)
  const nextDue = new Date()
  nextDue.setDate(nextDue.getDate() + nextDueDays)

  const { error: insertError } = await supabase.from('tasks').insert({
    plant_id: task.plant_id,
    user_id: task.user_id,
    task_type: task.task_type,
    due_date: nextDue.toISOString().split('T')[0],
    completed: false,
  })
  if (insertError) {
    // Rollback: un-complete the original task
    await supabase.from('tasks').update({ completed: false }).eq('id', task.id)
    throw insertError
  }
}

function getNextDueDays(taskType: string): number {
  switch (taskType) {
    case 'water': return 7
    case 'fertilize': return 30
    case 'repot': return 365
    case 'rotate': return 7
    default: return 7
  }
}

export function getTaskLabel(taskType: string): string {
  switch (taskType) {
    case 'water': return 'Water'
    case 'fertilize': return 'Fertilize'
    case 'repot': return 'Repot'
    case 'rotate': return 'Rotate'
    default: return taskType
  }
}

export function getTaskEmoji(taskType: string): string {
  switch (taskType) {
    case 'water': return '💧'
    case 'fertilize': return '🌱'
    case 'repot': return '🪴'
    case 'rotate': return '🔄'
    default: return '✅'
  }
}

export function formatDueDate(dueDateStr: string): string {
  const dueDate = new Date(dueDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)

  const diffMs = dueDate.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  return `Due in ${diffDays} days`
}

export function isOverdue(dueDateStr: string): boolean {
  const dueDate = new Date(dueDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today
}

/** True when the task is due today or overdue — i.e. the user should act now */
export function isDue(dueDateStr: string): boolean {
  const dueDate = new Date(dueDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate <= today
}
