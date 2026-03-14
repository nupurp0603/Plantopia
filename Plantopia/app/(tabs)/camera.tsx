import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View } from 'react-native'

// This screen is never shown — the tab button navigates directly to /scan
export default function CameraPlaceholder() {
  const router = useRouter()
  useEffect(() => { router.replace('/scan') }, [router])
  return <View style={{ flex: 1, backgroundColor: '#000' }} />
}
