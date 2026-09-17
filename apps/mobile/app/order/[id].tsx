import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { TablerIcon } from '../../components/shared/TablerIcon';
import { api } from '../../lib/api-client';
import { OrderStatus } from '@messconnect/shared-types';

const STEPS = [
  { key: OrderStatus.PLACED, label: 'Order Placed', desc: 'Kitchen received your thali request' },
  { key: OrderStatus.ACCEPTED, label: 'Accepted', desc: 'Vendor confirmed kitchen capacity' },
  { key: OrderStatus.PREPARING, label: 'Preparing', desc: 'Fresh chapatis & sabzi on the stove' },
  { key: OrderStatus.OUT_FOR_DELIVERY, label: 'Out for Delivery', desc: 'Partner en route to your hostel' },
  { key: OrderStatus.DELIVERED, label: 'Delivered', desc: 'Enjoy your hot meal!' },
];

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => api.getOrderDetail(id as string),
    enabled: !!id,
    refetchInterval: 10000, // Poll order status periodically
  });

  if (isLoading || !order) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
        <Text style={styles.loadingText}>Fetching live order status...</Text>
      </View>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Header Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.messName}>{order.messName}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{order.status}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <TablerIcon name="IconMapPin" size={13} color={Colors.brandPrimary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {order.address}
            </Text>
          </View>
        </View>

        {/* 5-Step Status Stepper */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preparation & Delivery Progress</Text>
          <View style={styles.divider} />

          <View style={styles.stepperWrapper}>
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <View key={step.key} style={styles.stepRow}>
                  {/* Left Column: Icon Circle & Connector Line */}
                  <View style={styles.stepIndicatorCol}>
                    <View
                      style={[
                        styles.stepCircle,
                        isCompleted && styles.circleCompleted,
                        isCurrent && styles.circleCurrent,
                        isUpcoming && styles.circleUpcoming,
                      ]}
                    >
                      {isCompleted ? (
                        <TablerIcon name="IconCheck" size={12} color="#FFFFFF" />
                      ) : isCurrent ? (
                        <View style={styles.currentDot} />
                      ) : (
                        <View style={styles.upcomingDot} />
                      )}
                    </View>
                    {index < STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          isCompleted ? styles.lineCompleted : styles.lineUpcoming,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Column: Step Info */}
                  <View style={styles.stepTextCol}>
                    <Text
                      style={[
                        styles.stepLabel,
                        isCurrent && styles.stepLabelCurrent,
                        isUpcoming && styles.stepLabelUpcoming,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Items Ordered Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          <View style={styles.divider} />

          {(order.items || []).map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.name} x{item.quantity}
              </Text>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Paid via UPI</Text>
            <Text style={styles.totalValue}>₹{order.totalAmount || 135}</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  messName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  statusPill: {
    backgroundColor: Colors.brandPrimaryTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDefault,
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  stepperWrapper: {
    paddingVertical: 4,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 48,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  circleCompleted: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  circleCurrent: {
    backgroundColor: Colors.brandAccentBg,
    borderColor: Colors.brandAccent,
  },
  circleUpcoming: {
    backgroundColor: Colors.bgScreen,
    borderColor: Colors.borderMuted,
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandAccent,
  },
  upcomingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderMuted,
  },
  stepLine: {
    flex: 1,
    width: 2,
    marginVertical: 2,
  },
  lineCompleted: {
    backgroundColor: Colors.brandPrimary,
  },
  lineUpcoming: {
    backgroundColor: Colors.borderDefault,
  },
  stepTextCol: {
    flex: 1,
    paddingBottom: 14,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  stepLabelCurrent: {
    color: Colors.brandAccentText,
  },
  stepLabelUpcoming: {
    color: Colors.textSecondary,
  },
  stepDesc: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  itemName: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
});
