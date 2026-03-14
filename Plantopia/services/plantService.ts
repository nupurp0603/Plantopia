import { supabase } from './supabaseClient'
import type { Plant, PlantCare } from '../types/database'

export async function fetchUserPlants(userId: string): Promise<(Plant & { plant_care: PlantCare | null })[]> {
  const { data, error } = await supabase
    .from('plants')
    .select('*, plant_care(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (Plant & { plant_care: PlantCare | null })[]
}

export async function fetchPlantById(plantId: string): Promise<Plant & { plant_care: PlantCare | null }> {
  const { data, error } = await supabase
    .from('plants')
    .select('*, plant_care(*)')
    .eq('id', plantId)
    .single()

  if (error) throw error
  return data as Plant & { plant_care: PlantCare | null }
}

export async function deletePlant(plantId: string): Promise<void> {
  const { error } = await supabase.from('plants').delete().eq('id', plantId)
  if (error) throw error
}

export async function markTaskComplete(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ completed: true })
    .eq('id', taskId)
  if (error) throw error
}

export async function sendChatMessage(
  plantContext: { plant_name: string; scientific_name: string; care_instructions: Record<string, string> },
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ assistant_message: string }> {
  const { data, error } = await supabase.functions.invoke('botanist-chat', {
    body: {
      plant_context: plantContext,
      user_message: userMessage,
      conversation_history: conversationHistory,
    },
  })
  if (error) throw error
  return data as { assistant_message: string }
}
