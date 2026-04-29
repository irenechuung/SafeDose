import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';

export default function PendingVerification() {
  const router = useRouter();
  const { profile, verifyDoctor, signOut } = useApp();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!code.trim()) { setError('Please enter a verification code.'); return; }
    setLoading(true);
    setError('');
    const ok = await verifyDoctor(code.trim());
    setLoading(false);
    if (ok) {
      router.replace('/');
    } else {
      setError('Invalid verification code. Please contact SafeDose support.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🔒</Text>
        </View>

        <Text style={styles.title}>Verification Pending</Text>
        <Text style={styles.subtitle}>
          Your doctor account is awaiting verification.{'\n'}
          Please enter the code provided by SafeDose administration.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Account</Text>
          <Text style={styles.infoValue}>{profile?.name}</Text>
          <Text style={[styles.infoLabel, { marginTop: 8 }]}>License</Text>
          <Text style={styles.infoValue}>{profile?.licenseNumber ?? '—'}</Text>
          <Text style={[styles.infoLabel, { marginTop: 8 }]}>NPI</Text>
          <Text style={styles.infoValue}>{profile?.npiNumber ?? '—'}</Text>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter code"
            placeholderTextColor="#94A3B8"
            value={code}
            onChangeText={v => { setCode(v); setError(''); }}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Verify Account</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={async () => { await signOut(); router.replace('/login'); }}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Demo code: DOCTOR2024</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF5FF' },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  iconBox: {
    width: 96, height: 96, borderRadius: 28, backgroundColor: '#F3E8FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 26, fontWeight: '800', color: '#581C87', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  infoCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, width: '100%', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', marginTop: 2 },
  codeCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  codeLabel: { fontSize: 14, fontWeight: '700', color: '#581C87', marginBottom: 10 },
  input: {
    backgroundColor: '#FAF5FF', borderRadius: 12, padding: 14,
    fontSize: 18, color: '#1E3A5F', borderWidth: 1.5, borderColor: '#E9D5FF',
    textAlign: 'center', letterSpacing: 3, marginBottom: 12,
  },
  error: { color: '#DC2626', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: { backgroundColor: '#9333EA', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  signOutBtn: { marginTop: 24 },
  signOutText: { color: '#94A3B8', fontSize: 13, textDecorationLine: 'underline' },
  hint: { marginTop: 32, fontSize: 11, color: '#C4B5FD', textAlign: 'center' },
});
