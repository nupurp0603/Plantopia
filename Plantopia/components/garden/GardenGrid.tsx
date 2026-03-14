import React, { useMemo } from 'react'
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import Svg, { Defs, Pattern, Rect, Circle, Path } from 'react-native-svg'
import PlantIcon from './PlantIcon'
import type { PlantWithCare } from '@/hooks/usePlants'

const COLS = 6
const ROWS = 6
const SCREEN_W = Dimensions.get('window').width
const GRID_PADDING = 16
const GRID_W = SCREEN_W - GRID_PADDING * 2
const CELL_SIZE = Math.floor(GRID_W / COLS)
const GRID_H = CELL_SIZE * ROWS

// Deterministically assign a grid position based on plant id + index
function assignCell(plant: PlantWithCare, index: number): { col: number; row: number } {
  // Use a hash of the plant id to spread plants across the grid
  let hash = 0
  for (let i = 0; i < plant.id.length; i++) {
    hash = ((hash << 5) - hash + plant.id.charCodeAt(i)) | 0
  }
  const col = Math.abs(hash + index * 7) % COLS
  const row = Math.abs((hash >> 3) + index * 5) % ROWS
  return { col, row }
}

// Soil texture SVG background
function SoilBackground() {
  return (
    <Svg width={GRID_W} height={GRID_H} style={StyleSheet.absoluteFillObject}>
      <Defs>
        <Pattern id="soil" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          {/* Base soil color is set on the parent View */}
          {/* Pebble dots */}
          <Circle cx="4" cy="5" r="1.2" fill="rgba(100,70,40,0.18)" />
          <Circle cx="14" cy="3" r="0.8" fill="rgba(100,70,40,0.14)" />
          <Circle cx="9" cy="12" r="1.4" fill="rgba(100,70,40,0.16)" />
          <Circle cx="17" cy="14" r="0.9" fill="rgba(100,70,40,0.12)" />
          <Circle cx="2" cy="16" r="1.1" fill="rgba(100,70,40,0.15)" />
          <Circle cx="18" cy="8"  r="0.7" fill="rgba(100,70,40,0.10)" />
        </Pattern>
        {/* Grass row at top */}
        <Pattern id="grass" x="0" y="0" width="12" height="10" patternUnits="userSpaceOnUse">
          <Path d="M2 10 Q3 5 4 10" stroke="rgba(80,140,60,0.5)" strokeWidth="1" fill="none" />
          <Path d="M7 10 Q8 4 9 10" stroke="rgba(80,140,60,0.4)" strokeWidth="1" fill="none" />
        </Pattern>
      </Defs>
      {/* Soil base */}
      <Rect width={GRID_W} height={GRID_H} fill="url(#soil)" />
      {/* Grass strip at top */}
      <Rect width={GRID_W} height={14} fill="url(#grass)" opacity={0.8} />
    </Svg>
  )
}

// Empty cell — just shows subtle grid lines
function GardenCell({ size }: { size: number }) {
  return <View style={[styles.cell, { width: size, height: size }]} />
}

interface GardenGridProps {
  plants: PlantWithCare[]
  onPlantPress: (plant: PlantWithCare) => void
}

export default function GardenGrid({ plants, onPlantPress }: GardenGridProps) {
  // Build a map: "col,row" → plant
  const plantMap = useMemo(() => {
    const map = new Map<string, PlantWithCare>()
    const used = new Set<string>()

    plants.forEach((plant, index) => {
      let { col, row } = assignCell(plant, index)
      // Resolve collision by scanning right/down
      let attempts = 0
      while (used.has(`${col},${row}`) && attempts < COLS * ROWS) {
        col = (col + 1) % COLS
        if (col === 0) row = (row + 1) % ROWS
        attempts++
      }
      const key = `${col},${row}`
      map.set(key, plant)
      used.add(key)
    })
    return map
  }, [plants])

  return (
    <View style={[styles.grid, { width: GRID_W, height: GRID_H }]}>
      <SoilBackground />

      {Array.from({ length: ROWS }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: COLS }, (_, col) => {
            const plant = plantMap.get(`${col},${row}`)
            if (plant) {
              return (
                <TouchableOpacity
                  key={col}
                  style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
                  onPress={() => onPlantPress(plant)}
                  activeOpacity={0.8}
                >
                  {/* Glow ring under plant */}
                  <View style={styles.plantGlow} />
                  <PlantIcon plantName={plant.plant_name} size={CELL_SIZE * 0.82} />
                </TouchableOpacity>
              )
            }
            return <GardenCell key={col} size={CELL_SIZE} />
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#C4A26A',  // warm soil base
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(160,110,60,0.18)',
  },
  plantGlow: {
    position: 'absolute',
    width: '60%',
    height: '35%',
    bottom: 4,
    borderRadius: 50,
    backgroundColor: 'rgba(60,100,40,0.22)',
  },
})
