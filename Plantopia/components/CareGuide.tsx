import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { PlantCare } from '../types/database'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

interface CareRow {
  icon: IoniconName
  iconColor: string
  label: string
  value: string
}

export default function CareGuide({ care }: { care: PlantCare }) {
  const rows: CareRow[] = [
    {
      icon: 'water-outline',
      iconColor: '#4A90D9',   // blue
      label: 'Water',
      value: `Every ${care.watering_frequency_days} days`,
    },
    {
      icon: 'sunny-outline',
      iconColor: '#F0A030',   // amber/orange
      label: 'Light',
      value: care.light_requirement,
    },
  ]

  if (care.care_instructions?.soil) {
    rows.push({
      icon: 'leaf-outline',
      iconColor: '#4A8A30',   // green
      label: 'Soil',
      value: care.care_instructions.soil,
    })
  }

  rows.push({
    icon: 'refresh-outline',
    iconColor: '#4A8A30',     // green
    label: 'Fertilizer',
    value: care.fertilizer_schedule,
  })

  if (care.care_instructions?.location) {
    rows.push({
      icon: 'location-outline',
      iconColor: '#666',       // gray
      label: 'Location',
      value: care.care_instructions.location,
    })
  }

  const skip = new Set(['soil', 'location'])
  for (const [key, val] of Object.entries(care.care_instructions ?? {})) {
    if (!skip.has(key)) {
      rows.push({
        icon: 'clipboard-outline',
        iconColor: '#888',
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: val,
      })
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Care Guide</Text>
      {rows.map((row, i) => (
        <View key={i}>
          <View style={styles.row}>
            <View style={styles.iconCircle}>
              <Ionicons name={row.icon} size={21} color={row.iconColor} />
            </View>
            <View style={styles.detail}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.value}>{row.value}</Text>
            </View>
          </View>
          {i < rows.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDEAE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detail: { flex: 1 },
  label: {
    fontSize: 13,
    color: '#999',
    marginBottom: 3,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EFEA',
    marginLeft: 64,
  },
})
