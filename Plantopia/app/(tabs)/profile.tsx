import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/services/supabaseClient'
import { usePlants } from '@/hooks/usePlants'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserInfo {
  id: string
  email: string | null
  displayName: string
  initials: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function resolveDisplayName(meta: Record<string, unknown> | null, email: string | null): string {
  if (meta) {
    if (typeof meta.display_name === 'string' && meta.display_name.trim()) {
      return meta.display_name.trim()
    }
    if (typeof meta.full_name === 'string' && meta.full_name.trim()) {
      return meta.full_name.trim()
    }
  }
  if (email) {
    const prefix = email.split('@')[0]
    if (prefix) return prefix
  }
  return 'Plant Lover'
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Avatar({ initials }: { initials: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  )
}

function StatCard({ emoji, count, label }: { emoji: string; count: number | string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statNumber}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

interface MenuRowProps {
  iconName: keyof typeof Ionicons.glyphMap
  iconBg: string
  title: string
  subtitle?: string
  onPress?: () => void
  renderRight?: () => React.ReactNode
}

function MenuRow({ iconName, iconBg, title, subtitle, onPress, renderRight }: MenuRowProps) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={22} color="#fff" />
      </View>
      <View style={styles.menuTextBlock}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.menuRight}>
        {renderRight ? renderRight() : (
          <Ionicons name="chevron-forward" size={18} color="#B0B0A8" />
        )}
      </View>
    </TouchableOpacity>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { plants } = usePlants()

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [wateredCount, setWateredCount] = useState<number>(0)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      if (!session || cancelled) return

      const user = session.user
      const email = user.email ?? null
      const meta = (user.user_metadata as Record<string, unknown>) ?? null
      const displayName = resolveDisplayName(meta, email)
      const initials = getInitials(displayName)

      if (!cancelled) {
        setUserInfo({ id: user.id, email, displayName, initials })
      }

      // Fetch completed water tasks
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('task_type', 'water')
        .eq('completed', true)

      if (!cancelled) {
        setWateredCount(count ?? 0)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [])

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      queryClient.clear()
      await supabase.auth.signOut()
    } catch {
      // ignore — redirect regardless
    } finally {
      setSigningOut(false)
      router.replace('/auth/sign-in')
    }
  }

  function comingSoon() {
    Alert.alert('Coming Soon', 'This feature is coming soon!')
  }

  const displayName = userInfo?.displayName ?? 'Plant Lover'
  const emailLabel = userInfo?.email ?? 'Anonymous user'
  const initials = userInfo?.initials ?? '?'

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Avatar + Name ── */}
      <View style={styles.headerSection}>
        <Avatar initials={initials} />
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.emailText}>{emailLabel}</Text>
        <TouchableOpacity style={styles.editPill} onPress={comingSoon}>
          <Text style={styles.editPillText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <StatCard emoji="🌱" count={plants.length} label="Plants" />
        <StatCard emoji="✅" count={wateredCount} label="Watered" />
        <StatCard emoji="🗓️" count="7 days" label="Streak" />
      </View>

      {/* ── Section 1: My Garden ── */}
      <SectionHeader title="MY GARDEN" />

      <MenuRow
        iconName="notifications-outline"
        iconBg="#2D4A2D"
        title="Notification Reminders"
        renderRight={() => (
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#D0D0C8', true: '#2D4A2D' }}
            thumbColor="#fff"
          />
        )}
      />
      <MenuRow
        iconName="color-palette-outline"
        iconBg="#7B68EE"
        title="App Theme"
        subtitle="Light"
        onPress={comingSoon}
      />
      <MenuRow
        iconName="stats-chart-outline"
        iconBg="#4A90D9"
        title="Measurement Units"
        subtitle="Metric"
        onPress={comingSoon}
      />

      {/* ── Section 2: Account ── */}
      <SectionHeader title="ACCOUNT" />

      <MenuRow
        iconName="star-outline"
        iconBg="#E0A030"
        title="My Subscription"
        subtitle="Free plan"
        onPress={comingSoon}
      />
      <MenuRow
        iconName="shield-outline"
        iconBg="#9A9A90"
        title="Privacy Policy"
        onPress={comingSoon}
      />
      <MenuRow
        iconName="help-circle-outline"
        iconBg="#4ABAB0"
        title="Help & Support"
        onPress={comingSoon}
      />
      <MenuRow
        iconName="log-out-outline"
        iconBg="#E05252"
        title={signingOut ? 'Signing out…' : 'Sign Out'}
        onPress={signingOut ? undefined : handleSignOut}
      />

      {/* ── Footer ── */}
      <Text style={styles.footer}>Plantopia v1.0.0</Text>
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEAE3',
  },
  content: {
    paddingBottom: 40,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2D4A2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#9A9A90',
    marginBottom: 10,
  },
  editPill: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D4A2D',
  },
  editPillText: {
    fontSize: 13,
    color: '#2D4A2D',
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D4A2D',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#9A9A90',
  },

  // Section header
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: '#9A9A90',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },

  // Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextBlock: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#9A9A90',
    marginTop: 2,
  },
  menuRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#B0B0A8',
    marginTop: 24,
  },
})
