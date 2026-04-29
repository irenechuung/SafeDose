import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';

export default function DoctorPatients() {
  const router = useRouter();
  const { medications, doseLogs } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const patients = [...new Set(medications.map(m => m.patientName))];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Patients</Text>
            <Text style={styles.subtitle}>Dr. Sarah Chen</Text>
          </View>
          <TouchableOpacity style={styles.switchBtn} onPress={() => router.replace('/')}>
            <Text style={styles.switchText}>Switch Role</Text>
          </TouchableOpacity>
        </View>

        {patients.map(name => {
          const patientMeds = medications.filter(m => m.patientName === name);
          const patientMedIds = new Set(patientMeds.map(m => m.id));
          const patientTodayLogs = doseLogs.filter(l => l.date === today && patientMedIds.has(l.medicationId));
          const taken = patientTodayLogs.filter(l => l.status === 'taken').length;

          return (
            <View key={name} style={styles.patientCard}>
              <View style={styles.patientHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.patientName}>{name}</Text>
                  <Text style={styles.patientMeta}>
                    {patientMeds.length} medications · {taken}/{patientTodayLogs.length} taken today
                  </Text>
                </View>
              </View>
              {patientMeds.map(med => (
                <View key={med.id} style={styles.medRow}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medDetail}>{med.dosage} · {med.times.join(', ')}</Text>
                  <Text style={[styles.medRemaining, med.remainingPills < 15 ? styles.medRemainingLow : null]}>
                    {med.remainingPills} pills left{med.remainingPills < 15 ? ' ⚠' : ''}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF5FF' },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#581C87' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
  switchBtn: { backgroundColor: '#F3E8FF', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, marginTop: 4 },
  switchText: { fontSize: 12, color: '#9333EA', fontWeight: '600' },
  patientCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  patientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#9333EA', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  patientName: { fontSize: 18, fontWeight: '700', color: '#1E3A5F' },
  patientMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  medRow: { backgroundColor: '#FAF5FF', borderRadius: 8, padding: 10, marginTop: 6 },
  medName: { fontSize: 15, fontWeight: '600', color: '#581C87' },
  medDetail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  medRemaining: { fontSize: 12, color: '#9333EA', marginTop: 2, fontWeight: '600' },
  medRemainingLow: { color: '#DC2626' },
});
