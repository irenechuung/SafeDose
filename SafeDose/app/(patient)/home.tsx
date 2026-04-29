import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useApp, type DoseLog } from '@/context/AppContext';
import { useRouter } from 'expo-router';

export default function PatientHome() {
  const router = useRouter();
  const { profile, medications, doseLogs, logDose } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = doseLogs.filter(l => l.date === today);
  const takenCount = todayLogs.filter(l => l.status === 'taken').length;
  const total = todayLogs.length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  const handleTake = (log: DoseLog) => {
    Alert.alert(
      `Take ${log.medicationName}?`,
      `Confirm you are taking ${log.medicationName} at ${log.scheduledTime}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '✓ I took it', onPress: () => logDose(log.medicationId, log.scheduledTime) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.name}>{firstName} 👋</Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity style={styles.switchBtn} onPress={() => router.replace('/')}>
              <Text style={styles.switchText}>Switch Role</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>{"Today's Progress"}</Text>
          <Text style={styles.progressCount}>{takenCount} / {total} doses taken</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(total > 0 ? (takenCount / total) * 100 : 0)}%` as `${number}%` }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{"Today's Medications"}</Text>

        {todayLogs.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No medications scheduled for today.</Text>
            <Text style={styles.emptySubtext}>Your doctor will add prescriptions here.</Text>
          </View>
        )}

        {todayLogs.map(log => {
          const med = medications.find(m => m.id === log.medicationId);
          return (
            <View key={log.id} style={[styles.medCard, log.status === 'taken' ? styles.medCardTaken : null]}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{log.medicationName}</Text>
                {med && (
                  <Text style={styles.medDosage}>{med.dosage} · {med.pillCount} pill{med.pillCount > 1 ? 's' : ''}</Text>
                )}
                <Text style={styles.medTime}>⏰ {log.scheduledTime}</Text>
                {med?.instructions ? <Text style={styles.medNote}>{med.instructions}</Text> : null}
              </View>
              {log.status === 'taken' ? (
                <View style={styles.takenBadge}>
                  <Text style={styles.takenText}>✓ Taken{'\n'}{log.takenAt}</Text>
                </View>
              ) : log.status === 'missed' ? (
                <View style={styles.missedBadge}>
                  <Text style={styles.missedText}>Missed</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.takeButton} onPress={() => handleTake(log)}>
                  <Text style={styles.takeButtonText}>Take Now</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' },
  scroll: { padding: 20 },
  header: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 18, color: '#64748B' },
  name: { fontSize: 32, fontWeight: '800', color: '#1E3A5F' },
  date: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  switchBtn: { backgroundColor: '#E2E8F0', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, marginTop: 4 },
  switchText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  progressCard: { backgroundColor: '#2563EB', borderRadius: 20, padding: 20, marginBottom: 24 },
  progressLabel: { color: '#BFDBFE', fontSize: 13 },
  progressCount: { color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 4 },
  progressBar: { height: 8, backgroundColor: '#1D4ED8', borderRadius: 4, marginTop: 12 },
  progressFill: { height: 8, backgroundColor: '#93C5FD', borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A5F', marginBottom: 12 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1E3A5F' },
  emptySubtext: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  medCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  medCardTaken: { opacity: 0.6 },
  medInfo: { flex: 1, marginRight: 12 },
  medName: { fontSize: 20, fontWeight: '700', color: '#1E3A5F' },
  medDosage: { fontSize: 13, color: '#2563EB', fontWeight: '600', marginTop: 2 },
  medTime: { fontSize: 13, color: '#64748B', marginTop: 4 },
  medNote: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontStyle: 'italic' },
  takeButton: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  takeButtonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  takenBadge: { backgroundColor: '#DCFCE7', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  takenText: { color: '#16A34A', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  missedBadge: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  missedText: { color: '#DC2626', fontWeight: '700', fontSize: 12 },
});
