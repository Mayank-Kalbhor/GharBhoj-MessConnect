import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PUSH_TOKEN_KEY = 'messconnect_push_token';
const PUSH_WARNING_KEY = 'messconnect_push_warning';

// Configure foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationRegistrationResult {
  token: string | null;
  granted: boolean;
  isRealToken: boolean;
  warning?: string;
  error?: string;
}

/**
 * Registers device for push notifications (SRS FR-4.7 daily menu reminders, FR-7.1 order status)
 */
export async function registerForPushNotificationsAsync(): Promise<NotificationRegistrationResult> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return {
        token: null,
        granted: false,
        isRealToken: false,
        error: 'Permission not granted for push notifications.',
      };
    }

    // On Android, configure notification channel for priority alerts
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'GharBhoj Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0F6E56',
      });
    }

    // Attempt to retrieve genuine push token from FCM / Expo push service
    let token: string | null = null;
    let warning: string | undefined;
    let isRealToken = false;

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData.data;
      isRealToken = true;
    } catch (err: any) {
      // EXPLICIT WARNING: Never silently pretend a mock token is a real FCM token
      warning =
        '[PUSH NOTIFICATION CONFIG WARNING]: Could not acquire a real FCM/Expo push token. ' +
        'Missing EAS Project ID or google-services.json Firebase configuration. ' +
        'Remote push notifications will NOT be delivered to this device.';

      console.warn(warning);
      token = null; // Strictly null: do not forge a fake token string
    }

    if (token) {
      await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
      await SecureStore.deleteItemAsync(PUSH_WARNING_KEY);
    } else if (warning) {
      await SecureStore.setItemAsync(PUSH_WARNING_KEY, warning);
      await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
    }

    return {
      token,
      granted: true,
      isRealToken,
      warning,
    };
  } catch (err: any) {
    return {
      token: null,
      granted: false,
      isRealToken: false,
      error: err?.message || 'Error registering push notifications.',
    };
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getStoredPushWarning(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PUSH_WARNING_KEY);
  } catch {
    return null;
  }
}
