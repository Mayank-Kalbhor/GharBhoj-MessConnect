import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { TablerIcon } from '../../components/shared/TablerIcon';
import { api } from '../../lib/api-client';

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSkipping, setIsSkipping] = useState(false);
  const queryClient = useQueryClient();

  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription-detail', id],
    queryFn: () => api.getSubscriptionDetail(id as string),
    enabled: !!id,
  });

  if (isLoading || !sub) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading subscription details...</Text>
      </View>
    );
  }

  // Rule 1: Derived Meals Remaining
  const mealsRemaining = Math.max(
    0,
    sub.totalMealsAllotted - sub.mealsDelivered - sub.mealsSkipped
  );

  // Rule 3: 25% Skip Cap Calculation
  const maxAllowedSkips = Math.floor(sub.totalMealsAllotted * 0.25);
  const skipsLeftBeforeCap = Math.max(0, maxAllowedSkips - sub.mealsSkipped);

  // Feature flag check: In V1, ENABLE_MESS_SWITCH=false -> switch-mess button must be COMPLETELY HIDDEN
  const isMessSwitchEnabled = process.env.EXPO_PUBLIC_ENABLE_MESS_SWITCH === 'true';

  const handleSkipMeal = async () => {
    if (skipsLeftBeforeCap <= 0) {
      Alert.alert(
        'Skip Limit Reached',
        `You have used all ${maxAllowedSkips} allowed skips (25% cap) for this plan.`
      );
      return;
    }

    Alert.alert(
      'Skip Today\'s Meal',
      'Skipping will bank 1 extra meal credit on this subscription, which you can redeem before the end date. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Skip',
          onPress: async () => {
            setIsSkipping(true);
            try {
              const today = new Date().toISOString().split('T')[0];
              const res = await api.skipSubscriptionMeal(sub.id, today);
              Alert.alert(
                'Meal Skipped Successfully',
                `1 extra meal credit banked! You now have ${res.skipCreditsRemaining} banked credits.`
              );
              queryClient.invalidateQueries({ queryKey: ['subscription-detail', id] });
              queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not skip meal. Please retry.');
            } finally {
              setIsSkipping(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription Main Header Card */}
        <View style={styles.card}>
          <Text style={styles.messName}>{sub.messName}</Text>
          <Text style={styles.planName}>{sub.planName}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{sub.status}</Text>
            </View>
            <Text style={styles.dateMeta}>
              {sub.startDate} to {sub.endDate}
            </Text>
          </View>
        </View>

        {/* Rule 1: Derived Allotment Ledger Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Meal Allotment Breakdown</Text>
          <Text style={styles.sectionSubtitle}>
            Derived dynamically: Total - Delivered - Skipped (Rule 1)
          </Text>

          <View style={styles.metricGrid}>
            <View style={styles.metricTile}>
              <Text style={styles.metricNum}>{sub.totalMealsAllotted}</Text>
              <Text style={styles.metricLabel}>Total Allotted</Text>
            </View>
            <View style={styles.metricTile}>
              <Text style={styles.metricNum}>{sub.mealsDelivered}</Text>
              <Text style={styles.metricLabel}>Delivered</Text>
            </View>
            <View style={styles.metricTile}>
              <Text style={[styles.metricNum, { color: Colors.brandAccentText }]}>
                {sub.mealsSkipped}
              </Text>
              <Text style={styles.metricLabel}>Skipped</Text>
            </View>
            <View style={styles.metricTile}>
              <Text style={[styles.metricNum, { color: Colors.brandPrimary }]}>
                {mealsRemaining}
              </Text>
              <Text style={styles.metricLabel}>Remaining</Text>
            </View>
          </View>

          {/* Banked Skip Credits Highlight */}
          <View style={styles.bankedCreditsTile}>
            <View style={styles.bankedIcon}>
              <TablerIcon name="IconCalendar" size={16} color={Colors.brandPrimary} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.bankedTitle}>
                {sub.skipCreditsRemaining} Banked Meal Credits Available
              </Text>
              <Text style={styles.bankedDesc}>
                Redeemable as extra meals on this subscription (Rule 3)
              </Text>
            </View>
          </View>
        </View>

        {/* Rule 3: Skip Meal Action Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <TablerIcon name="IconPlayerPause" size={15} color={Colors.brandAccentText} />
            <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>Skip Today's Meal</Text>
          </View>

          <Text style={styles.ruleExplainText}>
            Can't eat today? Skip before the daily cutoff (11:00 AM lunch / 07:00 PM dinner) to bank
            an extra meal credit.
          </Text>

          <View style={styles.capStatusRow}>
            <Text style={styles.capLabel}>25% Plan Skip Cap Status:</Text>
            <Text style={styles.capValue}>
              {sub.mealsSkipped} / {maxAllowedSkips} used ({skipsLeftBeforeCap} skips left)
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.skipButton,
              (skipsLeftBeforeCap <= 0 || isSkipping) && styles.skipButtonDisabled,
            ]}
            onPress={handleSkipMeal}
            disabled={skipsLeftBeforeCap <= 0 || isSkipping}
            activeOpacity={0.85}
          >
            {isSkipping ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <TablerIcon name="IconCheck" size={14} color="#FFFFFF" />
                <Text style={styles.skipButtonText}>
                  {skipsLeftBeforeCap > 0
                    ? "Skip Today's Meal & Bank Credit"
                    : 'Skip Cap Reached'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* CRITICAL FEATURE GATE INVARIANT:
            The Switch-Mess button MUST BE COMPLETELY HIDDEN while ENABLE_MESS_SWITCH=false.
            Never render it disabled or grayed out. */}
        {isMessSwitchEnabled && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Switch Mess</Text>
            <Text style={styles.ruleExplainText}>Transfer balance to another partner mess.</Text>
            <TouchableOpacity style={styles.secondaryActionBtn}>
              <Text style={styles.secondaryActionText}>Request Mess Transfer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Support & Cancellation Policy */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Subscription Policy</Text>
          <View style={styles.divider} />

          <View style={styles.policyRow}>
            <Text style={styles.policyBullet}>•</Text>
            <Text style={styles.policyText}>
              Pauses extend end date day-for-day per Rule 4.
            </Text>
          </View>
          <View style={styles.policyRow}>
            <Text style={styles.policyBullet}>•</Text>
            <Text style={styles.policyText}>
              Cancellations receive pro-rated refund minus mess cancellation fee per Rule 5.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgScreen,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgScreen,
  },
  loadingText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 8,
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
  messName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  planName: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '500',
    color: Colors.successText,
  },
  dateMeta: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 1,
    marginBottom: 10,
  },
  metricGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.bgScreen,
    borderRadius: Radii.card - 2,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    paddingVertical: 10,
    marginBottom: 10,
  },
  metricTile: {
    flex: 1,
    alignItems: 'center',
  },
  metricNum: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bankedCreditsTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brandPrimaryTint,
    borderRadius: Radii.card - 2,
    padding: 10,
  },
  bankedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankedTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
  bankedDesc: {
    fontSize: 9,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleExplainText: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginVertical: 6,
    lineHeight: 15,
  },
  capStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.brandAccentBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    marginVertical: 8,
  },
  capLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.brandAccentText,
  },
  capValue: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.brandAccentText,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brandPrimary,
    paddingVertical: 10,
    borderRadius: Radii.button,
    marginTop: 6,
  },
  skipButtonDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.textSecondary,
  },
  skipButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  secondaryActionBtn: {
    borderWidth: 1,
    borderColor: Colors.borderMuted,
    paddingVertical: 8,
    borderRadius: Radii.button,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryActionText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDefault,
    marginVertical: 8,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  policyBullet: {
    fontSize: 12,
    color: Colors.brandPrimary,
    marginRight: 6,
  },
  policyText: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 14,
  },
});
