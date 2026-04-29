import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useApp } from '@/context/AppContext';

export default function CaregiverDashboard() {
  const { profile, patients, medications, doseLogs, signOut } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const todayLogs = doseLogs.filter(l => l.date === today);
  const takenCount = todayLogs.filter(l => l.status === 'taken').length;
  const totalCount = todayLogs.length;
  const adherencePct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  const missedLogs = todayLogs.filter(l => l.status === 'missed');
  const lowMeds = medications.filter(m => m.remainingPills < 15);

  // Per-patient summary
  const patientSummaries = patients.map(patient => {
    const patientLogs = todayLogs.filter(l => l.patientUid === patient.uid);
    const taken = patientLogs.filter(l => l.status === 'taken').length;
    const total = patientLogs.length;
    const missed = patientLogs.filter(l => l.status === 'missed').length;
    const patientMeds = medications.filter(m => m.patientUid === patient.uid);
    const lowSupply = patientMeds.filter(m => m.remainingPills < 15).length;
    return { patient, taken, total, missed, lowSupply };
  });

  const patientsWithIssues = patientSummaries.filter(s => s.missed > 0 || s.lowSupply > 0);
  const patientsAllGood = patientSummaries.filter(s => s.missed === 0 && s.lowSupply === 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Overview</Text>
            <Text style={styles.subtitle}>
              {profile?.name} · {patients.length} patient{patients.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Aggregate adherence card */}
        <View style={styles.adherenceCard}>
          <Text style={styles.adherenceLabel}>Today's Adherence — All Patients</Text>
          <Text style={styles.adherenceCount}>{takenCount}/{totalCount} doses taken</Text>
          <View style={styles.adherenceBar}>
            <View style={[styles.adherenceFill, { width: `${adherencePct}%` as `${number}%` }]} />
          </View>
          {patients.length === 0 ? (
            <Text style={styles.adherenceSub}>No patients linked yet</Text>
          ) : adherencePct === 100 && totalCount > 0 ? (
            <Text style={styles.adherenceSub}>✓ All patients on track</Text>
          ) : (
            <Text style={styles.adherenceSub}>{adherencePct}% adherence today</Text>
          )}
        </View>

        {/* No patients state */}
        {patients.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🫂</Text>
            <Text style={styles.emptyTitle}>No patients yet</Text>
            <Text style={styles.emptyDesc}>
              Ask your patients to link to you using your email address ({profile?.email}) in their SafeDose app under Settings.
            </Text>
          </View>
        )}

        {/* Patients needing attention */}
        {patientsWithIssues.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>⚠️ Needs Attention</Text>
            {patientsWithIssues.map(s => (
              <View key={s.patient.uid} style={styles.alertPatientCard}>
                <View style={styles.patientAvatarSmall}>
                  <Text style={styles.patientAvatarText}>{s.patient.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{s.patient.name}</Text>
                  <View style={styles.issueRow}>
                    {s.missed > 0 && (
                      <View style={styles.issueBadge}>
                        <Text style={styles.issueText}>✗ {s.missed} missed</Text>
                      </View>
                    )}
                    {s.lowSupply > 0 && (
                      <View style={[styles.issueBadge, styles.warnBadge]}>
                        <Text style={[styles.issueText, { color: '#92400E' }]}>💊 Low supply</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.patientDoseCount}>{s.taken}/{s.total}</Text>
              </View>
            ))}
          </View>
        )}

        {/* All-good patients */}
        {patientsAllGood.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>✓ On Track</Text>
            {patientsAllGood.map(s => (
              <View key={s.patient.uid} style={styles.goodPatientCard}>
                <View style={styles.patientAvatarSmall}>
                  <Text style={styles.patientAvatarText}>{s.patient.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{s.patient.name}</Text>
                  <Text style={styles.patientSub}>{s.total > 0 ? `${s.taken}/${s.total} doses taken today` : 'No medications scheduled today'}</Text>
                </View>
                <View style={styles.goodBadge}>
                  <Text style={styles.goodBadgeText}>✓</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Low supply alert */}
        {lowMeds.length > 0 && (
          <View style={styles.refillCard}>
            <Text style={styles.refillTitle}>💊 Refill Soon</Text>
            {lowMeds.map(med => (
              <Text key={med.id} style={styles.refillRow}>
                {med.patientName} · {med.name} — {med.remainingPills} pills left
              </Text>
            ))}
          </View>
        )}

        {/* Today's missed doses detail */}
        {missedLogs.length > 0 && (
          <View style={styles.missedCard}>
            <Text style={styles.missedTitle}>✗ Missed Doses Today</Text>
            {missedLogs.map(log => (
              <Text key={log.id} style={styles.missedRow}>
                {patients.find(p => p.uid === log.patientUid)?.name ?? 'Patient'} · {log.medicationName} at {log.scheduledTime}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#14532D' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
  signOutBtn: { backgroundColor: '#DCFCE7', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 },
  signOutText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  adherenceCard: { backgroundColor: '#16A34A', borderRadius: 20, padding: 20, marginBottom: 20 },
  adherenceLabel: { color: '#BBF7D0', fontSize: 13 },
  adherenceCount: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: 4 },
  adherenceBar: { height: 8, backgroundColor: '#15803D', borderRadius: 4, marginTop: 12 },
  adherenceFill: { height: 8, backgroundColor: '#86EFAC', borderRadius: 4 },
  adherenceSub: { color: '#BBF7D0', fontSize: 12, marginTop: 8 },
  emptyCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 28, alignItems: 'center',
    marginBottom: 16,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A5F', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#14532D', marginBottom: 10, marginTop: 4 },
  alertPatientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FEF2F2', borderRadius: 16, padding: 14, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: '#EF4444',
  },
  goodPatientCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  patientAvatarSmall: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center',
  },
  patientAvatarText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  patientName: { fontSize: 15, fontWeight: '700', color: '#1E3A5F' },
  patientSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  patientDoseCount: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
  issueRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  issueBadge: { backgroundColor: '#FEE2E2', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 },
  warnBadge: { backgroundColor: '#FEF3C7' },
  issueText: { fontSize: 11, fontWeight: '600', color: '#991B1B' },
  goodBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#DCFCE7',
    alignItems: 'center', justifyContent: 'center',
  },
  goodBadgeText: { color: '#16A34A', fontWeight: '700', fontSize: 14 },
  refillCard: { backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#F59E0B', marginTop: 8 },
  refillTitle: { fontSize: 15, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  refillRow: { fontSize: 13, color: '#78350F', marginBottom: 4 },
  missedCard: { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#EF4444', marginTop: 4 },
  missedTitle: { fontSize: 15, fontWeight: '700', color: '#991B1B', marginBottom: 8 },
  missedRow: { fontSize: 13, color: '#7F1D1D', marginBottom: 4 },
});
