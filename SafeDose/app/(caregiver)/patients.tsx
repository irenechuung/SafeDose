import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  Modal, TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useState } from 'react';
import { useApp, type Medication, type PatientProfile, type DoseLog } from '@/context/AppContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function CaregiverPatients() {
  const { patients, medications, doseLogs, updateMedication, deleteMedication } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);

  // Inline edit state — lives inside the patient detail modal, no nested Modal needed
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [editPills, setEditPills] = useState('');
  const [editTimes, setEditTimes] = useState<string[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTime, setPickerTime] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const formatTime = (date: Date): string => {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const period = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m} ${period}`;
  };

  const onPickerChange = (e: DateTimePickerEvent, date?: Date) => {
    if (!date) return;
    setPickerTime(date);
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (e.type !== 'dismissed') {
        const label = formatTime(date);
        if (!editTimes.includes(label)) setEditTimes(prev => [...prev, label]);
      }
    }
  };

  const confirmIOSTime = () => {
    const label = formatTime(pickerTime);
    if (!editTimes.includes(label)) setEditTimes(prev => [...prev, label]);
    setShowTimePicker(false);
  };

  const openEdit = (med: Medication) => {
    setEditingMedId(med.id);
    setEditPills(String(med.remainingPills));
    setEditTimes([...med.times]);
  };

  const cancelEdit = () => {
    setEditingMedId(null);
    setShowTimePicker(false);
  };

  const saveEdit = async (med: Medication) => {
    if (editTimes.length === 0) {
      Alert.alert('Schedule required', 'Add at least one reminder time.'); return;
    }
    setSaving(true);
    try {
      await updateMedication(med.id, {
        remainingPills: Math.max(0, parseInt(editPills) || 0),
        times: editTimes,
      });
      setEditingMedId(null);
    } catch {
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (med: Medication) => {
    Alert.alert(
      'Remove Medication',
      `Remove ${med.name} from this patient's schedule?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            if (editingMedId === med.id) setEditingMedId(null);
            try {
              await deleteMedication(med.id);
            } catch {
              Alert.alert('Error', 'Could not remove medication.');
            }
          },
        },
      ]
    );
  };

  const dotColor = (status: string) =>
    status === 'taken' ? '#16A34A' : status === 'missed' ? '#DC2626' : '#94A3B8';

  const formatDate = (d: string) => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (d === yesterday) return 'Yesterday';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Patients</Text>
        <Text style={styles.subtitle}>{patients.length} patient{patients.length !== 1 ? 's' : ''} linked</Text>

        {patients.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyTitle}>No patients yet</Text>
            <Text style={styles.emptyDesc}>Patients link to you using your email in their Settings tab.</Text>
          </View>
        )}

        {patients.map(patient => {
          const patientLogs = doseLogs.filter(l => l.patientUid === patient.uid && l.date === today);
          const taken = patientLogs.filter(l => l.status === 'taken').length;
          const total = patientLogs.length;
          const missed = patientLogs.filter(l => l.status === 'missed').length;
          const patientMeds = medications.filter(m => m.patientUid === patient.uid);
          const lowPills = patientMeds.filter(m => m.remainingPills < 15);

          return (
            <TouchableOpacity
              key={patient.uid}
              style={styles.patientCard}
              onPress={() => { setEditingMedId(null); setSelectedPatient(patient); }}
              activeOpacity={0.85}>
              <View style={styles.patientCardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{patient.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientEmail}>{patient.email}</Text>
                </View>
                <View style={[styles.adherencePill, missed > 0 && styles.adherencePillBad]}>
                  <Text style={[styles.adherencePillText, missed > 0 && { color: '#DC2626' }]}>
                    {total > 0 ? `${taken}/${total}` : '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{patientMeds.length}</Text>
                  <Text style={styles.statLabel}>Medications</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statNum, missed > 0 && { color: '#DC2626' }]}>{missed}</Text>
                  <Text style={styles.statLabel}>Missed today</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statNum, lowPills.length > 0 && { color: '#F59E0B' }]}>{lowPills.length}</Text>
                  <Text style={styles.statLabel}>Low supply</Text>
                </View>
              </View>

              {patientLogs.slice(0, 3).map(log => (
                <View key={log.id} style={styles.miniLogRow}>
                  <View style={[styles.miniDot, { backgroundColor: dotColor(log.status) }]} />
                  <Text style={styles.miniLogName}>{log.medicationName}</Text>
                  <Text style={styles.miniLogTime}>{log.scheduledTime}</Text>
                  <Text style={[styles.miniLogStatus, { color: dotColor(log.status) }]}>
                    {log.status === 'taken' ? '✓' : log.status === 'missed' ? '✗' : '○'}
                  </Text>
                </View>
              ))}
              {patientLogs.length > 3 && (
                <Text style={styles.moreText}>+{patientLogs.length - 3} more · tap to view all</Text>
              )}
              <Text style={styles.tapToManage}>Tap to manage medications →</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Single patient detail modal — edit is inline, no nested modal */}
      <Modal visible={!!selectedPatient} animationType="slide" presentationStyle="pageSheet">
        {selectedPatient && (() => {
          const patientMeds = medications.filter(m => m.patientUid === selectedPatient.uid);
          const allPatientLogs = doseLogs.filter(l => l.patientUid === selectedPatient.uid);
          const patientLogs = allPatientLogs.filter(l => l.date === today);
          const resolved = allPatientLogs.filter(l => l.status !== 'pending');
          const takenAll = resolved.filter(l => l.status === 'taken').length;
          const adherence = resolved.length > 0 ? Math.round((takenAll / resolved.length) * 100) : 0;

          const pastLogs = allPatientLogs.filter(l => l.date !== today);
          const sortedPast = [...pastLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const groupedPast: Record<string, DoseLog[]> = {};
          sortedPast.forEach(l => { groupedPast[l.date] = [...(groupedPast[l.date] ?? []), l]; });

          return (
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalPatientName}>{selectedPatient.name}</Text>
                  <Text style={styles.modalPatientEmail}>{selectedPatient.email}</Text>
                </View>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { cancelEdit(); setSelectedPatient(null); }}>
                  <Text style={styles.modalCloseText}>Done</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
                {/* Adherence */}
                <View style={styles.modalAdherenceCard}>
                  <Text style={styles.modalAdherenceLabel}>Overall Adherence</Text>
                  <Text style={styles.modalAdherencePct}>{adherence}%</Text>
                  <View style={styles.modalAdherenceBar}>
                    <View style={[styles.modalAdherenceFill, { width: `${adherence}%` as `${number}%` }]} />
                  </View>
                  <Text style={styles.modalAdherenceSub}>{takenAll} of {resolved.length} resolved doses taken</Text>
                </View>

                {/* Today's doses */}
                <Text style={styles.modalSection}>Today's Doses</Text>
                {patientLogs.length === 0 && <Text style={styles.noneText}>No doses scheduled today.</Text>}
                {patientLogs.map(log => (
                  <View key={log.id} style={styles.logRow}>
                    <View style={[styles.dot, { backgroundColor: dotColor(log.status) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logMed}>{log.medicationName}</Text>
                      <Text style={styles.logTime}>{log.scheduledTime}</Text>
                    </View>
                    <Text style={[styles.logStatus, { color: dotColor(log.status) }]}>
                      {log.status === 'taken' ? `✓ ${log.takenAt}` : log.status === 'missed' ? '✗ Missed' : '○ Pending'}
                    </Text>
                  </View>
                ))}

                {/* Medications — inline edit */}
                <Text style={styles.modalSection}>Medications</Text>
                {patientMeds.length === 0 && <Text style={styles.noneText}>No medications added yet.</Text>}
                {patientMeds.map(med => {
                  const isEditing = editingMedId === med.id;
                  return (
                    <View key={med.id} style={[styles.medCard, isEditing && styles.medCardEditing]}>
                      {isEditing ? (
                        /* ── Inline edit form ── */
                        <View>
                          <Text style={styles.editingMedName}>{med.name}</Text>

                          <Text style={styles.editLabel}>Pills remaining</Text>
                          <TextInput
                            style={styles.editInput}
                            value={editPills}
                            onChangeText={setEditPills}
                            keyboardType="numeric"
                            placeholderTextColor="#94A3B8"
                            autoFocus
                          />

                          <Text style={styles.editLabel}>Reminder times</Text>
                          <View style={styles.chipRow}>
                            {editTimes.map(t => (
                              <TouchableOpacity
                                key={t}
                                style={styles.editTimeChip}
                                onPress={() => setEditTimes(prev => prev.filter(x => x !== t))}>
                                <Text style={styles.editTimeChipText}>{t}  ✕</Text>
                              </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={styles.addTimeBtn} onPress={() => setShowTimePicker(true)}>
                              <Text style={styles.addTimeBtnText}>＋ Add time</Text>
                            </TouchableOpacity>
                          </View>

                          {Platform.OS === 'android' && showTimePicker && (
                            <DateTimePicker value={pickerTime} mode="time" display="default" onChange={onPickerChange} />
                          )}
                          {Platform.OS === 'ios' && showTimePicker && (
                            <View style={styles.inlinePickerBox}>
                              <View style={styles.inlinePickerHeader}>
                                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                  <Text style={styles.inlinePickerCancel}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={confirmIOSTime}>
                                  <Text style={styles.inlinePickerDone}>Done</Text>
                                </TouchableOpacity>
                              </View>
                              <DateTimePicker
                                value={pickerTime}
                                mode="time"
                                display="spinner"
                                onChange={onPickerChange}
                                themeVariant="light"
                                style={{ backgroundColor: '#FFF' }}
                              />
                            </View>
                          )}

                          <View style={styles.editActions}>
                            <TouchableOpacity style={styles.cancelEditBtn} onPress={cancelEdit}>
                              <Text style={styles.cancelEditText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                              onPress={() => saveEdit(med)}
                              disabled={saving}>
                              {saving
                                ? <ActivityIndicator color="#FFF" />
                                : <Text style={styles.saveBtnText}>Save</Text>}
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        /* ── Read view ── */
                        <View>
                          <View style={styles.medCardHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.medCardName}>{med.name}</Text>
                              <Text style={styles.medCardDosage}>{med.dosage} · {med.pillCount} pill{med.pillCount > 1 ? 's' : ''} per dose</Text>
                              <Text style={styles.medCardTimes}>{med.times.join(', ')}</Text>
                            </View>
                            <View style={[styles.pillCountBadge, med.remainingPills < 15 && styles.pillCountBadgeLow]}>
                              <Text style={[styles.pillCount, med.remainingPills < 15 && { color: '#92400E' }]}>
                                {med.remainingPills}
                              </Text>
                              <Text style={[styles.pillCountLabel, med.remainingPills < 15 && { color: '#92400E' }]}>pills</Text>
                            </View>
                          </View>
                          {med.instructions ? <Text style={styles.medInstructions}>{med.instructions}</Text> : null}
                          <View style={styles.medCardActions}>
                            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(med)}>
                              <Text style={styles.editBtnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(med)}>
                              <Text style={styles.deleteBtnText}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Past dose history */}
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
                          <View style={styles.pastDateRow}>
                            <Text style={styles.pastDateLabel}>{formatDate(date)}</Text>
                            {dayPct !== null && (
                              <Text style={[styles.pastDatePct, { color: dayPct >= 80 ? '#16A34A' : dayPct >= 50 ? '#F59E0B' : '#DC2626' }]}>
                                {dayPct}%
                              </Text>
                            )}
                          </View>
                          {logs.map(log => (
                            <View key={log.id} style={styles.logRow}>
                              <View style={[styles.dot, { backgroundColor: dotColor(log.status) }]} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.logMed}>{log.medicationName}</Text>
                                <Text style={styles.logTime}>{log.scheduledTime}</Text>
                              </View>
                              <Text style={[styles.logStatus, { color: dotColor(log.status) }]}>
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
        })()}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#14532D' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 20 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A5F', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  patientCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  patientCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 18 },
  patientName: { fontSize: 17, fontWeight: '700', color: '#1E3A5F' },
  patientEmail: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  adherencePill: { backgroundColor: '#DCFCE7', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  adherencePillBad: { backgroundColor: '#FEE2E2' },
  adherencePillText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  statsRow: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 10 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#14532D' },
  statLabel: { fontSize: 10, color: '#64748B', marginTop: 2, textAlign: 'center' },
  miniLogRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  miniDot: { width: 8, height: 8, borderRadius: 4 },
  miniLogName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1E3A5F' },
  miniLogTime: { fontSize: 11, color: '#94A3B8' },
  miniLogStatus: { fontSize: 13, fontWeight: '700', width: 16, textAlign: 'center' },
  moreText: { fontSize: 11, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' },
  tapToManage: { fontSize: 12, color: '#16A34A', fontWeight: '600', marginTop: 10, textAlign: 'right' },

  modalContainer: { flex: 1, backgroundColor: '#F0FDF4' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#DCFCE7', backgroundColor: '#FFF',
  },
  modalPatientName: { fontSize: 22, fontWeight: '800', color: '#14532D' },
  modalPatientEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  modalCloseBtn: { backgroundColor: '#16A34A', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  modalCloseText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  modalScroll: { padding: 20, paddingBottom: 48 },
  modalAdherenceCard: { backgroundColor: '#16A34A', borderRadius: 16, padding: 16, marginBottom: 16 },
  modalAdherenceLabel: { color: '#BBF7D0', fontSize: 12 },
  modalAdherencePct: { color: '#FFF', fontSize: 32, fontWeight: '800', marginTop: 4 },
  modalAdherenceBar: { height: 6, backgroundColor: '#15803D', borderRadius: 3, marginTop: 8 },
  modalAdherenceFill: { height: 6, backgroundColor: '#86EFAC', borderRadius: 3 },
  modalAdherenceSub: { color: '#BBF7D0', fontSize: 12, marginTop: 6 },
  modalSection: { fontSize: 14, fontWeight: '700', color: '#14532D', marginTop: 16, marginBottom: 8 },
  noneText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginBottom: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  logMed: { fontSize: 14, fontWeight: '600', color: '#1E3A5F' },
  logTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  logStatus: { fontSize: 12, fontWeight: '600' },

  medCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 10 },
  medCardEditing: { borderWidth: 2, borderColor: '#2563EB' },
  medCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  medCardName: { fontSize: 16, fontWeight: '700', color: '#1E3A5F' },
  medCardDosage: { fontSize: 12, color: '#2563EB', fontWeight: '600', marginTop: 2 },
  medCardTimes: { fontSize: 12, color: '#64748B', marginTop: 2 },
  pillCountBadge: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 8, alignItems: 'center', minWidth: 52 },
  pillCountBadgeLow: { backgroundColor: '#FEF3C7' },
  pillCount: { fontSize: 20, fontWeight: '800', color: '#2563EB' },
  pillCountLabel: { fontSize: 10, color: '#2563EB', fontWeight: '600' },
  medInstructions: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginTop: 6 },
  medCardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  editBtn: { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 10, alignItems: 'center' },
  editBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  deleteBtn: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10, alignItems: 'center' },
  deleteBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },

  editingMedName: { fontSize: 17, fontWeight: '700', color: '#1E3A5F', marginBottom: 4 },
  editLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 12 },
  editInput: {
    backgroundColor: '#F8FAFF', borderRadius: 12, padding: 14,
    fontSize: 16, color: '#1E3A5F', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  editTimeChip: { backgroundColor: '#2563EB', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  editTimeChipText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  addTimeBtn: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#2563EB', borderStyle: 'dashed' },
  addTimeBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  inlinePickerBox: { marginTop: 8, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  inlinePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#F8FAFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  inlinePickerCancel: { fontSize: 14, color: '#94A3B8' },
  inlinePickerDone: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelEditBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, alignItems: 'center' },
  cancelEditText: { color: '#64748B', fontWeight: '700' },
  saveBtn: { flex: 2, backgroundColor: '#16A34A', borderRadius: 12, padding: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  historyDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  pastDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginTop: 10 },
  pastDateLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  pastDatePct: { fontSize: 12, fontWeight: '700' },
});
