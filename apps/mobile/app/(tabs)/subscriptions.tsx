import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { TablerIcon } from '../../components/shared/TablerIcon';
import { api } from '../../lib/api-client';

export default function SubscriptionsTabScreen() {
  const { data: subscriptions, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: () => api.getMySubscriptions(),
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        <View style={styles.headerGroup}>
          <Text style={styles.pageTitle}>Meal Subscriptions</Text>
          <Text style={styles.pageSubtitle}>
            Manage your daily mess allotment, track skips, and bank meals
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.brandPrimary} />
        ) : (subscriptions || []).length === 0 ? (
          <View style={styles.emptyCard}>
            <TablerIcon name="IconCalendar" size={28} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Active Subscriptions</Text>
            <Text style={styles.emptySubtitle}>
              Explore partner messes to subscribe to affordable monthly lunch and dinner plans.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/home' as any)}
            >
              <Text style={styles.browseButtonText}>Browse Indore Messes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          (subscriptions || []).map((sub: any) => {
            // Rule 1: derived meals remaining formula
            const remaining = Math.max(
              0,
              sub.totalMealsAllotted - sub.mealsDelivered - sub.mealsSkipped
            );
            const progressPercent = Math.min(
              100,
              Math.round(((sub.mealsDelivered + sub.mealsSkipped) / sub.totalMealsAllotted) * 100)
            );

            return (
              <TouchableOpacity
                key={sub.id}
                style={styles.subCard}
                onPress={() => router.push(`/subscription/${sub.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.subHeader}>
                  <View style={styles.headerInfo}>
                    <Text style={styles.messName}>{sub.messName}</Text>
                    <Text style={styles.planName}>{sub.planName}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{sub.status}</Text>
                  </View>
                </View>

                {/* Derived Allotment 4-Metric Grid (Rule 1) */}
                <View style={styles.metricGrid}>
                  <View style={styles.metricTile}>
                    <Text style={styles.metricNumber}>{sub.totalMealsAllotted}</Text>
                    <Text style={styles.metricLabel}>Total</Text>
                  </View>
                  <View style={styles.metricTile}>
                    <Text style={styles.metricNumber}>{sub.mealsDelivered}</Text>
                    <Text style={styles.metricLabel}>Delivered</Text>
                  </View>
                  <View style={styles.metricTile}>
                    <Text style={[styles.metricNumber, { color: Colors.brandAccentText }]}>
                      {sub.mealsSkipped}
                    </Text>
                    <Text style={styles.metricLabel}>Skipped</Text>
                  </View>
                  <View style={styles.metricTile}>
                    <Text style={[styles.metricNumber, { color: Colors.brandPrimary }]}>
                      {remaining}
                    </Text>
                    <Text style={styles.metricLabel}>Remaining</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>

                {/* Footer Action */}
                <View style={styles.subFooter}>
                  <Text style={styles.validityText}>
                    Valid until: {sub.endDate}
                  </Text>
                  <View style={styles.manageButton}>
                    <Text style={styles.manageButtonText}>Manage & Skip Meal →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
  headerGroup: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    padding: 30,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 16,
  },
  browseButton: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.button,
    marginTop: 6,
  },
  browseButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  subCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.cardGap,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginRight: 8,
  },
  messName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  planName: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
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
  metricGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.bgScreen,
    borderRadius: Radii.card - 2,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    paddingVertical: 8,
    marginBottom: 12,
  },
  metricTile: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.borderDefault,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.brandPrimary,
  },
  subFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
  },
  validityText: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
});
