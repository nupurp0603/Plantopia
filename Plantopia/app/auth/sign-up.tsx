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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabaseClient';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    if (!data.session) {
      // Email confirmation required
      Alert.alert('Check your email', 'Check your email to confirm your account.');
    }
    // If session exists, onAuthStateChange in _layout.tsx handles redirect
  }

  function handleSocialPress() {
    Alert.alert('Coming soon', 'Available soon.');
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero */}
        <View style={styles.heroContainer}>
          <Image
            source={require('@/assets/images-new/garden-hero.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subheading}>Start your plant care journey</Text>

          {/* Name */}
          <View style={styles.inputRow}>
            <Ionicons name="leaf-outline" size={20} color="#7A8A72" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#B0ADA5"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Email */}
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color="#7A8A72" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#B0ADA5"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#7A8A72" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#B0ADA5"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#7A8A72"
              />
            </TouchableOpacity>
          </View>

          {/* Create Account button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.7 }, { marginTop: 8 }]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} onPress={handleSocialPress} activeOpacity={0.8}>
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.socialLabel}> Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={handleSocialPress} activeOpacity={0.8}>
              <Ionicons name="logo-apple" size={18} color="#1A1A1A" />
              <Text style={styles.socialLabel}> Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom link */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomMuted}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/sign-in')}>
              <Text style={styles.bottomLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EDEAE3',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Hero
  heroContainer: {
    height: 260,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  logoWrapper: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2D4A2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: '700',
    fontSize: 18,
    color: '#fff',
  },

  // Body
  body: {
    flex: 1,
    backgroundColor: '#EDEAE3',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 36,
  },
  subheading: {
    fontSize: 16,
    color: '#7A8A72',
    marginTop: 6,
    marginBottom: 28,
  },

  // Inputs
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6E0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  eyeButton: {
    paddingLeft: 8,
  },

  // Primary button
  primaryButton: {
    backgroundColor: '#2D4A2D',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 28,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D8D5CE',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#7A8A72',
    fontSize: 14,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E6E0',
    borderRadius: 16,
    paddingVertical: 14,
  },
  googleG: {
    fontWeight: '700',
    fontSize: 16,
    color: '#EA4335',
  },
  socialLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // Bottom link
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomMuted: {
    color: '#7A8A72',
    fontSize: 15,
  },
  bottomLink: {
    color: '#2D4A2D',
    fontSize: 15,
    fontWeight: '700',
  },
});
