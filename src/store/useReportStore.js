import { create } from 'zustand';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns';

function toSqlRange(fromDate, toDate) {
  const from = format(startOfDay(fromDate), 'yyyy-MM-dd HH:mm:ss');
  const to = format(endOfDay(toDate), 'yyyy-MM-dd HH:mm:ss');
  return { from, to };
}

export const useReportStore = create((set, get) => ({
  preset: 'today',
  customFrom: null,
  customTo: null,
  rangeFrom: '',
  rangeTo: '',
  summary: null,
  byCategory: [],
  byProduct: [],
  byTable: [],
  productCategoryFilter: '',
  loading: false,

  setPreset: (preset) => {
    const now = new Date();
    let fromDate = now;
    let toDate = now;
    if (preset === 'week') {
      fromDate = startOfWeek(now, { weekStartsOn: 1 });
      toDate = endOfWeek(now, { weekStartsOn: 1 });
    } else if (preset === 'month') {
      fromDate = startOfMonth(now);
      toDate = endOfMonth(now);
    } else if (preset === 'custom') {
      const { customFrom, customTo } = get();
      if (customFrom && customTo) {
        fromDate = customFrom;
        toDate = customTo;
      } else {
        fromDate = now;
        toDate = now;
      }
    }
    const { from, to } = toSqlRange(fromDate, toDate);
    set({ preset, rangeFrom: from, rangeTo: to });
  },

  setCustomRange: (from, to) => {
    set({ customFrom: from, customTo: to, preset: 'custom' });
    get().setPreset('custom');
  },

  setProductCategoryFilter: (v) => set({ productCategoryFilter: v }),

  fetchAll: async () => {
    const api = window.electronAPI;
    if (!api) return;
    let { rangeFrom, rangeTo, productCategoryFilter } = get();
    if (!rangeFrom || !rangeTo) {
      get().setPreset('today');
      rangeFrom = get().rangeFrom;
      rangeTo = get().rangeTo;
    }
    const rf = rangeFrom;
    const rt = rangeTo;
    set({ loading: true });
    try {
      const [summary, byCategory, byProduct, byTable] = await Promise.all([
        api.getReportSummary(rf, rt),
        api.getReportByCategory(rf, rt),
        api.getReportByProduct(rf, rt, productCategoryFilter || null),
        api.getReportByTable(rf, rt),
      ]);
      set({
        summary,
        byCategory: byCategory || [],
        byProduct: byProduct || [],
        byTable: byTable || [],
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
