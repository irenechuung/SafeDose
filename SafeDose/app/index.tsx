import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();
  const { firebaseUser, profile, isLoading, signOut } = useApp();

  useEffect(() => {
    if (isLoading) return;
    if (!firebaseUser) {
      router.replace('/login');
      return;
    }
    if (!profile) return;
    if (profile.role === 'patient') {
      router.replace('/(patient)/home');
    } else if (profile.role === 'caregiver') {
      router.replace('/(caregiver)/dashboard');
    }
  }, [isLoading, firebaseUser, profile]);

  if (firebaseUser && !profile && !isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Profile Error</Text>
        <Text style={styles.errorSub}>{"We couldn't load your profile."}</Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
          <Text style={styles.signOutText}>Sign Out & Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFF' },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 14 },
  errorTitle: { fontSize: 22, fontWeight: '800', color: '#1E3A5F', marginBottom: 8 },
  errorSub: { fontSize: 14, color: '#64748B', marginBottom: 24 },
  signOutBtn: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  signOutText: { color: '#DC2626', fontWeight: '700' },
});
