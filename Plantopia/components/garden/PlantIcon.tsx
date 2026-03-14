import React, { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'
import Svg, { Circle, Ellipse, Path, Rect, G } from 'react-native-svg'

type PlantType = 'monstera' | 'snake' | 'cactus' | 'fern' | 'pothos' | 'default'

function classifyPlant(name: string): PlantType {
  const n = name.toLowerCase()
  if (n.includes('monstera') || n.includes('swiss')) return 'monstera'
  if (n.includes('snake') || n.includes('sansevieria') || n.includes('dracaena')) return 'snake'
  if (n.includes('cactus') || n.includes('succulent') || n.includes('aloe') || n.includes('echeveria')) return 'cactus'
  if (n.includes('fern') || n.includes('palm') || n.includes('areca')) return 'fern'
  if (n.includes('pothos') || n.includes('ivy') || n.includes('philodendron') || n.includes('hanging')) return 'pothos'
  return 'default'
}

// ── Individual plant SVGs ──────────────────────────────────────────────────

function MonsteraSVG({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Pot */}
      <Path d="M15 33 Q20 36 25 33 L23 28 H17 Z" fill="#C8854A" />
      <Rect x="16" y="27" width="8" height="2" rx="1" fill="#B07040" />
      {/* Stem */}
      <Path d="M20 27 Q19 22 18 17 Q17 12 20 9" stroke="#5A8A3A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Big leaf left */}
      <Path d="M18 17 Q10 12 9 6 Q13 5 16 10 Q17 14 18 17" fill="#7BBF5A" />
      <Path d="M13 9 Q11 11 12 14" stroke="#5A9A3A" strokeWidth="0.7" fill="none" />
      <Path d="M10 7 Q9 9 11 11" stroke="#5A9A3A" strokeWidth="0.7" fill="none" />
      {/* Big leaf right */}
      <Path d="M20 14 Q28 10 30 4 Q26 3 23 8 Q21 11 20 14" fill="#6DB54E" />
      <Path d="M27 7 Q29 9 27 12" stroke="#4A9030" strokeWidth="0.7" fill="none" />
      {/* Small leaf top */}
      <Path d="M20 9 Q22 4 26 3 Q25 7 21 9" fill="#88C860" />
    </Svg>
  )
}

function SnakePlantSVG({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Pot */}
      <Path d="M14 33 Q20 36 26 33 L24 28 H16 Z" fill="#C8854A" />
      <Rect x="15" y="27" width="10" height="2" rx="1" fill="#B07040" />
      {/* Leaves - tall pointed */}
      <Path d="M17 27 Q15 20 16 12 Q17 6 18 12 Q19 20 18 27Z" fill="#5A8A3A" />
      <Path d="M17 20 Q16 18 17 16" stroke="#88C060" strokeWidth="0.8" fill="none" />
      <Path d="M20 27 Q19 19 20 10 Q21 4 22 10 Q23 19 21 27Z" fill="#4A7A2A" />
      <Path d="M20 18 Q19 15 20 13" stroke="#78B050" strokeWidth="0.8" fill="none" />
      <Path d="M23 27 Q22 21 23 13 Q24 7 25 13 Q25 21 24 27Z" fill="#6AAA44" />
      {/* Stripe pattern */}
      <Path d="M16.5 22 Q17 21 17.5 22" stroke="#A8D870" strokeWidth="0.6" fill="none" />
      <Path d="M19.5 20 Q20 19 20.5 20" stroke="#98C860" strokeWidth="0.6" fill="none" />
    </Svg>
  )
}

function CactusSVG({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Pot */}
      <Path d="M14 33 Q20 36 26 33 L24 28 H16 Z" fill="#D4956A" />
      <Rect x="15" y="27" width="10" height="2" rx="1" fill="#B87040" />
      {/* Main body */}
      <Rect x="17" y="12" width="6" height="16" rx="3" fill="#6AAA50" />
      {/* Left arm */}
      <Path d="M17 20 Q11 20 11 15 Q11 12 14 12 Q14 16 17 17Z" fill="#5A9A40" />
      {/* Right arm */}
      <Path d="M23 18 Q29 18 29 13 Q29 10 26 10 Q26 14 23 15Z" fill="#5A9A40" />
      {/* Spines */}
      <Path d="M19 15 L18 13" stroke="#C8A870" strokeWidth="0.8" />
      <Path d="M21 15 L22 13" stroke="#C8A870" strokeWidth="0.8" />
      <Path d="M20 20 L19 18" stroke="#C8A870" strokeWidth="0.8" />
      {/* Top flower */}
      <Circle cx="20" cy="12" r="2" fill="#F07080" />
      <Circle cx="20" cy="12" r="1" fill="#FFD0A0" />
    </Svg>
  )
}

function FernSVG({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Pot */}
      <Path d="M14 33 Q20 36 26 33 L24 28 H16 Z" fill="#C8854A" />
      <Rect x="15" y="27" width="10" height="2" rx="1" fill="#B07040" />
      {/* Fronds */}
      <Path d="M20 27 Q16 22 10 18 Q12 16 15 19 Q17 21 20 24" fill="#5A9A38" />
      <Path d="M20 27 Q24 22 30 18 Q28 16 25 19 Q23 21 20 24" fill="#4A8A2A" />
      <Path d="M20 24 Q17 18 13 13 Q15 11 17 15 Q19 18 20 21" fill="#68B044" />
      <Path d="M20 24 Q23 18 27 13 Q25 11 23 15 Q21 18 20 21" fill="#5AA034" />
      <Path d="M20 21 Q19 15 18 10 Q21 9 21 14 Q21 17 20 21" fill="#78C050" />
      {/* Leaflets along fronds */}
      <Path d="M15 20 Q13 19 12 20" stroke="#88C858" strokeWidth="0.8" fill="none" />
      <Path d="M25 20 Q27 19 28 20" stroke="#78B848" strokeWidth="0.8" fill="none" />
    </Svg>
  )
}

function PothosSVG({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Pot */}
      <Path d="M14 33 Q20 36 26 33 L24 28 H16 Z" fill="#C8854A" />
      <Rect x="15" y="27" width="10" height="2" rx="1" fill="#B07040" />
      {/* Trailing vines */}
      <Path d="M18 27 Q14 24 10 26 Q8 22 12 20 Q16 22 18 25" stroke="#5A9A38" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M22 27 Q26 23 30 25 Q32 21 28 19 Q24 21 22 25" stroke="#4A8A2A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Heart-shaped leaves */}
      <Ellipse cx="10" cy="24" rx="3" ry="2.5" fill="#6AAA48" transform="rotate(-20,10,24)" />
      <Ellipse cx="30" cy="23" rx="3" ry="2.5" fill="#5A9A38" transform="rotate(20,30,23)" />
      {/* Center leaves */}
      <Path d="M20 27 Q17 20 18 14 Q21 12 21 18 Q21 22 20 27" fill="#78BA50" />
      <Path d="M20 22 Q23 16 22 11 Q19 10 20 15 Q20 19 20 22" fill="#68AA40" />
      {/* Leaf midrib lines */}
      <Path d="M10 22 Q10 25 10 26" stroke="#A8D870" strokeWidth="0.6" fill="none" />
      <Path d="M30 21 Q30 24 30 25" stroke="#98C860" strokeWidth="0.6" fill="none" />
    </Svg>
  )
}

function DefaultPlantSVG({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M15 33 Q20 36 25 33 L23 28 H17 Z" fill="#C8854A" />
      <Rect x="16" y="27" width="8" height="2" rx="1" fill="#B07040" />
      <Path d="M20 27 Q20 20 20 14" stroke="#5A8A3A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Ellipse cx="20" cy="11" rx="6" ry="5" fill="#6AAA48" />
      <Ellipse cx="14" cy="18" rx="5" ry="4" fill="#5A9A38" transform="rotate(-30,14,18)" />
      <Ellipse cx="26" cy="17" rx="5" ry="4" fill="#78BA50" transform="rotate(30,26,17)" />
    </Svg>
  )
}

// ── Animated wrapper ───────────────────────────────────────────────────────

interface PlantIconProps {
  plantName: string
  size?: number
  animate?: boolean
}

export default function PlantIcon({ plantName, size = 36, animate = true }: PlantIconProps) {
  const sway = useRef(new Animated.Value(0)).current
  const float = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!animate) return

    Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -1.5, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(float, { toValue: 1.5, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start()
  }, [animate])

  const type = classifyPlant(plantName)

  const SVGMap = {
    monstera: MonsteraSVG,
    snake: SnakePlantSVG,
    cactus: CactusSVG,
    fern: FernSVG,
    pothos: PothosSVG,
    default: DefaultPlantSVG,
  }

  const PlantSVG = SVGMap[type]

  return (
    <Animated.View
      style={{
        transform: [
          { rotate: sway.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] }) },
          { translateY: float },
        ],
      }}
    >
      <PlantSVG size={size} />
    </Animated.View>
  )
}

export { classifyPlant }
