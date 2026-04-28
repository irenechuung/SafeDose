import { Tabs } from 'expo-router';                                                                           
  import { Ionicons } from '@expo/vector-icons';                                                                
                                                                                                                
  export default function PatientLayout() {
    return (
      <Tabs screenOptions={{ tabBarActiveTintColor: '#2563EB', headerShown: false }}>
        <Tabs.Screen                                                                                            
          name="home"
          options={{                                                                                            
            title: 'Today',
            tabBarIcon: ({ color }) => <Ionicons name="medical-outline" size={24} color={color} />,             
          }}
        />                                                                                                      
        <Tabs.Screen
          name="history"                                                                                        
          options={{
            title: 'History',                                                                                   
            tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={24} color={color} />,
          }}                                                                                                    
        />
      </Tabs>                                                                                                   
    );            
  }
