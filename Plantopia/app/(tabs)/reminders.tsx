import React from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ReminderItem from '@/components/ReminderItem'
import { useTasks } from '@/hooks/useTasks'
import { isOverdue, type TaskWithPlant } from '@/services/reminderService'
import { supabase } from '@/services/supabaseClient'

export default function RemindersScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { tasks, isLoading, refetch, completeTask, completingTaskId } = useTasks()

  // Fetch recently completed tasks (last 8)
  const { data: completedTasks = [] } = useQuery<TaskWithPlant[]>({
    queryKey: ['completed-tasks'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []
      const { data } = await supabase
        .from('tasks')
        .select('*, plants(plant_name, scientific_name, image_url)')
        .eq('user_id', session.user.id)
        .eq('completed', true)
        .order('created_at', { ascending: false })
        .limit(8)
      return (data ?? []) as TaskWithPlant[]
    },
    staleTime: 30_000,
  })

  // Sort pending: overdue first, then by due date
  const pending = [...tasks].sort((a, b) => {
    const aOver = isOverdue(a.due_date) ? 0 : 1
    const bOver = isOverdue(b.due_date) ? 0 : 1
    if (aOver !== bOver) return aOver - bOver
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  return (
    <View style={s.root}>
      {/* ── White header ── */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        >
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={s.title}>Reminders</Text>
          <Text style={s.subtitle}>
            {isLoading ? 'Loading…' : `${pending.length} task${pending.length !== 1 ? 's' : ''} pending`}
          </Text>
        </View>
      </View>

      {/* ── Body ── */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#2D4A2D" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2D4A2D" />
          }
        >
          {/* PENDING section */}
          <Text style={s.sectionLabel}>PENDING ({pending.length})</Text>

          {pending.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="leaf-outline" size={32} color="#8AB48A" />
              <Text style={s.emptyTitle}>All caught up!</Text>
              <Text style={s.emptySub}>Your plants are happy</Text>
            </View>
          ) : (
            pending.map((task) => (
              <ReminderItem
                key={task.id}
                task={task}
                onComplete={completeTask}
                isCompleting={completingTaskId === task.id}
              />
            ))
          )}

          {/* COMPLETED section */}
          {completedTasks.length > 0 && (
            <>
              <Text style={[s.sectionLabel, s.sectionLabelSpaced]}>
                COMPLETED ({completedTasks.length})
              </Text>
              {completedTasks.map((task) => (
                <ReminderItem
                  key={task.id}
                  task={task}
                  completed
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDEAE3' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEAE4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title:    { fontSize: 26, fontWeight: '800', color: '#1A1A1A', lineHeight: 32 },
  subtitle: { fontSize: 14, color: '#7A8A72', marginTop: 2 },

  // Body
  scroll: { paddingTop: 8, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#9A9A90',
    letterSpacing: 1.2, textTransform: 'uppercase',
    paddingHorizontal: 24,
    paddingTop: 20, paddingBottom: 12,
  },
  sectionLabelSpaced: { paddingTop: 28 },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 32,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2D4A2D' },
  emptySub:   { fontSize: 13, color: '#888' },
})
