import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { TablerIcon } from '../../components/shared/TablerIcon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.bgScreen,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.borderDefault,
        },
        headerTitleStyle: {
          fontWeight: '500',
          fontSize: 16,
          color: Colors.textPrimary,
        },
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.borderDefault,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.brandPrimary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Discover',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TablerIcon name="IconSearch" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: 'Subscriptions',
          headerTitle: 'My Subscriptions',
          tabBarIcon: ({ color, size }) => (
            <TablerIcon name="IconCalendar" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          headerTitle: 'Order History',
          tabBarIcon: ({ color, size }) => (
            <TablerIcon name="IconTruckDelivery" size={size || 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Account',
          tabBarIcon: ({ color, size }) => (
            <TablerIcon name="IconUser" size={size || 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
