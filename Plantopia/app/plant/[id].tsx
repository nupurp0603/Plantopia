import React from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { fetchPlantById } from '@/services/plantService'
import CareGuide from '@/components/CareGuide'
import { supabase } from '@/services/supabaseClient'
import { formatDueDate } from '@/services/reminderService'

// ── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days   = Math.floor(diff / 86400000)
  const weeks  = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  if (diff < 3600000)  return 'Just now'
  if (days < 1)        return `${Math.floor(diff / 3600000)}h ago`
  if (days < 7)        return `${days} day${days !== 1 ? 's' : ''} ago`
  if (weeks < 4)       return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  return `${months} month${months !== 1 ? 's' : ''} ago`
}

function taskLabel(type: string) {
  return { water: 'Watered', fertilize: 'Fertilized', repot: 'Repotted', rotate: 'Rotated' }[type] ?? type
}

function parseProblem(raw: string) {
  const ci = raw.indexOf(':'), di = raw.indexOf(' - ')
  if (ci > 0) return { name: raw.slice(0, ci).trim(), desc: raw.slice(ci + 1).trim() }
  if (di > 0) return { name: raw.slice(0, di).trim(), desc: raw.slice(di + 3).trim() }
  return { name: raw.trim(), desc: '' }
}

// ── screen ───────────────────────────────────────────────────────────────────

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: plant, isLoading } = useQuery({
    queryKey: ['plant', id],
    queryFn: () => fetchPlantById(id),
    enabled: !!id,
  })

  const { data: nextWaterTask } = useQuery({
    queryKey: ['next-water', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks').select('*')
        .eq('plant_id', id).eq('task_type', 'water').eq('completed', false)
        .order('due_date', { ascending: true }).limit(1).single()
      return data
    },
    enabled: !!id,
  })

  const { data: history } = useQuery({
    queryKey: ['plant-history', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks').select('*')
        .eq('plant_id', id).eq('completed', true)
        .order('created_at', { ascending: false }).limit(10)
      return data ?? []
    },
    enabled: !!id,
  })

  const waterMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user.id || !id) return
      if (nextWaterTask) {
        await supabase.from('tasks').update({ completed: true }).eq('id', nextWaterTask.id)
      }
      await supabase.from('tasks').insert({
        plant_id: id, user_id: session.user.id, task_type: 'water',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        completed: false,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['next-water', id] })
      queryClient.invalidateQueries({ queryKey: ['plant-history', id] })
      Alert.alert('Done!', 'Plant watered.')
    },
  })

  const fertilizeMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user.id || !id) return
      await supabase.from('tasks').insert({
        plant_id: id, user_id: session.user.id, task_type: 'fertilize',
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        completed: true,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['plant-history', id] })
      Alert.alert('Done!', 'Plant fertilized.')
    },
  })

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#2D4A2D" />
      </View>
    )
  }

  if (!plant) {
    return (
      <View style={s.center}>
        <Text style={s.notFound}>Plant not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const problems: string[] = plant.plant_care?.common_problems ?? []

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={s.screen}>
        {/* ── Nav bar ── */}
        <View style={s.nav}>
          <TouchableOpacity style={s.navBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={s.navBtn}>
            <Ionicons name="pencil-outline" size={20} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* ── Hero ── */}
          <View style={s.heroRow}>
            {/* Plant image / placeholder */}
            {plant.image_url ? (
              <Image source={{ uri: plant.image_url }} style={s.heroImg} contentFit="cover" />
            ) : (
              <View style={s.heroPlaceholder}>
                <Ionicons name="leaf" size={44} color="#3D5A3E" />
              </View>
            )}

            {/* Info block */}
            <View style={s.heroInfo}>
              <Text style={s.plantName}>{plant.plant_name}</Text>
              <Text style={s.sciName}>{plant.scientific_name}</Text>
              <View style={s.healthPill}>
                <Text style={s.healthText}>🌿 Healthy</Text>
              </View>
            </View>
          </View>

          {/* ── Action bar ── */}
          <View style={s.actionBar}>
            {/* Left: watering info */}
            <View style={s.waterInfo}>
              <View style={s.waterIconWrap}>
                <Ionicons name="water-outline" size={26} color="rgba(255,255,255,0.75)" />
              </View>
              <View>
                <Text style={s.waterLabel}>Next watering</Text>
                <Text style={s.waterValue}>
                  {nextWaterTask ? formatDueDate(nextWaterTask.due_date) : 'Not scheduled'}
                </Text>
              </View>
            </View>

            {/* Right: action buttons */}
            <View style={s.actionBtns}>
              <TouchableOpacity
                style={s.waterNowBtn}
                onPress={() => waterMutation.mutate()}
                disabled={waterMutation.isPending}
              >
                {waterMutation.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.waterNowTxt}>Water now</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={s.fertilizeBtn}
                onPress={() => fertilizeMutation.mutate()}
                disabled={fertilizeMutation.isPending}
              >
                {fertilizeMutation.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.fertilizeTxt}>Fertilize</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Care Guide ── */}
          {plant.plant_care && <CareGuide care={plant.plant_care} />}

          {/* ── Common Problems ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardHeaderIcon}>🐛</Text>
              <Text style={s.cardTitle}>Common Problems</Text>
            </View>

            {problems.length === 0 ? (
              <Text style={s.empty}>No known issues.</Text>
            ) : (
              problems.map((raw, i) => {
                const { name, desc } = parseProblem(raw)
                return (
                  <View key={i} style={s.problemPill}>
                    <Text style={s.warnIcon}>⚠️</Text>
                    <View style={s.problemTxt}>
                      <Text style={s.problemName}>{name}</Text>
                      {desc ? <Text style={s.problemDesc}>{desc}</Text> : null}
                    </View>
                  </View>
                )
              })
            )}
          </View>

          {/* ── Plant History ── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.historyIconCircle}>
                <Ionicons name="time-outline" size={18} color="#3D5A3E" />
              </View>
              <Text style={s.cardTitle}>Plant History</Text>
            </View>

            {!history || history.length === 0 ? (
              <Text style={s.empty}>No care history yet.</Text>
            ) : (
              history.map((t, i) => (
                <View key={t.id} style={[s.histRow, i < history.length - 1 && s.histDivider]}>
                  <Text style={s.histLabel}>{taskLabel(t.task_type)}</Text>
                  <Text style={s.histTime}>{timeAgo(t.created_at)}</Text>
                </View>
              ))
            )}
          </View>

        </ScrollView>
      </View>
    </>
  )
}

// ── styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEAE3' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDEAE3' },
  notFound: { fontSize: 16, color: '#666', marginBottom: 12 },
  backLink:  { fontSize: 15, color: '#2D4A2D', fontWeight: '600' },

  // Nav
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 14,
  },
  navBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.09, shadowRadius: 4, elevation: 2,
  },

  scroll: { paddingBottom: 48 },

  // Hero
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 18,
    gap: 16,
  },
  heroImg: {
    width: 112, height: 112, borderRadius: 18,
    backgroundColor: '#D4D8D0',
  },
  heroPlaceholder: {
    width: 112, height: 112, borderRadius: 18,
    backgroundColor: '#D4D8D0',
    alignItems: 'center', justifyContent: 'center',
  },
  heroInfo: { flex: 1, paddingTop: 4 },
  plantName: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 4, lineHeight: 30 },
  sciName:   { fontSize: 14, fontStyle: 'italic', color: '#888', marginBottom: 12 },
  healthPill: {
    alignSelf: 'flex-start',
    borderWidth: 1.5, borderColor: '#AABFAA',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  healthText: { fontSize: 13, color: '#3D5A3E', fontWeight: '600' },

  // Action bar
  actionBar: {
    backgroundColor: '#2D4A2D',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  waterInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  waterIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  waterLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  waterValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  actionBtns: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  waterNowBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
  },
  waterNowTxt: { color: '#fff', fontWeight: '600', fontSize: 13 },
  fertilizeBtn: {
    borderWidth: 1.5, borderColor: '#fff',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9,
  },
  fertilizeTxt: { color: '#fff', fontWeight: '600', fontSize: 13 },

  // Shared card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 16,
  },
  cardHeaderIcon: { fontSize: 22 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  empty: { fontSize: 14, color: '#aaa' },

  // Problems
  problemPill: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#F2F0EA',
    borderRadius: 14, padding: 14, marginBottom: 10, gap: 10,
  },
  warnIcon:    { fontSize: 18, marginTop: 1 },
  problemTxt:  { flex: 1 },
  problemName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  problemDesc: { fontSize: 13, color: '#888', lineHeight: 18 },

  // History
  historyIconCircle: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, borderColor: '#3D5A3E',
    alignItems: 'center', justifyContent: 'center',
  },
  histRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14,
  },
  histDivider: { borderBottomWidth: 1, borderBottomColor: '#F0EFEA' },
  histLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  histTime:  { fontSize: 14, color: '#999' },
})
