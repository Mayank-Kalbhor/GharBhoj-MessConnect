import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../lib/auth-store';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { Colors } from '../constants/theme';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

export default function RootLayout() {
  const loadSession = useAuthStore((state) => state.loadSession);

  useEffect(() => {
    // 1. Initialize user session from SecureStore
    loadSession();

    // 2. Initialize Push Notifications pipeline (SRS FR-4.7 & FR-7.1)
    registerForPushNotificationsAsync();

    // 3. Response listener: Tapping notification navigates to relevant screen
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.orderId) {
        router.push(`/order/${data.orderId}` as any);
      } else if (data?.subscriptionId) {
        router.push(`/subscription/${data.subscriptionId}` as any);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" backgroundColor={Colors.bgScreen} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.bgScreen },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: '500', fontSize: 16 },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: Colors.bgScreen },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="mess/[id]"
            options={{ title: 'Mess Details', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="checkout"
            options={{ title: 'Review Order', headerBackTitle: 'Cancel' }}
          />
          <Stack.Screen
            name="order/[id]"
            options={{ title: 'Live Order Status', headerBackTitle: 'Orders' }}
          />
          <Stack.Screen
            name="subscription/[id]"
            options={{ title: 'Subscription Details', headerBackTitle: 'Subscriptions' }}
          />
          <Stack.Screen
            name="auth/login"
            options={{ title: 'Customer Sign In', headerShown: false }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
