import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/services/supabaseClient'
import { uploadPlantImage, savePlant } from '@/services/visionService'
import { identifyPlant } from '@/services/aiService'
import type { PlantIdentificationResult } from '@/types/database'

const SCREEN_H = Dimensions.get('window').height

// Pick a local illustration based on plant name keywords
function pickIllustration(name: string) {
  const n = name.toLowerCase()
  if (n.includes('cactus') || n.includes('succulent') || n.includes('aloe')) {
    return require('@/assets/images-new/plant-cactus.png')
  }
  if (n.includes('fern') || n.includes('palm') || n.includes('tropical')) {
    return require('@/assets/images-new/plant-fern.png')
  }
  if (n.includes('flower') || n.includes('rose') || n.includes('orchid') || n.includes('lily')) {
    return require('@/assets/images-new/plant-flowering.png')
  }
  if (n.includes('hang') || n.includes('ivy') || n.includes('pothos') || n.includes('string')) {
    return require('@/assets/images-new/plant-hanging.png')
  }
  return require('@/assets/images-new/plant-leafy.png')
}

type ScanState = 'camera' | 'preview' | 'identifying' | 'result' | 'saving'

export default function ScanScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [state, setState] = useState<ScanState>('camera')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [result, setResult] = useState<PlantIdentificationResult | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function takePicture() {
    if (!cameraRef.current) return
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 })
      if (photo) {
        setPhotoUri(photo.uri)
        setState('preview')
      }
    } catch {
      Alert.alert('Error', 'Failed to take picture. Please try again.')
    }
  }

  async function pickFromLibrary() {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })
    if (!picked.canceled && picked.assets[0]) {
      setPhotoUri(picked.assets[0].uri)
      setState('preview')
    }
  }

  async function identifyPhoto() {
    if (!photoUri) return
    setState('identifying')
    setError(null)

    try {
      const session = await supabase.auth.getSession()
      const userId = session.data.session?.user.id
      if (!userId) throw new Error('Not signed in. Please wait and try again.')

      const imageUrl = await uploadPlantImage(photoUri, userId)
      setUploadedImageUrl(imageUrl)
      const identification = await identifyPlant(imageUrl)
      setResult({ ...identification })
      setState('result')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not identify plant'
      setError(msg)
      setState('preview')
    }
  }

  async function confirmSave() {
    if (!result || !photoUri) return
    setState('saving')

    try {
      const session = await supabase.auth.getSession()
      const userId = session.data.session?.user.id
      if (!userId) throw new Error('Not signed in. Please wait and try again.')
      const imageUrl = uploadedImageUrl ?? await uploadPlantImage(photoUri, userId)
      await savePlant(userId, imageUrl, result)
      queryClient.invalidateQueries({ queryKey: ['plants'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      router.replace('/')
    } catch {
      Alert.alert('Error', 'Failed to save plant. Please try again.')
      setState('result')
    }
  }

  function reset() {
    setPhotoUri(null)
    setResult(null)
    setUploadedImageUrl(null)
    setError(null)
    setState('camera')
  }

  // Permission state still loading — show a prompt so screen isn't blank
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#2D4A2D" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          Plantopia needs camera access to identify your plants.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Identifying state
  if (state === 'identifying') {
    return (
      <View style={styles.container}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        )}
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.identifyingText}>Identifying your plant...</Text>
          <Text style={styles.identifyingSubtext}>Analyzing with AI</Text>
        </View>
      </View>
    )
  }

  // Saving state
  if (state === 'saving') {
    return (
      <View style={styles.container}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.identifyingText}>Adding to your garden...</Text>
        </View>
      </View>
    )
  }

  // Result state — bottom sheet over photo
  if (state === 'result' && result) {
    const illustration = pickIllustration(result.plant_name)
    const sheetTop = SCREEN_H * 0.38

    return (
      <View style={styles.container}>
        {/* Background photo */}
        {photoUri && (
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        )}

        {/* Bottom sheet */}
        <View style={[styles.sheet, { top: sheetTop }]}>
          {/* Drag handle */}
          <View style={styles.sheetHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + 24 }]}
          >
            {/* Header row */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.plantName}>{result.plant_name}</Text>
                <Text style={styles.scientificName}>{result.scientific_name}</Text>
              </View>
              <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => router.back()}>
                <Ionicons name="close" size={18} color="#555" />
              </TouchableOpacity>
            </View>

            {/* Confidence badge */}
            <View style={styles.confBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#2D6A2D" />
              <Text style={styles.confText}>{Math.round(result.confidence * 100)}% match</Text>
            </View>

            {/* Illustration grid */}
            <View style={styles.illustGrid}>
              {/* Large illustration tile */}
              <View style={styles.illustMain}>
                <Image source={illustration} style={styles.illustMainImg} contentFit="contain" />
              </View>

              {/* Right column — water & light info tiles */}
              <View style={styles.illustCol}>
                <View style={styles.illustTile}>
                  <Ionicons name="water-outline" size={28} color="#2D6A2D" />
                  <Text style={styles.illustTileLabel}>Every {result.watering_frequency_days}d</Text>
                </View>
                <View style={styles.illustTile}>
                  <Ionicons name="sunny-outline" size={28} color="#2D6A2D" />
                  <Text style={styles.illustTileLabel}>{result.light_requirement.split(' ').slice(0, 2).join(' ')}</Text>
                </View>
              </View>
            </View>

            {/* Care chips */}
            <View style={styles.careChips}>
              <View style={styles.careChip}>
                <Text style={styles.careChipLabel}>Light</Text>
                <Text style={styles.careChipValue}>{result.light_requirement.split(' ').slice(0, 2).join(' ')}</Text>
              </View>
              <View style={styles.careChip}>
                <Text style={styles.careChipLabel}>Water</Text>
                <Text style={styles.careChipValue}>Every {result.watering_frequency_days}d</Text>
              </View>
              <View style={styles.careChip}>
                <Text style={styles.careChipLabel}>Care</Text>
                <Text style={styles.careChipValue}>{result.fertilizer_schedule.split(' ')[0]}</Text>
              </View>
            </View>

            {/* Add to garden CTA */}
            <TouchableOpacity style={styles.addBtn} onPress={confirmSave} activeOpacity={0.88}>
              <Text style={styles.addBtnText}>Add to My Garden</Text>
            </TouchableOpacity>

            {/* Secondary action */}
            <TouchableOpacity onPress={reset} activeOpacity={0.7}>
              <Text style={styles.tryAgainText}>View other results</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    )
  }

  // Preview state
  if (state === 'preview' && photoUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
            <Text style={styles.secondaryBtnText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={identifyPhoto}>
            <Text style={styles.primaryBtnText}>Identify Plant</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Camera state (default)
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>
      <View style={styles.cameraActions}>
        <TouchableOpacity style={styles.libraryBtn} onPress={pickFromLibrary}>
          <Text style={styles.libraryBtnText}>Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
          <View style={styles.captureBtnInner} />
        </TouchableOpacity>
        <View style={{ width: 70 }} />
      </View>
      <Text style={styles.cameraHint}>Point at a plant to identify it</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f9fbe7',
  },
  permissionIcon: { fontSize: 64, marginBottom: 20 },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: '#1b5e20', marginBottom: 10 },
  permissionText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  closeBtn: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  cameraActions: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  libraryBtn: {
    width: 70,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  libraryBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  cameraHint: {
    position: 'absolute',
    bottom: 160,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  identifyingText: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  identifyingSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  previewActions: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  errorBanner: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 12,
  },
  errorText: { color: '#fff', fontSize: 14, textAlign: 'center' },

  // ── Bottom sheet result ──────────────────────────────────────────────────
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D8D8D0',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  plantName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.5,
  },
  scientificName: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#888',
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFEFEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginTop: 4,
  },
  confBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF4EA',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  confText: {
    fontSize: 12,
    color: '#2D6A2D',
    fontWeight: '600',
  },

  // Illustration grid
  illustGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  illustMain: {
    flex: 3,
    backgroundColor: '#F2F2EE',
    borderRadius: 18,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  illustMainImg: {
    width: '85%',
    height: '85%',
  },
  illustCol: {
    flex: 2,
    gap: 10,
  },
  illustTile: {
    flex: 1,
    backgroundColor: '#F2F2EE',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  illustTileLabel: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  // Care chips
  careChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  careChip: {
    flex: 1,
    backgroundColor: '#F2F2EE',
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
  },
  careChipLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  careChipValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },

  // CTA
  addBtn: {
    backgroundColor: '#2D4A2D',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  tryAgainText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    paddingBottom: 4,
  },

  // Kept for preview state buttons
  primaryBtn: {
    backgroundColor: '#4caf50',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    flex: 1,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    flex: 1,
  },
  secondaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
