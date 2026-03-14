import { create } from 'zustand'
import type { Plant, PlantCare } from '../types/database'

export type PlantWithCare = Plant & { plant_care: PlantCare | null }

interface PlantStore {
  plants: PlantWithCare[]
  setPlants: (plants: PlantWithCare[]) => void
  addPlant: (plant: PlantWithCare) => void
  removePlant: (plantId: string) => void
}

export const usePlantStore = create<PlantStore>((set) => ({
  plants: [],
  setPlants: (plants) => set({ plants }),
  addPlant: (plant) => set((state) => ({ plants: [plant, ...state.plants] })),
  removePlant: (plantId) =>
    set((state) => ({ plants: state.plants.filter((p) => p.id !== plantId) })),
}))
