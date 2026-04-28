 import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
  import { useApp } from '@/context/AppContext';                                                                
                  
  export default function CaregiverDashboard() {                                                                
    const { medications, doseLogs } = useApp();
    const today = new Date().toISOString().split('T')[0];                                                       
    const todayLogs = doseLogs.filter(l => l.date === today);
    const takenCount = todayLogs.filter(l => l.status === 'taken').length;                                      
    const total = todayLogs.length;
    const missedLogs = doseLogs.filter(l => l.status === 'missed');                                             
    const lowMeds = medications.filter(m => m.remainingPills < 15);                                             
                                                                                                                
    const dotColor = (status: string) =>                                                                        
      status === 'taken' ? '#16A34A' : status === 'missed' ? '#DC2626' : '#94A3B8';                             
                                                                                                                
    return (
      <SafeAreaView style={styles.container}>                                                                   
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Caregiver View</Text>
          <Text style={styles.subtitle}>Margaret Wilson · Your mother</Text>                                    
                                                                                                                
          <View style={styles.statusCard}>                                                                      
             <Text style={styles.statusLabel}>{"Today's adherence"}</Text>                       
            <Text style={styles.statusCount}>{takenCount}/{total} doses taken</Text>                            
            {takenCount === total ? (
              <View style={styles.goodBadge}><Text style={styles.goodText}>✓ All on track</Text></View>         
            ) : (                                                                                               
              <View style={styles.warnBadge}><Text style={styles.warnText}>⚠ Attention needed</Text></View>     
            )}                                                                                                  
          </View> 
                                                                                                                
          {missedLogs.length > 0 && (
            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>⚠️  Missed doses</Text>
              {missedLogs.map(log => (                                                                          
                <Text key={log.id} style={styles.alertRow}>
                  • {log.medicationName} — {log.scheduledTime} on {log.date}                                    
                </Text>
              ))}                                                                                               
            </View>
          )}
                                                                                                                
          {lowMeds.length > 0 && (
            <View style={styles.refillCard}>                                                                    
              <Text style={styles.refillTitle}>💊 Refill soon</Text>
              {lowMeds.map(med => (                                                                             
                <Text key={med.id} style={styles.refillRow}>
                  {med.name} — {med.remainingPills} pills left                                                  
                </Text>                                                                                         
              ))}
            </View>                                                                                             
          )}      

          <Text style={styles.sectionTitle}>{"Today's Schedule"}</Text>

          {todayLogs.map(log => (
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
        </ScrollView>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0FDF4' },
    scroll: { padding: 20 },                                                                                    
    title: { fontSize: 28, fontWeight: '800', color: '#14532D' },
    subtitle: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 20 },                               
    statusCard: { backgroundColor: '#16A34A', borderRadius: 20, padding: 20, marginBottom: 16 },                
    statusLabel: { color: '#BBF7D0', fontSize: 13 },                                                            
    statusCount: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: 4 },                              
    goodBadge: { backgroundColor: '#15803D', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12,        
  alignSelf: 'flex-start', marginTop: 12 },                                                                     
    goodText: { color: '#DCFCE7', fontWeight: '600' },                                                          
    warnBadge: { backgroundColor: '#EF4444', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12,        
  alignSelf: 'flex-start', marginTop: 12 },                                                                     
    warnText: { color: '#FFF', fontWeight: '600' },                                                             
    alertCard: { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth:  
  4, borderLeftColor: '#EF4444' },                                                                              
    alertTitle: { fontSize: 15, fontWeight: '700', color: '#991B1B', marginBottom: 8 },
    alertRow: { fontSize: 13, color: '#7F1D1D', marginBottom: 4 },                                              
    refillCard: { backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 
  4, borderLeftColor: '#F59E0B' },                                                                              
    refillTitle: { fontSize: 15, fontWeight: '700', color: '#92400E', marginBottom: 8 },                        
    refillRow: { fontSize: 13, color: '#78350F', marginBottom: 4 },                                             
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#14532D', marginBottom: 12 },                      
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14,  
  marginBottom: 8 },                                                                                            
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },                                           
    info: { flex: 1 },                                                                                          
    medName: { fontSize: 16, fontWeight: '600', color: '#1E3A5F' },
    time: { fontSize: 12, color: '#94A3B8', marginTop: 2 },                                                     
    status: { fontSize: 13, fontWeight: '600' },
  });                                                