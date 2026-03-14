import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { fetchUserPlants } from '../services/plantService'
import type { Plant, PlantCare } from '../types/database'

export type PlantWithCare = Plant & { plant_care: PlantCare | null }

export function usePlants() {
  const queryClient = useQueryClient()

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: () => supabase.auth.getSession().then((r) => r.data.session),
  })

  const userId = sessionQuery.data?.user?.id

  const plantsQuery = useQuery<PlantWithCare[]>({
    queryKey: ['plants', userId],
    queryFn: () => fetchUserPlants(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  })

  return {
    plants: plantsQuery.data ?? [],
    isLoading: plantsQuery.isLoading,
    error: plantsQuery.error,
    refetch: plantsQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['plants'] }),
  }
}
