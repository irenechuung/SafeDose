import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';

export default function DoctorPatients() {
  const router = useRouter();
  const { medications, doseLogs, profile } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const doctorName = profile ? `Dr. ${profile.name}` : 'Doctor';
  const patients = [...new Set(medications.map(m => m.patientName))];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Patients</Text>
            <Text style={styles.subtitle}>{doctorName}</Text>
          </View>
          <TouchableOpacity style={styles.switchBtn} onPress={() => router.replace('/')}>
            <Text style={styles.switchText}>Switch Role</Text>
          </TouchableOpacity>
        </View>

        {patients.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No patients yet.</Text>
            <Text style={styles.emptySubtext}>Use the Prescribe tab to add your first prescription.</Text>
          </View>
        )}

        {patients.map(name => {
          const patientMeds = medications.filter(m => m.patientName === name);
          const patientMedIds = new Set(patientMeds.map(m => m.id));
          const patientTodayLogs = doseLogs.filter(l => l.date === today && patientMedIds.has(l.medicationId));
          const taken = patientTodayLogs.filter(l => l.status === 'taken').length;
          const patientEmail = patientMeds[0]?.patientEmail ?? '';

          return (
            <View key={name} style={styles.patientCard}>
              <View style={styles.patientHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{name}</Text>
                  <Text style={styles.patientEmail}>{patientEmail}</Text>
                  <Text style={styles.patientMeta}>
                    {patientMeds.length} medication{patientMeds.length !== 1 ? 's' : ''} · {taken}/{patientTodayLogs.length} taken today
                  </Text>
                </View>
              </View>
              {patientMeds.map(med => (
                <View key={med.id} style={styles.medRow}>
                  <View style={styles.medRowHeader}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={[styles.medRemaining, med.remainingPills < 15 ? styles.medRemainingLow : null]}>
                      {med.remainingPills} left{med.remainingPills < 15 ? ' ⚠' : ''}
                    </Text>
                  </View>
                  <Text style={styles.medDetail}>{med.dosage} · {med.times.join(', ')}</Text>
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
  emptyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#1E3A5F' },
  emptySubtext: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
  patientCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  patientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#9333EA', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  patientName: { fontSize: 17, fontWeight: '700', color: '#1E3A5F' },
  patientEmail: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  patientMeta: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  medRow: { backgroundColor: '#FAF5FF', borderRadius: 10, padding: 10, marginTop: 6 },
  medRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medName: { fontSize: 14, fontWeight: '700', color: '#581C87' },
  medDetail: { fontSize: 12, color: '#64748B', marginTop: 3 },
  medRemaining: { fontSize: 12, color: '#9333EA', fontWeight: '600' },
  medRemainingLow: { color: '#DC2626' },
});
