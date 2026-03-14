import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatDueDate, isOverdue, type TaskWithPlant } from '../services/reminderService'

interface ReminderItemProps {
  task: TaskWithPlant
  onComplete: (task: TaskWithPlant) => void
  isCompleting?: boolean
}

function getTaskTitle(taskType: string): string {
  switch (taskType) {
    case 'water':     return 'Water plant'
    case 'fertilize': return 'Fertilize plant'
    case 'repot':     return 'Repot plant'
    case 'rotate':    return 'Rotate for sunlight'
    default:          return taskType
  }
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

function getTaskIcon(taskType: string): IoniconName {
  switch (taskType) {
    case 'water':     return 'water-outline'
    case 'fertilize': return 'refresh-outline'
    case 'repot':     return 'reload-outline'
    case 'rotate':    return 'sunny-outline'
    default:          return 'checkmark-circle-outline'
  }
}

export default function ReminderItem({ task, onComplete, isCompleting }: ReminderItemProps) {
  const overdue = isOverdue(task.due_date)
  const iconBg   = overdue ? '#F5E3CC' : '#D4DAD0'
  const iconColor = overdue ? '#C8753A' : '#2D4A2D'

  return (
    <View style={styles.card}>
      {/* Task type icon */}
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={getTaskIcon(task.task_type)} size={22} color={iconColor} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.taskTitle}>{getTaskTitle(task.task_type)}</Text>
        <Text style={styles.plantName}>{task.plants.plant_name}</Text>
        <Text style={[styles.dueDate, overdue && styles.overdueDue]}>
          {formatDueDate(task.due_date)}
        </Text>
      </View>

      {/* Checkmark button */}
      <TouchableOpacity
        style={styles.checkBtn}
        onPress={() => onComplete(task)}
        disabled={isCompleting}
        accessibilityLabel={`Complete ${task.task_type} for ${task.plants.plant_name}`}
      >
        {isCompleting ? (
          <ActivityIndicator size="small" color="#888" />
        ) : (
          <Ionicons name="checkmark" size={20} color="#999" />
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: { flex: 1 },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  plantName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  dueDate: {
    fontSize: 13,
    color: '#888',
  },
  overdueDue: {
    color: '#C8753A',
    fontWeight: '600',
  },
  checkBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#D0D0C8',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
})
