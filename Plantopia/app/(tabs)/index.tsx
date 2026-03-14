import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import Svg, { Polygon, Ellipse, G, Line, Circle, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { usePlants } from '@/hooks/usePlants';
import { useTasks } from '@/hooks/useTasks';
import { isOverdue } from '@/services/reminderService';
import type { Plant } from '@/types/database';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning 🌿';
  if (h < 17) return 'Good afternoon 🌿';
  return 'Good evening 🌿';
}

// ─── Plant Illustrations ──────────────────────────────────────────────────────

// Round flowering tree (like the broad-leaf trees in Forest app)
// viewBox 0 0 56 76
function RoundTree({ flowers = false }: { flowers?: boolean }) {
  const flowerPositions = [[20, 14], [35, 10], [39, 22], [14, 22], [28, 8]] as const;
  return (
    <Svg width={56} height={76} viewBox="0 0 56 76">
      {/* Trunk */}
      <Rect x={23} y={50} width={10} height={26} rx={4} fill="#8B6035" />
      <Rect x={30} y={50} width={4} height={26} rx={2} fill="#6B4A25" />
      {/* Shadow layer (back) */}
      <Circle cx={30} cy={28} r={26} fill="#359018" />
      {/* Main canopy */}
      <Circle cx={27} cy={26} r={25} fill="#4AAA20" />
      {/* Highlight */}
      <Circle cx={21} cy={19} r={16} fill="#5EBB2C" />
      {/* Small highlight spot */}
      <Circle cx={18} cy={16} r={8} fill="#70CC38" />
      {flowers && flowerPositions.map(([x, y], i) => (
        <React.Fragment key={i}>
          <Circle cx={x} cy={y} r={3.5} fill="#FFFDF0" />
          <Circle cx={x} cy={y} r={1.5} fill="#F5C820" />
        </React.Fragment>
      ))}
    </Svg>
  );
}

// Pine / conifer tree (triangular layered, like Forest app)
// viewBox 0 0 48 76
function PineTree() {
  return (
    <Svg width={48} height={76} viewBox="0 0 48 76">
      {/* Trunk */}
      <Rect x={20} y={60} width={8} height={16} rx={2} fill="#7A4E28" />
      <Rect x={25} y={60} width={3} height={16} rx={1} fill="#5A3A1A" />
      {/* Layer 1 — bottom, widest */}
      <Polygon points="24,32 2,64 46,64" fill="#3A9A15" />
      <Polygon points="2,64 24,58 24,32" fill="#2A7808" />
      {/* Layer 2 — middle */}
      <Polygon points="24,18 7,48 41,48" fill="#4AAA20" />
      <Polygon points="7,48 24,43 24,18" fill="#389015" />
      {/* Layer 3 — top */}
      <Polygon points="24,4 12,32 36,32" fill="#5ABB28" />
      <Polygon points="12,32 24,27 24,4" fill="#48A01E" />
    </Svg>
  );
}

// Small round shrub (for herbs, ferns, small plants)
function SmallShrub({ color = '#4AAA20' }: { color?: string }) {
  return (
    <Svg width={40} height={52} viewBox="0 0 40 52">
      {/* Trunk */}
      <Rect x={16} y={38} width={8} height={14} rx={3} fill="#8B6035" />
      {/* Shadow */}
      <Circle cx={22} cy={22} r={18} fill="#389018" />
      {/* Main */}
      <Circle cx={20} cy={20} r={18} fill={color} />
      {/* Highlight */}
      <Circle cx={15} cy={14} r={11} fill="#5ABB28" />
    </Svg>
  );
}

// Flower plant (tulip / rose style) — thin stem with flower head
function FlowerPlant({ petalColor = '#E87FAF', centerColor = '#C45A80' }: { petalColor?: string; centerColor?: string }) {
  return (
    <Svg width={36} height={56} viewBox="0 0 36 56">
      {/* Stem */}
      <Line x1={18} y1={56} x2={18} y2={30} stroke="#4A8030" strokeWidth={2.5} strokeLinecap="round" />
      {/* Left leaf */}
      <Ellipse cx={11} cy={44} rx={9} ry={4} fill="#4A8030" transform="rotate(-38,11,44)" />
      {/* Right leaf */}
      <Ellipse cx={25} cy={40} rx={9} ry={4} fill="#3A6828" transform="rotate(38,25,40)" />
      {/* Outer petals */}
      <Ellipse cx={12} cy={20} rx={7} ry={13} fill={centerColor} transform="rotate(-14,12,20)" />
      <Ellipse cx={24} cy={20} rx={7} ry={13} fill={centerColor} transform="rotate(14,24,20)" />
      {/* Center petal */}
      <Ellipse cx={18} cy={17} rx={7.5} ry={15} fill={petalColor} />
    </Svg>
  );
}

// Cactus plant
function CactusPlant() {
  return (
    <Svg width={40} height={58} viewBox="0 0 40 58">
      {/* Soil */}
      <Ellipse cx={20} cy={55} rx={14} ry={5} fill="#A07840" />
      {/* Body */}
      <Rect x={12} y={20} width={16} height={33} rx={8} fill="#4A9030" />
      <Rect x={20} y={22} width={5} height={30} rx={4} fill="#5AAA3C" />
      {/* Left arm */}
      <Rect x={4} y={26} width={10} height={6} rx={3} fill="#4A9030" />
      <Rect x={4} y={18} width={8} height={10} rx={4} fill="#4A9030" />
      {/* Right arm */}
      <Rect x={26} y={30} width={10} height={6} rx={3} fill="#4A9030" />
      <Rect x={28} y={22} width={8} height={10} rx={4} fill="#4A9030" />
      {/* Spine at top */}
      <Line x1={20} y1={20} x2={20} y2={14} stroke="#C8B870" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function getPlantComponent(name: string) {
  const n = name.toLowerCase();
  if (n.includes('cactus') || n.includes('succulent')) return <CactusPlant />;
  if (n.includes('pine') || n.includes('spruce') || n.includes('fir') || n.includes('fern') || n.includes('bamboo')) return <PineTree />;
  if (n.includes('rose')) return <FlowerPlant petalColor="#E8314A" centerColor="#B0213A" />;
  if (n.includes('tulip')) return <FlowerPlant petalColor="#E87FAF" centerColor="#C45A80" />;
  if (n.includes('sunflower')) return <FlowerPlant petalColor="#F5C030" centerColor="#8B5010" />;
  if (n.includes('lavender') || n.includes('violet')) return <FlowerPlant petalColor="#9B80D0" centerColor="#6B50A0" />;
  if (n.includes('lily') || n.includes('orchid') || n.includes('daisy') || n.includes('flower') || n.includes('blossom')) return <FlowerPlant petalColor="#F5A8D0" centerColor="#D07098" />;
  if (n.includes('herb') || n.includes('mint') || n.includes('basil') || n.includes('pothos') || n.includes('ivy') || n.includes('moss')) return <SmallShrub color="#4AAA20" />;
  if (n.includes('palm') || n.includes('coconut')) return <RoundTree flowers={false} />;
  if (n.includes('oak') || n.includes('maple') || n.includes('birch') || n.includes('tree')) return <RoundTree flowers={true} />;
  // Default — flowering round tree for most houseplants
  return <RoundTree flowers={true} />;
}

function getPlantSize(name: string): { w: number; h: number } {
  const n = name.toLowerCase();
  if (n.includes('cactus') || n.includes('succulent')) return { w: 40, h: 58 };
  if (n.includes('pine') || n.includes('spruce') || n.includes('fir') || n.includes('bamboo')) return { w: 48, h: 76 };
  if (n.includes('herb') || n.includes('mint') || n.includes('basil') || n.includes('pothos') || n.includes('ivy') || n.includes('moss') || n.includes('fern')) return { w: 40, h: 52 };
  if (n.includes('rose') || n.includes('tulip') || n.includes('sunflower') || n.includes('flower') || n.includes('lily') || n.includes('orchid') || n.includes('daisy') || n.includes('lavender')) return { w: 36, h: 56 };
  return { w: 56, h: 76 }; // round tree
}

// ─── Isometric Island Geometry ────────────────────────────────────────────────
//
//         T(165,25)
//        /         \
//  L(25,95)         R(305,95)
//        \         /
//         B(165,165)   ← bottom of grass diamond
//
//   Soil faces drop straight down by DEPTH from the bottom two edges

const PAD    = 25;
const HALF_W = 140;
const HALF_H = 70;
const DEPTH  = 72;   // thick soil (matches Forest app proportions)

const SVG_W = PAD * 2 + HALF_W * 2;             // 330
const SVG_H = PAD + HALF_H * 2 + DEPTH + 40;    // 275

const TX = PAD + HALF_W,       TY = PAD;           // top
const RX = PAD + HALF_W * 2,   RY = PAD + HALF_H;  // right
const BX = PAD + HALF_W,       BY = PAD + HALF_H * 2; // bottom of grass
const LX = PAD,                LY = PAD + HALF_H;  // left
const BDX = BX,  BDY = BY + DEPTH;               // bottom tip of soil
const LDX = LX,  LDY = LY + DEPTH;               // left-down
const RDX = RX,  RDY = RY + DEPTH;               // right-down

// ── Grass blade spikes ── hanging DOWN into the soil from the grass edge
function makeSpikes(edge: 'left' | 'right', count: number): string[] {
  const spikes: string[] = [];
  const tVals = Array.from({ length: count }, (_, i) => (i + 0.5) / count);
  for (const t of tVals) {
    const cx = edge === 'left' ? LX + HALF_W * t : BX + HALF_W * t;
    const cy = edge === 'left' ? LY + HALF_H * t : BY - HALF_H * t;
    // spike width varies slightly
    const w = 4 + (Math.round(t * 100) % 3);
    const h = 12 + (Math.round(t * 137) % 8);
    if (edge === 'left') {
      spikes.push(`${cx - w},${cy - 2} ${cx + w},${cy + 2} ${cx - w + 2},${cy + h}`);
    } else {
      spikes.push(`${cx - w},${cy + 2} ${cx + w},${cy - 2} ${cx + w - 2},${cy + h}`);
    }
  }
  return spikes;
}

// ── Soil bumps ── rounded circles along the bottom edges
function makeSoilBumps(edge: 'left' | 'right'): { x: number; y: number; rx: number; ry: number }[] {
  const bumps = [];
  const tVals = [0.12, 0.28, 0.44, 0.60, 0.76, 0.90];
  for (const t of tVals) {
    if (edge === 'left') {
      bumps.push({
        x: LDX + (BDX - LDX) * t,
        y: LDY + (BDY - LDY) * t,
        rx: 13, ry: 9,
      });
    } else {
      bumps.push({
        x: BDX + (RDX - BDX) * t,
        y: BDY + (RDY - BDY) * t,
        rx: 13, ry: 9,
      });
    }
  }
  return bumps;
}

// 9 plant positions on the grass surface
const STEP_X = HALF_W / 3;
const STEP_Y = HALF_H / 3;
const GRID_POSITIONS = [
  [0.8, 0.8], [0.8, 1.5], [0.8, 2.2],
  [1.5, 0.8], [1.5, 1.5], [1.5, 2.2],
  [2.2, 0.8], [2.2, 1.5], [2.2, 2.2],
].map(([r, c]) => ({
  x: TX + (c - r) * STEP_X,
  y: TY + (c + r) * STEP_Y,
}));

// ─── Island Component ─────────────────────────────────────────────────────────

interface IslandProps {
  plants: Plant[];
  overdueIds: Set<string>;
  onPlantPress: (id: string) => void;
}

function IsometricGarden({ plants, overdueIds, onPlantPress }: IslandProps) {
  const leftSpikes  = makeSpikes('left', 9);
  const rightSpikes = makeSpikes('right', 9);
  const leftBumps   = makeSoilBumps('left');
  const rightBumps  = makeSoilBumps('right');

  // Total canvas height = SVG_H (island) + extra room above for tallest plants (76px)
  const extraTop = 80;
  const canvasH  = SVG_H + extraTop;

  return (
    <View style={{ width: SVG_W, height: canvasH }}>

      {/* ── SVG island base ── */}
      <Svg width={SVG_W} height={SVG_H} style={{ position: 'absolute', top: extraTop, left: 0 }}>

        {/* Drop shadow */}
        <Ellipse
          cx={TX} cy={BDY + 14}
          rx={HALF_W * 0.75} ry={13}
          fill="rgba(0,0,0,0.15)"
        />

        {/* ── Soil faces ── */}
        {/* Left soil face */}
        <Polygon
          points={`${LX},${LY} ${BX},${BY} ${BDX},${BDY} ${LDX},${LDY}`}
          fill="#7A4E2A"
        />
        {/* Right soil face */}
        <Polygon
          points={`${BX},${BY} ${RX},${RY} ${RDX},${RDY} ${BDX},${BDY}`}
          fill="#9B6538"
        />

        {/* ── Soil bump circles at bottom of soil faces ── */}
        <G fill="#5E3C1C">
          {leftBumps.map((b, i) => (
            <Ellipse key={`lb${i}`} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} />
          ))}
          {rightBumps.map((b, i) => (
            <Ellipse key={`rb${i}`} cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} />
          ))}
          {/* Tip bump */}
          <Ellipse cx={BDX} cy={BDY} rx={15} ry={10} />
        </G>

        {/* ── Grass top face ── */}
        <Polygon
          points={`${TX},${TY} ${RX},${RY} ${BX},${BY} ${LX},${LY}`}
          fill="#8DD040"
        />

        {/* ── Grass subtle shadow near edges ── */}
        {/* Left edge darkening strip */}
        <Polygon
          points={`${LX},${LY} ${BX},${BY} ${BX - 12},${BY - 4} ${LX + 8},${LY + 4}`}
          fill="#72B82E"
          opacity={0.5}
        />
        {/* Right edge darkening strip */}
        <Polygon
          points={`${BX},${BY} ${RX},${RY} ${RX - 8},${RY + 4} ${BX + 12},${BY - 4}`}
          fill="#72B82E"
          opacity={0.5}
        />

        {/* ── Grass blade spikes (hanging into soil) ── */}
        <G fill="#4E9A18">
          {leftSpikes.map((pts, i)  => <Polygon key={`ls${i}`} points={pts} />)}
          {rightSpikes.map((pts, i) => <Polygon key={`rs${i}`} points={pts} />)}
        </G>

        {/* ── Top highlight ── */}
        <Ellipse
          cx={TX} cy={TY + 24}
          rx={42} ry={18}
          fill="#A0E040"
          opacity={0.3}
        />
      </Svg>

      {/* ── Plant illustrations overlaid on grass ── */}
      {plants.length === 0 && (
        [GRID_POSITIONS[1], GRID_POSITIONS[4], GRID_POSITIONS[7]].map((pos, i) => {
          const sz = { w: 40, h: 52 };
          return (
            <View
              key={i}
              style={[
                isl.pin,
                {
                  left: pos.x - sz.w / 2,
                  top: extraTop + pos.y - sz.h,
                  opacity: 0.35,
                },
              ]}
            >
              <SmallShrub color="#6AAC3C" />
            </View>
          );
        })
      )}

      {plants.slice(0, 9).map((plant, i) => {
        const pos = GRID_POSITIONS[i];
        const sz  = getPlantSize(plant.plant_name);
        return (
          <TouchableOpacity
            key={plant.id}
            style={[
              isl.pin,
              {
                left: pos.x - sz.w / 2,
                top:  extraTop + pos.y - sz.h,
              },
            ]}
            onPress={() => onPlantPress(plant.id)}
            activeOpacity={0.75}
          >
            {getPlantComponent(plant.plant_name)}
            {overdueIds.has(plant.id) && (
              <View style={isl.badge}>
                <Text style={isl.badgeTxt}>💧</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const isl = StyleSheet.create({
  pin: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -6,
    backgroundColor: '#4A90D9',
    borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1,
  },
  badgeTxt: { fontSize: 10 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GardenHomeScreen() {
  const router = useRouter();
  const { plants, isLoading: plantsLoading } = usePlants();
  const { tasks, completeTask, isCompleting } = useTasks();

  const overdueWaterTasks = useMemo(
    () => tasks.filter((t) => t.task_type === 'water' && isOverdue(t.due_date)),
    [tasks]
  );
  const overdueIds = useMemo(
    () => new Set(overdueWaterTasks.map((t) => t.plant_id)),
    [overdueWaterTasks]
  );
  const overdueWaterTask = overdueWaterTasks[0] ?? null;
  const waterNeededCount = overdueWaterTasks.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>My Garden</Text>
          </View>
          <View style={styles.pills}>
            <View style={styles.pill}>
              <Text style={styles.pillIcon}>🌱</Text>
              <Text style={styles.pillText}>{plants.length}</Text>
            </View>
            <View style={[styles.pill, styles.pillWater]}>
              <Text style={styles.pillIcon}>💧</Text>
              <Text style={styles.pillText}>{waterNeededCount}</Text>
            </View>
          </View>
        </View>

        {/* Garden */}
        <View style={styles.gardenArea}>
          <IsometricGarden
            plants={plants}
            overdueIds={overdueIds}
            onPlantPress={(id) => router.push(`/plant/${id}`)}
          />
          {plants.length === 0 && !plantsLoading && (
            <Text style={styles.emptyHint}>Tap 📷 to scan your first plant!</Text>
          )}
        </View>

        {/* Care alert */}
        {overdueWaterTask && (
          <View style={styles.alertCard}>
            <Text style={styles.alertIcon}>🪴</Text>
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>
                {waterNeededCount} plant{waterNeededCount !== 1 ? 's' : ''} need{waterNeededCount === 1 ? 's' : ''} care
              </Text>
              <Text style={styles.alertSub}>Time to water!</Text>
            </View>
            <TouchableOpacity
              style={styles.waterBtn}
              onPress={() => completeTask(overdueWaterTask)}
              disabled={isCompleting}
            >
              <Text style={styles.waterBtnText}>Water</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Plant list */}
        {plants.length > 0 && (
          <View style={styles.plantListHeader}>
            <Text style={styles.plantListTitle}>Your plants</Text>
            <TouchableOpacity onPress={() => router.push('/botanist')}>
              <Text style={styles.plantListSee}>Ask botanist →</Text>
            </TouchableOpacity>
          </View>
        )}
        {plants.slice(0, 5).map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.plantRow}
            onPress={() => router.push(`/plant/${p.id}`)}
          >
            <View style={styles.plantRowThumb}>
              <Svg width={32} height={40} viewBox="0 0 56 76">
                <RoundTree flowers={true} />
              </Svg>
            </View>
            <View style={styles.plantRowInfo}>
              <Text style={styles.plantRowName}>{p.plant_name}</Text>
              <Text style={styles.plantRowSci}>{p.scientific_name}</Text>
            </View>
            {overdueIds.has(p.id) && <Text style={{ fontSize: 16 }}>💧</Text>}
            <Text style={styles.plantRowArrow}>›</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EFEA' },
  scroll: { paddingHorizontal: 22, paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingTop: 16, marginBottom: 0,
  },
  greeting: { fontSize: 13, color: '#5A7A5A', fontWeight: '500', marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '800', color: '#1C3A1C' },
  pills: { flexDirection: 'row', gap: 8, marginTop: 4 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E0DED8', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  pillWater: { backgroundColor: '#F0E6D8' },
  pillIcon: { fontSize: 14 },
  pillText: { fontSize: 14, fontWeight: '700', color: '#333' },

  gardenArea: { alignItems: 'center', marginTop: -8, marginBottom: 4 },
  emptyHint: { fontSize: 14, color: '#888', marginTop: 4, textAlign: 'center' },

  alertCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5EDE3', borderRadius: 20,
    padding: 16, marginTop: 4, marginBottom: 20, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  alertIcon: { fontSize: 36 },
  alertText: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: '#2D2D2D' },
  alertSub: { fontSize: 13, color: '#888', marginTop: 2 },
  waterBtn: {
    backgroundColor: '#C8845A', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  waterBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  plantListHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  plantListTitle: { fontSize: 16, fontWeight: '700', color: '#1C3A1C' },
  plantListSee: { fontSize: 13, color: '#5A7A5A', fontWeight: '600' },
  plantRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 8, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  plantRowThumb: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  plantRowInfo: { flex: 1 },
  plantRowName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  plantRowSci: { fontSize: 12, fontStyle: 'italic', color: '#888', marginTop: 2 },
  plantRowArrow: { fontSize: 22, color: '#ccc' },
});
