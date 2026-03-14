import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabaseClient'
import { uploadPlantImage, savePlant } from '@/services/visionService'
import { identifyPlant } from '@/services/aiService'
import type { PlantIdentificationResult } from '@/types/database'

type ScanState = 'camera' | 'preview' | 'identifying' | 'result' | 'saving'

export default function ScanScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
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

  // Permission not granted
  if (!permission) return <View style={styles.container} />

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

  // Result state
  if (state === 'result' && result) {
    return (
      <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.resultImage} contentFit="cover" />
        )}

        <View style={styles.resultCard}>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {Math.round(result.confidence * 100)}% confident
            </Text>
          </View>
          <Text style={styles.resultName}>{result.plant_name}</Text>
          <Text style={styles.resultScientific}>{result.scientific_name}</Text>
          <Text style={styles.resultDescription}>{result.description}</Text>

          <View style={styles.careRow}>
            <View style={styles.careTile}>
              <Text style={styles.careTileIcon}>💧</Text>
              <Text style={styles.careTileLabel}>Every {result.watering_frequency_days}d</Text>
            </View>
            <View style={styles.careTile}>
              <Text style={styles.careTileIcon}>☀️</Text>
              <Text style={styles.careTileLabel}>{result.light_requirement.split(' ')[0]}</Text>
            </View>
            <View style={styles.careTile}>
              <Text style={styles.careTileIcon}>🌱</Text>
              <Text style={styles.careTileLabel}>{result.fertilizer_schedule.split(' ')[0]}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={confirmSave}>
            <Text style={styles.primaryBtnText}>Add to My Garden</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
            <Text style={styles.secondaryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  resultContainer: { flex: 1, backgroundColor: '#f9fbe7' },
  resultContent: { paddingBottom: 40 },
  resultImage: { width: '100%', height: 280 },
  resultCard: { padding: 20 },
  confidenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  confidenceText: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  resultName: { fontSize: 26, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  resultScientific: { fontSize: 16, fontStyle: 'italic', color: '#666', marginBottom: 12 },
  resultDescription: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 20 },
  careRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  careTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  careTileIcon: { fontSize: 24, marginBottom: 4 },
  careTileLabel: { fontSize: 11, color: '#555', textAlign: 'center', fontWeight: '500' },
  primaryBtn: {
    backgroundColor: '#4caf50',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
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
