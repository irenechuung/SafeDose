import { Tabs } from 'expo-router';                                                                           
  import { Ionicons } from '@expo/vector-icons';                                                                
  
  export default function CaregiverLayout() {                                                                   
    return (      
      <Tabs screenOptions={{ tabBarActiveTintColor: '#16A34A', headerShown: false }}>
        <Tabs.Screen                                                                                            
          name="dashboard"
          options={{                                                                                            
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,                
          }}
        />                                                                                                      
      </Tabs>     
    );                                                                                                          
  }
