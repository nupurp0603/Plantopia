import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { usePlants } from '@/hooks/usePlants';
import { useTasks } from '@/hooks/useTasks';
import type { Plant, Task } from '@/types/database';

// ─── Plant image map ──────────────────────────────────────────────────────────

const PLANT_IMAGES = {
  leafy:     require('@/assets/images-new/plant-leafy.png'),
  cactus:    require('@/assets/images-new/plant-cactus.png'),
  fern:      require('@/assets/images-new/plant-fern.png'),
  flowering: require('@/assets/images-new/plant-flowering.png'),
  hanging:   require('@/assets/images-new/plant-hanging.png'),
} as const;

function getPlantImage(name: string) {
  const n = name.toLowerCase();
  if (n.includes('cactus') || n.includes('succulent') || n.includes('aloe') || n.includes('agave')) return PLANT_IMAGES.cactus;
  if (n.includes('fern') || n.includes('pine') || n.includes('spruce') || n.includes('bamboo')) return PLANT_IMAGES.fern;
  if (n.includes('lily') || n.includes('orchid') || n.includes('rose') || n.includes('tulip') ||
      n.includes('flower') || n.includes('daisy') || n.includes('lavender') || n.includes('sunflower')) return PLANT_IMAGES.flowering;
  if (n.includes('hanging') || n.includes('pothos') || n.includes('ivy') || n.includes('tradescantia')) return PLANT_IMAGES.hanging;
  return PLANT_IMAGES.leafy; // monstera, ficus, palm, most houseplants
}

// ─── Health ring ──────────────────────────────────────────────────────────────

const RING_R  = 22;
const RING_C  = 28;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

function getHealthPercent(plantId: string, tasks: Task[]): number {
  const waterTask = tasks.find((t) => t.plant_id === plantId && t.task_type === 'water' && !t.completed);
  if (!waterTask) return 85;
  const due  = new Date(waterTask.due_date).getTime();
  const now  = Date.now();
  const diff = due - now;
  if (diff < 0)            return 25; // overdue
  if (diff < 86400000)     return 45; // due today
  if (diff < 86400000 * 3) return 65; // due in 1-3 days
  return 85;
}

function ringColor(pct: number): string {
  if (pct < 45) return '#E05252';
  if (pct < 70) return '#E0A040';
  return '#6DB86D';
}

function HealthRing({ percent }: { percent: number }) {
  const filled = CIRCUMFERENCE * (percent / 100);
  const color  = ringColor(percent);
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56">
      {/* Track */}
      <Circle
        cx={RING_C} cy={RING_C} r={RING_R}
        stroke="rgba(255,255,255,0.15)" strokeWidth={5}
        fill="none"
      />
      {/* Progress */}
      <Circle
        cx={RING_C} cy={RING_C} r={RING_R}
        stroke={color} strokeWidth={5}
        fill="none"
        strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
        strokeLinecap="round"
        rotation={-90}
        origin={`${RING_C},${RING_C}`}
      />
    </Svg>
  );
}

// ─── Weeks old helper ─────────────────────────────────────────────────────────

function weeksOld(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  if (weeks === 0) return 'Added this week';
  if (weeks === 1) return '1 week old';
  return `${weeks} weeks old`;
}

// ─── Plant Card ───────────────────────────────────────────────────────────────

interface PlantCardProps {
  plant: Plant;
  tasks: Task[];
  onPress: () => void;
}

function PlantCard({ plant, tasks, onPress }: PlantCardProps) {
  const pct = getHealthPercent(plant.id, tasks);
  return (
    <TouchableOpacity style={card.wrap} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={getPlantImage(plant.plant_name)}
        style={card.image}
        contentFit="contain"
      />
      <View style={card.info}>
        <Text style={card.name} numberOfLines={1}>{plant.plant_name}</Text>
        <Text style={card.age}>{weeksOld(plant.created_at)}</Text>
      </View>
      <View style={card.ringWrap}>
        <HealthRing percent={pct} />
        <Text style={card.pct}>{pct}%</Text>
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A4A2A',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 14,
  },
  image: {
    width: 56,
    height: 72,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  age:  { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  ringWrap: { alignItems: 'center' },
  pct: { fontSize: 11, fontWeight: '700', color: '#fff', marginTop: 2 },
});

// ─── Weather Card ─────────────────────────────────────────────────────────────

function WeatherCard() {
  return (
    <View style={wx.card}>
      <View style={wx.row}>
        <Ionicons name="location-outline" size={14} color="#4A6A8A" />
        <Text style={wx.location}>Your Location  ·  Today</Text>
      </View>
      <View style={wx.main}>
        <View>
          <Text style={wx.temp}>22°C</Text>
          <Text style={wx.tip}>Great for your plants!</Text>
        </View>
        <View style={wx.iconWrap}>
          <Ionicons name="rainy-outline" size={40} color="#4A6A8A" />
        </View>
      </View>
    </View>
  );
}

const wx = StyleSheet.create({
  card: {
    backgroundColor: '#D4E8F8',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  location: { fontSize: 13, color: '#4A6A8A', fontWeight: '500' },
  main: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  temp: { fontSize: 36, fontWeight: '800', color: '#1A3A5A' },
  tip:  { fontSize: 13, color: '#4A6A8A', marginTop: 2 },
  iconWrap: { opacity: 0.9 },
});

// ─── Quick Tips ───────────────────────────────────────────────────────────────

const TIPS = [
  { icon: 'water-outline'   as const, title: 'Water Check',     body: 'Check soil before watering to avoid overwatering.' },
  { icon: 'sunny-outline'   as const, title: 'Light Rotation',  body: 'Rotate pots a quarter turn weekly for even growth.' },
  { icon: 'leaf-outline'    as const, title: 'Wipe the Leaves', body: 'Dust blocks light — wipe leaves with a damp cloth.' },
  { icon: 'thermometer-outline' as const, title: 'Temperature', body: 'Most houseplants thrive between 18–24°C.' },
];

function QuickTips() {
  return (
    <View>
      <Text style={tips.heading}>Quick Tips</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tips.scroll}
      >
        {TIPS.map((t) => (
          <View key={t.title} style={tips.card}>
            <View style={tips.iconCircle}>
              <Ionicons name={t.icon} size={22} color="#2D4A2D" />
            </View>
            <Text style={tips.title}>{t.title}</Text>
            <Text style={tips.body}>{t.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const tips = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  scroll: { gap: 12, paddingBottom: 4 },
  card: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EDF4EC',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  body:  { fontSize: 12, color: '#777', lineHeight: 17 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

function useUserName(): string {
  const [name, setName] = useState('Plant Lover')
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const meta = session.user.user_metadata ?? {}
      // Prefer display_name, then first part of email, then fallback
      const resolved =
        meta.display_name ||
        meta.full_name ||
        meta.name ||
        (session.user.email ? session.user.email.split('@')[0] : null) ||
        'Plant Lover'
      setName(resolved as string)
    })
  }, [])
  return name
}

export default function GardenHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plants, isLoading: plantsLoading } = usePlants();
  const { tasks } = useTasks();
  const userName = useUserName();

  const hasPlants = plants.length > 0;

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

          {/* ── Hero ── */}
          <ImageBackground
            source={require('@/assets/images-new/garden-hero.png')}
            style={s.hero}
            imageStyle={s.heroImg}
            resizeMode="cover"
          >
            <View style={s.heroOverlay} />
            <View style={s.heroContent}>
              <Text style={s.heroSub}>Welcome back</Text>
              <Text style={s.heroTitle}>Hi, {userName}</Text>
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => router.push('/scan')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color="#2D4A2D" />
                <Text style={s.addBtnTxt}>Add a plant</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* ── Body padding starts here ── */}
          <View style={s.body}>

              {/* ── My Garden banner ── */}
            <TouchableOpacity
              style={s.gardenBanner}
              onPress={() => router.push('/(tabs)/garden')}
              activeOpacity={0.85}
            >
              <View style={s.gardenBannerLeft}>
                <View style={s.gardenBannerIcon}>
                  <Ionicons name="grid-outline" size={22} color="#2D4A2D" />
                </View>
                <View>
                  <Text style={s.gardenBannerTitle}>My Garden</Text>
                  <Text style={s.gardenBannerSub}>View your garden map & analytics</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9A9A90" />
            </TouchableOpacity>

            {/* ── Your Plants ── */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Your Plants</Text>
              <Text style={s.sectionCount}>{plants.length}</Text>
            </View>

            {!hasPlants && !plantsLoading && (
              <View style={s.emptyCard}>
                <Ionicons name="leaf-outline" size={36} color="#8AB48A" />
                <Text style={s.emptyTitle}>No plants yet</Text>
                <Text style={s.emptySub}>{'Tap "Add a plant" to scan your first one!'}</Text>
              </View>
            )}

            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                tasks={tasks}
                onPress={() => router.push(`/plant/${plant.id}`)}
              />
            ))}

            {/* ── Weather ── */}
            <WeatherCard />

            {/* ── Quick Tips ── */}
            <QuickTips />

          </View>
        </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#EDEAE3' },
  scroll: {},

  // Hero
  hero: {
    width: '100%',
    height: 260,
    justifyContent: 'flex-end',
  },
  heroImg: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroContent: {
    padding: 24,
    paddingBottom: 28,
  },
  heroSub:   { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 2 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 16 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D9C89A',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 6,
  },
  addBtnTxt: { fontSize: 15, fontWeight: '700', color: '#2D4A2D' },

  // Body
  body: { paddingHorizontal: 20, paddingTop: 24 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  sectionCount: {
    fontSize: 13, fontWeight: '700', color: '#fff',
    backgroundColor: '#2D4A2D',
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2D4A2D' },
  emptySub:   { fontSize: 13, color: '#888', textAlign: 'center' },

  gardenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EDF4EC',
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(45,74,45,0.12)',
  },
  gardenBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gardenBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D4E8D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gardenBannerTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  gardenBannerSub: { fontSize: 12, color: '#6A8A6A', marginTop: 1 },
});
