import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/context/AppContext';

const LAST_EMAIL_KEY = '@safedose/lastEmail';

export default function Login() {
  const router = useRouter();
  const { signIn, firebaseUser } = useApp();
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LAST_EMAIL_KEY).then(val => {
      if (val) setSavedEmail(val);
    });
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    router.replace('/');
  }, [firebaseUser]);

  const usingSavedEmail = !!savedEmail && !switchingAccount;
  const displayEmail = usingSavedEmail ? savedEmail : email;

  const submit = async () => {
    const emailToUse = usingSavedEmail ? savedEmail! : email.trim();
    if (!usingSavedEmail && (!emailToUse || !emailToUse.includes('@'))) {
      setError('Please enter a valid email.'); return;
    }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    setError('');
    try {
      await signIn(emailToUse, password);
      await AsyncStorage.setItem(LAST_EMAIL_KEY, emailToUse.toLowerCase());
      router.replace('/');
    } catch (e: any) {
      const msg =
        e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password'
          ? 'Incorrect password.'
          : e.code === 'auth/user-not-found'
          ? 'No account found with this email.'
          : e.code === 'auth/network-request-failed'
          ? 'Network error. Check your connection.'
          : 'Sign in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    setSwitchingAccount(true);
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>💊</Text>
          </View>
          <Text style={styles.title}>SafeDose</Text>
          <Text style={styles.subtitle}>The right pill, at the right time</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {usingSavedEmail ? 'Welcome back' : 'Sign in'}
            </Text>

            {usingSavedEmail ? (
              <View style={styles.accountRow}>
                <View style={styles.accountBadge}>
                  <Text style={styles.accountAvatar}>
                    {savedEmail!.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.accountEmail} numberOfLines={1}>{savedEmail}</Text>
                <TouchableOpacity onPress={handleSwitchAccount} style={styles.switchBtn}>
                  <Text style={styles.switchBtnText}>Switch</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={v => { setEmail(v); setError(''); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  autoFocus={!usingSavedEmail && switchingAccount}
                />
              </>
            )}

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={submit}
              autoFocus={usingSavedEmail}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Sign In →</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => router.replace('/signup')}>
              <Text style={styles.link}>
                {"Don't have an account? "}
                <Text style={styles.linkBold}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoBox: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
    alignSelf: 'center', marginBottom: 16,
  },
  logoEmoji: { fontSize: 48 },
  title: { fontSize: 36, fontWeight: '800', color: '#1E3A5F', textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 4, marginBottom: 36 },
  card: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#1E3A5F', marginBottom: 20 },
  accountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 12, marginBottom: 16,
  },
  accountBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
  },
  accountAvatar: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  accountEmail: { flex: 1, fontSize: 14, color: '#1E3A5F', fontWeight: '600' },
  switchBtn: { backgroundColor: '#DBEAFE', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  switchBtnText: { fontSize: 12, color: '#2563EB', fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFF', borderRadius: 12, padding: 14,
    fontSize: 16, color: '#1E3A5F', borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 16,
  },
  error: { color: '#DC2626', fontSize: 13, marginBottom: 12 },
  btn: { backgroundColor: '#2563EB', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  linkRow: { alignItems: 'center', marginTop: 20 },
  link: { fontSize: 13, color: '#94A3B8' },
  linkBold: { color: '#2563EB', fontWeight: '700' },
});
