import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { TablerIcon } from '../../components/shared/TablerIcon';
import { useAuthStore } from '../../lib/auth-store';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isDevAuthAllowed = useAuthStore((state) => state.isDevAuthAllowed);
  const loginDevCustomer = useAuthStore((state) => state.loginDevCustomer);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    // Simulate sending OTP or call backend /v1/auth/otp
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'OTP Sent',
        'Enter code 123456 to verify (Demo)',
        [
          {
            text: 'OK',
            onPress: () => {
              loginDevCustomer();
              router.replace('/(tabs)/home' as any);
            },
          },
        ]
      );
    }, 800);
  };

  const handleDevBypass = async () => {
    await loginDevCustomer();
    router.replace('/(tabs)/home' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.brandIcon}>
            <TablerIcon name="IconToolsKitchen2" size={28} color={Colors.brandPrimary} />
          </View>
          <Text style={styles.title}>Welcome to GharBhoj</Text>
          <Text style={styles.subtitle}>Fresh student mess subscriptions & meals in Indore</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <View style={styles.inputRow}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter 10-digit number"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Get OTP</Text>
            )}
          </TouchableOpacity>

          {/* Strictly Gated Dev Auth Bypass */}
          {isDevAuthAllowed && (
            <View style={styles.devSection}>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.devBypassBtn}
                onPress={handleDevBypass}
                activeOpacity={0.8}
              >
                <TablerIcon name="IconShieldCheck" size={14} color={Colors.brandAccentText} />
                <Text style={styles.devBypassText}>
                  Dev Instant Login (Rahul Sharma - DAVV)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.screenPadding,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brandPrimaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    padding: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radii.input,
    paddingHorizontal: 10,
    height: 44,
    marginBottom: 16,
    backgroundColor: Colors.bgScreen,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: Colors.brandPrimary,
    borderRadius: Radii.button,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  devSection: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDefault,
    marginVertical: 12,
  },
  devBypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brandAccentBg,
    borderWidth: 1,
    borderColor: Colors.brandAccent,
    borderRadius: Radii.button,
    paddingVertical: 10,
  },
  devBypassText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.brandAccentText,
    marginLeft: 6,
  },
});
