import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

export default function ScanButton() {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/scan')}
      activeOpacity={0.85}
      accessibilityLabel="Scan new plant"
    >
      <Text style={styles.icon}>+</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 32,
    color: '#fff',
    lineHeight: 36,
    fontWeight: '300',
  },
})
