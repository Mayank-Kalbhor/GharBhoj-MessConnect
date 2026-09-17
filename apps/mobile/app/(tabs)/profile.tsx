import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { TablerIcon } from '../../components/shared/TablerIcon';
import { useAuthStore } from '../../lib/auth-store';
import { registerForPushNotificationsAsync, getStoredPushToken } from '../../lib/notifications';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const isDevAuthAllowed = useAuthStore((state) => state.isDevAuthAllowed);
  const loginDevCustomer = useAuthStore((state) => state.loginDevCustomer);
  const logout = useAuthStore((state) => state.logout);

  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);

  useEffect(() => {
    getStoredPushToken().then(setPushToken);
  }, []);

  const handlePushRegistration = async () => {
    setIsRegisteringPush(true);
    const res = await registerForPushNotificationsAsync();
    setIsRegisteringPush(false);
    if (res.granted) {
      setPushToken(res.token);
      Alert.alert('Push Alerts Active', 'Notifications enabled for daily cutoff reminders & order updates.');
    } else {
      Alert.alert('Permission Denied', res.error || 'Please enable notifications in device settings.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Header Card */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <TablerIcon name="IconUser" size={24} color={Colors.brandPrimary} />
            </View>
            <View style={styles.profileTextGroup}>
              <Text style={styles.userName}>{user?.fullName || 'Customer'}</Text>
              <Text style={styles.userPhone}>{user?.phone || '+91'}</Text>
              {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.badgeRow}>
            {user?.isStudentVerified ? (
              <View style={styles.studentBadge}>
                <TablerIcon name="IconShieldCheck" size={12} color={Colors.successText} />
                <Text style={styles.studentBadgeText}>Indore Student Verified (DAVV)</Text>
              </View>
            ) : (
              <View style={[styles.studentBadge, { backgroundColor: Colors.bgScreen }]}>
                <Text style={[styles.studentBadgeText, { color: Colors.textSecondary }]}>
                  General Customer
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Saved Address Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <TablerIcon name="IconMapPin" size={14} color={Colors.brandPrimary} />
            <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>Delivery Address</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>{user?.defaultAddress?.label || 'Hostel A'}</Text>
            <Text style={styles.addressLine}>
              {user?.defaultAddress?.addressLine || 'Room 204, Boys Hostel, Bholaram Marg'}
            </Text>
            <Text style={styles.addressCity}>
              {user?.defaultAddress?.city || 'Indore'}, MP
            </Text>
          </View>
        </View>

        {/* Push Notification Card (SRS FR-4.7 & FR-7.1) */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <TablerIcon name="IconBell" size={14} color={Colors.brandPrimary} />
            <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>
              Push Notifications (Cutoff Reminders)
            </Text>
          </View>
          <Text style={styles.infoText}>
            Receive notifications 30 mins before daily kitchen cutoff to skip meals or order lunch.
          </Text>

          <View style={styles.divider} />

          <View style={styles.notificationStatusRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.notifStatusLabel}>Daily Skip Reminders</Text>
              <Text style={styles.notifTokenPreview}>
                {pushToken ? 'Real FCM Token Active' : 'Remote push unconfigured'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.notifButton}
              onPress={handlePushRegistration}
              disabled={isRegisteringPush}
            >
              <Text style={styles.notifButtonText}>
                {pushToken ? 'Refresh' : 'Check'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Visible Warning Banner when Firebase/EAS config is unconfigured */}
          {!pushToken && (
            <View style={styles.pushWarningBox}>
              <TablerIcon name="IconAlertTriangle" size={13} color={Colors.brandAccentText} />
              <Text style={styles.pushWarningText}>
                ⚠️ FCM Remote Push Inactive: Missing google-services.json / EAS credentials. Real APNs/FCM push will not be delivered over the air until cloud credentials are added.
              </Text>
            </View>
          )}
        </View>

        {/* STRICTLY GATED DEV AUTH SWITCHER:
            Only rendered when NODE_ENV !== 'production' && EXPO_PUBLIC_ALLOW_DEV_AUTH === 'true' */}
        {isDevAuthAllowed && (
          <View style={[styles.card, styles.devCard]}>
            <View style={styles.sectionHeaderRow}>
              <TablerIcon name="IconToolsKitchen2" size={14} color={Colors.brandAccentText} />
              <Text style={[styles.sectionTitle, { marginLeft: 6, color: Colors.brandAccentText }]}>
                Developer Testing Sandbox
              </Text>
            </View>
            <Text style={styles.devDesc}>
              Environment: development (Gated). Fast-login as student customer for Indore launch testing.
            </Text>

            <TouchableOpacity
              style={styles.devLoginBtn}
              onPress={async () => {
                await loginDevCustomer();
                Alert.alert('Dev Auth Active', 'Switched to Rahul Sharma (DAVV Hostel, Indore).');
              }}
            >
              <Text style={styles.devLoginBtnText}>Reset to Rahul Sharma (Indore Student)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: logout },
            ]);
          }}
        >
          <TablerIcon name="IconX" size={14} color={Colors.dangerText} />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.cardGap,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brandPrimaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileTextGroup: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  userPhone: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDefault,
    marginVertical: 10,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  studentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  studentBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.successText,
    marginLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  addressBox: {
    backgroundColor: Colors.bgScreen,
    borderRadius: Radii.card - 2,
    padding: 8,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  addressLine: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addressCity: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  infoText: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 14,
  },
  notificationStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifStatusLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  notifTokenPreview: {
    fontSize: 9,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notifButton: {
    backgroundColor: Colors.brandPrimaryTint,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.button,
  },
  notifButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
  pushWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.brandAccentBg,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.brandAccent,
    padding: 8,
    marginTop: 10,
  },
  pushWarningText: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.brandAccentText,
    marginLeft: 6,
    flex: 1,
    lineHeight: 14,
  },
  devCard: {
    borderColor: Colors.brandAccent,
    backgroundColor: Colors.brandAccentBg,
  },
  devDesc: {
    fontSize: 10,
    color: Colors.brandAccentText,
    marginVertical: 6,
    lineHeight: 14,
  },
  devLoginBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.brandAccent,
    paddingVertical: 8,
    borderRadius: Radii.button,
    alignItems: 'center',
    marginTop: 4,
  },
  devLoginBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.brandAccentText,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    paddingVertical: 10,
    borderRadius: Radii.button,
    marginTop: 10,
  },
  logoutButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.dangerText,
    marginLeft: 6,
  },
});
