import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatDueDate, isOverdue, isDue, type TaskWithPlant } from '../services/reminderService'

interface ReminderItemProps {
  task: TaskWithPlant
  onComplete?: (task: TaskWithPlant) => void
  isCompleting?: boolean
  completed?: boolean
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

export default function ReminderItem({ task, onComplete, isCompleting, completed = false }: ReminderItemProps) {
  const overdue    = !completed && isOverdue(task.due_date)
  const actionable = !completed && isDue(task.due_date)   // today or overdue
  const iconBg    = completed ? '#E8E6E0' : overdue ? '#F5E3CC' : '#DDE6DC'
  const iconColor = completed ? '#AAA'    : overdue ? '#C8753A' : '#2D4A2D'

  return (
    <View style={styles.card}>
      {/* Icon */}
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={getTaskIcon(task.task_type)} size={22} color={iconColor} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.taskTitle, completed && styles.strikethrough]}>
          {getTaskTitle(task.task_type)}
        </Text>
        <Text style={[styles.plantName, completed && styles.mutedText]}>
          {task.plants.plant_name}
        </Text>
        {!completed && (
          <Text style={[styles.dueDate, overdue && styles.overdueDue]}>
            {formatDueDate(task.due_date)}
          </Text>
        )}
      </View>

      {/* Check button */}
      {completed ? (
        <View style={styles.checkDone}>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.checkBtn, !actionable && styles.checkBtnLocked]}
          onPress={() => onComplete?.(task)}
          disabled={isCompleting || !actionable}
          accessibilityLabel={
            actionable
              ? `Complete ${task.task_type} for ${task.plants.plant_name}`
              : `${task.task_type} not due yet`
          }
        >
          {isCompleting ? (
            <ActivityIndicator size="small" color="#888" />
          ) : (
            <Ionicons
              name={actionable ? 'checkmark' : 'time-outline'}
              size={18}
              color={actionable ? '#9A9A90' : '#C8C4BC'}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECEAE4',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  info: { flex: 1 },
  taskTitle: {
    fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 2,
  },
  plantName: {
    fontSize: 13, color: '#6A6A62', marginBottom: 3,
  },
  dueDate: {
    fontSize: 13, color: '#8A8A82',
  },
  overdueDue: {
    color: '#C8753A', fontWeight: '600',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#ABABAB',
  },
  mutedText: {
    color: '#ABABAB',
  },
  checkBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#D4D2CC',
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  checkBtnLocked: {
    borderColor: '#E8E6E0',
    backgroundColor: '#F5F4F0',
  },
  checkDone: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#3D5E3D',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
})
