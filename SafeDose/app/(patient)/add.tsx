import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, Platform, Modal, Image,
} from 'react-native';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MEDICATION_CATEGORIES, type MedicationTemplate } from '@/constants/medications';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { identifyMedication } from '@/lib/anthropic';

type AddMode = 'choose' | 'scanning' | 'manual';

export default function PatientAddMedication() {
  const { addMedication, profile, firebaseUser } = useApp();

  const [mode, setMode] = useState<AddMode>('choose');
  const [scannedPhoto, setScannedPhoto] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMed, setSelectedMed] = useState<MedicationTemplate | null>(null);
  const [medName, setMedName] = useState('');
  const [selectedDosage, setSelectedDosage] = useState('');
  const [pillCount, setPillCount] = useState('1');
  const [totalPills, setTotalPills] = useState('30');
  const [times, setTimes] = useState<string[]>(['8:00 AM']);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTime, setPickerTime] = useState(new Date());
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setMode('choose');
    setScannedPhoto(null);
    setSelectedCategory(null);
    setSelectedMed(null);
    setMedName('');
    setSelectedDosage('');
    setPillCount('1');
    setTotalPills('30');
    setTimes(['8:00 AM']);
    setInstructions('');
  };

  const scanMedication = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera access is required to scan medications.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setScannedPhoto(asset.uri);
    setMode('scanning');
    setAiLoading(true);

    try {
      const base64 = asset.base64;
      if (!base64) throw new Error('No image data.');
      const mimeType = asset.mimeType?.startsWith('image/png') ? 'image/png' : 'image/jpeg';
      const identified = await identifyMedication(base64, mimeType as 'image/jpeg' | 'image/png');
      setMedName(identified.name);
      setSelectedDosage(identified.dosage);
      setInstructions(identified.instructions);
      setMode('manual');
    } catch (e: any) {
      Alert.alert('Scan failed', e.message ?? 'Could not identify medication. Please enter details manually.');
      setMode('manual');
      setScannedPhoto(null);
    } finally {
      setAiLoading(false);
    }
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
    const name = selectedMed?.name ?? medName.trim();
    if (!name) {
      Alert.alert('Missing info', 'Please enter or scan a medication name.'); return;
    }
    if (!selectedDosage.trim()) {
      Alert.alert('Missing info', 'Please enter a dosage.'); return;
    }
    if (times.length === 0) {
      Alert.alert('Missing info', 'Please add at least one reminder time.'); return;
    }
    if (!profile || !firebaseUser) return;

    setLoading(true);
    try {
      await addMedication({
        name,
        dosage: selectedDosage.trim(),
        pillCount: parseInt(pillCount) || 1,
        patientName: profile.name,
        patientEmail: profile.email,
        patientUid: firebaseUser.uid,
        instructions,
        totalPills: parseInt(totalPills) || 30,
        remainingPills: parseInt(totalPills) || 30,
        times,
        photoUri: scannedPhoto ?? undefined,
      });
      Alert.alert('Added!', `${name} has been added to your schedule.`, [
        { text: 'OK', onPress: reset },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to add medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Choose mode — initial screen
  if (mode === 'choose') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chooseCenterWrap}>
          <Text style={styles.title}>Add Medication</Text>
          <Text style={styles.subtitle}>How would you like to add this medication?</Text>

          <TouchableOpacity style={styles.scanCard} onPress={scanMedication} activeOpacity={0.85}>
            <Text style={styles.scanCardEmoji}>📷</Text>
            <Text style={styles.scanCardTitle}>Scan Medication</Text>
            <Text style={styles.scanCardDesc}>Take a photo of the bottle or pill — AI will identify it automatically</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.manualCard} onPress={() => setMode('manual')} activeOpacity={0.85}>
            <Text style={styles.manualCardEmoji}>✏️</Text>
            <Text style={styles.manualCardTitle}>Enter Manually</Text>
            <Text style={styles.manualCardDesc}>Browse the medication catalog and fill in the details yourself</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Scanning — show spinner while AI processes
  if (mode === 'scanning' && aiLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chooseCenterWrap}>
          {scannedPhoto && (
            <Image source={{ uri: scannedPhoto }} style={styles.previewImage} />
          )}
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 24 }} />
          <Text style={styles.scanningText}>Identifying medication...</Text>
          <Text style={styles.scanningSubText}>Claude AI is reading the label</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Manual / post-scan form
  const categoryMeds = selectedCategory
    ? MEDICATION_CATEGORIES.find(c => c.label === selectedCategory)?.medications ?? []
    : [];
  const isAiPrefilled = !!scannedPhoto && !selectedMed;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Add Medication</Text>
            <Text style={styles.subtitle}>
              {isAiPrefilled ? 'AI identified — confirm the details below' : 'Fill in the details'}
            </Text>
          </View>
          <TouchableOpacity onPress={reset} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Scanned photo preview */}
        {scannedPhoto && (
          <View style={styles.section}>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>✨ AI Identified</Text>
            </View>
            <Image source={{ uri: scannedPhoto }} style={styles.photoPreview} />
          </View>
        )}

        {/* Medication name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication</Text>

          {isAiPrefilled ? (
            <>
              <Text style={styles.label}>Name (from scan)</Text>
              <TextInput
                style={styles.input}
                value={medName}
                onChangeText={setMedName}
                placeholder="Medication name"
                placeholderTextColor="#94A3B8"
              />
            </>
          ) : selectedMed ? (
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
                      <TouchableOpacity key={med.name} style={styles.medItem} onPress={() => {
                        setSelectedMed(med);
                        setSelectedDosage(med.commonDosages[0]);
                        setInstructions(med.defaultInstructions);
                        setMedName('');
                      }}>
                        <Text style={styles.medItemName}>{med.name}</Text>
                        <Text style={styles.medItemDosages}>{med.commonDosages.join(' · ')}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.label}>Or enter name directly</Text>
              <TextInput
                style={styles.input}
                value={medName}
                onChangeText={setMedName}
                placeholder="e.g. Metformin"
                placeholderTextColor="#94A3B8"
              />
            </>
          )}

          {/* Dosage */}
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

          {isAiPrefilled && (
            <>
              <Text style={styles.label}>Dosage</Text>
              <TextInput
                style={styles.input}
                value={selectedDosage}
                onChangeText={setSelectedDosage}
                placeholder="e.g. 10mg"
                placeholderTextColor="#94A3B8"
              />
            </>
          )}
        </View>

        {/* Schedule */}
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

        {/* Supply */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supply</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Pills per dose</Text>
              <TextInput style={styles.input} value={pillCount} onChangeText={setPillCount}
                keyboardType="numeric" placeholderTextColor="#94A3B8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Total pills on hand</Text>
              <TextInput style={styles.input} value={totalPills} onChangeText={setTotalPills}
                keyboardType="numeric" placeholderTextColor="#94A3B8" />
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            multiline
            placeholder="e.g. Take with food"
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
  chooseCenterWrap: { flex: 1, padding: 24, paddingTop: 48, alignItems: 'stretch' },
  scroll: { padding: 20, paddingBottom: 48 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#1E3A5F', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#64748B' },
  cancelBtn: { backgroundColor: '#E2E8F0', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 },
  cancelText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  scanCard: {
    backgroundColor: '#2563EB', borderRadius: 24, padding: 28, marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  scanCardEmoji: { fontSize: 52, marginBottom: 12 },
  scanCardTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  scanCardDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },
  manualCard: {
    backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  manualCardEmoji: { fontSize: 40, marginBottom: 8 },
  manualCardTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A5F', marginBottom: 4 },
  manualCardDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 },
  scanningText: { fontSize: 20, fontWeight: '700', color: '#1E3A5F', marginTop: 20, textAlign: 'center' },
  scanningSubText: { fontSize: 14, color: '#64748B', marginTop: 6, textAlign: 'center' },
  previewImage: { width: '100%', height: 220, borderRadius: 16, resizeMode: 'cover' },
  photoPreview: { width: '100%', height: 180, borderRadius: 12, resizeMode: 'cover', marginTop: 10 },
  aiBadge: {
    alignSelf: 'flex-start', backgroundColor: '#DBEAFE', borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 12, marginBottom: 8,
  },
  aiBadgeText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
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
    marginBottom: 4,
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
  chipSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  chipTextSelected: { color: '#FFF', fontWeight: '600', fontSize: 13 },
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
