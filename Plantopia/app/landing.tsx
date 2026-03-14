import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'

export default function LandingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <ImageBackground
      source={require('@/assets/images/background-lp.jpg')}
      style={s.root}
      resizeMode="cover"
      imageStyle={{ height: '100%' }}
    >
      {/* Gradient: transparent at top, dark green at bottom */}
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(18,46,22,0.72)', 'rgba(10,30,14,0.97)']}
        locations={[0, 0.38, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Bottom content area */}
      <View style={[s.content, { paddingBottom: insets.bottom + 28 }]}>

        {/* Welcome label */}
        <Text style={s.welcomeLabel}>Welcome to</Text>

        {/* App name — large, bold, two lines */}
        <Text style={s.appName}>Plantopia</Text>
        <View style={s.taglineRow}>
          <Text style={s.taglineLine}>Your plant care</Text>
        </View>
        <View style={s.taglineRow}>
          <Text style={s.taglineLine}>companion </Text>
          <View style={s.leafBadge}>
            <Ionicons name="leaf" size={20} color="#fff" />
          </View>
        </View>

        {/* Sub-description */}
        <Text style={s.sub}>
          Identify, track and care for your plants{'\n'}with the power of AI — all in one place.
        </Text>

        {/* Get Started pill button */}
        <TouchableOpacity
          style={s.getStartedBtn}
          onPress={() => router.push('/auth/sign-up')}
          activeOpacity={0.88}
        >
          {/* Left avatar circle */}
          <View style={s.avatarCircle}>
            <Image
              source={require('@/assets/images-new/plant-flowering.png')}
              style={s.avatarImage}
              contentFit="cover"
            />
          </View>

          <Text style={s.getStartedTxt}>Get Started</Text>

          <Text style={s.chevrons}>{'>  >  >'}</Text>
        </TouchableOpacity>

        {/* Sign in link */}
        <TouchableOpacity
          style={s.signInRow}
          onPress={() => router.push('/auth/sign-in')}
          activeOpacity={0.7}
        >
          <Text style={s.signInTxt}>Already have an account? </Text>
          <Text style={s.signInLink}>Sign In</Text>
        </TouchableOpacity>

      </View>
    </ImageBackground>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },

  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },

  welcomeLabel: {
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },

  appName: {
    fontSize: 52,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 56,
  },

  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taglineLine: {
    fontSize: 42,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: -0.5,
    lineHeight: 50,
  },

  leafBadge: {
    width: 52,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginBottom: 4,
  },

  sub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 21,
    marginTop: 14,
    marginBottom: 28,
  },

  // Get Started pill
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 8,
    paddingRight: 20,
    paddingLeft: 8,
    marginBottom: 18,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarArrow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2D4A2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedTxt: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  chevrons: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
  },

  // Sign in row
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 4,
  },
  signInTxt: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A8D5A2',
  },
})
