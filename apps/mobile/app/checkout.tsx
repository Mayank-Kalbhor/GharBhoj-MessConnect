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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { TablerIcon } from '../components/shared/TablerIcon';
import { useCartStore } from '../lib/cart-store';
import { useAuthStore } from '../lib/auth-store';
import { api } from '../lib/api-client';

export default function CheckoutScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'WALLET'>('UPI');

  const cart = useCartStore();
  const user = useAuthStore((state) => state.user);

  const subtotal = cart.getTotalAmount();
  const deliveryFee = 0; // Free student delivery in Indore launch zone
  const platformFee = 5;
  const grandTotal = subtotal + deliveryFee + platformFee;

  const defaultAddress = user?.defaultAddress || {
    id: 'addr_default_indore',
    label: 'Hostel A',
    addressLine: 'Room 204, Boys Hostel, Bholaram Marg',
    city: 'Indore',
  };

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) {
      Alert.alert('Cart Empty', 'Please add dishes from a mess menu first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderDto = {
        messId: cart.messId,
        addressId: defaultAddress.id,
        mealType: cart.mealType,
        scheduledDate: cart.scheduledDate,
        paymentMethod,
        items: cart.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      };

      const result = await api.createOrder(orderDto);
      cart.clearCart();
      router.replace(`/order/${result.id}` as any);
    } catch (err: any) {
      Alert.alert('Order Failed', err?.message || 'Could not process order. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Address Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <TablerIcon name="IconMapPin" size={14} color={Colors.brandPrimary} />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.cardTitle}>Delivering To ({defaultAddress.label})</Text>
              <Text style={styles.cardSubtitle}>
                {defaultAddress.addressLine}, {defaultAddress.city}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items Review */}
        <View style={styles.sectionCard}>
          <View style={styles.cardTitleRow}>
            <TablerIcon name="IconToolsKitchen2" size={14} color={Colors.brandPrimary} />
            <Text style={[styles.cardTitle, { marginLeft: 6 }]}>
              {cart.messName || 'Your Selected Thali'}
            </Text>
          </View>
          <Text style={styles.mealMetaText}>
            Service: {cart.mealType} • Scheduled: {cart.scheduledDate}
          </Text>

          <View style={styles.divider} />

          {cart.items.map((item) => (
            <View key={item.menuItemId} style={styles.itemRow}>
              <View style={styles.itemLead}>
                <TablerIcon
                  name="IconLeaf"
                  size={10}
                  color={item.isVeg ? Colors.successText : Colors.dangerText}
                />
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Bill Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Bill Summary</Text>
          <View style={styles.divider} />

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Campus Delivery Fee</Text>
            <Text style={[styles.billValue, { color: Colors.successText }]}>
              FREE (Indore Launch)
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform & Packing Fee</Text>
            <Text style={styles.billValue}>₹{platformFee}</Text>
          </View>

          <View style={[styles.divider, { marginVertical: 8 }]} />

          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>₹{grandTotal}</Text>
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'UPI' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('UPI')}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLead}>
              <TablerIcon name="IconCreditCard" size={16} color={Colors.brandPrimary} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.paymentName}>UPI Instant Pay</Text>
                <Text style={styles.paymentSub}>Google Pay, PhonePe, Paytm, BHIM</Text>
              </View>
            </View>
            <View style={[styles.radioCircle, paymentMethod === 'UPI' && styles.radioCircleActive]}>
              {paymentMethod === 'UPI' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Pay & Place Order Bottom Button */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>₹{grandTotal}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, isSubmitting && styles.payButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Pay & Place Order</Text>
              <TablerIcon name="IconChevronRight" size={14} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 90,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.cardGap,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brandPrimaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTextGroup: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealMetaText: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDefault,
    marginVertical: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemLead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginHorizontal: 12,
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  billLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  billValue: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  paymentOptionSelected: {
    backgroundColor: Colors.bgScreen,
    borderRadius: Radii.pill,
    paddingHorizontal: 8,
  },
  paymentLead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentName: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  paymentSub: {
    fontSize: 9,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.borderMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.brandPrimary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomTotalLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  bottomTotalValue: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.button,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: 4,
  },
});
