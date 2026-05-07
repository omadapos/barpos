import { create } from 'zustand';
import type { BottleMeasure, Category, Order, Product } from '@/types';
import { ordersApi } from '@/api/orders.api';

interface OrderStore {
  currentOrder: Order | null;
  activeCategory: Category | null;
  selectedProduct: Product | null;
  showMeasureModal: boolean;
  /** Incluir propina en total y ticket (solo UI / impresión; no persiste en API). */
  includeTip18: boolean;
  /** Porcentaje de propina cuando está activa (elige el mesero). */
  tipPercent: number;

  setCurrentOrder: (order: Order | null) => void;
  setIncludeTip18: (value: boolean) => void;
  setTipPercent: (value: number) => void;
  setActiveCategory: (cat: Category | null) => void;
  openMeasureModal: (product: Product) => void;
  closeMeasureModal: () => void;

  addFlatItem: (product: Product) => Promise<void>;
  addMeasuredItem: (product: Product, measure: BottleMeasure) => Promise<void>;
  updateQuantity: (itemId: number, qty: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  payOrder: (method: 'cash' | 'card') => Promise<void>;
  cancelOrder: () => Promise<void>;
  sendOrder: () => Promise<void>;
  refreshOrder: () => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
  moveItems: (
    items: Array<{ orderItemId: number; quantity: number }>,
    targetTableId: number
  ) => Promise<{ sourceCleared: boolean }>;
  mergeToTable: (targetTableId: number) => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  currentOrder: null,
  activeCategory: null,
  selectedProduct: null,
  showMeasureModal: false,
  includeTip18: false,
  tipPercent: 18,

  setCurrentOrder: (order) =>
    set({ currentOrder: order, includeTip18: false, tipPercent: 18 }),
  setIncludeTip18: (value) => set({ includeTip18: value }),
  setTipPercent: (value) => {
    const n = Number(value);
    const pct = Number.isFinite(n) ? Math.min(50, Math.max(0, Math.round(n))) : 18;
    set({ tipPercent: pct });
  },
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  openMeasureModal: (product) => set({ selectedProduct: product, showMeasureModal: true }),
  closeMeasureModal: () => set({ selectedProduct: null, showMeasureModal: false }),

  addFlatItem: async (product) => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    await ordersApi.addItem(currentOrder.id, {
      productId: product.id,
      quantity: 1,
    });
    await get().refreshOrder();
  },

  addMeasuredItem: async (product, measure) => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    await ordersApi.addItem(currentOrder.id, {
      productId: product.id,
      quantity: 1,
      measureName: measure.measureName,
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
      tipPercent: 18,
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
      tipPercent: 18,
    });
  },

  sendOrder: async () => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    const updated = await ordersApi.send(currentOrder.id);
    set({ currentOrder: updated });
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

  moveItems: async (items, targetTableId) => {
    const { currentOrder } = get();
    if (!currentOrder) return { sourceCleared: false };
    const result = await ordersApi.moveItems(currentOrder.id, { targetTableId, items });
    if (result.sourceOrder) {
      set({ currentOrder: result.sourceOrder });
      return { sourceCleared: false };
    }
    set({
      currentOrder: null,
      activeCategory: null,
      selectedProduct: null,
      showMeasureModal: false,
      includeTip18: false,
      tipPercent: 18,
    });
    return { sourceCleared: true };
  },

  mergeToTable: async (targetTableId) => {
    const { currentOrder } = get();
    if (!currentOrder) return;
    await ordersApi.merge(currentOrder.id, { targetTableId });
    set({
      currentOrder: null,
      activeCategory: null,
      selectedProduct: null,
      showMeasureModal: false,
      includeTip18: false,
      tipPercent: 18,
    });
  },
}));
