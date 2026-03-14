import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const ACTIVE   = '#3D5A3E';
const INACTIVE = '#9A9A8E';
const FAB_SIZE = 62;

function CameraTabButton(_props: object) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={camStyles.wrapper}
      onPress={() => router.push('/scan')}
      activeOpacity={0.85}
    >
      <View style={camStyles.fab}>
        <Ionicons name="camera-outline" size={26} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const camStyles = StyleSheet.create({
  wrapper: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -(FAB_SIZE / 2 + 4),
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#2D4A2D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D4A2D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E8E8E0',
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 1,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="botanist"
        options={{
          title: 'Botanist',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="robot-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: '',
          tabBarButton: (props) => <CameraTabButton {...props} />,
        }}
      />
      <Tabs.Screen name="garden" options={{ href: null }} />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
