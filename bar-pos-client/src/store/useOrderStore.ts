import { create } from 'zustand';
import type { BottleMeasure, Category, Order, Product } from '@/types';
import { ordersApi } from '@/api/orders.api';

interface OrderStore {
  currentOrder: Order | null;
  activeCategory: Category | null;
  selectedProduct: Product | null;
  showMeasureModal: boolean;
  /** Propina 18 % opcional sobre el total de la orden (solo UI / ticket; no persiste en API). */
  includeTip18: boolean;

  setCurrentOrder: (order: Order | null) => void;
  setIncludeTip18: (value: boolean) => void;
  setActiveCategory: (cat: Category | null) => void;
  openMeasureModal: (product: Product) => void;
  closeMeasureModal: () => void;

  addFlatItem: (product: Product) => Promise<void>;
  addMeasuredItem: (product: Product, measure: BottleMeasure) => Promise<void>;
  updateQuantity: (itemId: number, qty: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  payOrder: (method: 'cash' | 'card') => Promise<void>;
  cancelOrder: () => Promise<void>;
  refreshOrder: () => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  currentOrder: null,
  activeCategory: null,
  selectedProduct: null,
  showMeasureModal: false,
  includeTip18: false,

  setCurrentOrder: (order) => set({ currentOrder: order, includeTip18: false }),
  setIncludeTip18: (value) => set({ includeTip18: value }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  openMeasureModal: (product) => set({ selectedProduct: product, showMeasureModal: true }),
  closeMeasureModal: () => set({ selectedProduct: null, showMeasureModal: false }),

  addFlatItem: async (product) => {
    const { currentOrder, activeCategory } = get();
    if (!currentOrder) return;
    await ordersApi.addItem(currentOrder.id, {
      productId: product.id,
      quantity: 1,
    });
    await get().refreshOrder();
  },

  addMeasuredItem: async (product, measure) => {
    const { currentOrder, activeCategory } = get();
    if (!currentOrder) return;
    await ordersApi.addItem(currentOrder.id, {
      productId: product.id,
      quantity: 1,
      notes: measure.measureName,
    });
    get().closeMeasureModal();
    await get().refreshOrder();
  },

  updateQuantity: async (itemId, qty) => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    if (qty <= 0) {
      await ordersApi.removeItem(currentOrder.id, itemId);
    } else {
      await ordersApi.updateQty(currentOrder.id, itemId, qty);
    }
    await get().refreshOrder();
  },

  removeItem: async (itemId) => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    await ordersApi.removeItem(currentOrder.id, itemId);
    await get().refreshOrder();
  },

  payOrder: async (method) => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    await ordersApi.pay(currentOrder.id, method);
    set({
      currentOrder: null,
      activeCategory: null,
      selectedProduct: null,
      showMeasureModal: false,
      includeTip18: false,
    });
  },

  cancelOrder: async () => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    await ordersApi.cancel(currentOrder.id);
    set({
      currentOrder: null,
      activeCategory: null,
      selectedProduct: null,
      showMeasureModal: false,
      includeTip18: false,
    });
  },

  refreshOrder: async () => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    const updated = await ordersApi.getById(currentOrder.id);
    set({ currentOrder: updated });
  },

  updateNotes: async (notes) => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    await ordersApi.updateNotes(currentOrder.id, notes);
    await get().refreshOrder();
  },
}));
