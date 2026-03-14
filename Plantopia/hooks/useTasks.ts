import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { fetchTasks, completeTask, type TaskWithPlant } from '../services/reminderService'

export function useTasks() {
  const queryClient = useQueryClient()

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: () => supabase.auth.getSession().then((r) => r.data.session),
  })

  const userId = sessionQuery.data?.user?.id

  const tasksQuery = useQuery<TaskWithPlant[]>({
    queryKey: ['tasks', userId],
    queryFn: () => fetchTasks(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  })

  const completeTaskMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
    completeTask: completeTaskMutation.mutate,
    isCompleting: completeTaskMutation.isPending,
  }
}
