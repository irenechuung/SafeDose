import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useEffect } from 'react';

const ROLES = [
  { id: 'patient' as const, title: 'Patient', desc: 'View and confirm your daily medications', emoji: '💊', color: '#2563EB', bg: '#EFF6FF', iconBg: '#DBEAFE' },
  { id: 'caregiver' as const, title: 'Caregiver', desc: "Monitor your family member's adherence", emoji: '🫂', color: '#16A34A', bg: '#F0FDF4', iconBg: '#DCFCE7' },
  { id: 'doctor' as const, title: 'Doctor', desc: 'Input prescriptions for your patients', emoji: '🩺', color: '#9333EA', bg: '#FAF5FF', iconBg: '#F3E8FF' },
];

export default function RoleSelector() {
  const router = useRouter();
  const { firebaseUser, profile, isLoading, signOut, setRole } = useApp();

  useEffect(() => {
    if (isLoading) return;
    
    if (!firebaseUser) {
      router.replace('/login');
    } else if (profile?.role === 'doctor' && !profile.verified) {
      router.replace('/pending-verification');
    }
  }, [isLoading, firebaseUser, profile, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10, color: '#64748B' }}>Loading profile...</Text>
      </View>
    );
  }

  // Escape hatch: If logged in but Firestore document failed to load
  if (firebaseUser && !profile) {
    return (
      <View style={styles.loading}>
        <Text style={styles.logo}>⚠️</Text>
        <Text style={styles.title}>Profile Error</Text>
        <Text style={styles.subtitle}>{"We couldn't load your user profile."}</Text>
        <TouchableOpacity 
          style={[styles.card, { marginTop: 20, backgroundColor: '#FEE2E2' }]} 
          onPress={() => signOut()}
        >
          <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>Sign Out & Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const select = (role: 'patient' | 'caregiver' | 'doctor') => {
    setRole(role);
    if (role === 'patient') router.replace('/(patient)/home');
    if (role === 'caregiver') router.replace('/(caregiver)/dashboard');
    if (role === 'doctor') router.replace('/(doctor)/patients');
  };

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'User';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logo}>💊</Text>
        </View>
        <Text style={styles.title}>SafeDose</Text>
        <Text style={styles.welcome}>Welcome back, {firstName}!</Text>
        <Text style={styles.subtitle}>Select your role to continue</Text>
      </View>

      <View style={styles.divider} />
      <Text style={styles.prompt}>I am a...</Text>

      <View style={styles.cards}>
        {ROLES.filter(r => profile?.role === 'doctor' ? r.id === 'doctor' : r.id !== 'doctor').map(role => (
          <TouchableOpacity
            key={role.id}
            style={[styles.card, { backgroundColor: role.bg, borderColor: role.color }]}
            onPress={() => select(role.id)}
            activeOpacity={0.8}>
            <View style={[styles.iconBox, { backgroundColor: role.iconBg }]}>
              <Text style={styles.emoji}>{role.emoji}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: role.color }]}>{role.title}</Text>
              <Text style={styles.cardDesc}>{role.desc}</Text>
            </View>
            <Text style={[styles.arrow, { color: role.color }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutRow} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign out ({profile?.email})</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFF' },
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 6, marginBottom: 16,
  },
  logo: { fontSize: 44 },
  title: { fontSize: 36, fontWeight: '800', color: '#1E3A5F', letterSpacing: -1 },
  welcome: { fontSize: 18, fontWeight: '700', color: '#2563EB', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 32, marginBottom: 20 },
  prompt: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 24, marginBottom: 12 },
  cards: { paddingHorizontal: 20, gap: 12 },
  card: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 28 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardDesc: { fontSize: 13, color: '#64748B', marginTop: 3, lineHeight: 18 },
  arrow: { fontSize: 28, fontWeight: '300' },
  signOutRow: { alignItems: 'center', marginTop: 24 },
  signOutText: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'underline' },
});