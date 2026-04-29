import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useApp, DoseLog } from '@/context/AppContext';

export default function CaregiverHistory() {
  const { doseLogs } = useApp();
  const sorted = [...doseLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const grouped: Record<string, DoseLog[]> = {};
  sorted.forEach(log => {
    grouped[log.date] = [...(grouped[log.date] ?? []), log];
  });

  const resolved = doseLogs.filter(l => l.status !== 'pending');
  const takenCount = resolved.filter(l => l.status === 'taken').length;
  const adherencePct = resolved.length > 0 ? Math.round((takenCount / resolved.length) * 100) : 0;

  const dotColor = (status: string) =>
    status === 'taken' ? '#16A34A' : status === 'missed' ? '#DC2626' : '#94A3B8';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Margaret's History</Text>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Overall Adherence</Text>
          <Text style={styles.statPct}>{adherencePct}%</Text>
          <View style={styles.statBar}>
            <View style={[styles.statFill, { width: `${adherencePct}%` as `${number}%` }]} />
          </View>
          <Text style={styles.statSub}>{takenCount} of {resolved.length} resolved doses taken</Text>
        </View>

        {Object.entries(grouped).map(([date, logs]) => {
          const dayResolved = logs.filter(l => l.status !== 'pending');
          const dayTaken = logs.filter(l => l.status === 'taken').length;
          const dayPct = dayResolved.length > 0 ? Math.round((dayTaken / dayResolved.length) * 100) : null;

          return (
            <View key={date}>
              <View style={styles.dateRow}>
                <Text style={styles.dateHeader}>
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                {dayPct !== null && (
                  <Text style={[styles.datePct, { color: dayPct >= 80 ? '#16A34A' : dayPct >= 50 ? '#F59E0B' : '#DC2626' }]}>
                    {dayPct}%
                  </Text>
                )}
              </View>
              {logs.map(log => (
                <View key={log.id} style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: dotColor(log.status) }]} />
                  <View style={styles.info}>
                    <Text style={styles.medName}>{log.medicationName}</Text>
                    <Text style={styles.time}>{log.scheduledTime}</Text>
                  </View>
                  <Text style={[styles.status, { color: dotColor(log.status) }]}>
                    {log.status === 'taken' ? `✓ ${log.takenAt}` : log.status === 'missed' ? '✗ Missed' : '○ Pending'}
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
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  scroll: { padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#14532D', marginBottom: 16 },
  statCard: { backgroundColor: '#16A34A', borderRadius: 20, padding: 20, marginBottom: 24 },
  statLabel: { color: '#BBF7D0', fontSize: 13 },
  statPct: { color: '#FFF', fontSize: 40, fontWeight: '800', marginTop: 4 },
  statBar: { height: 8, backgroundColor: '#15803D', borderRadius: 4, marginTop: 12 },
  statFill: { height: 8, backgroundColor: '#86EFAC', borderRadius: 4 },
  statSub: { color: '#BBF7D0', fontSize: 12, marginTop: 8 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  dateHeader: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  datePct: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  info: { flex: 1 },
  medName: { fontSize: 16, fontWeight: '600', color: '#1E3A5F' },
  time: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  status: { fontSize: 13, fontWeight: '600' },
});
