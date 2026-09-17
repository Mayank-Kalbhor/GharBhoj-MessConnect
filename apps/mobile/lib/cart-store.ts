import { create } from 'zustand';
import { MealType } from '@messconnect/shared-types';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
}

interface CartState {
  messId: string | null;
  messName: string | null;
  mealType: MealType;
  scheduledDate: string; // YYYY-MM-DD
  items: CartItem[];
  addItem: (messId: string, messName: string, item: Omit<CartItem, 'quantity'>, mealType: MealType, date: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  messId: null,
  messName: null,
  mealType: MealType.LUNCH,
  scheduledDate: new Date().toISOString().split('T')[0],
  items: [],

  addItem: (messId, messName, item, mealType, date) => {
    const state = get();
    // If cart has items from a different mess, reset cart
    if (state.messId && state.messId !== messId) {
      set({
        messId,
        messName,
        mealType,
        scheduledDate: date,
        items: [{ ...item, quantity: 1 }],
      });
      return;
    }

    const existingIndex = state.items.findIndex((i) => i.menuItemId === item.menuItemId);
    if (existingIndex > -1) {
      const updated = [...state.items];
      updated[existingIndex].quantity += 1;
      set({ items: updated });
    } else {
      set({
        messId,
        messName,
        mealType,
        scheduledDate: date,
        items: [...state.items, { ...item, quantity: 1 }],
      });
    }
  },

  updateQuantity: (menuItemId, delta) => {
    const { items } = get();
    const updated = items
      .map((item) => {
        if (item.menuItemId === menuItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter((i): i is CartItem => i !== null);

    if (updated.length === 0) {
      set({ items: [], messId: null, messName: null });
    } else {
      set({ items: updated });
    }
  },

  clearCart: () => {
    set({ items: [], messId: null, messName: null });
  },

  getTotalAmount: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
