import { supabase } from './supabaseClient'
import type { PlantIdentificationResult } from '../types/database'

export async function identifyPlant(imageUrl: string): Promise<PlantIdentificationResult> {
  const { data, error } = await supabase.functions.invoke('identify-plant', {
    body: { image_url: imageUrl },
  })
  if (error) throw error
  return data as PlantIdentificationResult
}

export async function sendBotanistMessage(
  plantContext: { plant_name: string; scientific_name: string; care_instructions: Record<string, string> },
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ assistant_message: string }> {
  // Pull onboarding profile to tailor response complexity
  const { data: { session } } = await supabase.auth.getSession()
  const meta = session?.user.user_metadata ?? {}
  const userProfile = meta.experience
    ? { experience: meta.experience, goals: meta.goals ?? [] }
    : undefined

  const { data, error } = await supabase.functions.invoke('botanist-chat', {
    body: {
      plant_context: plantContext,
      user_message: userMessage,
      conversation_history: conversationHistory,
      user_profile: userProfile,
    },
  })
  if (error) throw error
  return data as { assistant_message: string }
}

export async function generateCareInstructions(
  plantSpecies: string,
  scientificName: string
): Promise<{
  watering_frequency_days: number
  light_requirement: string
  fertilizer_schedule: string
  care_instructions: Record<string, string>
  common_problems: string[]
}> {
  const { data, error } = await supabase.functions.invoke('generate-care', {
    body: { plant_species: plantSpecies, scientific_name: scientificName },
  })
  if (error) throw error
  return data
}
