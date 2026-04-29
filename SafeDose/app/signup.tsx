import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/context/AppContext';

type Role = 'patient' | 'caregiver';

const ROLES: { id: Role; label: string; emoji: string; color: string; bg: string; desc: string }[] = [
  { id: 'patient', label: 'Patient', emoji: '💊', color: '#2563EB', bg: '#EFF6FF', desc: 'Track and confirm your daily medications' },
  { id: 'caregiver', label: 'Caregiver', emoji: '🫂', color: '#16A34A', bg: '#F0FDF4', desc: 'Monitor medications for your patients' },
];

export default function Signup() {
  const router = useRouter();
  const { signUp } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!role) { setError('Please select your role.'); return; }

    setLoading(true);
    setError('');
    try {
      await signUp(email.trim(), password, name.trim(), role);
      await AsyncStorage.setItem('@safedose/lastEmail', email.trim().toLowerCase());
      router.replace('/');
    } catch (e: any) {
      const msg =
        e.code === 'auth/email-already-in-use' ? 'An account with this email already exists.' :
        e.code === 'auth/weak-password' ? 'Password is too weak.' :
        e.code === 'auth/operation-not-allowed' ? 'Email/password sign-in is not enabled in Firebase.' :
        e.code === 'auth/network-request-failed' ? 'Network error. Check your connection.' :
        `Sign up failed: ${e.message}`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>💊</Text>
          </View>
          <Text style={styles.title}>SafeDose</Text>
          <Text style={styles.subtitle}>Create your account</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Margaret Wilson" placeholderTextColor="#94A3B8"
              value={name} onChangeText={v => { setName(v); setError(''); }} autoCapitalize="words" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor="#94A3B8"
              value={email} onChangeText={v => { setEmail(v); setError(''); }}
              autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} placeholder="Min. 6 characters" placeholderTextColor="#94A3B8"
              value={password} onChangeText={v => { setPassword(v); setError(''); }} secureTextEntry />

            <Text style={styles.label}>I am a...</Text>
            <View style={styles.roleCol}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.roleCard, { borderColor: r.color, backgroundColor: role === r.id ? r.color : r.bg }]}
                  onPress={() => { setRole(r.id); setError(''); }}
                  activeOpacity={0.8}>
                  <Text style={styles.roleEmoji}>{r.emoji}</Text>
                  <View style={styles.roleText}>
                    <Text style={[styles.roleLabel, { color: role === r.id ? '#FFF' : r.color }]}>{r.label}</Text>
                    <Text style={[styles.roleDesc, { color: role === r.id ? 'rgba(255,255,255,0.8)' : '#64748B' }]}>{r.desc}</Text>
                  </View>
                  {role === r.id && <Text style={styles.roleCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {role === 'caregiver' && (
              <View style={styles.infoNote}>
                <Text style={styles.infoNoteText}>
                  After signing up, your patients will link to you using your email address.
                </Text>
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Create Account →</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => router.replace('/login')}>
              <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  logoBox: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
    alignSelf: 'center', marginBottom: 12, marginTop: 16,
  },
  logoEmoji: { fontSize: 44 },
  title: { fontSize: 32, fontWeight: '800', color: '#1E3A5F', textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 4, marginBottom: 28 },
  card: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#F8FAFF', borderRadius: 12, padding: 14,
    fontSize: 16, color: '#1E3A5F', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  roleCol: { gap: 10, marginTop: 4 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1.5, gap: 12,
  },
  roleEmoji: { fontSize: 28 },
  roleText: { flex: 1 },
  roleLabel: { fontSize: 15, fontWeight: '700' },
  roleDesc: { fontSize: 12, marginTop: 2 },
  roleCheck: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  infoNote: {
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginTop: 12,
    borderLeftWidth: 3, borderLeftColor: '#16A34A',
  },
  infoNoteText: { fontSize: 12, color: '#14532D', lineHeight: 18 },
  error: { color: '#DC2626', fontSize: 13, marginTop: 12 },
  btn: { backgroundColor: '#2563EB', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  linkRow: { alignItems: 'center', marginTop: 18 },
  link: { fontSize: 13, color: '#94A3B8' },
  linkBold: { color: '#2563EB', fontWeight: '700' },
});
