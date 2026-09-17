import { useAuthStore } from './auth-store';
import { MealType, MessStatus, OrderStatus, SubscriptionStatus } from '@messconnect/shared-types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    // If backend is unreachable, throw or allow callers to catch
    throw err;
  }
}

// ---------------------- MOCK INDORE DATA FALLBACKS ----------------------
export const MOCK_INDORE_MESSES = [
  {
    id: 'mess_indore_01',
    name: 'Maa Annapurna Pure Veg Bhojnalaya',
    fssaiLicenseNumber: '11422850000123',
    city: 'Indore',
    addressLine: '14/2, Bholaram Ustad Marg, Bhawarkua',
    latitude: 22.6912,
    longitude: 75.8679,
    status: MessStatus.ACTIVE,
    isVeg: true,
    cuisineTypes: ['North Indian', 'Malwi'],
    rating: 4.8,
    reviewCount: 342,
    consistencyScore: 96,
    capacity: 120,
    ordersPlaced: 42,
    cutoffTime: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    menuItems: [
      {
        id: 'item_01',
        name: 'Executive Malwi Thali',
        description: '4 Phulka, Dal Fry, Jeera Rice, Paneer Butter Masala, Gulab Jamun',
        price: 130,
        mealType: MealType.LUNCH,
        isVeg: true,
      },
      {
        id: 'item_02',
        name: 'Standard Dal Roti Combo',
        description: '4 Tawa Roti, Tadka Dal, Seasonal Sabzi, Salad',
        price: 90,
        mealType: MealType.LUNCH,
        isVeg: true,
      },
    ],
  },
  {
    id: 'mess_indore_02',
    name: 'Shree Mahakal Student Mess',
    fssaiLicenseNumber: '11422850000456',
    city: 'Indore',
    addressLine: '82, Professor Colony, Near IT Park Square',
    latitude: 22.6842,
    longitude: 75.8712,
    status: MessStatus.ACTIVE,
    isVeg: true,
    cuisineTypes: ['North Indian', 'Thali'],
    rating: 4.6,
    reviewCount: 218,
    consistencyScore: 92,
    capacity: 90,
    ordersPlaced: 78,
    cutoffTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    menuItems: [
      {
        id: 'item_03',
        name: 'Unlimited Student Special Thali',
        description: '5 Ghee Phulka, Sev Tamatar, Chana Masala, Rice, Buttermilk',
        price: 110,
        mealType: MealType.LUNCH,
        isVeg: true,
      },
    ],
  },
  {
    id: 'mess_indore_03',
    name: 'Ghar Ka Swaad (Homely Kitchen)',
    fssaiLicenseNumber: '11422850000789',
    city: 'Indore',
    addressLine: '5, Tower Square, Sapna Sangeeta',
    latitude: 22.7021,
    longitude: 75.8695,
    status: MessStatus.ACTIVE,
    isVeg: false,
    cuisineTypes: ['North Indian', 'Punjabi'],
    rating: 4.5,
    reviewCount: 164,
    consistencyScore: 89,
    capacity: 80,
    ordersPlaced: 35,
    cutoffTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    menuItems: [
      {
        id: 'item_04',
        name: 'Egg Curry & Rice Meal',
        description: '2 Eggs in spiced curry, Steamed Rice, 3 Rotis, Onion Salad',
        price: 140,
        mealType: MealType.LUNCH,
        isVeg: false,
      },
    ],
  },
];

export const MOCK_ORDERS = [
  {
    id: 'ord_live_8912',
    messId: 'mess_indore_01',
    messName: 'Maa Annapurna Pure Veg Bhojnalaya',
    status: OrderStatus.PREPARING,
    mealType: MealType.LUNCH,
    scheduledDate: new Date().toISOString().split('T')[0],
    totalAmount: 130,
    items: [
      {
        id: 'oi_01',
        name: 'Executive Malwi Thali',
        quantity: 1,
        price: 130,
      },
    ],
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    address: 'Room 204, Boys Hostel, Bhawarkua, Indore',
  },
  {
    id: 'ord_live_7104',
    messId: 'mess_indore_02',
    messName: 'Shree Mahakal Student Mess',
    status: OrderStatus.DELIVERED,
    mealType: MealType.DINNER,
    scheduledDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    totalAmount: 110,
    items: [
      {
        id: 'oi_02',
        name: 'Unlimited Student Special Thali',
        quantity: 1,
        price: 110,
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    address: 'Room 204, Boys Hostel, Bhawarkua, Indore',
  },
];

export const MOCK_SUBSCRIPTIONS = [
  {
    id: 'sub_indore_001',
    messId: 'mess_indore_01',
    messName: 'Maa Annapurna Pure Veg Bhojnalaya',
    planName: 'Monthly Lunch & Dinner Saver (30 Days)',
    status: SubscriptionStatus.ACTIVE,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    totalMealsAllotted: 60,
    mealsDelivered: 28,
    mealsSkipped: 3,
    skipCreditsRemaining: 3,
    skipCap: 15, // floor(60 * 0.25)
    // mealsRemaining is derived on the fly: 60 - 28 - 3 = 29
    mealTypes: [MealType.LUNCH, MealType.DINNER],
    cutoffTime: '11:00 AM (Lunch) / 07:00 PM (Dinner)',
    price: 4800,
  },
];

// ---------------------- API METHODS ----------------------
export const api = {
  // Discovery
  getMesses: async (params?: { latitude?: number; longitude?: number; isVeg?: boolean; cuisine?: string }) => {
    try {
      const query = new URLSearchParams();
      if (params?.latitude) query.append('latitude', params.latitude.toString());
      if (params?.longitude) query.append('longitude', params.longitude.toString());
      if (params?.isVeg !== undefined) query.append('isVeg', params.isVeg.toString());
      if (params?.cuisine) query.append('cuisineType', params.cuisine);

      const res = await fetchWithAuth(`/v1/mess?${query.toString()}`);
      return res.data || res;
    } catch {
      // Return filtered mock data
      let list = [...MOCK_INDORE_MESSES];
      if (params?.isVeg !== undefined) {
        list = list.filter((m) => m.isVeg === params.isVeg);
      }
      if (params?.cuisine) {
        list = list.filter((m) => m.cuisineTypes.includes(params.cuisine!));
      }
      return list;
    }
  },

  getMessDetail: async (id: string) => {
    try {
      const res = await fetchWithAuth(`/v1/mess/${id}`);
      return res.data || res;
    } catch {
      const found = MOCK_INDORE_MESSES.find((m) => m.id === id);
      return found || MOCK_INDORE_MESSES[0];
    }
  },

  // Orders
  createOrder: async (dto: any) => {
    try {
      const res = await fetchWithAuth('/v1/orders', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      return res.data || res;
    } catch {
      // Mock order creation response
      const newOrder = {
        id: `ord_${Math.random().toString(36).slice(2, 8)}`,
        messId: dto.messId,
        messName: MOCK_INDORE_MESSES.find((m) => m.id === dto.messId)?.name || 'Indore Mess',
        status: OrderStatus.PLACED,
        mealType: dto.mealType,
        scheduledDate: dto.scheduledDate,
        totalAmount: 130,
        items: dto.items,
        createdAt: new Date().toISOString(),
        address: 'Room 204, Boys Hostel, Bhawarkua, Indore',
      };
      MOCK_ORDERS.unshift(newOrder);
      return newOrder;
    }
  },

  getMyOrders: async () => {
    try {
      const res = await fetchWithAuth('/v1/orders/me');
      return res.data || res;
    } catch {
      return MOCK_ORDERS;
    }
  },

  getOrderDetail: async (orderId: string) => {
    try {
      const res = await fetchWithAuth(`/v1/orders/${orderId}`);
      return res.data || res;
    } catch {
      return MOCK_ORDERS.find((o) => o.id === orderId) || MOCK_ORDERS[0];
    }
  },

  // Subscriptions
  getMySubscriptions: async () => {
    try {
      const res = await fetchWithAuth('/v1/subscriptions/me');
      return res.data || res;
    } catch {
      return MOCK_SUBSCRIPTIONS;
    }
  },

  getSubscriptionDetail: async (subId: string) => {
    try {
      const res = await fetchWithAuth(`/v1/subscriptions/${subId}`);
      return res.data || res;
    } catch {
      return MOCK_SUBSCRIPTIONS.find((s) => s.id === subId) || MOCK_SUBSCRIPTIONS[0];
    }
  },

  skipSubscriptionMeal: async (subId: string, date: string) => {
    try {
      const res = await fetchWithAuth(`/v1/subscriptions/${subId}/skip`, {
        method: 'POST',
        body: JSON.stringify({ date }),
      });
      return res.data || res;
    } catch {
      const sub = MOCK_SUBSCRIPTIONS.find((s) => s.id === subId);
      if (sub) {
        // Enforce 25% skip cap
        const maxSkips = Math.floor(sub.totalMealsAllotted * 0.25);
        if (sub.mealsSkipped >= maxSkips) {
          throw new Error(`Skip cap reached: Maximum ${maxSkips} skips allowed.`);
        }
        sub.mealsSkipped += 1;
        sub.skipCreditsRemaining += 1;
      }
      return {
        status: 'SKIPPED',
        mealsSkipped: sub?.mealsSkipped,
        skipCreditsRemaining: sub?.skipCreditsRemaining,
        creditBanked: true,
      };
    }
  },
};
