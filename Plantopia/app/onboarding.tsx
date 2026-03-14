import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/services/supabaseClient'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

interface Option {
  id: string
  title: string
  subtitle: string
  icon: IoniconName
}

const EXPERIENCE_OPTIONS: Option[] = [
  { id: 'beginner',  title: 'Total beginner',  subtitle: 'Just starting out',           icon: 'leaf'             },
  { id: 'some',      title: 'Some experience', subtitle: "I've kept a few alive",        icon: 'leaf-outline'     },
  { id: 'parent',    title: 'Plant parent',    subtitle: 'I have a growing collection',  icon: 'git-branch-outline' },
  { id: 'expert',    title: 'Expert',          subtitle: 'My jungle is thriving',        icon: 'flower-outline'   },
]

const PLANT_COUNT_OPTIONS: Option[] = [
  { id: '1-3',   title: '1–3 plants',   subtitle: 'Just a few friends',      icon: 'leaf'             },
  { id: '4-10',  title: '4–10 plants',  subtitle: 'A nice little family',    icon: 'leaf-outline'     },
  { id: '11-25', title: '11–25 plants', subtitle: 'A proper collection',     icon: 'git-branch-outline' },
  { id: '25+',   title: '25+ plants',   subtitle: "It's a jungle in here",   icon: 'flower-outline'   },
]

const GOALS_OPTIONS: Option[] = [
  { id: 'water',    title: 'Get water reminders', subtitle: 'Never forget to water',  icon: 'water-outline'    },
  { id: 'light',    title: 'Check light needs',   subtitle: 'Right plant, right spot', icon: 'sunny-outline'    },
  { id: 'identify', title: 'Identify plants',      subtitle: 'Scan and discover',      icon: 'search-outline'   },
  { id: 'healthy',  title: 'Keep plants healthy',  subtitle: 'Diagnose issues early',  icon: 'heart-outline'    },
  { id: 'grow',     title: 'Grow my collection',   subtitle: 'Find new plants to love', icon: 'aperture-outline' },
]

const STEPS = [
  {
    title: "What's your plant\nexperience?",
    subtitle: "We'll tailor tips just for you.",
    options: EXPERIENCE_OPTIONS,
    multiSelect: false,
  },
  {
    title: 'How many plants\ndo you have?',
    subtitle: 'This helps us organize your garden.',
    options: PLANT_COUNT_OPTIONS,
    multiSelect: false,
  },
  {
    title: 'Choose your\ntop goals',
    subtitle: "We'll help you get there.",
    options: GOALS_OPTIONS,
    multiSelect: true,
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const [step, setStep]           = useState(0)
  const [experience, setExperience] = useState<string | null>('beginner') // pre-select first
  const [plantCount, setPlantCount] = useState<string | null>(null)
  const [goals, setGoals]           = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving]     = useState(false)

  const currentStep = STEPS[step]
  const isLastStep  = step === STEPS.length - 1

  function canContinue() {
    if (step === 0) return experience !== null
    if (step === 1) return plantCount !== null
    return goals.size > 0
  }

  function handleSelect(id: string) {
    if (step === 0) {
      setExperience(id)
    } else if (step === 1) {
      setPlantCount(id)
    } else {
      setGoals((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    }
  }

  function isSelected(id: string): boolean {
    if (step === 0) return experience === id
    if (step === 1) return plantCount === id
    return goals.has(id)
  }

  async function saveAndFinish() {
    setIsSaving(true)
    try {
      await supabase.auth.updateUser({
        data: {
          onboarded:   true,
          experience,
          plant_count: plantCount,
          goals:       Array.from(goals),
        },
      })
    } catch {
      // silent fail — still proceed
    } finally {
      setIsSaving(false)
      router.replace('/(tabs)')
    }
  }

  async function handleSkip() {
    try {
      await supabase.auth.updateUser({ data: { onboarded: true } })
    } catch {}
    router.replace('/(tabs)')
  }

  function handleContinue() {
    if (!canContinue()) return
    if (!isLastStep) { setStep((s) => s + 1); return }
    saveAndFinish()
  }

  return (
    <View style={s.root}>
    <SafeAreaView style={s.container}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <View style={s.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[s.dot, i === step && s.dotActive, i < step && s.dotDone]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>{currentStep.title}</Text>
        <Text style={s.subtitle}>{currentStep.subtitle}</Text>

        <View style={s.options}>
          {currentStep.options.map((opt) => {
            const sel = isSelected(opt.id)
            return (
              <TouchableOpacity
                key={opt.id}
                style={[s.option, sel && s.optionSelected]}
                onPress={() => handleSelect(opt.id)}
                activeOpacity={0.8}
              >
                <View style={[s.iconCircle, sel && s.iconCircleSelected]}>
                  <Ionicons name={opt.icon} size={24} color={sel ? '#fff' : '#8A8A88'} />
                </View>
                <View style={s.optionText}>
                  <Text style={s.optionTitle}>{opt.title}</Text>
                  <Text style={s.optionSub}>{opt.subtitle}</Text>
                </View>
                {currentStep.multiSelect && sel && (
                  <Ionicons name="checkmark-circle" size={22} color="#3B6EC8" />
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* ── Continue button ── */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.continueBtn, !canContinue() && s.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue() || isSaving}
          activeOpacity={0.88}
        >
          <Text style={[s.continueTxt, !canContinue() && s.continueTxtDisabled]}>
            {isSaving ? 'Saving…' : isLastStep ? 'Get started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDEAE3' },
  container: {
    flex: 1,
    backgroundColor: '#EDEAE3',
    paddingTop: Platform.OS === 'web' ? 48 : 0,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 28, height: 6, borderRadius: 3,
    backgroundColor: '#D4D0C8',
  },
  dotActive: { width: 40, backgroundColor: '#2D4A2D' },
  dotDone:   { backgroundColor: '#8AB48A' },
  skip: { fontSize: 16, color: '#7A7A72', fontWeight: '500' },

  // Content
  scroll: { paddingHorizontal: 24, paddingBottom: 20 },
  title: {
    fontSize: 34, fontWeight: '800', color: '#1A1A1A',
    lineHeight: 42, marginTop: 28, marginBottom: 8,
  },
  subtitle: {
    fontSize: 16, color: '#6B7B6B', lineHeight: 22, marginBottom: 32,
  },

  // Option cards
  options: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20,
    padding: 16, gap: 14,
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  optionSelected: {
    borderColor: '#3B6EC8',
    backgroundColor: '#F0EEE8',
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#E8E6E2',
    alignItems: 'center', justifyContent: 'center',
  },
  iconCircleSelected: { backgroundColor: '#2D4A2D' },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  optionSub:   { fontSize: 14, color: '#888' },

  // Footer
  footer: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  continueBtn: {
    backgroundColor: '#2D4A2D',
    borderRadius: 32, paddingVertical: 18,
    alignItems: 'center',
  },
  continueBtnDisabled: { backgroundColor: '#C8C4BC' },
  continueTxt: { color: '#fff', fontSize: 17, fontWeight: '700' },
  continueTxtDisabled: { color: '#A8A8A4' },
})
