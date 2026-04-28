import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';                              
import { useApp, DoseLog } from '@/context/AppContext';                                                       
                                                                                                                
  export default function PatientHistory() {                                                                    
    const { doseLogs } = useApp();
    const sorted = [...doseLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());       
                                                                                                                
   const grouped: Record<string, DoseLog[]> = {};
  sorted.forEach(log => {
    grouped[log.date] = [...(grouped[log.date] ?? []), log];                                                    
  });
          
                                                                                                                
    const dotColor = (status: string) =>
      status === 'taken' ? '#16A34A' : status === 'missed' ? '#DC2626' : '#94A3B8';                             
                                                                                                                
    return (
      <SafeAreaView style={styles.container}>                                                                   
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Dose History</Text>                                                        
          {Object.entries(grouped).map(([date, logs]) => (
            <View key={date}>                                                                                   
              <Text style={styles.dateHeader}>                                                                  
                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day:
   'numeric' })}                                                                                                
              </Text>
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
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({                                                                            
    container: { flex: 1, backgroundColor: '#EFF6FF' },
    scroll: { padding: 20 },                                                                                    
    title: { fontSize: 28, fontWeight: '800', color: '#1E3A5F', marginBottom: 20 },
    dateHeader: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 16, marginBottom: 8 },          
    row: {                                                                                                      
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',                                      
      borderRadius: 12, padding: 14, marginBottom: 8,                                                           
    },                                                                                                          
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    info: { flex: 1 },                                                                                          
    medName: { fontSize: 16, fontWeight: '600', color: '#1E3A5F' },                                             
    time: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    status: { fontSize: 13, fontWeight: '600' },                                                                
  });             
