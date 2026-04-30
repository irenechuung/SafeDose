import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useApp, type DoseLog } from '@/context/AppContext';
import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { verifyMedication } from '@/lib/anthropic';

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
  if (diffMs <= 600_000) return 'due';
  return 'overdue';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

type VerifyState = { step: 'idle' | 'scanning' | 'done'; match?: boolean; message?: string };

const REFILL_THRESHOLD = 7;

export default function PatientHome() {
  const { profile, medications, doseLogs, logDose, deleteMedication } = useApp();

  const handleRemoveMed = (medicationId: string, name: string) => {
    Alert.alert(
      'Remove Medication',
      `Remove ${name} from your schedule? This will also delete all its dose logs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteMedication(medicationId) },
      ]
    );
  };

  const today = new Date().toISOString().split('T')[0];

  // Deduplicate dose logs per slot — duplicate documents can exist due to a Firestore
  // race condition on first load. Prefer 'taken' over anything else; otherwise first seen.
  const todayLogs = (() => {
    const raw = doseLogs.filter(l => l.date === today);
    const best = new Map<string, DoseLog>();
    for (const log of raw) {
      const key = `${log.medicationId}-${log.scheduledTime}`;
      const prev = best.get(key);
      if (!prev || (log.status === 'taken' && prev.status !== 'taken')) {
        best.set(key, log);
      }
    }
    return Array.from(best.values());
  })();

  const takenCount = todayLogs.filter(l => l.status === 'taken').length;
  const total = todayLogs.length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  const [alarmLog, setAlarmLog] = useState<DoseLog | null>(null);
  const [snoozedUntil, setSnoozedUntil] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);
  const notifScheduled = useRef<string>('');

  const [alarmVerify, setAlarmVerify] = useState<VerifyState>({ step: 'idle' });
  const [cardVerifyLog, setCardVerifyLog] = useState<DoseLog | null>(null);
  const [cardVerify, setCardVerify] = useState<VerifyState>({ step: 'idle' });

  // Tracks which medication IDs have already triggered a refill alert this session
  const refillAlerted = useRef(new Set<string>());

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

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

  // Refill alert: notify when any medication's supply drops to REFILL_THRESHOLD or below
  useEffect(() => {
    medications.forEach(med => {
      if (med.remainingPills <= REFILL_THRESHOLD && !refillAlerted.current.has(med.id)) {
        refillAlerted.current.add(med.id);
        Notifications.scheduleNotificationAsync({
          content: {
            title: '⚠️ Refill needed',
            body: `${med.name} has only ${med.remainingPills} pill${med.remainingPills !== 1 ? 's' : ''} left — time to refill`,
            sound: true,
          },
          trigger: null,
        });
      }
    });
  }, [medications]);

  const handleTake = async (log: DoseLog) => {
    await logDose(log.medicationId, log.scheduledTime);
    if (alarmLog?.id === log.id) {
      setAlarmLog(null);
      setAlarmVerify({ step: 'idle' });
    }
    if (cardVerifyLog?.id === log.id) {
      setCardVerifyLog(null);
      setCardVerify({ step: 'idle' });
    }
  };

  const handleSnooze = () => {
    if (!alarmLog) return;
    setSnoozedUntil(prev => ({ ...prev, [alarmLog.id]: Date.now() + 15 * 60_000 }));
    setAlarmLog(null);
    setAlarmVerify({ step: 'idle' });
  };

  const handleAlarmVerify = async (log: DoseLog) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera needed', 'Allow camera access to verify your medication.');
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (picked.canceled || !picked.assets[0]) return;

    setAlarmVerify({ step: 'scanning' });
    try {
      const asset = picked.assets[0];
      const mimeType = (asset.mimeType?.startsWith('image/png') ? 'image/png' : 'image/jpeg') as 'image/jpeg' | 'image/png';
      const med = medications.find(m => m.id === log.medicationId);
      const res = await verifyMedication(asset.base64!, mimeType, log.medicationName, med?.dosage ?? '');
      setAlarmVerify({ step: 'done', match: res.match, message: res.message });
    } catch {
      setAlarmVerify({ step: 'idle' });
      Alert.alert('Could not verify', 'Scan failed. Check the label manually.');
    }
  };

  const handleCardVerify = async (log: DoseLog) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera needed', 'Allow camera access to verify your medication.');
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (picked.canceled || !picked.assets[0]) return;

    setCardVerifyLog(log);
    setCardVerify({ step: 'scanning' });
    try {
      const asset = picked.assets[0];
      const mimeType = (asset.mimeType?.startsWith('image/png') ? 'image/png' : 'image/jpeg') as 'image/jpeg' | 'image/png';
      const med = medications.find(m => m.id === log.medicationId);
      const res = await verifyMedication(asset.base64!, mimeType, log.medicationName, med?.dosage ?? '');
      setCardVerify({ step: 'done', match: res.match, message: res.message });
    } catch {
      setCardVerifyLog(null);
      setCardVerify({ step: 'idle' });
      Alert.alert('Could not verify', 'Scan failed. Check the label manually.');
    }
  };

  const pastLogs = doseLogs.filter(l => l.date !== today);
  const sortedPast = [...pastLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const groupedPast: Record<string, DoseLog[]> = {};
  sortedPast.forEach(log => {
    groupedPast[log.date] = [...(groupedPast[log.date] ?? []), log];
  });

  const resolved = doseLogs.filter(l => l.status !== 'pending');
  const takenResolved = resolved.filter(l => l.status === 'taken').length;
  const adherencePct = resolved.length > 0 ? Math.round((takenResolved / resolved.length) * 100) : 100;

  const dotColor = (status: string) =>
    status === 'taken' ? '#16A34A' : status === 'missed' ? '#DC2626' : '#94A3B8';

  return (
    <SafeAreaView style={styles.container}>
      {/* Full-screen alarm modal — large text designed for aging eyes */}
      <Modal visible={!!alarmLog} animationType="slide" statusBarTranslucent>
        <View style={styles.alarmScreen}>
          {alarmVerify.step === 'scanning' ? (
            <>
              <ActivityIndicator size="large" color="#93C5FD" />
              <Text style={styles.alarmVerifyingText}>Checking bottle label...</Text>
            </>
          ) : (
            <>
              <Text style={styles.alarmEmoji}>💊</Text>
              <Text style={styles.alarmTitle}>Time for your medicine</Text>

              {alarmLog && (() => {
                const med = medications.find(m => m.id === alarmLog.medicationId);
                return (
                  <>
                    <Text style={styles.alarmMedName}>{alarmLog.medicationName}</Text>
                    {med && (
                      <View style={styles.alarmInfoRow}>
                        <View style={styles.alarmInfoChip}>
                          <Text style={styles.alarmInfoChipNum}>{med.pillCount}</Text>
                          <Text style={styles.alarmInfoChipLabel}>pill{med.pillCount !== 1 ? 's' : ''}</Text>
                        </View>
                        <View style={styles.alarmInfoChip}>
                          <Text style={styles.alarmInfoChipNum}>{med.dosage}</Text>
                          <Text style={styles.alarmInfoChipLabel}>dose</Text>
                        </View>
                      </View>
                    )}
                    <Text style={styles.alarmTime}>{alarmLog.scheduledTime}</Text>
                    {med?.instructions ? (
                      <Text style={styles.alarmNote}>{med.instructions}</Text>
                    ) : null}
                  </>
                );
              })()}

              {/* Verify result banner — shown after scanning */}
              {alarmVerify.step === 'done' && (
                <View style={[styles.verifyBanner, alarmVerify.match ? styles.verifyBannerOk : styles.verifyBannerWarn]}>
                  <Text style={styles.verifyBannerTitle}>
                    {alarmVerify.match ? '✓ Correct medication' : '⚠ Wrong bottle — check label'}
                  </Text>
                  {alarmVerify.message ? (
                    <Text style={styles.verifyBannerSub}>{alarmVerify.message}</Text>
                  ) : null}
                </View>
              )}

              {/* Before scanning: camera button is the primary action */}
              {alarmVerify.step === 'idle' && alarmLog && (
                <TouchableOpacity style={styles.alarmTakeBtn} onPress={() => handleAlarmVerify(alarmLog)}>
                  <Text style={styles.alarmTakeBtnText}>📷  Scan Bottle to Take</Text>
                </TouchableOpacity>
              )}

              {/* After scanning: confirm button unlocks */}
              {alarmVerify.step === 'done' && alarmLog && (
                <TouchableOpacity style={styles.alarmTakeBtn} onPress={() => handleTake(alarmLog)}>
                  <Text style={styles.alarmTakeBtnText}>✓  I Took It</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.alarmSnoozeBtn} onPress={handleSnooze}>
                <Text style={styles.alarmSnoozeBtnText}>Snooze 15 min</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      {/* Card verify modal — used from inline dose cards */}
      <Modal visible={!!cardVerifyLog} animationType="fade" transparent>
        <View style={styles.cardVerifyOverlay}>
          <View style={styles.cardVerifyBox}>
            {cardVerify.step === 'scanning' ? (
              <>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.cardVerifyingText}>Checking bottle label...</Text>
              </>
            ) : cardVerify.step === 'done' ? (
              <>
                <Text style={styles.cardVerifyResultIcon}>{cardVerify.match ? '✅' : '⚠️'}</Text>
                <Text style={styles.cardVerifyResultTitle}>
                  {cardVerify.match ? 'Correct medication' : 'Check the label'}
                </Text>
                {cardVerify.message ? (
                  <Text style={styles.cardVerifyResultMsg}>{cardVerify.message}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.cardVerifyTakeBtn}
                  onPress={() => cardVerifyLog && handleTake(cardVerifyLog)}>
                  <Text style={styles.cardVerifyTakeBtnText}>✓ Take It</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cardVerifyDismissBtn}
                  onPress={() => { setCardVerifyLog(null); setCardVerify({ step: 'idle' }); }}>
                  <Text style={styles.cardVerifyDismissText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{firstName} 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Today's progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>{"Today's Progress"}</Text>
          <Text style={styles.progressCount}>{takenCount} / {total} doses taken</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(total > 0 ? (takenCount / total) * 100 : 0)}%` as `${number}%` }]} />
          </View>
          {resolved.length > 0 && (
            <Text style={styles.progressAdherence}>{adherencePct}% overall adherence</Text>
          )}
        </View>

        {/* Today's doses */}
        <Text style={styles.sectionTitle}>Today</Text>

        {todayLogs.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No medications scheduled today.</Text>
            <Text style={styles.emptySubtext}>Add medications using the Add Med tab.</Text>
          </View>
        )}

        {todayLogs.map(log => {
          const med = medications.find(m => m.id === log.medicationId);
          const status = getDoseStatus(log);
          const pillsLow = med?.remainingPills !== undefined && med.remainingPills <= REFILL_THRESHOLD;
          const pillsWarn = med?.remainingPills !== undefined && med.remainingPills < 15 && !pillsLow;
          return (
            <View key={log.id} style={[styles.medCard, status === 'taken' && styles.medCardTaken]}>
              <View style={styles.medInfo}>
                <View style={styles.medNameRow}>
                  <Text style={styles.medName}>{log.medicationName}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveMed(log.medicationId, log.medicationName)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
                {med && (
                  <Text style={styles.medDosage}>{med.dosage} · {med.pillCount} pill{med.pillCount > 1 ? 's' : ''}</Text>
                )}
                <Text style={styles.medTime}>⏰ {log.scheduledTime}</Text>
                {med?.remainingPills !== undefined && (
                  <Text style={[
                    styles.pillsLeft,
                    pillsLow ? styles.pillsLeftCritical : pillsWarn ? styles.pillsLeftLow : null,
                  ]}>
                    {pillsLow ? `⚠ ${med.remainingPills} pills left — refill soon` : `${med.remainingPills} pills remaining`}
                  </Text>
                )}
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
                <TouchableOpacity style={styles.overdueButton} onPress={() => handleCardVerify(log)}>
                  <Text style={styles.overdueButtonText}>Overdue{'\n'}Take Now</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.takeButton} onPress={() => handleCardVerify(log)}>
                  <Text style={styles.takeButtonText}>Take Now</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Past history */}
        {Object.keys(groupedPast).length > 0 && (
          <>
            <View style={styles.historyDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Past Doses</Text>
              <View style={styles.dividerLine} />
            </View>

            {Object.entries(groupedPast).map(([date, logs]) => {
              const dayResolved = logs.filter(l => l.status !== 'pending');
              const dayTaken = logs.filter(l => l.status === 'taken').length;
              const dayPct = dayResolved.length > 0 ? Math.round((dayTaken / dayResolved.length) * 100) : null;

              return (
                <View key={date}>
                  <View style={styles.dateRow}>
                    <Text style={styles.dateHeader}>{formatDate(date)}</Text>
                    {dayPct !== null && (
                      <Text style={[styles.datePct, {
                        color: dayPct >= 80 ? '#16A34A' : dayPct >= 50 ? '#F59E0B' : '#DC2626',
                      }]}>
                        {dayPct}%
                      </Text>
                    )}
                  </View>
                  {logs.map(log => (
                    <View key={log.id} style={styles.pastRow}>
                      <View style={[styles.pastDot, { backgroundColor: dotColor(log.status) }]} />
                      <View style={styles.pastInfo}>
                        <Text style={styles.pastMedName}>{log.medicationName}</Text>
                        <Text style={styles.pastTime}>{log.scheduledTime}</Text>
                      </View>
                      <Text style={[styles.pastStatus, { color: dotColor(log.status) }]}>
                        {log.status === 'taken' ? `✓ ${log.takenAt}` : log.status === 'missed' ? '✗ Missed' : '○ Pending'}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' },
  scroll: { padding: 20, paddingBottom: 48 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 18, color: '#64748B' },
  name: { fontSize: 32, fontWeight: '800', color: '#1E3A5F' },
  date: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  progressCard: { backgroundColor: '#2563EB', borderRadius: 20, padding: 20, marginBottom: 24 },
  progressLabel: { color: '#BFDBFE', fontSize: 13 },
  progressCount: { color: '#FFF', fontSize: 26, fontWeight: '800', marginTop: 4 },
  progressBar: { height: 8, backgroundColor: '#1D4ED8', borderRadius: 4, marginTop: 12 },
  progressFill: { height: 8, backgroundColor: '#93C5FD', borderRadius: 4 },
  progressAdherence: { color: '#BFDBFE', fontSize: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A5F', marginBottom: 12 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#1E3A5F' },
  emptySubtext: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
  medCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  medCardTaken: { opacity: 0.6 },
  medInfo: { flex: 1, marginRight: 12 },
  medNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: -4 },
  medName: { fontSize: 20, fontWeight: '700', color: '#1E3A5F', flex: 1 },
  removeBtn: { fontSize: 14, color: '#CBD5E1', paddingLeft: 8 },
  medDosage: { fontSize: 13, color: '#2563EB', fontWeight: '600', marginTop: 2 },
  medTime: { fontSize: 13, color: '#64748B', marginTop: 4 },
  pillsLeft: { fontSize: 12, color: '#64748B', marginTop: 2 },
  pillsLeftLow: { color: '#F59E0B', fontWeight: '600' },
  pillsLeftCritical: { color: '#DC2626', fontWeight: '700' },
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

  // History section
  historyDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginTop: 12 },
  dateHeader: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  datePct: { fontSize: 13, fontWeight: '700' },
  pastRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 6 },
  pastDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  pastInfo: { flex: 1 },
  pastMedName: { fontSize: 14, fontWeight: '600', color: '#1E3A5F' },
  pastTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  pastStatus: { fontSize: 12, fontWeight: '600' },

  // Alarm modal — extra-large typography for aging eyes
  alarmScreen: {
    flex: 1, backgroundColor: '#0F2044',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  alarmEmoji: { fontSize: 72, marginBottom: 8 },
  alarmTitle: { fontSize: 20, fontWeight: '600', color: '#93C5FD', marginBottom: 20, textAlign: 'center', letterSpacing: 0.5 },
  alarmMedName: { fontSize: 52, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 16, lineHeight: 58 },
  alarmInfoRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  alarmInfoChip: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', minWidth: 90,
  },
  alarmInfoChipNum: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  alarmInfoChipLabel: { fontSize: 13, color: '#93C5FD', fontWeight: '600', marginTop: 2 },
  alarmTime: { fontSize: 30, fontWeight: '700', color: '#FFF', marginBottom: 8, letterSpacing: 1 },
  alarmNote: { fontSize: 16, color: '#93C5FD', textAlign: 'center', fontStyle: 'italic', marginBottom: 8, lineHeight: 22 },
  alarmVerifyingText: { fontSize: 20, fontWeight: '600', color: '#93C5FD', marginTop: 24, textAlign: 'center' },
  alarmTakeBtn: {
    backgroundColor: '#16A34A', borderRadius: 24, paddingVertical: 24,
    paddingHorizontal: 56, marginTop: 24, width: '100%', alignItems: 'center',
    shadowColor: '#16A34A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 10,
  },
  alarmTakeBtnText: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  alarmSnoozeBtn: { marginTop: 20, padding: 12 },
  alarmSnoozeBtnText: { color: '#64748B', fontSize: 16 },

  // Verify result banner inside alarm modal
  verifyBanner: {
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20, marginTop: 16,
    width: '100%', alignItems: 'center',
  },
  verifyBannerOk: { backgroundColor: 'rgba(22,163,74,0.2)', borderWidth: 1, borderColor: 'rgba(22,163,74,0.4)' },
  verifyBannerWarn: { backgroundColor: 'rgba(220,38,38,0.2)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.4)' },
  verifyBannerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  verifyBannerSub: { fontSize: 13, color: '#CBD5E1', textAlign: 'center', marginTop: 4 },

  // Card verify modal
  cardVerifyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  cardVerifyBox: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 32, width: '100%',
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  cardVerifyingText: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', marginTop: 16 },
  cardVerifyResultIcon: { fontSize: 52, marginBottom: 12 },
  cardVerifyResultTitle: { fontSize: 22, fontWeight: '800', color: '#1E3A5F', textAlign: 'center', marginBottom: 8 },
  cardVerifyResultMsg: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  cardVerifyTakeBtn: {
    backgroundColor: '#16A34A', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40,
    width: '100%', alignItems: 'center', marginBottom: 10,
  },
  cardVerifyTakeBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  cardVerifyDismissBtn: { padding: 10 },
  cardVerifyDismissText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
});
