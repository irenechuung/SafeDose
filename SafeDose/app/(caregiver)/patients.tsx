import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
  Modal, TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useState } from 'react';
import { useApp, type Medication, type PatientProfile } from '@/context/AppContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function CaregiverPatients() {
  const { patients, medications, doseLogs, updateMedication, deleteMedication } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
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

  const openEditMed = (med: Medication) => {
    setEditingMed(med);
    setEditPills(String(med.remainingPills));
    setEditTimes([...med.times]);
  };

  const saveEdit = async () => {
    if (!editingMed) return;
    if (editTimes.length === 0) {
      Alert.alert('Schedule required', 'Add at least one reminder time.'); return;
    }
    setSaving(true);
    try {
      await updateMedication(editingMed.id, {
        remainingPills: Math.max(0, parseInt(editPills) || 0),
        times: editTimes,
      });
      setEditingMed(null);
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
              onPress={() => setSelectedPatient(patient)}
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

              {/* Today's dose quick view */}
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

      {/* Patient detail modal */}
      <Modal visible={!!selectedPatient} animationType="slide" presentationStyle="pageSheet">
        {selectedPatient && (() => {
          const patientMeds = medications.filter(m => m.patientUid === selectedPatient.uid);
          const patientLogs = doseLogs.filter(l => l.patientUid === selectedPatient.uid && l.date === today);
          const resolved = doseLogs.filter(l => l.patientUid === selectedPatient.uid && l.status !== 'pending');
          const taken = resolved.filter(l => l.status === 'taken').length;
          const adherence = resolved.length > 0 ? Math.round((taken / resolved.length) * 100) : 0;

          return (
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalPatientName}>{selectedPatient.name}</Text>
                  <Text style={styles.modalPatientEmail}>{selectedPatient.email}</Text>
                </View>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedPatient(null)}>
                  <Text style={styles.modalCloseText}>Done</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScroll}>
                {/* Adherence summary */}
                <View style={styles.modalAdherenceCard}>
                  <Text style={styles.modalAdherenceLabel}>Overall Adherence</Text>
                  <Text style={styles.modalAdherencePct}>{adherence}%</Text>
                  <View style={styles.modalAdherenceBar}>
                    <View style={[styles.modalAdherenceFill, { width: `${adherence}%` as `${number}%` }]} />
                  </View>
                </View>

                {/* Today's doses */}
                <Text style={styles.modalSection}>Today's Doses</Text>
                {patientLogs.length === 0 && (
                  <Text style={styles.noneText}>No doses scheduled today.</Text>
                )}
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

                {/* Medications management */}
                <Text style={styles.modalSection}>Medications</Text>
                {patientMeds.length === 0 && (
                  <Text style={styles.noneText}>No medications added yet.</Text>
                )}
                {patientMeds.map(med => (
                  <View key={med.id} style={styles.medCard}>
                    <View style={styles.medCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medCardName}>{med.name}</Text>
                        <Text style={styles.medCardDosage}>{med.dosage} · {med.pillCount} pill{med.pillCount > 1 ? 's' : ''} per dose</Text>
                        <Text style={styles.medCardTimes}>{med.times.join(', ')}</Text>
                      </View>
                      <View style={styles.medCardRight}>
                        <View style={[styles.pillCountBadge, med.remainingPills < 15 && styles.pillCountBadgeLow]}>
                          <Text style={[styles.pillCount, med.remainingPills < 15 && { color: '#92400E' }]}>
                            {med.remainingPills}
                          </Text>
                          <Text style={[styles.pillCountLabel, med.remainingPills < 15 && { color: '#92400E' }]}>pills</Text>
                        </View>
                      </View>
                    </View>
                    {med.instructions ? (
                      <Text style={styles.medInstructions}>{med.instructions}</Text>
                    ) : null}
                    <View style={styles.medCardActions}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEditMed(med)}>
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(med)}>
                        <Text style={styles.deleteBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </SafeAreaView>
          );
        })()}
      </Modal>

      {/* Edit medication modal */}
      <Modal visible={!!editingMed} animationType="slide" transparent>
        <View style={styles.editOverlay}>
          <View style={styles.editBox}>
            <Text style={styles.editTitle}>Edit {editingMed?.name}</Text>

            <Text style={styles.editLabel}>Pills remaining</Text>
            <TextInput
              style={styles.editInput}
              value={editPills}
              onChangeText={setEditPills}
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
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
                <Text style={styles.addTimeBtnText}>＋ Add</Text>
              </TouchableOpacity>
            </View>

            {Platform.OS === 'android' && showTimePicker && (
              <DateTimePicker value={pickerTime} mode="time" display="default" onChange={onPickerChange} />
            )}
            <Modal visible={Platform.OS === 'ios' && showTimePicker} transparent animationType="slide">
              <View style={styles.timePickerOverlay}>
                <View style={styles.timePickerBox}>
                  <View style={styles.timePickerHeader}>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text style={styles.timePickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.timePickerTitle}>Select Time</Text>
                    <TouchableOpacity onPress={confirmIOSTime}>
                      <Text style={styles.timePickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker value={pickerTime} mode="time" display="spinner" onChange={onPickerChange} themeVariant="light" style={{ backgroundColor: '#FFF' }} />
                </View>
              </View>
            </Modal>

            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditingMed(null)}>
                <Text style={styles.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveEdit} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

  // Patient detail modal
  modalContainer: { flex: 1, backgroundColor: '#F0FDF4' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#DCFCE7',
    backgroundColor: '#FFF',
  },
  modalPatientName: { fontSize: 22, fontWeight: '800', color: '#14532D' },
  modalPatientEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  modalCloseBtn: { backgroundColor: '#16A34A', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  modalCloseText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  modalScroll: { padding: 20 },
  modalAdherenceCard: { backgroundColor: '#16A34A', borderRadius: 16, padding: 16, marginBottom: 16 },
  modalAdherenceLabel: { color: '#BBF7D0', fontSize: 12 },
  modalAdherencePct: { color: '#FFF', fontSize: 32, fontWeight: '800', marginTop: 4 },
  modalAdherenceBar: { height: 6, backgroundColor: '#15803D', borderRadius: 3, marginTop: 8 },
  modalAdherenceFill: { height: 6, backgroundColor: '#86EFAC', borderRadius: 3 },
  modalSection: { fontSize: 14, fontWeight: '700', color: '#14532D', marginTop: 16, marginBottom: 8 },
  noneText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginBottom: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  logMed: { fontSize: 14, fontWeight: '600', color: '#1E3A5F' },
  logTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  logStatus: { fontSize: 12, fontWeight: '600' },
  medCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 10 },
  medCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  medCardName: { fontSize: 16, fontWeight: '700', color: '#1E3A5F' },
  medCardDosage: { fontSize: 12, color: '#2563EB', fontWeight: '600', marginTop: 2 },
  medCardTimes: { fontSize: 12, color: '#64748B', marginTop: 2 },
  medCardRight: { alignItems: 'center' },
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

  // Edit modal
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editBox: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  editTitle: { fontSize: 20, fontWeight: '800', color: '#1E3A5F', marginBottom: 16 },
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
  editActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelEditBtn: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelEditText: { color: '#64748B', fontWeight: '700' },
  saveBtn: { flex: 2, backgroundColor: '#16A34A', borderRadius: 14, padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  timePickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  timePickerBox: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  timePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  timePickerTitle: { fontSize: 16, fontWeight: '700', color: '#1E3A5F' },
  timePickerCancel: { fontSize: 15, color: '#94A3B8' },
  timePickerDone: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
});
