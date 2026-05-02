import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CategoryGrid from '@/components/CategoryGrid';
import ProductGrid from '@/components/ProductGrid';
import MeasureModal from '@/components/MeasureModal';
import TicketPanel from '@/components/TicketPanel';
import PaymentModal from '@/components/PaymentModal';
import Spinner from '@/components/Spinner';
import { categoriesApi } from '@/api/categories.api';
import { productsApi } from '@/api/products.api';
import { useOrderStore } from '@/store/useOrderStore';
import { useTableStore } from '@/store/useTableStore';
import type { BottleMeasure, Order, Product } from '@/types';
import { buildPreBillPayload, buildReceiptPayload } from '@/lib/buildReceiptPayload';
import { loadThermalSettings, toElectronPrintConfig } from '@/lib/thermalPrinterConfig';
import {
  computeTipAmount,
  grandTotalWithTip,
  orderTotalForTip,
  parseAmount,
} from '@/lib/tip';

type Props = {
  onBack: () => void;
  onPaid: () => void;
};

function OrderProductsPanel({
  categoryId,
  isBottleCategory,
  onProduct,
  busy,
}: {
  categoryId: number;
  isBottleCategory: boolean;
  onProduct: (p: Product) => void;
  busy: boolean;
}) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => productsApi.getByCategory(categoryId),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <ProductGrid
      products={products.filter((p) => p.active)}
      isBottleCategory={isBottleCategory}
      onProduct={(p) => {
        if (!busy) onProduct(p);
      }}
    />
  );
}

export default function OrderScreen({ onBack, onPaid }: Props) {
  const queryClient = useQueryClient();
  const refresh = useTableStore((s) => s.refresh);
  const currentOrder = useOrderStore((s) => s.currentOrder);
  const activeCategory = useOrderStore((s) => s.activeCategory);
  const setActiveCategory = useOrderStore((s) => s.setActiveCategory);
  const showMeasureModal = useOrderStore((s) => s.showMeasureModal);
  const selectedProduct = useOrderStore((s) => s.selectedProduct);
  const openMeasureModal = useOrderStore((s) => s.openMeasureModal);
  const closeMeasureModal = useOrderStore((s) => s.closeMeasureModal);
  const addFlatItem = useOrderStore((s) => s.addFlatItem);
  const addMeasuredItem = useOrderStore((s) => s.addMeasuredItem);
  const updateQuantity = useOrderStore((s) => s.updateQuantity);
  const removeItem = useOrderStore((s) => s.removeItem);
  const payOrder = useOrderStore((s) => s.payOrder);
  const cancelOrder = useOrderStore((s) => s.cancelOrder);
  const updateNotes = useOrderStore((s) => s.updateNotes);
  const includeTip18 = useOrderStore((s) => s.includeTip18);
  const setIncludeTip18 = useOrderStore((s) => s.setIncludeTip18);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const { data: categoriesRaw = [], isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoriesRaw.filter((c) => c.active !== false);

  useEffect(() => {
    if (!categories.length) return;
    const stillValid =
      activeCategory && categories.some((c) => c.id === activeCategory.id);
    if (!stillValid) setActiveCategory(categories[0]);
  }, [categories, activeCategory, setActiveCategory]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showMeasureModal) closeMeasureModal();
        else if (paymentOpen) setPaymentOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showMeasureModal, paymentOpen, closeMeasureModal]);

  const headerTitle = currentOrder?.tableName ?? 'Orden';

  const subtotalNum = useMemo(
    () => (currentOrder ? parseAmount(currentOrder.subtotal) : 0),
    [currentOrder]
  );
  const taxNum = useMemo(
    () => (currentOrder ? parseAmount(currentOrder.tax) : 0),
    [currentOrder]
  );
  const baseTotalNum = useMemo(
    () => (currentOrder ? orderTotalForTip(currentOrder) : 0),
    [currentOrder]
  );

  const tipAmount = useMemo(() => {
    if (!currentOrder || !includeTip18) return 0;
    return computeTipAmount(currentOrder);
  }, [currentOrder, includeTip18]);

  const grandTotal = useMemo(() => {
    if (!currentOrder) return 0;
    return grandTotalWithTip(currentOrder, includeTip18);
  }, [currentOrder, includeTip18]);

  const handleProduct = async (p: Product) => {
    if (!activeCategory) return;
    if (activeCategory.isBottleCategory) {
      openMeasureModal(p);
      return;
    }
    setActionBusy(true);
    try {
      await addFlatItem(p);
      toast.success(`${p.name} agregado`);
      if (currentOrder?.id) {
        await queryClient.invalidateQueries({ queryKey: ['order', currentOrder.id] });
      }
    } finally {
      setActionBusy(false);
    }
  };

  const handleMeasure = async (m: BottleMeasure) => {
    if (!selectedProduct) return;
    setActionBusy(true);
    try {
      await addMeasuredItem(selectedProduct, m);
      toast.success(`${selectedProduct.name} agregado`);
    } finally {
      setActionBusy(false);
    }
  };

  const handleQty = async (itemId: number, qty: number) => {
    setActionBusy(true);
    try {
      await updateQuantity(itemId, qty);
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemove = async (itemId: number) => {
    setActionBusy(true);
    try {
      await removeItem(itemId);
    } finally {
      setActionBusy(false);
    }
  };

  const confirmCancel = async () => {
    if (!currentOrder) return;
    setActionBusy(true);
    try {
      await cancelOrder();
      await refresh();
      onBack();
    } finally {
      setActionBusy(false);
    }
  };

  const handlePayConfirm = async (method: 'cash' | 'card') => {
    if (!currentOrder) return;
    const snapshot: Order = {
      ...currentOrder,
      items: (currentOrder.items ?? []).map((it) => ({ ...it })),
    };
    const withTip = useOrderStore.getState().includeTip18;
    try {
      await payOrder(method);
      toast.success('¡Pago registrado!');
      setPaymentOpen(false);

      const settings = loadThermalSettings();
      const printApi = window.electronEnv?.printThermalReceipt;
      if (settings.printOnPay && printApi) {
        try {
          const payload = buildReceiptPayload(snapshot, method, settings, 'final', {
            include: withTip,
          });
          const result = await printApi({
            config: toElectronPrintConfig(settings) as Record<string, unknown>,
            payload: { ...payload } as Record<string, unknown>,
          });
          if (!result.ok) {
            toast.error(result.error || 'No se pudo imprimir el ticket');
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Error al imprimir');
        }
      }

      await refresh();
      await queryClient.invalidateQueries({ queryKey: ['pos', 'todaySales'] });
      onPaid();
    } catch {
      /* toast vía interceptor axios */
    }
  };

  const handleSaveNote = async (note: string) => {
    try {
      await updateNotes(note);
      toast.success('Nota guardada');
    } catch {
      toast.error('No se pudo guardar la nota (¿el backend soporta PATCH?)');
    }
  };

  const handlePrintPreBill = async () => {
    if (!currentOrder?.items?.length) {
      toast.error('Agrega artículos para imprimir la pre-cuenta');
      return;
    }
    const printApi = window.electronEnv?.printThermalReceipt;
    if (!printApi) {
      toast.error('La pre-cuenta en impresora solo está disponible en la app de escritorio.');
      return;
    }
    const settings = loadThermalSettings();
    if (settings.connection !== 'tcp') {
      toast.error('Use conexión Red (TCP) con la IP de la impresora en ajustes 🖨');
      return;
    }
    setActionBusy(true);
    try {
      const withTip = useOrderStore.getState().includeTip18;
      const payload = buildPreBillPayload(currentOrder, settings, withTip);
      const result = await printApi({
        config: toElectronPrintConfig(settings) as Record<string, unknown>,
        payload: { ...payload } as Record<string, unknown>,
      });
      if (result.ok) toast.success('Pre-cuenta enviada a la impresora');
      else toast.error(result.error || 'No se pudo imprimir');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al imprimir');
    } finally {
      setActionBusy(false);
    }
  };

  if (!currentOrder) return null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg)]">
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[3fr_2fr]">
        <div className="flex min-h-0 flex-col overflow-hidden border-b border-[var(--border)] lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg2)] px-4 py-3">
            <button
              type="button"
              onClick={async () => {
                await refresh();
                onBack();
              }}
              className="app-no-drag mb-3 min-h-[48px] rounded-[var(--radius)] border border-[var(--border2)] px-4 text-sm font-bold text-[var(--text2)] transition hover:border-[var(--green)] hover:text-[var(--green)] active:scale-[0.98]"
            >
              ← {headerTitle}
            </button>
            {catLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <CategoryGrid
                categories={categories}
                activeCategory={activeCategory}
                onSelect={(c) => setActiveCategory(c)}
              />
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-emerald">
            {activeCategory && (
              <OrderProductsPanel
                categoryId={activeCategory.id}
                isBottleCategory={activeCategory.isBottleCategory}
                onProduct={handleProduct}
                busy={actionBusy}
              />
            )}
          </div>
        </div>

        <TicketPanel
          title={headerTitle}
          createdAt={currentOrder.createdAt}
          notes={currentOrder.notes}
          items={currentOrder.items ?? []}
          subtotal={subtotalNum}
          tax={taxNum}
          total={baseTotalNum}
          onQuantity={handleQty}
          onRemove={handleRemove}
          onCancelOrder={confirmCancel}
          onPay={() => {
            if (!currentOrder.items?.length) {
              toast.error('Agrega artículos antes de cobrar');
              return;
            }
            setPaymentOpen(true);
          }}
          onPrintPreBill={handlePrintPreBill}
          includeTip18={includeTip18}
          onToggleTip18={setIncludeTip18}
          tipAmount={tipAmount}
          grandTotal={grandTotal}
          onSaveNote={handleSaveNote}
          busy={actionBusy}
        />
      </div>

      <MeasureModal
        product={selectedProduct}
        open={showMeasureModal}
        onClose={closeMeasureModal}
        onSelectMeasure={handleMeasure}
      />

      <PaymentModal
        open={paymentOpen}
        total={grandTotal}
        tableLabel={headerTitle}
        onClose={() => setPaymentOpen(false)}
        onConfirm={handlePayConfirm}
      />
    </div>
  );
}
