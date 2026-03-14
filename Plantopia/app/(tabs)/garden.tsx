import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Svg, { Circle, Rect, G, Text as SvgText } from 'react-native-svg'
import { usePlants, type PlantWithCare } from '@/hooks/usePlants'
import { useTasks } from '@/hooks/useTasks'
import GardenGrid from '@/components/garden/GardenGrid'
import PlantIcon from '@/components/garden/PlantIcon'

// ── Analytics helpers ──────────────────────────────────────────────────────

function countNeedingWater(plants: PlantWithCare[], tasks: ReturnType<typeof useTasks>['tasks']): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return plants.filter((p) => {
    const t = tasks.find((t) => t.plant_id === p.id && t.task_type === 'water' && !t.completed)
    if (!t) return false
    return new Date(t.due_date) <= today
  }).length
}

function countHealthy(plants: PlantWithCare[], tasks: ReturnType<typeof useTasks>['tasks']): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return plants.filter((p) => {
    const t = tasks.find((t) => t.plant_id === p.id && t.task_type === 'water' && !t.completed)
    if (!t) return true
    return new Date(t.due_date) > today
  }).length
}

function getTypeBreakdown(plants: PlantWithCare[]): { label: string; count: number; color: string }[] {
  const map: Record<string, number> = {}
  for (const p of plants) {
    const n = p.plant_name.toLowerCase()
    let type = 'Other'
    if (n.includes('cactus') || n.includes('succulent') || n.includes('aloe')) type = 'Cactus'
    else if (n.includes('fern') || n.includes('palm')) type = 'Fern'
    else if (n.includes('monstera') || n.includes('philodendron')) type = 'Monstera'
    else if (n.includes('snake') || n.includes('sansevieria')) type = 'Snake'
    else if (n.includes('pothos') || n.includes('ivy')) type = 'Pothos'
    else type = 'Other'
    map[type] = (map[type] ?? 0) + 1
  }
  const colors = ['#5A9A38', '#4A90D9', '#E0A030', '#9A6ABE', '#E05252', '#4ABAB0']
  return Object.entries(map).map(([label, count], i) => ({
    label,
    count,
    color: colors[i % colors.length],
  }))
}

// ── Mini bar chart ─────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; count: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const BAR_MAX_H = 60
  const BAR_W = 36
  const CHART_W = data.length * (BAR_W + 12)
  const CHART_H = BAR_MAX_H + 30

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={Math.max(CHART_W, 200)} height={CHART_H}>
        {data.map((d, i) => {
          const barH = Math.max(4, (d.count / max) * BAR_MAX_H)
          const x = i * (BAR_W + 12)
          const y = BAR_MAX_H - barH
          return (
            <G key={d.label} x={x}>
              <Rect x={0} y={y} width={BAR_W} height={barH} rx={6} fill={d.color} opacity={0.85} />
              <SvgText x={BAR_W / 2} y={BAR_MAX_H + 14} fontSize={9} fill="#888" textAnchor="middle">
                {d.label}
              </SvgText>
              <SvgText x={BAR_W / 2} y={y - 4} fontSize={10} fill={d.color} textAnchor="middle" fontWeight="bold">
                {d.count}
              </SvgText>
            </G>
          )
        })}
      </Svg>
    </ScrollView>
  )
}

// ── Donut chart ────────────────────────────────────────────────────────────

function DonutChart({
  healthy,
  total,
}: {
  healthy: number
  total: number
}) {
  const R = 38
  const C = 50
  const CIRC = 2 * Math.PI * R
  const pct = total === 0 ? 0 : healthy / total
  const filled = CIRC * pct

  return (
    <Svg width={100} height={100}>
      <Circle cx={C} cy={C} r={R} stroke="#E8E8E0" strokeWidth={10} fill="none" />
      <Circle
        cx={C} cy={C} r={R}
        stroke="#5A9A38" strokeWidth={10}
        fill="none"
        strokeDasharray={`${filled} ${CIRC - filled}`}
        strokeLinecap="round"
        rotation={-90}
        origin={`${C},${C}`}
      />
      <SvgText x={C} y={C - 6} fontSize={18} fontWeight="bold" fill="#1A1A1A" textAnchor="middle">
        {total === 0 ? '—' : Math.round(pct * 100)}
      </SvgText>
      <SvgText x={C} y={C + 10} fontSize={9} fill="#888" textAnchor="middle">
        {total === 0 ? '' : '%'}
      </SvgText>
    </Svg>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconColor,
  iconBg,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBg: string
  value: string | number
  label: string
}) {
  return (
    <View style={sc.card}>
      <View style={[sc.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  )
}

const sc = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  label: { fontSize: 11, color: '#9A9A90', textAlign: 'center' },
})

// ── Plant detail modal ─────────────────────────────────────────────────────

function PlantModal({
  plant,
  onClose,
}: {
  plant: PlantWithCare | null
  onClose: () => void
}) {
  if (!plant) return null
  const care = plant.plant_care
  const light = care?.light_requirement?.split(' ').slice(0, 3).join(' ')

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modal.backdrop} />
      </TouchableWithoutFeedback>
      <View style={modal.sheet}>
        <View style={modal.handle} />
        <View style={modal.illustBox}>
          <PlantIcon plantName={plant.plant_name} size={90} animate />
        </View>
        <View style={modal.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={modal.name}>{plant.plant_name}</Text>
            <Text style={modal.sci}>{plant.scientific_name}</Text>
          </View>
          <TouchableOpacity style={modal.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color="#555" />
          </TouchableOpacity>
        </View>
        <View style={modal.healthRow}>
          <View style={[modal.healthDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={modal.healthText}>Healthy</Text>
        </View>
        <View style={modal.statsRow}>
          <View style={modal.statChip}>
            <Ionicons name="water-outline" size={16} color="#4A90D9" />
            <Text style={modal.statLabel}>{care?.watering_frequency_days ? `Every ${care.watering_frequency_days}d` : '—'}</Text>
          </View>
          <View style={modal.statChip}>
            <Ionicons name="sunny-outline" size={16} color="#E0A030" />
            <Text style={modal.statLabel}>{light ?? '—'}</Text>
          </View>
          <View style={modal.statChip}>
            <Ionicons name="leaf-outline" size={16} color="#5A9A38" />
            <Text style={modal.statLabel}>{care?.fertilizer_schedule?.split(' ')[0] ?? '—'}</Text>
          </View>
        </View>
        {plant.description ? (
          <Text style={modal.desc} numberOfLines={3}>{plant.description}</Text>
        ) : null}
      </View>
    </Modal>
  )
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function MyGardenScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { plants, isLoading } = usePlants()
  const { tasks } = useTasks()
  const [selected, setSelected] = useState<PlantWithCare | null>(null)

  const totalPlants = plants.length
  const needingWater = useMemo(() => countNeedingWater(plants, tasks), [plants, tasks])
  const healthy = useMemo(() => countHealthy(plants, tasks), [plants, tasks])
  const typeBreakdown = useMemo(() => getTypeBreakdown(plants), [plants])

  // Oldest plant
  const oldestPlant = useMemo(() => {
    if (plants.length === 0) return null
    return plants.reduce((a, b) =>
      new Date(a.created_at) < new Date(b.created_at) ? a : b
    )
  }, [plants])

  const daysOldest = oldestPlant
    ? Math.floor((Date.now() - new Date(oldestPlant.created_at).getTime()) / 86400000)
    : 0

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.title}>My Garden</Text>
          <Text style={styles.subtitle}>{totalPlants} plant{totalPlants !== 1 ? 's' : ''} growing</Text>
        </View>
        <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/scan')} activeOpacity={0.85}>
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={styles.scanBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Garden grid */}
        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#3D5A3E" />
          </View>
        ) : plants.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Your garden is empty</Text>
            <Text style={styles.emptySub}>Scan a plant to add it to your garden</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/scan')}>
              <Text style={styles.emptyBtnText}>Scan a Plant</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Grid */}
            <View style={styles.gridWrapper}>
              <GardenGrid plants={plants} onPlantPress={setSelected} />
            </View>

            <View style={styles.gridHint}>
              <Ionicons name="hand-left-outline" size={12} color="#9A9A90" />
              <Text style={styles.gridHintText}>Tap a plant to inspect it</Text>
            </View>

            {/* ── Analytics ── */}
            <Text style={styles.sectionTitle}>Garden Analytics</Text>

            {/* Stat row */}
            <View style={styles.statRow}>
              <StatCard icon="leaf" iconColor="#5A9A38" iconBg="#EAF4EA" value={totalPlants} label="Total Plants" />
              <View style={{ width: 10 }} />
              <StatCard icon="water" iconColor="#4A90D9" iconBg="#E8F0FA" value={needingWater} label="Need Water" />
              <View style={{ width: 10 }} />
              <StatCard icon="heart" iconColor="#E05252" iconBg="#FAE8E8" value={healthy} label="Healthy" />
            </View>

            {/* Health donut + oldest plant */}
            <View style={styles.analyticsRow}>
              {/* Health score card */}
              <View style={[styles.analyticsCard, { flex: 1 }]}>
                <Text style={styles.analyticsCardTitle}>Garden Health</Text>
                <View style={{ alignItems: 'center', marginTop: 4 }}>
                  <DonutChart healthy={healthy} total={totalPlants} />
                </View>
                <Text style={styles.analyticsCardSub}>
                  {healthy} of {totalPlants} plant{totalPlants !== 1 ? 's' : ''} healthy
                </Text>
              </View>

              <View style={{ width: 10 }} />

              {/* Oldest plant card */}
              <View style={[styles.analyticsCard, { flex: 1 }]}>
                <Text style={styles.analyticsCardTitle}>Longest Growing</Text>
                {oldestPlant ? (
                  <>
                    <View style={styles.oldestPlantIcon}>
                      <PlantIcon plantName={oldestPlant.plant_name} size={54} animate={false} />
                    </View>
                    <Text style={styles.oldestPlantName} numberOfLines={1}>{oldestPlant.plant_name}</Text>
                    <View style={styles.daysBadge}>
                      <Text style={styles.daysBadgeText}>{daysOldest}d in garden</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.analyticsCardSub}>—</Text>
                )}
              </View>
            </View>

            {/* Type breakdown bar chart */}
            {typeBreakdown.length > 0 && (
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsCardTitle}>Plant Types</Text>
                <View style={{ marginTop: 12 }}>
                  <BarChart data={typeBreakdown} />
                </View>
                {/* Legend dots */}
                <View style={styles.chartLegend}>
                  {typeBreakdown.map((d) => (
                    <View key={d.label} style={styles.chartLegendItem}>
                      <View style={[styles.chartLegendDot, { backgroundColor: d.color }]} />
                      <Text style={styles.chartLegendText}>{d.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Care summary */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsCardTitle}>Care Overview</Text>
              <View style={styles.careOverviewRows}>
                <View style={styles.careOverviewRow}>
                  <View style={styles.careOverviewLeft}>
                    <View style={[styles.careOverviewIcon, { backgroundColor: '#E8F0FA' }]}>
                      <Ionicons name="checkmark-done-outline" size={16} color="#4A90D9" />
                    </View>
                    <Text style={styles.careOverviewLabel}>Up to date</Text>
                  </View>
                  <Text style={styles.careOverviewValue}>{healthy} plants</Text>
                </View>
                <View style={styles.careOverviewDivider} />
                <View style={styles.careOverviewRow}>
                  <View style={styles.careOverviewLeft}>
                    <View style={[styles.careOverviewIcon, { backgroundColor: '#FFF3E0' }]}>
                      <Ionicons name="water-outline" size={16} color="#E0A030" />
                    </View>
                    <Text style={styles.careOverviewLabel}>Needs watering</Text>
                  </View>
                  <Text style={[styles.careOverviewValue, needingWater > 0 && { color: '#E05252' }]}>
                    {needingWater} plants
                  </Text>
                </View>
                <View style={styles.careOverviewDivider} />
                <View style={styles.careOverviewRow}>
                  <View style={styles.careOverviewLeft}>
                    <View style={[styles.careOverviewIcon, { backgroundColor: '#EAF4EA' }]}>
                      <Ionicons name="calendar-outline" size={16} color="#5A9A38" />
                    </View>
                    <Text style={styles.careOverviewLabel}>Days tracked</Text>
                  </View>
                  <Text style={styles.careOverviewValue}>{daysOldest}d</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <PlantModal plant={selected} onClose={() => setSelected(null)} />
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDEAE3' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, color: '#9A9A90', marginTop: 1 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2D4A2D', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  scanBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  scroll: { paddingHorizontal: 16 },
  loader: { height: 300, alignItems: 'center', justifyContent: 'center' },

  gridWrapper: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#5A3A1A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 6,
    marginBottom: 8,
  },

  gridHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24, justifyContent: 'center' },
  gridHintText: { fontSize: 11, color: '#9A9A90' },

  sectionTitle: {
    fontSize: 18, fontWeight: '800', color: '#1A1A1A',
    marginBottom: 14, letterSpacing: -0.3,
  },

  statRow: { flexDirection: 'row', marginBottom: 12 },

  analyticsRow: { flexDirection: 'row', marginBottom: 12 },
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  analyticsCardTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  analyticsCardSub: { fontSize: 11, color: '#9A9A90', textAlign: 'center', marginTop: 6 },

  oldestPlantIcon: { alignItems: 'center', marginVertical: 6 },
  oldestPlantName: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  daysBadge: {
    alignSelf: 'center', marginTop: 6,
    backgroundColor: '#EAF4EA', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  daysBadgeText: { fontSize: 11, color: '#5A9A38', fontWeight: '600' },

  chartLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chartLegendDot: { width: 8, height: 8, borderRadius: 4 },
  chartLegendText: { fontSize: 11, color: '#777' },

  careOverviewRows: { marginTop: 8 },
  careOverviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  careOverviewLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  careOverviewIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  careOverviewLabel: { fontSize: 14, color: '#3A3A3A', fontWeight: '500' },
  careOverviewValue: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  careOverviewDivider: { height: 1, backgroundColor: '#F0F0EC' },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#2D2D2D', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9A9A90', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn: { backgroundColor: '#2D4A2D', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})

const modal = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D8D8D0', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  illustBox: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F2F2EE', borderRadius: 20, height: 120, marginVertical: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  name: { fontSize: 24, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  sci: { fontSize: 14, fontStyle: 'italic', color: '#999', marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#EFEFEB', alignItems: 'center', justifyContent: 'center',
    marginLeft: 10, marginTop: 4,
  },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  healthDot: { width: 10, height: 10, borderRadius: 5 },
  healthText: { fontSize: 13, color: '#555', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F4F4F0', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 10,
  },
  statLabel: { fontSize: 12, color: '#444', fontWeight: '500', flexShrink: 1 },
  desc: { fontSize: 13, color: '#777', lineHeight: 19 },
})
