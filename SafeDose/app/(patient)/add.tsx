import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, Platform, Modal,
} from 'react-native';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MEDICATION_CATEGORIES, type MedicationTemplate } from '@/constants/medications';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function PatientAddMedication() {
  const { addMedication, profile } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMed, setSelectedMed] = useState<MedicationTemplate | null>(null);
  const [selectedDosage, setSelectedDosage] = useState('');
  const [pillCount, setPillCount] = useState('1');
  const [totalPills, setTotalPills] = useState('30');
  const [times, setTimes] = useState<string[]>(['8:00 AM']);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTime, setPickerTime] = useState(new Date());
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const categoryMeds = selectedCategory
    ? MEDICATION_CATEGORIES.find(c => c.label === selectedCategory)?.medications ?? []
    : [];

  const selectMed = (med: MedicationTemplate) => {
    setSelectedMed(med);
    setSelectedDosage(med.commonDosages[0]);
    setInstructions(med.defaultInstructions);
  };

  const reset = () => {
    setSelectedCategory(null);
    setSelectedMed(null);
    setSelectedDosage('');
    setPillCount('1');
    setTotalPills('30');
    setTimes(['8:00 AM']);
    setInstructions('');
  };

  const formatTime = (date: Date): string => {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m} ${period}`;
  };

  const onPickerChange = (e: DateTimePickerEvent, date?: Date) => {
    if (!date) return;
    setPickerTime(date);
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (e.type !== 'dismissed') {
        const label = formatTime(date);
        if (!times.includes(label)) setTimes(prev => [...prev, label]);
      }
    }
  };

  const confirmIOSTime = () => {
    const label = formatTime(pickerTime);
    if (!times.includes(label)) setTimes(prev => [...prev, label]);
    setShowTimePicker(false);
  };

  const removeTime = (t: string) => setTimes(prev => prev.filter(x => x !== t));

  const submit = async () => {
    if (!selectedMed || !selectedDosage) {
      Alert.alert('Missing info', 'Please select a medication and dosage.'); return;
    }
    if (times.length === 0) {
      Alert.alert('Missing info', 'Please select at least one time.'); return;
    }
    if (!profile) return;

    setLoading(true);
    try {
      await addMedication({
        name: selectedMed.name,
        dosage: selectedDosage,
        pillCount: parseInt(pillCount) || 1,
        patientName: profile.name,
        patientEmail: profile.email,
        instructions,
        totalPills: parseInt(totalPills) || 30,
        remainingPills: parseInt(totalPills) || 30,
        times,
        prescribedBy: profile.name,
        doctorId: '',
      });
      Alert.alert('Added!', `${selectedMed.name} has been added to your schedule.`, [
        { text: 'OK', onPress: reset },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to add medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Add Medication</Text>
        <Text style={styles.subtitle}>Log a medication to your daily schedule</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication</Text>

          {selectedMed ? (
            <View style={styles.selectedRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedName}>{selectedMed.name}</Text>
                <Text style={styles.selectedCat}>{selectedCategory}</Text>
              </View>
              <TouchableOpacity onPress={() => { setSelectedMed(null); setSelectedDosage(''); setInstructions(''); }}>
                <Text style={styles.changeBtn}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                {MEDICATION_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.label}
                    style={[styles.catChip, selectedCategory === cat.label && styles.catChipSelected]}
                    onPress={() => setSelectedCategory(cat.label)}>
                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catLabel, selectedCategory === cat.label && styles.catLabelSelected]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedCategory && (
                <>
                  <Text style={styles.label}>{selectedCategory}</Text>
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {categoryMeds.map(med => (
                      <TouchableOpacity key={med.name} style={styles.medItem} onPress={() => selectMed(med)}>
                        <Text style={styles.medItemName}>{med.name}</Text>
                        <Text style={styles.medItemDosages}>{med.commonDosages.join(' · ')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          {selectedMed && (
            <>
              <Text style={styles.label}>Dosage</Text>
              <View style={styles.chipRow}>
                {selectedMed.commonDosages.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, selectedDosage === d && styles.chipSelected]}
                    onPress={() => setSelectedDosage(d)}>
                    <Text style={[styles.chipText, selectedDosage === d && styles.chipTextSelected]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.chipRow}>
            {times.map(t => (
              <TouchableOpacity key={t} style={styles.chipSelected} onPress={() => removeTime(t)}>
                <Text style={styles.chipTextSelected}>{t}  ✕</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addTimeBtn} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.addTimeBtnText}>＋ Add Time</Text>
            </TouchableOpacity>
          </View>
          {Platform.OS === 'android' && showTimePicker && (
            <DateTimePicker value={pickerTime} mode="time" display="default" onChange={onPickerChange} />
          )}
          <Modal visible={Platform.OS === 'ios' && showTimePicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.modalCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Select Time</Text>
                  <TouchableOpacity onPress={confirmIOSTime}>
                    <Text style={styles.modalDone}>Done</Text>
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
            </View>
          </Modal>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supply</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Pills per dose</Text>
              <TextInput style={styles.input} value={pillCount} onChangeText={setPillCount}
                keyboardType="numeric" placeholderTextColor="#94A3B8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Total pills</Text>
              <TextInput style={styles.input} value={totalPills} onChangeText={setTotalPills}
                keyboardType="numeric" placeholderTextColor="#94A3B8" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            multiline
            placeholder="Any special instructions"
            placeholderTextColor="#94A3B8"
            value={instructions}
            onChangeText={setInstructions}
          />
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Add to My Schedule</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' },
  scroll: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E3A5F', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  section: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1E3A5F', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 13,
    fontSize: 15, color: '#1E3A5F', borderWidth: 1, borderColor: '#E2E8F0',
  },
  catChip: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 14, backgroundColor: '#EFF6FF', marginRight: 8, minWidth: 80,
    borderWidth: 1.5, borderColor: '#DBEAFE',
  },
  catChipSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  catEmoji: { fontSize: 18, marginBottom: 3 },
  catLabel: { fontSize: 11, fontWeight: '600', color: '#2563EB', textAlign: 'center' },
  catLabelSelected: { color: '#FFF' },
  medItem: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  medItemName: { fontSize: 15, fontWeight: '700', color: '#1E3A5F' },
  medItemDosages: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  selectedRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF',
    borderRadius: 12, padding: 12,
  },
  selectedName: { fontSize: 16, fontWeight: '700', color: '#1E3A5F' },
  selectedCat: { fontSize: 11, color: '#2563EB', marginTop: 2 },
  changeBtn: { fontSize: 13, color: '#2563EB', fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' },
  chipSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  chipTextSelected: { color: '#FFF' },
  row: { flexDirection: 'row', gap: 12 },
  submitBtn: { backgroundColor: '#2563EB', borderRadius: 18, padding: 18, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  addTimeBtn: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: '#2563EB', borderStyle: 'dashed' },
  addTimeBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1E3A5F' },
  modalCancel: { fontSize: 15, color: '#94A3B8' },
  modalDone: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
});
