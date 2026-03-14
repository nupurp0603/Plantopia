import React from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import ReminderItem from '@/components/ReminderItem'
import { useTasks } from '@/hooks/useTasks'
import { isOverdue, type TaskWithPlant } from '@/services/reminderService'

export default function RemindersScreen() {
  const { tasks, isLoading, refetch, completeTask, isCompleting } = useTasks()

  // Sort: overdue first, then by due date
  const sorted = [...tasks].sort((a, b) => {
    const aOver = isOverdue(a.due_date) ? 0 : 1
    const bOver = isOverdue(b.due_date) ? 0 : 1
    if (aOver !== bOver) return aOver - bOver
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reminders & Tasks</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2D4A2D" />
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌿</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>Your plants are happy</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2D4A2D" />
          }
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>PENDING ({tasks.length})</Text>
          }
          renderItem={({ item }) => (
            <ReminderItem
              task={item as TaskWithPlant}
              onComplete={completeTask}
              isCompleting={isCompleting}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEAE3' },

  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1C',
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },

  list: { paddingBottom: 40 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#888' },
})
