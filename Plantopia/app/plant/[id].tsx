import React from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle, Text as SvgText } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fetchPlantById } from '@/services/plantService'
import { supabase } from '@/services/supabaseClient'
import { formatDueDate } from '@/services/reminderService'
import type { PlantCare } from '@/types/database'

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
  if (months < 1)      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
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

function waterPercent(dueDate: string | undefined): number {
  if (!dueDate) return 85
  const diff = new Date(dueDate).getTime() - Date.now()
  if (diff < 0)             return 20
  if (diff < 86400000)      return 40
  if (diff < 86400000 * 3)  return 60
  if (diff < 86400000 * 7)  return 75
  return 90
}

function fertPercent(history: { task_type: string; created_at: string }[]): number {
  const lastFert = history.find((t) => t.task_type === 'fertilize')
  if (!lastFert) return 30
  const days = (Date.now() - new Date(lastFert.created_at).getTime()) / 86400000
  if (days < 14) return 85
  if (days < 28) return 60
  return 35
}

// ── Plant illustration ────────────────────────────────────────────────────────

function getPlantImage(name: string) {
  const n = name.toLowerCase()
  if (n.includes('cactus') || n.includes('succulent') || n.includes('aloe') || n.includes('agave'))
    return require('@/assets/images-new/plant-cactus.png')
  if (n.includes('fern') || n.includes('pine') || n.includes('spruce') || n.includes('bamboo'))
    return require('@/assets/images-new/plant-fern.png')
  if (n.includes('lily') || n.includes('orchid') || n.includes('rose') || n.includes('tulip') ||
      n.includes('flower') || n.includes('daisy') || n.includes('lavender') || n.includes('sunflower'))
    return require('@/assets/images-new/plant-flowering.png')
  if (n.includes('hanging') || n.includes('pothos') || n.includes('ivy') || n.includes('tradescantia'))
    return require('@/assets/images-new/plant-hanging.png')
  return require('@/assets/images-new/plant-leafy.png')
}

// ── Status ring with centered % ───────────────────────────────────────────────

const RING_R = 28
const RING_C = 36
const CIRCUMFERENCE = 2 * Math.PI * RING_R

function StatusRing({ percent }: { percent: number }) {
  const filled = CIRCUMFERENCE * (percent / 100)
  return (
    <Svg width={72} height={72} viewBox="0 0 72 72">
      {/* Track */}
      <Circle cx={RING_C} cy={RING_C} r={RING_R} stroke="#E0DEDA" strokeWidth={5} fill="none" />
      {/* Progress arc */}
      <Circle
        cx={RING_C} cy={RING_C} r={RING_R}
        stroke="#D94040" strokeWidth={5} fill="none"
        strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
        strokeLinecap="round"
        rotation={-90}
        origin={`${RING_C},${RING_C}`}
      />
      {/* Centered percentage label */}
      <SvgText
        x={RING_C} y={RING_C + 5}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#1A1A1A"
      >
        {`${percent}%`}
      </SvgText>
    </Svg>
  )
}

// ── Status card ───────────────────────────────────────────────────────────────

function StatusCard({
  title, subtitle, percent, onPress, loading,
}: {
  title: string; subtitle: string; percent: number
  onPress: () => void; loading: boolean
}) {
  return (
    <TouchableOpacity style={st.card} onPress={onPress} activeOpacity={0.8} disabled={loading}>
      <Text style={st.title}>{title}</Text>
      <Text style={st.subtitle}>{subtitle}</Text>
      <View style={st.ringWrap}>
        {loading
          ? <ActivityIndicator size="small" color="#D94040" />
          : <StatusRing percent={percent} />
        }
      </View>
    </TouchableOpacity>
  )
}

const st = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  title:    { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#7A8A72', marginBottom: 12 },
  ringWrap: { alignItems: 'flex-end' },
})

// ── Growth method card ────────────────────────────────────────────────────────

function GrowthCard({
  icon, title, subtitle, bg,
}: {
  icon: ReturnType<typeof require>; title: string; subtitle: string; bg: string
}) {
  return (
    <View style={[gw.card, { backgroundColor: bg }]}>
      <Image source={icon} style={gw.icon} contentFit="contain" />
      <View style={gw.text}>
        <Text style={gw.title}>{title}</Text>
        <Text style={gw.sub}>{subtitle}</Text>
      </View>
      <View style={gw.arrow}>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </View>
  )
}

const gw = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.70)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  icon:  { width: 52, height: 52 },
  text:  { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  sub:   { fontSize: 13, color: '#7A8A72' },
  arrow: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
})

// ── Inline Care Guide ─────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

const CARE_ROWS: {
  key: 'water' | 'light' | 'soil' | 'fertilizer'
  icon: IoniconName
  iconColor: string
  iconBg: string
  label: string
}[] = [
  { key: 'water',      icon: 'water-outline',     iconColor: '#4A90D9', iconBg: '#E8F3FC', label: 'Water'      },
  { key: 'light',      icon: 'sunny-outline',      iconColor: '#E0A030', iconBg: '#FEF4E4', label: 'Light'      },
  { key: 'soil',       icon: 'leaf-outline',       iconColor: '#4A8A30', iconBg: '#EAF3E8', label: 'Soil'       },
  { key: 'fertilizer', icon: 'refresh-circle-outline', iconColor: '#6A8ABA', iconBg: '#E8EDF5', label: 'Fertilizer' },
]

function InlineCareGuide({ care }: { care: PlantCare }) {
  const values: Record<string, string> = {
    water:      `Every ${care.watering_frequency_days} days`,
    light:      care.light_requirement,
    soil:       care.care_instructions?.soil ?? '',
    fertilizer: care.fertilizer_schedule,
  }

  const rows = CARE_ROWS.filter((r) => values[r.key])

  return (
    <View style={cg.card}>
      {rows.map((row, i) => (
        <View key={row.key}>
          <View style={cg.row}>
            <View style={[cg.iconCircle, { backgroundColor: row.iconBg }]}>
              <Ionicons name={row.icon} size={22} color={row.iconColor} />
            </View>
            <View style={cg.detail}>
              <Text style={cg.label}>{row.label}</Text>
              <Text style={cg.value}>{values[row.key]}</Text>
            </View>
          </View>
          {i < rows.length - 1 && <View style={cg.divider} />}
        </View>
      ))}
    </View>
  )
}

const cg = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  row:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  iconCircle: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  detail:   { flex: 1 },
  label:    { fontSize: 12, color: '#9A9A90', marginBottom: 3 },
  value:    { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  divider:  { height: 1, backgroundColor: '#F0EFEA', marginLeft: 60 },
})

// ── Recent Activity card ──────────────────────────────────────────────────────

function RecentActivity({ history }: { history: { id: string; task_type: string; created_at: string }[] }) {
  return (
    <View style={ra.card}>
      <View style={ra.header}>
        <View style={ra.clockCircle}>
          <Ionicons name="time-outline" size={16} color="#4A8A30" />
        </View>
        <Text style={ra.heading}>Recent Activity</Text>
      </View>
      {history.length === 0 ? (
        <Text style={ra.empty}>No care history yet.</Text>
      ) : (
        history.map((t, i) => (
          <View key={t.id} style={[ra.row, i < history.length - 1 && ra.divider]}>
            <Text style={ra.label}>{taskLabel(t.task_type)}</Text>
            <Text style={ra.time}>{timeAgo(t.created_at)}</Text>
          </View>
        ))
      )}
    </View>
  )
}

const ra = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  clockCircle: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#4A8A30',
    alignItems: 'center', justifyContent: 'center',
  },
  heading:  { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  empty:    { fontSize: 14, color: '#aaa', paddingBottom: 12 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14,
  },
  divider:  { borderBottomWidth: 1, borderBottomColor: '#F0EFEA' },
  label:    { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  time:     { fontSize: 14, color: '#999' },
})

// ── screen ───────────────────────────────────────────────────────────────────

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()

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
        .order('due_date', { ascending: true }).limit(1).maybeSingle()
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
      if (!session?.user.id || !id) throw new Error('Not signed in')
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
    onError: (error: Error) => Alert.alert('Error', error.message),
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
  const wPct = waterPercent(nextWaterTask?.due_date)
  const fPct = fertPercent(history ?? [])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={s.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16, paddingBottom: 24 }]}
        >

          {/* ── Header ── */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
            </TouchableOpacity>
            <Image
              source={require('@/assets/images-new/plant-hanging.png')}
              style={s.hangingPlant}
              contentFit="contain"
            />
          </View>

          <Text style={s.pageTitle}>Plant Detail</Text>
          <Text style={s.plantName}>{plant.plant_name}</Text>
          {!!plant.scientific_name && (
            <Text style={s.sciName}>{plant.scientific_name}</Text>
          )}

          {/* ── Status cards ── */}
          <View style={s.statusRow}>
            <StatusCard
              title="Water"
              subtitle={nextWaterTask ? `Due ${formatDueDate(nextWaterTask.due_date)}` : 'Needs water'}
              percent={wPct}
              onPress={() => waterMutation.mutate()}
              loading={waterMutation.isPending}
            />
            <StatusCard
              title="Fertilizer"
              subtitle="Needs fertilizer"
              percent={fPct}
              onPress={() => fertilizeMutation.mutate()}
              loading={fertilizeMutation.isPending}
            />
          </View>

          {/* ── Plant illustration (always uses images-new assets) ── */}
          <View style={s.illustrationWrap}>
            <Image
              source={getPlantImage(plant.plant_name)}
              style={s.plantIllustration}
              contentFit="contain"
            />
          </View>

          {/* ── Growth of Plant ── */}
          <Text style={s.growthTitle}>Growth of Plant</Text>
          <Text style={s.growthSub}>Which method do you want to choose?</Text>
          <GrowthCard
            icon={require('@/assets/images-new/icon-soil-growing.png')}
            title="Soil Growing"
            subtitle="The best potting mix to use"
            bg="#FFFDF7"
          />
          <GrowthCard
            icon={require('@/assets/images-new/icon-coco-growing.png')}
            title="Coco Growing"
            subtitle="Can be purchased loose"
            bg="#EDE9E0"
          />

          {/* ── Care Guide ── */}
          <Text style={s.sectionHeading}>Care Guide</Text>
          {plant.plant_care && <InlineCareGuide care={plant.plant_care} />}

          {/* ── Recent Activity ── */}
          <RecentActivity history={history ?? []} />

          {/* ── Common Problems ── */}
          {problems.length > 0 && (
            <>
              <Text style={s.sectionHeading}>Common Problems</Text>
              {problems.map((raw, i) => {
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
              })}
            </>
          )}

        </ScrollView>

        {/* ── Sticky bottom bar ── */}
        <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={s.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.scanBtn}
            onPress={() => router.push('/scan')}
            activeOpacity={0.85}
          >
            <Text style={s.scanTxt}>Scan Now</Text>
          </TouchableOpacity>
        </View>
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
  scroll:    { paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.70)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  hangingPlant: { width: 80, height: 100, marginTop: -12 },

  pageTitle: { fontSize: 32, fontWeight: '800', color: '#1C3A1C', marginBottom: 4 },
  plantName: { fontSize: 18, fontWeight: '600', color: '#3D5A3E', marginBottom: 2 },
  sciName:   { fontSize: 14, fontStyle: 'italic', color: '#9A9A90', marginBottom: 20 },

  // Status
  statusRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },

  // Illustration
  illustrationWrap: { alignItems: 'center', marginBottom: 28 },
  plantIllustration: { width: 180, height: 200 },

  // Growth
  growthTitle: { fontSize: 22, fontWeight: '800', color: '#1C3A1C', marginBottom: 4 },
  growthSub:   { fontSize: 14, color: '#7A8A72', marginBottom: 16 },

  // Section heading
  sectionHeading: {
    fontSize: 20, fontWeight: '800', color: '#1C3A1C',
    marginBottom: 12, marginTop: 4,
  },

  // Problems
  problemPill: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.70)', borderRadius: 14,
    padding: 14, marginBottom: 10, gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)',
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  warnIcon:    { fontSize: 18, marginTop: 1 },
  problemTxt:  { flex: 1 },
  problemName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  problemDesc: { fontSize: 13, color: '#888', lineHeight: 18 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: '#EDEAE3',
    borderTopWidth: 1,
    borderTopColor: '#E0DDD5',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  cancelTxt: { fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  scanBtn: {
    flex: 1,
    backgroundColor: '#A8D5A2',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  scanTxt: { fontSize: 16, fontWeight: '700', color: '#1A3A1A' },
})
