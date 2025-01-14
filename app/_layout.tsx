import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}>
      <Tabs.Screen
        name="index" // This corresponds to index.tsx
        options={{
          title: 'Water',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "water" : "water-outline"}
              size={24}
              color={color}
            />
          ),
          tabBarActiveTintColor: '#4facfe',
          tabBarInactiveTintColor: '#666',
        }}
      />
      <Tabs.Screen
        name="meds" // This corresponds to meds.tsx
        options={{
          title: 'Meds',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "pill" : "pill"}
              size={24}
              color={color}
            />
          ),
          tabBarActiveTintColor: '#4facfe',
          tabBarInactiveTintColor: '#666',
        }}
      />
      <Tabs.Screen
        name="habits" // This will correspond to habits.tsx
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "check-circle" : "check-circle-outline"}
              size={24}
              color={color}
            />
          ),
          tabBarActiveTintColor: '#4facfe',
          tabBarInactiveTintColor: '#666',
        }}
      />
    </Tabs>
  );
}