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
import { OrderStatus } from '@messconnect/shared-types';

export default function OrdersListScreen() {
  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.getMyOrders(),
  });

  const activeOrders = (orders || []).filter(
    (o: any) =>
      o.status === OrderStatus.PLACED ||
      o.status === OrderStatus.ACCEPTED ||
      o.status === OrderStatus.PREPARING ||
      o.status === OrderStatus.OUT_FOR_DELIVERY
  );

  const pastOrders = (orders || []).filter(
    (o: any) => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED
  );

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
        {/* Active Order Spotlight */}
        {activeOrders.length > 0 && (
          <View style={styles.spotlightSection}>
            <Text style={styles.sectionHeader}>Active Order in Progress</Text>
            {activeOrders.map((order: any) => (
              <TouchableOpacity
                key={order.id}
                style={styles.activeOrderCard}
                onPress={() => router.push(`/order/${order.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.activeCardHeader}>
                  <View>
                    <Text style={styles.activeMessName}>{order.messName}</Text>
                    <Text style={styles.activeMealType}>
                      {order.mealType} Service • Today
                    </Text>
                  </View>
                  <View style={styles.activeStatusPill}>
                    <Text style={styles.activeStatusText}>{order.status}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.activeCardFooter}>
                  <View style={styles.liveIndicator}>
                    <View style={styles.pulsingDot} />
                    <Text style={styles.liveText}>Kitchen is preparing your meal</Text>
                  </View>
                  <View style={styles.trackButton}>
                    <Text style={styles.trackButtonText}>Track Live</Text>
                    <TablerIcon name="IconChevronRight" size={12} color={Colors.brandPrimary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Past Orders Section */}
        <View style={styles.pastSection}>
          <Text style={styles.sectionHeader}>Past Orders</Text>

          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.brandPrimary} />
          ) : pastOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No past orders yet.</Text>
            </View>
          ) : (
            pastOrders.map((order: any) => (
              <TouchableOpacity
                key={order.id}
                style={styles.pastOrderCard}
                onPress={() => router.push(`/order/${order.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.pastCardHeader}>
                  <Text style={styles.pastMessName}>{order.messName}</Text>
                  <Text style={styles.pastAmount}>₹{order.totalAmount}</Text>
                </View>

                <Text style={styles.pastDate}>
                  {order.scheduledDate} • {order.mealType}
                </Text>

                <View style={styles.pastCardFooter}>
                  <View style={styles.completedBadge}>
                    <TablerIcon name="IconCheck" size={10} color={Colors.successText} />
                    <Text style={styles.completedText}>{order.status}</Text>
                  </View>
                  <Text style={styles.reorderLink}>View Details →</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  spotlightSection: {
    marginBottom: 20,
  },
  activeOrderCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1.5,
    borderColor: Colors.brandAccent,
    padding: Spacing.cardPadding,
  },
  activeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activeMessName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  activeMealType: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeStatusPill: {
    backgroundColor: Colors.brandAccentBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  activeStatusText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.brandAccentText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDefault,
    marginVertical: 10,
  },
  activeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandPrimary,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.brandPrimary,
    marginRight: 2,
  },
  pastSection: {
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    padding: 24,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  pastOrderCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.cardGap,
  },
  pastCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  pastMessName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  pastAmount: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  pastDate: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  pastCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  completedText: {
    fontSize: 9,
    fontWeight: '500',
    color: Colors.successText,
    marginLeft: 3,
  },
  reorderLink: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
});
