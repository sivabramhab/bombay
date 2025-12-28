import { create } from 'zustand';
import toast from 'react-hot-toast';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  quantity: number;
  seller?: string;
  allowBargaining?: boolean;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

// Load cart from localStorage on initialization
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('cart-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Handle both old format (with state wrapper) and new format (direct items array)
      return parsed.state?.items || parsed.items || [];
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
  }
  return [];
};

// Save cart to localStorage
const saveCartToStorage = (items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cart-storage', JSON.stringify({ items }));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

export const useCartStore = create<CartState>((set, get) => {
  // Initialize from storage if available (only on client side)
  let initialItems: CartItem[] = [];
  let initialTotal = 0;
  
  if (typeof window !== 'undefined') {
    initialItems = loadCartFromStorage();
    initialTotal = initialItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  return {
    items: initialItems,
    totalItems: initialTotal,

    addToCart: (item) => {
      const items = get().items;
      const existingItem = items.find((i) => i.id === item.id);

      if (existingItem) {
        // If item already exists, increase quantity
        const updatedItems = items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        saveCartToStorage(updatedItems);
        set({
          items: updatedItems,
          totalItems,
        });
        toast.success(`${item.name} quantity updated in cart!`);
      } else {
        // Add new item to cart
        const newItem = { ...item, quantity: 1 };
        const updatedItems = [...items, newItem];
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        saveCartToStorage(updatedItems);
        set({
          items: updatedItems,
          totalItems,
        });
        toast.success(`${item.name} added to cart!`, {
          icon: '🛒',
        });
      }
    },

    removeFromCart: (id: string) => {
      const items = get().items;
      const item = items.find((i) => i.id === id);
      const updatedItems = items.filter((i) => i.id !== id);
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      saveCartToStorage(updatedItems);
      set({
        items: updatedItems,
        totalItems,
      });
      if (item) {
        toast.success(`${item.name} removed from cart!`);
      }
    },

    updateQuantity: (id: string, quantity: number) => {
      if (quantity <= 0) {
        get().removeFromCart(id);
        return;
      }

      const items = get().items;
      const updatedItems = items.map((i) =>
        i.id === id ? { ...i, quantity } : i
      );
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      saveCartToStorage(updatedItems);
      set({
        items: updatedItems,
        totalItems,
      });
    },

    clearCart: () => {
      saveCartToStorage([]);
      set({ items: [], totalItems: 0 });
      toast.success('Cart cleared!');
    },

    getTotalPrice: () => {
      return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
    },
  };
});

