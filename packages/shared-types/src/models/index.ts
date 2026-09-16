import {
  UserRole,
  MessStatus,
  MealType,
  SubscriptionStatus,
  OrderType,
  OrderStatus,
  PaymentType,
  PaymentStatus,
  PayoutStatus,
  DeliveryStatus,
  WalletTxnType,
  NotificationType
} from '../enums';

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  phone: string;
  email: string | null;
  firebaseUid: string;
  isStudentVerified: boolean;
  studentIdDocUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}

export interface Mess {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  fssaiLicenseNumber: string;
  licenseDocUrl: string | null;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  isVeg: boolean;
  cuisineTypes: string[];
  status: MessStatus;
  avgRating: number;
  hygieneRating: number;
  consistencyScore: number;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  bankAccountHolder: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  messId: string;
  name: string;
  description: string | null;
  mealType: MealType;
  isVeg: boolean;
  price: string; // Decimal(10,2) string
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyMenu {
  id: string;
  messId: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  capacity: number;
  ordersPlaced: number;
  cutoffTime: string; // ISO-8601
  createdAt: string;
}

export interface DailyMenuItem {
  id: string;
  dailyMenuId: string;
  menuItemId: string;
}

export interface SubscriptionPlan {
  id: string;
  messId: string;
  name: string;
  mealTypes: MealType[];
  durationDays: number;
  price: string; // Decimal(10,2) string
  refundPolicyText: string;
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  messId: string;
  planId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: SubscriptionStatus;
  mealTypesIncluded: MealType[];
  totalMealsAllotted: number;
  mealsDelivered: number;
  mealsSkipped: number;
  skipCreditsRemaining: number;
  balanceAmount: string; // Decimal(10,2) string
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPause {
  id: string;
  subscriptionId: string;
  pauseStart: string; // YYYY-MM-DD
  pauseEnd: string; // YYYY-MM-DD
  reason: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderType: OrderType;
  userId: string;
  messId: string;
  subscriptionId: string | null;
  addressId: string;
  mealType: MealType;
  scheduledDate: string; // YYYY-MM-DD
  status: OrderStatus;
  amount: string; // Decimal(10,2) string
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  priceEach: string; // Decimal(10,2) string
}

export interface Review {
  id: string;
  userId: string;
  messId: string;
  orderId: string | null;
  subscriptionId: string | null;
  tasteRating: number;
  hygieneRating: number;
  quantityRating: number;
  punctualityRating: number;
  overallRating: number;
  comment: string | null;
  photoUrls: string[];
  isVerifiedSubscriber: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  orderId: string | null;
  subscriptionId: string | null;
  amount: string; // Decimal(10,2) string
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: string; // Decimal(10,2) string
  currency: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: string; // Decimal(10,2) string
  type: WalletTxnType;
  reason: string;
  referenceId: string | null;
  createdAt: string;
}

export interface Payout {
  id: string;
  messId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  grossAmount: string; // Decimal(10,2) string
  commissionAmount: string; // Decimal(10,2) string
  netAmount: string; // Decimal(10,2) string
  status: PayoutStatus;
  razorpayPayoutId: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface DeliveryPartner {
  id: string;
  userId: string;
  vehicleType: string;
  isAvailable: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  rating: number;
  createdAt: string;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  deliveryPartnerId: string;
  status: DeliveryStatus;
  otp: string;
  assignedAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
}

export interface CityConfig {
  id: string;
  cityName: string;
  commissionPercentage: string; // Decimal(5,2) string
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
