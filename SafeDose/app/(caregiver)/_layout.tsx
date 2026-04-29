import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CaregiverLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#16A34A', headerShown: false }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} />,
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
