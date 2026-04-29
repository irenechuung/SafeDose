import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function PatientSettings() {
  const { profile, signOut, linkToCaregiver, unlinkCaregiver } = useApp();
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const handleLink = async () => {
    if (!caregiverEmail.trim() || !caregiverEmail.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid caregiver email address.'); return;
    }
    setLinking(true);
    try {
      await linkToCaregiver(caregiverEmail.trim());
      setCaregiverEmail('');
      Alert.alert('Linked!', 'Your caregiver can now monitor your medications.');
    } catch (e: any) {
      Alert.alert('Not found', e.message ?? 'Could not find a caregiver with that email.');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = () => {
    Alert.alert(
      'Remove Caregiver',
      'Your caregiver will no longer be able to see your medications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            setUnlinking(true);
            try {
              await unlinkCaregiver();
              Alert.alert('Removed', 'Caregiver link has been removed.');
            } catch {
              Alert.alert('Error', 'Could not remove caregiver.');
            } finally {
              setUnlinking(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.profileName}>{profile?.name}</Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>💊 Patient</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Caregiver linking */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Caregiver</Text>

          {profile?.caregiverId ? (
            <View>
              <View style={styles.linkedBadge}>
                <Text style={styles.linkedIcon}>🫂</Text>
                <Text style={styles.linkedText}>You have a linked caregiver</Text>
              </View>
              <Text style={styles.linkedSub}>
                Your caregiver can view your medications and daily adherence.
              </Text>
              <TouchableOpacity
                style={styles.unlinkBtn}
                onPress={handleUnlink}
                disabled={unlinking}
                activeOpacity={0.8}>
                {unlinking
                  ? <ActivityIndicator color="#DC2626" />
                  : <Text style={styles.unlinkText}>Remove Caregiver</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.cardDesc}>
                Link to a caregiver so they can monitor your medication adherence and help manage your schedule.
              </Text>
              <Text style={styles.label}>Caregiver's Email</Text>
              <TextInput
                style={styles.input}
                placeholder="caregiver@example.com"
                placeholderTextColor="#94A3B8"
                value={caregiverEmail}
                onChangeText={setCaregiverEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TouchableOpacity
                style={[styles.linkBtn, linking && { opacity: 0.6 }]}
                onPress={handleLink}
                disabled={linking}
                activeOpacity={0.85}>
                {linking
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.linkBtnText}>Link to Caregiver</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' },
  scroll: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E3A5F', marginBottom: 20 },
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E3A5F', marginBottom: 12 },
  cardDesc: { fontSize: 13, color: '#64748B', lineHeight: 20, marginBottom: 12 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  profileName: { fontSize: 18, fontWeight: '700', color: '#1E3A5F' },
  profileEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  roleBadge: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start', marginTop: 6 },
  roleText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  linkedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 8,
  },
  linkedIcon: { fontSize: 20 },
  linkedText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
  linkedSub: { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFF', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#1E3A5F', borderWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 12,
  },
  linkBtn: { backgroundColor: '#16A34A', borderRadius: 14, padding: 14, alignItems: 'center' },
  linkBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  unlinkBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  unlinkText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
  signOutBtn: {
    backgroundColor: '#F1F5F9', borderRadius: 14, padding: 16, alignItems: 'center',
    marginTop: 8,
  },
  signOutText: { color: '#64748B', fontWeight: '600', fontSize: 15 },
});
