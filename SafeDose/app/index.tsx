import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';                        
  import { useRouter } from 'expo-router';                                                                      
  import { useApp } from '@/context/AppContext';
                                                                                                                
  const ROLES = [
    {                                                                                                           
      id: 'patient' as const,
      title: 'Patient',
      desc: 'View and confirm your daily medications',
      emoji: '💊',
      color: '#2563EB',
      bg: '#EFF6FF',                                                                                            
      iconBg: '#DBEAFE',
    },                                                                                                          
    {             
      id: 'caregiver' as const,
      title: 'Caregiver',
      desc: 'Monitor your family members adherence',                                                            
      emoji: '🫂',
      color: '#16A34A',                                                                                         
      bg: '#F0FDF4',
      iconBg: '#DCFCE7',
    },                                                                                                          
    {
      id: 'doctor' as const,                                                                                    
      title: 'Doctor',
      desc: 'Input prescriptions for your patients',
      emoji: '🩺',
      color: '#9333EA',
      bg: '#FAF5FF',                                                                                            
      iconBg: '#F3E8FF',
    },                                                                                                          
  ];              

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
          <View style={styles.logoBox}>
            <Text style={styles.logo}>💊</Text>                                                                 
          </View> 
          <Text style={styles.title}>SafeDose</Text>
          <Text style={styles.subtitle}>The right pill, at the right time</Text>                                
        </View>
                                                                                                                
        <View style={styles.divider} />
        <Text style={styles.prompt}>I am a...</Text>
                                                                                                                
        <View style={styles.cards}>
          {ROLES.map(role => (                                                                                  
            <TouchableOpacity
              key={role.id}
              style={[styles.card, { backgroundColor: role.bg, borderColor: role.color }]}
              onPress={() => select(role.id)}                                                                   
              activeOpacity={0.8}>
              <View style={[styles.iconBox, { backgroundColor: role.iconBg }]}>                                 
                <Text style={styles.emoji}>{role.emoji}</Text>                                                  
              </View>
              <View style={styles.cardText}>                                                                    
                <Text style={[styles.cardTitle, { color: role.color }]}>{role.title}</Text>
                <Text style={styles.cardDesc}>{role.desc}</Text>                                                
              </View>
              <Text style={[styles.arrow, { color: role.color }]}>›</Text>                                      
            </TouchableOpacity>                                                                                 
          ))}
        </View>                                                                                                 
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFF' },
    header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },                                        
    logoBox: {
      width: 96, height: 96, borderRadius: 28,                                                                  
      backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',                               
      shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15, shadowRadius: 16, elevation: 6, marginBottom: 20,                                    
    },            
    logo: { fontSize: 52 },                                                                                     
    title: { fontSize: 42, fontWeight: '800', color: '#1E3A5F', letterSpacing: -1 },
    subtitle: { fontSize: 15, color: '#94A3B8', marginTop: 6 },                                                 
    divider: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 32, marginBottom: 24 },
    prompt: {                                                                                                   
      fontSize: 12, fontWeight: '700', color: '#94A3B8',
      textTransform: 'uppercase', letterSpacing: 1.5,                                                           
      paddingHorizontal: 24, marginBottom: 12,
    },                                                                                                          
    cards: { paddingHorizontal: 20, gap: 12 },
    card: {                                                                                                     
      borderRadius: 20, padding: 20,
      flexDirection: 'row', alignItems: 'center', gap: 16,
      borderWidth: 1.5,                                                                                         
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,                                                       
    },                                                                                                          
    iconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 30 },                                                                                    
    cardText: { flex: 1 },
    cardTitle: { fontSize: 20, fontWeight: '800' },                                                             
    cardDesc: { fontSize: 13, color: '#64748B', marginTop: 3, lineHeight: 18 },
    arrow: { fontSize: 30, fontWeight: '300' },                                                                 
  });