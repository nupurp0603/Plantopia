import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import type { PlantWithCare } from '../hooks/usePlants'

interface PlantCardProps {
  plant: PlantWithCare
}

export default function PlantCard({ plant }: PlantCardProps) {
  const router = useRouter()
  const wateringDays = plant.plant_care?.watering_frequency_days ?? 7

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/plant/${plant.id}`)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: plant.image_url ?? undefined }}
        style={styles.image}
        contentFit="cover"
        placeholder={{ uri: 'https://placehold.co/80x80/e8f5e9/4caf50?text=🌿' }}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{plant.plant_name}</Text>
        <Text style={styles.scientific}>{plant.scientific_name}</Text>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>💧 Every {wateringDays}d</Text>
          </View>
          {plant.plant_care?.light_requirement ? (
            <View style={[styles.badge, styles.lightBadge]}>
              <Text style={styles.badgeText}>☀️ {plant.plant_care.light_requirement.split(' ')[0]}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  scientific: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lightBadge: {
    backgroundColor: '#fff9c4',
  },
  badgeText: {
    fontSize: 11,
    color: '#444',
    fontWeight: '500',
  },
})
