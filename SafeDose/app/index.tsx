import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
  import { useRouter } from 'expo-router';                                                                      
  import { useApp } from '@/context/AppContext';
                                                                                                                
  export default function RoleSelector() {
    const router = useRouter();                                                                                 
    const { setRole } = useApp();
                                                                                                                
    const select = (role: 'patient' | 'caregiver' | 'doctor') => {
      setRole(role);                                                                                            
      if (role === 'patient') router.replace('/(patient)/home');
      if (role === 'caregiver') router.replace('/(caregiver)/dashboard');                                       
      if (role === 'doctor') router.replace('/(doctor)/patients');                                              
    };                                                                                                          
                                                                                                                
    return (      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>                                                                            
          <Text style={styles.logo}>💊</Text>
          <Text style={styles.title}>SafeDose</Text>                                                            
          <Text style={styles.subtitle}>Who are you?</Text>                                                     
        </View>
                                                                                                                
        <View style={styles.cards}>
          <TouchableOpacity
            style={[styles.card, { borderLeftColor: '#2563EB' }]}                                               
            onPress={() => select('patient')}>
            <Text style={styles.cardEmoji}>👴</Text>                                                            
            <View>
              <Text style={styles.cardTitle}>Patient</Text>                                                     
              <Text style={styles.cardDesc}>View and confirm your daily medications</Text>                      
            </View>
          </TouchableOpacity>                                                                                   
                  
          <TouchableOpacity                                                                                     
            style={[styles.card, { borderLeftColor: '#16A34A' }]}
            onPress={() => select('caregiver')}>                                                                
            <Text style={styles.cardEmoji}>👨</Text>/Text>
            <View>                                                                                              
              <Text style={styles.cardTitle}>Caregiver</Text>
              <Text style={styles.cardDesc}>Monitor your family members adherence</Text>                        
            </View>                                                                                             
          </TouchableOpacity>
                                                                                                                
          <TouchableOpacity
            style={[styles.card, { borderLeftColor: '#9333EA' }]}
            onPress={() => select('doctor')}>                                                                   
            <Text style={styles.cardEmoji}>👨</Text>
            <View>                                                                                              
              <Text style={styles.cardTitle}>Doctor</Text>                                                      
              <Text style={styles.cardDesc}>Input prescriptions for your patients</Text>
            </View>                                                                                             
          </TouchableOpacity>
        </View>                                                                                                 
      </SafeAreaView>
    );                                                                                                          
  }               

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EFF6FF' },
    header: { alignItems: 'center', paddingTop: 80, paddingBottom: 48 },                                        
    logo: { fontSize: 64 },
    title: { fontSize: 40, fontWeight: '800', color: '#1E3A5F', marginTop: 8 },                                 
    subtitle: { fontSize: 18, color: '#64748B', marginTop: 6 },                                                 
    cards: { paddingHorizontal: 24, gap: 16 },                                                                  
    card: {                                                                                                     
      backgroundColor: '#FFFFFF',
      borderRadius: 20,                                                                                         
      padding: 24,
      flexDirection: 'row',
      alignItems: 'center',                                                                                     
      gap: 16,
      borderLeftWidth: 6,                                                                                       
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,                                                                                      
      shadowRadius: 10,
      elevation: 3,                                                                                             
    },            
    cardEmoji: { fontSize: 36 },
    cardTitle: { fontSize: 22, fontWeight: '700', color: '#1E3A5F' },                                           
    cardDesc: { fontSize: 13, color: '#64748B', marginTop: 3 },
  });                  