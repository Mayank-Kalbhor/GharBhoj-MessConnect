import {
  UserRole,
  MessStatus,
  MealType,
  SubscriptionStatus,
  OrderStatus,
  PaymentStatus,
  PayoutStatus,
  DeliveryStatus
} from '../enums';
import {
  User,
  Address,
  Mess,
  MenuItem,
  DailyMenu,
  SubscriptionPlan,
  Subscription,
  Order,
  Review,
  Payment,
  Wallet,
  WalletTransaction,
  Payout,
  DeliveryAssignment,
  CityConfig,
  Notification
} from '../models';

// Envelopes
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details: any | null;
}

export interface ErrorEnvelope {
  error: ErrorDetails;
}

// 3. Auth Module
export interface VerifyAuthDto {
  firebaseIdToken: string;
}

export interface VerifyAuthResponse {
  accessToken: string | null;
  requiresSignup?: boolean;
  firebaseUid?: string;
  phone?: string;
  user?: {
    id: string;
    role: UserRole;
    fullName: string;
    phone: string;
    isStudentVerified: boolean;
  };
}

export interface SignupDto {
  firebaseIdToken: string;
  role: UserRole;
  fullName: string;
  email?: string | null;
}

export interface SignupResponse {
  accessToken: string;
  user: {
    id: string;
    role: UserRole;
    fullName: string;
    phone: string;
  };
}

// 4. Users Module
export interface UpdateUserDto {
  fullName?: string;
  email?: string;
}

export interface StudentVerificationDto {
  studentIdDocUrl: string;
}

export interface CreateAddressDto {
  label: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface UpdateAddressDto extends Partial<CreateAddressDto> {}

// 5. Mess Discovery Module
export interface MessSearchQuery {
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  city?: string;
  cuisine?: string;
  isVeg?: boolean;
  minRating?: number;
  sortBy?: 'distance' | 'rating' | 'price';
  page?: number;
  limit?: number;
}

export interface MessSearchResultItem {
  id: string;
  name: string;
  avgRating: number;
  consistencyScore: number;
  isVeg: boolean;
  cuisineTypes: string[];
  distanceMeters?: number;
  city: string;
  status: MessStatus;
}

export interface DailyMenuSummaryItem {
  id: string;
  name: string;
  isVeg: boolean;
  price: string;
  imageUrl: string | null;
}

export interface DailyMenuWithItems {
  dailyMenuId: string;
  mealType: MealType;
  date: string;
  capacity: number;
  ordersPlaced: number;
  slotsRemaining: number;
  cutoffTime: string;
  isCutoffPassed: boolean;
  items: DailyMenuSummaryItem[];
}

// 6. Vendor Mess Module
export interface CreateMessDto {
  name: string;
  description?: string | null;
  fssaiLicenseNumber: string;
  licenseDocUrl?: string | null;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  isVeg?: boolean;
  cuisineTypes: string[];
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  bankAccountHolder?: string | null;
}

export interface UpdateMessDto extends Partial<CreateMessDto> {}

export interface CreateMenuItemDto {
  name: string;
  description?: string | null;
  mealType: MealType;
  isVeg?: boolean;
  price: string;
  imageUrl?: string | null;
}

export interface UpdateMenuItemDto extends Partial<CreateMenuItemDto> {
  isAvailable?: boolean;
}

export interface CreateDailyMenuDto {
  date: string;
  mealType: MealType;
  capacity: number;
  cutoffTime: string;
  menuItemIds: string[];
}

export interface MealCountSheetMealType {
  mealType: MealType;
  subscriptionOrders: number;
  oneTimeOrders: number;
  total: number;
  capacity: number;
}

export interface MealCountSheetResponse {
  date: string;
  byMealType: MealCountSheetMealType[];
}

// 7. Orders Module
export interface CreateOrderItemDto {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderDto {
  messId: string;
  addressId: string;
  mealType: MealType;
  scheduledDate: string;
  items: CreateOrderItemDto[];
  paymentMethod: string;
}

export interface CreateOrderResponse {
  id: string;
  orderType: string;
  status: OrderStatus;
  amount: string;
  razorpayOrderId?: string | null;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

export interface CancelOrderDto {
  reason: string;
}

// 8. Subscriptions Module
export interface CreateSubscriptionDto {
  messId: string;
  planId: string;
  startDate: string;
  addressId: string;
  autoRenew?: boolean;
  walletCreditToApply?: string;
}

export interface CreateSubscriptionResponse {
  id: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  totalMealsAllotted: number;
  mealsDelivered: number;
  mealsSkipped: number;
  skipCreditsRemaining: number;
  balanceAmount: string;
  razorpayOrderId?: string | null;
}

export interface SkipMealDto {
  date: string;
}

export interface SkipMealResponse {
  orderId: string;
  orderStatus: OrderStatus;
  skipCreditsRemaining: number;
  creditBanked: boolean;
}

export interface RedeemSkipCreditDto {
  date: string;
  mealType: MealType;
}

export interface PauseSubscriptionDto {
  pauseStart: string;
  pauseEnd: string;
  reason?: string | null;
}

export interface PauseSubscriptionResponse {
  subscriptionPauseId: string;
  newEndDate: string;
}

export interface CancelSubscriptionDto {
  reason?: string | null;
}

export interface CancelSubscriptionResponse {
  status: SubscriptionStatus;
  netRefundAmount: string;
  refundPaymentId: string;
}

export interface SwitchMessDto {
  newMessId: string;
  newPlanId: string;
  startDate: string;
}

export interface SwitchMessResponse {
  oldSubscription: {
    id: string;
    status: SubscriptionStatus;
  };
  walletCreditApplied: string;
  newSubscription: Subscription;
}

// 9. Payments Module
export interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id?: string;
        amount: number;
        currency: string;
        status: string;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        receipt?: string;
      };
    };
  };
}

// 10. Wallet Module
export interface TopupWalletDto {
  amount: string;
}

export interface TopupWalletResponse {
  razorpayOrderId: string;
}

// 11. Admin Module
export interface UpdateMessStatusDto {
  status: MessStatus;
  reason?: string;
}

export interface UpdateStudentVerificationDto {
  isStudentVerified: boolean;
}

export interface CreateCityConfigDto {
  cityName: string;
  commissionPercentage: string;
}

export interface UpdateCityConfigDto {
  commissionPercentage?: string;
  isActive?: boolean;
}

export interface AdminAnalyticsResponse {
  gmv: string;
  activeSubscriptions: number;
  activeMesses: number;
  churnRatePercent: number;
  cityWiseGrowth: Array<{
    cityName: string;
    gmv: string;
    activeUsers: number;
  }>;
}

// 12. Payouts Module
export interface RunPayoutsDto {
  messId?: string | null;
  periodStart: string;
  periodEnd: string;
}

// 13. Delivery Module
export interface OnboardDeliveryPartnerDto {
  vehicleType: string;
}

export interface UpdateAvailabilityDto {
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface DeliverOrderDto {
  otp: string;
}

// 14. Reviews Module
export interface CreateReviewDto {
  messId: string;
  orderId?: string | null;
  subscriptionId?: string | null;
  tasteRating: number;
  hygieneRating: number;
  quantityRating: number;
  punctualityRating: number;
  comment?: string | null;
  photoUrls?: string[];
}

// 15. Notifications Module
export interface NotificationReadDto {
  isRead: boolean;
}
