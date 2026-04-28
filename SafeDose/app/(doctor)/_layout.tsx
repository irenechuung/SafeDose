                                                                                                                
  import { Tabs } from 'expo-router';                                                                           
  import { Ionicons } from '@expo/vector-icons';                                                                

  export default function DoctorLayout() {
    return (
      <Tabs screenOptions={{ tabBarActiveTintColor: '#9333EA', headerShown: false }}>                           
        <Tabs.Screen                                                                                            
          name="patients"                                                                                       
          options={{                                                                                            
            title: 'Patients',
            tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
          }}                                                                                                    
        />
        <Tabs.Screen                                                                                            
          name="prescribe"
          options={{
            title: 'Prescribe',
            tabBarIcon: ({ color }) => <Ionicons name="add-circle-outline" size={24} color={color} />,          
          }}
        />                                                                                                      
      </Tabs>     
    );
  }    