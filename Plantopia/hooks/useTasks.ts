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
    onMutate: async (task) => {
      // Cancel in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks', userId] })
      await queryClient.cancelQueries({ queryKey: ['completed-tasks'] })

      const previousTasks     = queryClient.getQueryData<TaskWithPlant[]>(['tasks', userId])
      const previousCompleted = queryClient.getQueryData<TaskWithPlant[]>(['completed-tasks'])

      // Immediately remove from pending list
      queryClient.setQueryData<TaskWithPlant[]>(['tasks', userId], (old) =>
        (old ?? []).filter((t) => t.id !== task.id)
      )
      // Immediately prepend to completed list
      queryClient.setQueryData<TaskWithPlant[]>(['completed-tasks'], (old) =>
        [{ ...task, completed: true }, ...(old ?? [])]
      )

      return { previousTasks, previousCompleted }
    },
    onError: (_err, _task, context) => {
      // Roll back on failure
      if (context?.previousTasks !== undefined)
        queryClient.setQueryData(['tasks', userId], context.previousTasks)
      if (context?.previousCompleted !== undefined)
        queryClient.setQueryData(['completed-tasks'], context.previousCompleted)
    },
    onSuccess: () => {
      // Sync with server state
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['completed-tasks'] })
    },
  })

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
    completeTask: completeTaskMutation.mutate,
    completingTaskId: completeTaskMutation.isPending
      ? (completeTaskMutation.variables as TaskWithPlant | undefined)?.id ?? null
      : null,
  }
}
