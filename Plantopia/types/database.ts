export interface Plant {
  id: string
  user_id: string
  plant_name: string
  scientific_name: string
  image_url: string | null
  description: string | null
  created_at: string
}

export interface PlantCare {
  id: string
  plant_id: string
  watering_frequency_days: number
  light_requirement: string
  fertilizer_schedule: string
  care_instructions: Record<string, string>
  common_problems: string[]
}

export interface Task {
  id: string
  plant_id: string
  user_id: string
  task_type: 'water' | 'fertilize' | 'repot' | 'rotate'
  due_date: string
  completed: boolean
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  plant_id: string | null
  role: 'user' | 'assistant'
  message: string
  created_at: string
}

export interface PlantIdentificationResult {
  plant_name: string
  scientific_name: string
  confidence: number
  description: string
  watering_frequency_days: number
  light_requirement: string
  fertilizer_schedule: string
  common_problems: string[]
}
