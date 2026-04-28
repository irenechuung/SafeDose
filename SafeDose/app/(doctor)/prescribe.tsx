  import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from          
  'react-native';                                                                                               
  import { useState } from 'react';                                                                             
  import { useApp } from '@/context/AppContext';                                                                
  import { useRouter } from 'expo-router';
                                                                                                                
  const TIME_OPTIONS = ['6:00 AM', '8:00 AM', '12:00 PM', '6:00 PM', '9:00 PM'];                                
   
  export default function DoctorPrescribe() {                                                                   
    const { addMedication } = useApp();
    const router = useRouter();
    const [form, setForm] = useState({
      patientName: 'Margaret Wilson',                                                                           
      name: '',
      dosage: '',                                                                                               
      pillCount: '1',                                                                                           
      totalPills: '30',
      instructions: '',                                                                                         
      times: ['8:00 AM'],                                                                                       
    });
                                                                                                                
    const toggleTime = (t: string) => {
      setForm(f => ({
        ...f,                                                                                                   
        times: f.times.includes(t) ? f.times.filter(x => x !== t) : [...f.times, t],
      }));                                                                                                      
    };            
                                                                                                                
    const submit = () => {
      if (!form.name || !form.dosage) {
        Alert.alert('Missing info', 'Please fill in medication name and dosage.');
        return;                                                                                                 
      }
      if (form.times.length === 0) {                                                                            
        Alert.alert('Missing info', 'Please select at least one time.');
        return;                                                                                                 
      }
      addMedication({                                                                                           
        name: form.name,
        dosage: form.dosage,
        pillCount: parseInt(form.pillCount) || 1,
        patientName: form.patientName,
        instructions: form.instructions,                                                                        
        totalPills: parseInt(form.totalPills) || 30,
        remainingPills: parseInt(form.totalPills) || 30,                                                        
        times: form.times,                                                                                      
        prescribedBy: 'Dr. Sarah Chen',
      });                                                                                                       
      Alert.alert('Done!', `${form.name} added to ${form.patientName}'s schedule.`, [
        { text: 'OK', onPress: () => router.back() },                                                           
      ]);
      setForm({ patientName: 'Margaret Wilson', name: '', dosage: '', pillCount: '1', totalPills: '30',         
  instructions: '', times: ['8:00 AM'] });                                                                      
    };
                                                                                                                
    return (      
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>                                                      
          <Text style={styles.title}>New Prescription</Text>
                                                                                                                
          {([     
            { label: 'Patient', key: 'patientName', placeholder: 'Patient name' },
            { label: 'Medication Name', key: 'name', placeholder: 'e.g. Lisinopril' },                          
            { label: 'Dosage', key: 'dosage', placeholder: 'e.g. 10mg' },                                       
            { label: 'Pills per dose', key: 'pillCount', placeholder: '1', numeric: true },                     
            { label: 'Total pills supplied', key: 'totalPills', placeholder: '30', numeric: true },             
          ] as {label: string, key: keyof typeof form, placeholder: string, numeric?: boolean}[]).map(({ label, key,    
  placeholder, numeric }) => (
        
            <View key={key}>                                                                                    
              <Text style={styles.label}>{label}</Text>
              <TextInput                                                                                        
                style={styles.input}
                placeholder={placeholder}
                keyboardType={numeric ? 'numeric' : 'default'}
                value={form[key] as string}                                                           
                onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
              />                                                                                                
            </View>
          ))}                                                                                                   
                  
          <Text style={styles.label}>Schedule (tap to select)</Text>                                            
          <View style={styles.timeGrid}>
            {TIME_OPTIONS.map(t => (                                                                            
              <TouchableOpacity
                key={t}
                style={[styles.chip, form.times.includes(t) && styles.chipSelected]}
                onPress={() => toggleTime(t)}                                                                   
              >
                <Text style={[styles.chipText, form.times.includes(t) && styles.chipTextSelected]}>{t}</Text>   
              </TouchableOpacity>                                                                               
            ))}
          </View>                                                                                               
                  
          <Text style={styles.label}>Special instructions (optional)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}                                    
            multiline                                                                                           
            placeholder="e.g. Take with food"                                                                   
            value={form.instructions}                                                                           
            onChangeText={v => setForm(f => ({ ...f, instructions: v }))}
          />                                                                                                    
  
          <TouchableOpacity style={styles.submitBtn} onPress={submit}>                                          
            <Text style={styles.submitText}>Submit Prescription</Text>
          </TouchableOpacity>
        </ScrollView>                                                                                           
      </SafeAreaView>
    );                                                                                                          
  }               

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAF5FF' },
    scroll: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '800', color: '#581C87', marginBottom: 24 },                             
    label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 16 },
    input: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, fontSize: 16, color: '#1E3A5F',            
  borderWidth: 1, borderColor: '#E2E8F0' },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },                                 
    chip: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#F3E8FF',            
  borderWidth: 1, borderColor: '#E9D5FF' },                                                                     
    chipSelected: { backgroundColor: '#9333EA', borderColor: '#9333EA' },                                       
    chipText: { color: '#9333EA', fontWeight: '600' },                                                          
    chipTextSelected: { color: '#FFF' },                                                                        
    submitBtn: { backgroundColor: '#9333EA', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 32
  },                                                                                                            
    submitText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  });                                                                                                           
         