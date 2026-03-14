import React from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.sub}>Coming soon</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EFEA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#2D4A2D' },
  sub: { fontSize: 14, color: '#888', marginTop: 4 },
})
