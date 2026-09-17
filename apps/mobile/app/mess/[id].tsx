import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { TablerIcon } from '../../components/shared/TablerIcon';
import { api } from '../../lib/api-client';
import { useCartStore } from '../../lib/cart-store';
import { MealType } from '@messconnect/shared-types';

export default function MessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedMealType, setSelectedMealType] = useState<MealType>(MealType.LUNCH);

  const { data: mess, isLoading } = useQuery({
    queryKey: ['mess-detail', id],
    queryFn: () => api.getMessDetail(id as string),
    enabled: !!id,
  });

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const totalAmount = useCartStore((state) => state.getTotalAmount());
  const itemCount = useCartStore((state) => state.getItemCount());

  if (isLoading || !mess) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
        <Text style={styles.loadingText}>Loading kitchen details...</Text>
      </View>
    );
  }

  const slotsRemaining = Math.max(0, (mess.capacity || 100) - (mess.ordersPlaced || 0));
  const filteredMenuItems = (mess.menuItems || []).filter(
    (item: any) => item.mealType === selectedMealType
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mess Header Card */}
        <View style={styles.messHeaderCard}>
          <Text style={styles.messName}>{mess.name}</Text>
          <Text style={styles.messAddress}>{mess.addressLine}, {mess.city}</Text>

          <View style={styles.fssaiRow}>
            <TablerIcon name="IconShieldCheck" size={13} color={Colors.brandPrimary} />
            <Text style={styles.fssaiText}>
              FSSAI Lic. #{mess.fssaiLicenseNumber || '11422850000123'}
            </Text>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.badge}>
              <TablerIcon name="IconStar" size={12} color={Colors.brandAccent} />
              <Text style={styles.ratingText}>{mess.rating || '4.8'} Rating</Text>
            </View>
            <View style={styles.badge}>
              <TablerIcon name="IconToolsKitchen2" size={12} color={Colors.brandPrimary} />
              <Text style={styles.badgeText}>{mess.consistencyScore || 96}% Consistency</Text>
            </View>
            {mess.isVeg && (
              <View style={[styles.badge, styles.vegBadge]}>
                <TablerIcon name="IconLeaf" size={10} color={Colors.successText} />
                <Text style={styles.vegBadgeText}>Pure Veg</Text>
              </View>
            )}
          </View>
        </View>

        {/* Meal Type Tabs (Lunch vs Dinner) */}
        <View style={styles.mealTypeTabs}>
          <TouchableOpacity
            style={[
              styles.mealTab,
              selectedMealType === MealType.LUNCH && styles.mealTabActive,
            ]}
            onPress={() => setSelectedMealType(MealType.LUNCH)}
            activeOpacity={0.8}
          >
            <TablerIcon
              name="IconSun"
              size={15}
              color={selectedMealType === MealType.LUNCH ? Colors.brandPrimary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.mealTabText,
                selectedMealType === MealType.LUNCH && styles.mealTabTextActive,
              ]}
            >
              Lunch Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.mealTab,
              selectedMealType === MealType.DINNER && styles.mealTabActive,
            ]}
            onPress={() => setSelectedMealType(MealType.DINNER)}
            activeOpacity={0.8}
          >
            <TablerIcon
              name="IconMoon"
              size={15}
              color={selectedMealType === MealType.DINNER ? Colors.brandPrimary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.mealTabText,
                selectedMealType === MealType.DINNER && styles.mealTabTextActive,
              ]}
            >
              Dinner Service
            </Text>
          </TouchableOpacity>
        </View>

        {/* Capacity & Cutoff Alert Banner */}
        <View style={styles.alertBanner}>
          <View style={styles.alertItem}>
            <TablerIcon name="IconClock" size={14} color={Colors.brandAccentText} />
            <Text style={styles.alertText}>
              Cutoff: {selectedMealType === MealType.LUNCH ? '11:00 AM' : '07:00 PM'}
            </Text>
          </View>
          <View style={styles.alertItem}>
            <TablerIcon name="IconUsers" size={14} color={Colors.brandPrimary} />
            <Text style={[styles.alertText, { color: Colors.brandPrimary }]}>
              {slotsRemaining} Slots Remaining
            </Text>
          </View>
        </View>

        {/* Menu Items Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Today's Fresh Thalis & Dishes</Text>
          <Text style={styles.sectionSubtitle}>Freshly prepared daily with home-style spices</Text>

          {filteredMenuItems.length === 0 ? (
            <View style={styles.emptyMenuCard}>
              <Text style={styles.emptyMenuText}>No items listed for this meal service yet.</Text>
            </View>
          ) : (
            filteredMenuItems.map((item: any) => {
              const inCart = cartItems.find((ci) => ci.menuItemId === item.id);
              const qty = inCart ? inCart.quantity : 0;

              return (
                <View key={item.id} style={styles.dishCard}>
                  <View style={styles.dishInfo}>
                    <View style={styles.dishHeader}>
                      <Text style={styles.dishName}>{item.name}</Text>
                      <Text style={styles.dishPrice}>₹{item.price}</Text>
                    </View>
                    {item.description && (
                      <Text style={styles.dishDesc}>{item.description}</Text>
                    )}
                  </View>

                  {/* Quantity Stepper Button */}
                  <View style={styles.stepperContainer}>
                    {qty === 0 ? (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() =>
                          addItem(
                            mess.id,
                            mess.name,
                            {
                              menuItemId: item.id,
                              name: item.name,
                              price: Number(item.price),
                              isVeg: item.isVeg,
                            },
                            selectedMealType,
                            new Date().toISOString().split('T')[0]
                          )
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addButtonText}>ADD</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.stepperControls}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item.id, -1)}
                        >
                          <TablerIcon name="IconMinus" size={12} color={Colors.brandPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item.id, 1)}
                        >
                          <TablerIcon name="IconPlus" size={12} color={Colors.brandPrimary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Cart Bar */}
      {itemCount > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartCount}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in thali
            </Text>
            <Text style={styles.cartTotal}>₹{totalAmount} + taxes</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => router.push('/checkout' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutButtonText}>Review & Order</Text>
            <TablerIcon name="IconChevronRight" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: 80,
  },
  messHeaderCard: {
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
    marginBottom: 4,
  },
  messAddress: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  fssaiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fssaiText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgScreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.brandAccent,
    marginLeft: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.brandPrimary,
    marginLeft: 3,
  },
  vegBadge: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successText,
  },
  vegBadgeText: {
    fontSize: 9,
    fontWeight: '500',
    color: Colors.successText,
    marginLeft: 3,
  },
  mealTypeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.chip,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    padding: 3,
    marginBottom: 10,
  },
  mealTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radii.chip - 2,
  },
  mealTabActive: {
    backgroundColor: Colors.brandPrimaryTint,
  },
  mealTabText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  mealTabTextActive: {
    color: Colors.brandPrimary,
  },
  alertBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.brandAccentBg,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.brandAccent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.brandAccentText,
    marginLeft: 5,
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  emptyMenuCard: {
    backgroundColor: Colors.bgCard,
    padding: 24,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    alignItems: 'center',
  },
  emptyMenuText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dishCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.cardGap,
  },
  dishInfo: {
    flex: 1,
    marginRight: 12,
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  dishName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  dishPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
  dishDesc: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  stepperContainer: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  addButton: {
    backgroundColor: Colors.brandPrimaryTint,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radii.button,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgScreen,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    borderRadius: Radii.button,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperValue: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.brandPrimary,
    minWidth: 18,
    textAlign: 'center',
  },
  cartBar: {
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
  cartCount: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  cartTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.button,
  },
  checkoutButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: 4,
  },
});
