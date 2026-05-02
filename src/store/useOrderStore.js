import { create } from 'zustand';
import toast from 'react-hot-toast';
import { useTableStore } from './useTableStore';

export const useOrderStore = create((set, get) => ({
  currentOrder: null,
  activeCategory: null,
  activeProduct: null,
  showMeasureModal: false,
  showPaymentModal: false,
  categories: [],
  products: [],
  taxPercent: 0,

  loadSettings: async () => {
    const api = window.electronAPI;
    if (!api) return;
    const s = await api.getSettings();
    set({ taxPercent: s?.taxPercent ?? 0 });
  },

  setTaxPercent: async (pct) => {
    const api = window.electronAPI;
    if (!api) return;
    await api.setSettings({ taxPercent: pct });
    set({ taxPercent: pct });
    const { currentOrder } = get();
    if (currentOrder?.id) {
      const updated = await api.getOrderById(currentOrder.id);
      set({ currentOrder: updated });
    }
  },

  fetchCategories: async (reset) => {
    const api = window.electronAPI;
    if (!api) return;
    const categories = await api.getCategories();
    set({ categories: categories || [] });
    const shouldPick = reset || !get().activeCategory;
    if (shouldPick && categories?.length) {
      set({ activeCategory: categories[0] });
      await get().fetchProducts(categories[0].id);
    }
  },

  fetchProducts: async (categoryId) => {
    const api = window.electronAPI;
    if (!api) return;
    const products = await api.getProducts(categoryId);
    set({ products: products || [] });
  },

  setCategory: async (cat) => {
    set({ activeCategory: cat });
    await get().fetchProducts(cat.id);
  },

  selectProduct: (product) => {
    const cat = get().activeCategory;
    if (cat?.is_bottle_category) {
      set({ activeProduct: product, showMeasureModal: true });
      return;
    }
    get().addItemFromProduct(product, null);
  },

  closeMeasureModal: () => set({ showMeasureModal: false, activeProduct: null }),

  addItemFromProduct: async (product, measure) => {
    const api = window.electronAPI;
    const { currentOrder, activeCategory } = get();
    if (!api || !currentOrder?.id) return;

    const item = {
      product_id: product.id,
      product_name: product.name,
      measure_name: measure?.measure_name ?? null,
      category_name: activeCategory?.name ?? null,
      unit_price: measure ? measure.price : product.price,
      quantity: 1,
    };

    try {
      const updated = await api.addOrderItem(currentOrder.id, item);
      set({ currentOrder: updated });
      toast.success('Artículo agregado');
    } catch (e) {
      toast.error('No se pudo agregar el artículo');
    }
  },

  addMeasureSelection: async (measure) => {
    const product = get().activeProduct;
    if (!product) return;
    await get().addItemFromProduct(product, measure);
    set({ showMeasureModal: false, activeProduct: null });
  },

  openOrder: async (payload) => {
    const api = window.electronAPI;
    if (!api) return;
    await get().loadSettings();
    await get().fetchCategories(true);

    let order = null;
    if (payload.orderId) {
      order = await api.getOrderById(payload.orderId);
    } else if (payload.tableId != null) {
      order = await api.getOrderByTable(payload.tableId);
      if (!order) {
        order = await api.createOrder({
          table_id: payload.tableId,
          table_name: payload.tableName,
        });
      }
    } else {
      order = await api.createOrder({
        table_id: null,
        table_name: null,
      });
    }

    set({
      currentOrder: order,
      activeCategory: get().categories[0] || null,
      showMeasureModal: false,
      activeProduct: null,
      showPaymentModal: false,
    });

    const first = get().categories[0];
    if (first) await get().fetchProducts(first.id);
  },

  reloadCurrentOrder: async () => {
    const api = window.electronAPI;
    const id = get().currentOrder?.id;
    if (!api || !id) return;
    const order = await api.getOrderById(id);
    set({ currentOrder: order });
  },

  updateQuantity: async (itemId, qty) => {
    const api = window.electronAPI;
    if (!api) return;
    try {
      const updated = await api.updateItemQuantity(itemId, qty);
      set({ currentOrder: updated });
    } catch {
      toast.error('Error al actualizar cantidad');
    }
  },

  removeItem: async (itemId) => {
    const api = window.electronAPI;
    if (!api) return;
    try {
      const updated = await api.removeOrderItem(itemId);
      set({ currentOrder: updated });
      toast.success('Línea eliminada');
    } catch {
      toast.error('No se pudo eliminar');
    }
  },

  openPayment: () => set({ showPaymentModal: true }),
  closePayment: () => set({ showPaymentModal: false }),

  payOrder: async (method) => {
    const api = window.electronAPI;
    const id = get().currentOrder?.id;
    if (!api || !id) {
      toast.error('Sin orden activa');
      return { error: 'Sin orden' };
    }
    const res = await api.closeOrder(id, method);
    if (res?.error) {
      toast.error(res.error);
      return res;
    }
    toast.success('¡Cobro registrado!');
    set({ currentOrder: null, showPaymentModal: false });
    await useTableStore.getState().refreshAll();
    return res;
  },

  cancelOrder: async () => {
    const api = window.electronAPI;
    const id = get().currentOrder?.id;
    if (!api || !id) return;
    const res = await api.cancelOrder(id);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Orden cancelada');
    set({ currentOrder: null, showPaymentModal: false, showMeasureModal: false });
    await useTableStore.getState().refreshAll();
  },

  clearLocalOrder: () =>
    set({
      currentOrder: null,
      showMeasureModal: false,
      showPaymentModal: false,
      activeProduct: null,
    }),
}));
