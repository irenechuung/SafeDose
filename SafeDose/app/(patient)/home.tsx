import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Modal,
} from 'react-native';
import { useApp, type DoseLog } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function parseToDate(timeStr: string): Date {
  // Normalize all whitespace variants (iOS uses U+202F narrow no-break space before AM/PM)
  const parts = timeStr.trim().split(/\s+/);
  const [h, m] = parts[0].split(':').map(Number);
  const period = parts[1]?.toUpperCase();
  let hours = h;
  if (period === 'PM' && h !== 12) hours = h + 12;
  if (period === 'AM' && h === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, m, 0, 0);
  return d;
}

type DoseStatus = 'upcoming' | 'due' | 'overdue' | 'taken' | 'missed';

function getDoseStatus(log: DoseLog): DoseStatus {
  if (log.status === 'taken') return 'taken';
  if (log.status === 'missed') return 'missed';
  const scheduled = parseToDate(log.scheduledTime);
  const now = new Date();
  const diffMs = now.getTime() - scheduled.getTime();
  if (diffMs < -60_000) return 'upcoming';
  if (diffMs <= 600_000) return 'due';     // up to 10 min after
  return 'overdue';
}

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

  const [alarmLog, setAlarmLog] = useState<DoseLog | null>(null);
  const [snoozedUntil, setSnoozedUntil] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);
  const notifScheduled = useRef<string>('');

  // Request notification permissions once
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  // Schedule push notifications whenever today's pending logs change
  useEffect(() => {
    const pending = todayLogs.filter(l => l.status === 'pending');
    const key = pending.map(l => l.id).join(',');
    if (key === notifScheduled.current) return;
    notifScheduled.current = key;

    const schedule = async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const now = new Date();
      for (const log of pending) {
        const trigger = parseToDate(log.scheduledTime);
        if (trigger > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '💊 Time to take your medicine',
              body: `${log.medicationName} — ${log.scheduledTime}`,
              sound: true,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
          });
        }
      }
    };
    schedule();
  }, [todayLogs]);

  // Poll every 30s for in-app alarm
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (alarmLog) return;
    const now = Date.now();
    const due = todayLogs.find(log => {
      if (log.status !== 'pending') return false;
      const snooze = snoozedUntil[log.id];
      if (snooze && now < snooze) return false;
      return getDoseStatus(log) === 'due';
    });
    if (due) setAlarmLog(due);
  }, [tick, todayLogs, snoozedUntil]);

  const handleTake = async (log: DoseLog) => {
    await logDose(log.medicationId, log.scheduledTime);
    if (alarmLog?.id === log.id) setAlarmLog(null);
  };

  const handleSnooze = () => {
    if (!alarmLog) return;
    setSnoozedUntil(prev => ({ ...prev, [alarmLog.id]: Date.now() + 15 * 60_000 }));
    setAlarmLog(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Full-screen alarm modal */}
      <Modal visible={!!alarmLog} animationType="slide" statusBarTranslucent>
        <View style={styles.alarmScreen}>
          <Text style={styles.alarmEmoji}>💊</Text>
          <Text style={styles.alarmTitle}>Time for your medicine!</Text>
          {alarmLog && (
            <>
              <Text style={styles.alarmMedName}>{alarmLog.medicationName}</Text>
              {(() => {
                const med = medications.find(m => m.id === alarmLog.medicationId);
                return med ? (
                  <Text style={styles.alarmDosage}>{med.dosage} · {med.pillCount} pill{med.pillCount > 1 ? 's' : ''}</Text>
                ) : null;
              })()}
              <Text style={styles.alarmTime}>{alarmLog.scheduledTime}</Text>
              {(() => {
                const med = medications.find(m => m.id === alarmLog.medicationId);
                return med?.instructions ? (
                  <Text style={styles.alarmNote}>{med.instructions}</Text>
                ) : null;
              })()}
            </>
          )}
          <TouchableOpacity style={styles.alarmTakeBtn} onPress={() => alarmLog && handleTake(alarmLog)}>
            <Text style={styles.alarmTakeBtnText}>✓ I Took It</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.alarmSnoozeBtn} onPress={handleSnooze}>
            <Text style={styles.alarmSnoozeBtnText}>Snooze 15 min</Text>
          </TouchableOpacity>
        </View>
      </Modal>

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
            <Text style={styles.emptySubtext}>Add medications using the Add Med tab.</Text>
          </View>
        )}

        {todayLogs.map(log => {
          const med = medications.find(m => m.id === log.medicationId);
          const status = getDoseStatus(log);
          return (
            <View key={log.id} style={[styles.medCard, status === 'taken' && styles.medCardTaken]}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{log.medicationName}</Text>
                {med && (
                  <Text style={styles.medDosage}>{med.dosage} · {med.pillCount} pill{med.pillCount > 1 ? 's' : ''}</Text>
                )}
                <Text style={styles.medTime}>⏰ {log.scheduledTime}</Text>
                {med?.instructions ? <Text style={styles.medNote}>{med.instructions}</Text> : null}
              </View>
              {status === 'taken' ? (
                <View style={styles.takenBadge}>
                  <Text style={styles.takenText}>✓ Taken{'\n'}{log.takenAt}</Text>
                </View>
              ) : status === 'missed' ? (
                <View style={styles.missedBadge}>
                  <Text style={styles.missedText}>Missed</Text>
                </View>
              ) : status === 'upcoming' ? (
                <View style={styles.upcomingBadge}>
                  <Text style={styles.upcomingText}>{log.scheduledTime}</Text>
                </View>
              ) : status === 'overdue' ? (
                <TouchableOpacity style={styles.overdueButton} onPress={() => handleTake(log)}>
                  <Text style={styles.overdueButtonText}>Overdue{'\n'}Take Now</Text>
                </TouchableOpacity>
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
  emptySubtext: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
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
  upcomingBadge: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  upcomingText: { color: '#94A3B8', fontWeight: '600', fontSize: 12, textAlign: 'center' },
  overdueButton: { backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1.5, borderColor: '#FCA5A5' },
  overdueButtonText: { color: '#DC2626', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  takenBadge: { backgroundColor: '#DCFCE7', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  takenText: { color: '#16A34A', fontWeight: '700', fontSize: 12, textAlign: 'center' },
  missedBadge: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  missedText: { color: '#DC2626', fontWeight: '700', fontSize: 12 },

  // Full-screen alarm
  alarmScreen: {
    flex: 1, backgroundColor: '#1E3A5F',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  alarmEmoji: { fontSize: 80, marginBottom: 16 },
  alarmTitle: { fontSize: 22, fontWeight: '700', color: '#BFDBFE', marginBottom: 24, textAlign: 'center' },
  alarmMedName: { fontSize: 36, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 8 },
  alarmDosage: { fontSize: 18, color: '#93C5FD', fontWeight: '600', marginBottom: 4 },
  alarmTime: { fontSize: 16, color: '#64748B', marginBottom: 12 },
  alarmNote: { fontSize: 14, color: '#94A3B8', textAlign: 'center', fontStyle: 'italic', marginBottom: 8 },
  alarmTakeBtn: {
    backgroundColor: '#16A34A', borderRadius: 20, paddingVertical: 20,
    paddingHorizontal: 48, marginTop: 40,
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  alarmTakeBtnText: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  alarmSnoozeBtn: { marginTop: 20, padding: 12 },
  alarmSnoozeBtnText: { color: '#64748B', fontSize: 15 },
});
