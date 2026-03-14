import { Platform } from 'react-native'
import { supabase } from './supabaseClient'
import type { PlantIdentificationResult, Plant } from '../types/database'

export async function uploadPlantImage(localUri: string, userId: string): Promise<string> {
  const fileName = `${userId}/${Date.now()}.jpg`
  const contentType = 'image/jpeg'

  let uploadData: Uint8Array | Blob

  if (Platform.OS === 'web') {
    // On web, fetch the blob URI directly
    const response = await fetch(localUri)
    uploadData = await response.blob()
  } else {
    // On native, use expo-file-system
    const { readAsStringAsync } = await import('expo-file-system/legacy')
    const base64 = await readAsStringAsync(localUri, { encoding: 'base64' as const })
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    uploadData = new Uint8Array(byteNumbers)
  }

  const { error } = await supabase.storage
    .from('plant-images')
    .upload(fileName, uploadData, { contentType })

  if (error) throw error

  const { data } = supabase.storage.from('plant-images').getPublicUrl(fileName)
  return data.publicUrl
}

export async function savePlant(
  userId: string,
  imageUrl: string,
  identification: PlantIdentificationResult
): Promise<Plant> {
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .insert({
      user_id: userId,
      plant_name: identification.plant_name,
      scientific_name: identification.scientific_name,
      image_url: imageUrl,
      description: identification.description,
    })
    .select()
    .single()

  if (plantError) throw plantError

  const { error: careError } = await supabase.from('plant_care').insert({
    plant_id: plant.id,
    watering_frequency_days: identification.watering_frequency_days,
    light_requirement: identification.light_requirement,
    fertilizer_schedule: identification.fertilizer_schedule,
    care_instructions: {},
    common_problems: identification.common_problems,
  })
  if (careError) throw careError

  const waterDue = new Date()
  waterDue.setDate(waterDue.getDate() + identification.watering_frequency_days)

  const { error: taskError } = await supabase.from('tasks').insert({
    plant_id: plant.id,
    user_id: userId,
    task_type: 'water',
    due_date: waterDue.toISOString().split('T')[0],
    completed: false,
  })
  if (taskError) throw taskError

  return plant as Plant
}
