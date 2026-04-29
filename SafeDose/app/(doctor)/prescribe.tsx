import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { MEDICATION_CATEGORIES, MedicationTemplate } from '@/constants/medications';

const TIME_OPTIONS = ['6:00 AM', '8:00 AM', '12:00 PM', '6:00 PM', '9:00 PM'];

export default function DoctorPrescribe() {
  const { addMedication, profile } = useApp();
  const router = useRouter();
  const doctorName = profile ? `Dr. ${profile.name}` : 'Doctor';

  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMed, setSelectedMed] = useState<MedicationTemplate | null>(null);
  const [selectedDosage, setSelectedDosage] = useState('');
  const [pillCount, setPillCount] = useState('1');
  const [totalPills, setTotalPills] = useState('30');
  const [times, setTimes] = useState<string[]>(['8:00 AM']);
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

  const toggleTime = (t: string) => {
    setTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const submit = async () => {
    if (!patientName.trim()) { Alert.alert('Missing info', "Please enter the patient's name."); return; }
    if (!patientEmail.trim() || !patientEmail.includes('@')) { Alert.alert('Missing info', "Please enter a valid patient email."); return; }
    if (!selectedMed || !selectedDosage) { Alert.alert('Missing info', 'Please select a medication and dosage.'); return; }
    if (times.length === 0) { Alert.alert('Missing info', 'Please select at least one time.'); return; }

    setLoading(true);
    try {
      await addMedication({
        name: selectedMed.name,
        dosage: selectedDosage,
        pillCount: parseInt(pillCount) || 1,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim().toLowerCase(),
        instructions,
        totalPills: parseInt(totalPills) || 30,
        remainingPills: parseInt(totalPills) || 30,
        times,
        prescribedBy: doctorName,
        doctorId: profile?.uid ?? '',
      });
      Alert.alert('Prescription sent!', `${selectedMed.name} added to ${patientName}'s schedule.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>New Prescription</Text>
        <Text style={styles.doctor}>{doctorName}</Text>

        {/* Patient info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} placeholder="Patient's full name" placeholderTextColor="#94A3B8"
            value={patientName} onChangeText={setPatientName} autoCapitalize="words" />
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="patient@example.com" placeholderTextColor="#94A3B8"
            value={patientEmail} onChangeText={setPatientEmail}
            autoCapitalize="none" keyboardType="email-address" />
        </View>

        {/* Medication picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication</Text>

          {selectedMed ? (
            <View style={styles.selectedMedRow}>
              <View style={styles.selectedMedInfo}>
                <Text style={styles.selectedMedName}>{selectedMed.name}</Text>
                <Text style={styles.selectedMedCat}>{selectedCategory}</Text>
              </View>
              <TouchableOpacity onPress={() => { setSelectedMed(null); setSelectedDosage(''); setInstructions(''); }}>
                <Text style={styles.changeBtn}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
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
                  <View style={styles.medList}>
                    {categoryMeds.map(med => (
                      <TouchableOpacity key={med.name} style={styles.medItem} onPress={() => selectMed(med)} activeOpacity={0.7}>
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
              <View style={styles.chipGrid}>
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

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.chipGrid}>
            {TIME_OPTIONS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, times.includes(t) && styles.chipSelected]}
                onPress={() => toggleTime(t)}>
                <Text style={[styles.chipText, times.includes(t) && styles.chipTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Supply */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supply</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Pills per dose</Text>
              <TextInput style={styles.input} value={pillCount} onChangeText={setPillCount} keyboardType="numeric" placeholderTextColor="#94A3B8" />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Total pills</Text>
              <TextInput style={styles.input} value={totalPills} onChangeText={setTotalPills} keyboardType="numeric" placeholderTextColor="#94A3B8" />
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            multiline
            placeholder="Special instructions for patient"
            placeholderTextColor="#94A3B8"
            value={instructions}
            onChangeText={setInstructions}
          />
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Send Prescription</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF5FF' },
  scroll: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: '#581C87', marginBottom: 2 },
  doctor: { fontSize: 13, color: '#9333EA', fontWeight: '600', marginBottom: 24 },
  section: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#581C87', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#FAF5FF', borderRadius: 12, padding: 13, fontSize: 15, color: '#1E3A5F', borderWidth: 1, borderColor: '#E2E8F0' },
  categoryScroll: { marginBottom: 4 },
  catChip: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 14, backgroundColor: '#F3E8FF', marginRight: 8, minWidth: 80,
    borderWidth: 1.5, borderColor: '#E9D5FF',
  },
  catChipSelected: { backgroundColor: '#9333EA', borderColor: '#9333EA' },
  catEmoji: { fontSize: 18, marginBottom: 3 },
  catLabel: { fontSize: 11, fontWeight: '600', color: '#9333EA', textAlign: 'center' },
  catLabelSelected: { color: '#FFF' },
  medList: { gap: 8, marginTop: 4 },
  medItem: {
    backgroundColor: '#FAF5FF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#E9D5FF',
  },
  medItemName: { fontSize: 15, fontWeight: '700', color: '#581C87' },
  medItemDosages: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  selectedMedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F3E8FF', borderRadius: 12, padding: 12 },
  selectedMedInfo: { flex: 1 },
  selectedMedName: { fontSize: 16, fontWeight: '700', color: '#581C87' },
  selectedMedCat: { fontSize: 11, color: '#9333EA', marginTop: 2 },
  changeBtn: { fontSize: 13, color: '#9333EA', fontWeight: '700' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#F3E8FF', borderWidth: 1, borderColor: '#E9D5FF' },
  chipSelected: { backgroundColor: '#9333EA', borderColor: '#9333EA' },
  chipText: { color: '#9333EA', fontWeight: '600', fontSize: 13 },
  chipTextSelected: { color: '#FFF' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  submitBtn: { backgroundColor: '#9333EA', borderRadius: 18, padding: 18, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
