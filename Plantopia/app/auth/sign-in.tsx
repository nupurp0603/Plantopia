import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabaseClient';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Enter email', 'Please enter your email address first.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check your email', 'Password reset instructions have been sent.');
    }
  }

  function handleSocialPress() {
    Alert.alert('Coming soon', 'Available soon.');
  }

  return (
    <ImageBackground
      source={require('@/assets/images/sign in bg.jpg')}
      style={s.bg}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'rgba(5,20,8,0.70)', 'rgba(5,20,8,0.88)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingTop: insets.top + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo row */}
          <View style={s.logoRow}>
            <View style={s.logoCircle}>
              <Ionicons name="leaf" size={22} color="#fff" />
            </View>
            <Text style={s.logoText}>Plantopia</Text>
          </View>

          {/* Glass panel */}
          <View style={s.panel}>
            <Text style={s.heading}>Welcome Back</Text>
            <Text style={s.subheading}>Sign in to your garden</Text>

            {/* Email */}
            <View style={s.inputRow}>
              <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.65)" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Email address"
                placeholderTextColor="rgba(255,255,255,0.40)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View style={s.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.65)" style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.40)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="rgba(255,255,255,0.65)"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot */}
            <TouchableOpacity onPress={handleForgotPassword} style={s.forgotWrap}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In */}
            <TouchableOpacity
              style={[s.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={s.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or continue with</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Social */}
            <View style={s.socialRow}>
              <TouchableOpacity style={s.socialBtn} onPress={handleSocialPress} activeOpacity={0.8}>
                <Text style={s.googleG}>G</Text>
                <Text style={s.socialLabel}> Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.socialBtn} onPress={handleSocialPress} activeOpacity={0.8}>
                <Ionicons name="logo-apple" size={18} color="#fff" />
                <Text style={s.socialLabel}> Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom link */}
            <View style={s.bottomRow}>
              <Text style={s.bottomMuted}>{"Don't have an account? "}</Text>
              <TouchableOpacity onPress={() => router.replace('/auth/sign-up')}>
                <Text style={s.bottomLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 36,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  logoCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(45,74,45,0.85)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4,
  },

  // Glass panel
  panel: {
    backgroundColor: 'rgba(10,28,12,0.60)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },

  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.60)',
    marginBottom: 24,
  },

  // Inputs
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    padding: 0,
  },
  eyeBtn: { paddingLeft: 8 },

  forgotWrap: { alignSelf: 'flex-end', marginBottom: 22, marginTop: 2 },
  forgotText: { color: '#A8D5A2', fontSize: 14, fontWeight: '600' },

  // Primary button
  primaryBtn: {
    backgroundColor: '#A8D5A2',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryBtnText: {
    color: '#1A3A1A',
    fontSize: 17,
    fontWeight: '700',
  },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.18)' },
  dividerText: { marginHorizontal: 12, color: 'rgba(255,255,255,0.50)', fontSize: 13 },

  // Social
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  googleG: { fontWeight: '700', fontSize: 16, color: '#EA4335' },
  socialLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // Bottom link
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomMuted: { color: 'rgba(255,255,255,0.55)', fontSize: 15 },
  bottomLink: { color: '#A8D5A2', fontSize: 15, fontWeight: '700' },
});
