import React, { useState, useEffect } from 'react';
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
import {
  getCurrentUserLocation,
  calculateHaversineDistanceKm,
  formatDistanceLabel,
  UserLocationState,
  DEFAULT_INDORE_COORDS,
  DEFAULT_LOCATION_LABEL,
} from '../../lib/location';
import { api } from '../../lib/api-client';

const CUISINE_FILTERS = ['All', 'North Indian', 'Malwi', 'Thali', 'Punjabi'];

export default function HomeScreen() {
  const [locationState, setLocationState] = useState<UserLocationState>({
    coords: DEFAULT_INDORE_COORDS,
    isDefault: true,
    label: DEFAULT_LOCATION_LABEL,
  });
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  // Load location on mount
  useEffect(() => {
    refreshLocation();
  }, []);

  const refreshLocation = async () => {
    const loc = await getCurrentUserLocation();
    setLocationState(loc);
  };

  // Fetch messes
  const { data: messes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['messes', vegOnly, selectedCuisine],
    queryFn: () =>
      api.getMesses({
        latitude: locationState.coords.latitude,
        longitude: locationState.coords.longitude,
        isVeg: vegOnly ? true : undefined,
        cuisine: selectedCuisine !== 'All' ? selectedCuisine : undefined,
      }),
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header & Transparent Location Banner */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.brandTitle}>GharBhoj</Text>
            <Text style={styles.brandSubtitle}>Ghar jaisa swaad, rozana</Text>
          </View>
          <View style={styles.indoreBadge}>
            <Text style={styles.indoreBadgeText}>Indore Launch</Text>
          </View>
        </View>

        {/* Location Banner with explicit Default vs GPS transparency */}
        <TouchableOpacity
          style={[
            styles.locationBanner,
            locationState.isDefault ? styles.locationBannerDefault : styles.locationBannerGps,
          ]}
          onPress={refreshLocation}
          activeOpacity={0.7}
        >
          <TablerIcon
            name="IconMapPin"
            size={14}
            color={locationState.isDefault ? Colors.brandAccentText : Colors.brandPrimary}
          />
          <Text
            style={[
              styles.locationBannerText,
              locationState.isDefault ? styles.locationTextDefault : styles.locationTextGps,
            ]}
            numberOfLines={1}
          >
            {locationState.isDefault
              ? '📍 Bhawarkua, Indore (Default — Tap to enable GPS)'
              : `📍 ${locationState.label}`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refreshLocation();
              refetch();
            }}
            tintColor={Colors.brandPrimary}
          />
        }
      >
        {/* Filters Bar: Veg Toggle & Cuisine Chips */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[styles.vegToggle, vegOnly && styles.vegToggleActive]}
            onPress={() => setVegOnly(!vegOnly)}
            activeOpacity={0.8}
          >
            <TablerIcon
              name="IconLeaf"
              size={14}
              color={vegOnly ? Colors.successText : Colors.textSecondary}
            />
            <Text
              style={[
                styles.vegToggleText,
                vegOnly && styles.vegToggleTextActive,
              ]}
            >
              Pure Veg
            </Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cuisineScroll}
          >
            {CUISINE_FILTERS.map((cuisine) => {
              const isActive = selectedCuisine === cuisine;
              return (
                <TouchableOpacity
                  key={cuisine}
                  style={[styles.cuisineChip, isActive && styles.cuisineChipActive]}
                  onPress={() => setSelectedCuisine(cuisine)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.cuisineChipText,
                      isActive && styles.cuisineChipTextActive,
                    ]}
                  >
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Partner Messes Near You</Text>
          <Text style={styles.sectionSubtitle}>
            {locationState.isDefault
              ? 'Distances computed from Bhawarkua'
              : 'Sorted by distance'}
          </Text>
        </View>

        {/* Mess Cards Feed */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.brandPrimary} />
            <Text style={styles.loadingText}>Finding nearby kitchens...</Text>
          </View>
        ) : (
          messes?.map((mess: any) => {
            const distanceKm = calculateHaversineDistanceKm(locationState.coords, {
              latitude: mess.latitude,
              longitude: mess.longitude,
            });
            const distanceLabel = formatDistanceLabel(distanceKm, locationState.isDefault);
            const slotsRemaining = Math.max(0, (mess.capacity || 100) - (mess.ordersPlaced || 0));

            return (
              <TouchableOpacity
                key={mess.id}
                style={styles.messCard}
                onPress={() => router.push(`/mess/${mess.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.messTitleGroup}>
                    <Text style={styles.messName}>{mess.name}</Text>
                    <Text style={styles.messAddress} numberOfLines={1}>
                      {mess.addressLine}
                    </Text>
                  </View>
                  {mess.isVeg && (
                    <View style={styles.vegBadge}>
                      <TablerIcon name="IconLeaf" size={10} color={Colors.successText} />
                      <Text style={styles.vegBadgeText}>VEG</Text>
                    </View>
                  )}
                </View>

                {/* Badges Row: Rating, Consistency, Distance */}
                <View style={styles.metaRow}>
                  <View style={styles.ratingBadge}>
                    <TablerIcon name="IconStar" size={12} color={Colors.brandAccent} />
                    <Text style={styles.ratingText}>
                      {mess.rating || '4.7'} ({mess.reviewCount || 120})
                    </Text>
                  </View>

                  <View style={styles.metaDivider} />

                  <View style={styles.distanceBadge}>
                    <TablerIcon
                      name="IconMapPin"
                      size={12}
                      color={locationState.isDefault ? Colors.brandAccentText : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.distanceText,
                        locationState.isDefault && styles.distanceTextDefault,
                      ]}
                    >
                      {distanceLabel}
                    </Text>
                  </View>
                </View>

                {/* Footer: Cuisine & Capacity */}
                <View style={styles.cardFooter}>
                  <Text style={styles.cuisineText} numberOfLines={1}>
                    {mess.cuisineTypes?.join(' • ') || 'North Indian'}
                  </Text>
                  <View style={styles.capacityBadge}>
                    <Text style={styles.capacityText}>
                      {slotsRemaining} lunch slots left
                    </Text>
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
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
    backgroundColor: Colors.bgScreen,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDefault,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  indoreBadge: {
    backgroundColor: Colors.brandPrimaryTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  indoreBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  locationBannerDefault: {
    backgroundColor: Colors.brandAccentBg,
    borderWidth: 1,
    borderColor: Colors.brandAccent,
  },
  locationBannerGps: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  locationBannerText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 6,
  },
  locationTextDefault: {
    color: Colors.brandAccentText,
  },
  locationTextGps: {
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vegToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.chip,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
    backgroundColor: Colors.bgCard,
    marginRight: 8,
  },
  vegToggleActive: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successText,
  },
  vegToggleText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  vegToggleTextActive: {
    color: Colors.successText,
  },
  cuisineScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cuisineChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.chip,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
    backgroundColor: Colors.bgCard,
    marginRight: 6,
  },
  cuisineChipActive: {
    backgroundColor: Colors.brandPrimary,
    borderColor: Colors.brandPrimary,
  },
  cuisineChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  cuisineChipTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginBottom: 12,
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
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  messCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.cardGap,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messTitleGroup: {
    flex: 1,
    marginRight: 8,
  },
  messName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  messAddress: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  vegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  vegBadgeText: {
    fontSize: 9,
    fontWeight: '500',
    color: Colors.successText,
    marginLeft: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.brandAccent,
    marginLeft: 4,
  },
  metaDivider: {
    width: 1,
    height: 10,
    backgroundColor: Colors.borderDefault,
    marginHorizontal: 8,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  distanceTextDefault: {
    color: Colors.brandAccentText,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
  },
  cuisineText: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  capacityBadge: {
    backgroundColor: Colors.brandPrimaryTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  capacityText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.brandPrimary,
  },
});
