import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CategoryGrid from '@/components/CategoryGrid';
import ProductGrid from '@/components/ProductGrid';
import MeasureModal from '@/components/MeasureModal';
import TicketPanel from '@/components/TicketPanel';
import PaymentModal from '@/components/PaymentModal';
import Spinner from '@/components/Spinner';
import ApprovalWaitingModal from '@/components/ApprovalWaitingModal';
import { approvalsApi, type ApprovalStatus } from '@/api/approvals.api';
import { categoriesApi } from '@/api/categories.api';
import { productsApi } from '@/api/products.api';
import { useOrderStore } from '@/store/useOrderStore';
import { useTableStore } from '@/store/useTableStore';
import type { BottleMeasure, Order, OrderItem, Product } from '@/types';
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
      <div className="flex h-full items-center justify-center py-12">
        <Spinner className="h-12 w-12 border-t-[var(--green)]" />
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
  const tables = useTableStore((s) => s.tables);
  const openOrders = useTableStore((s) => s.openOrders);
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
  const sendOrder = useOrderStore((s) => s.sendOrder);
  const moveItems = useOrderStore((s) => s.moveItems);
  const mergeToTable = useOrderStore((s) => s.mergeToTable);
  const updateNotes = useOrderStore((s) => s.updateNotes);
  const includeTip18 = useOrderStore((s) => s.includeTip18);
  const setIncludeTip18 = useOrderStore((s) => s.setIncludeTip18);
  const tipPercent = useOrderStore((s) => s.tipPercent);
  const setTipPercent = useOrderStore((s) => s.setTipPercent);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | 'idle'>('idle');
  const [approvalError, setApprovalError] = useState('');

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
    return computeTipAmount(currentOrder, tipPercent);
  }, [currentOrder, includeTip18, tipPercent]);

  const grandTotal = useMemo(() => {
    if (!currentOrder) return 0;
    return grandTotalWithTip(currentOrder, includeTip18, tipPercent);
  }, [currentOrder, includeTip18, tipPercent]);
  const occupiedOrderTableIds = useMemo(
    () =>
      new Set(
        Object.entries(openOrders)
          .filter(([, order]) => (order.itemCount ?? 0) > 0)
          .map(([tableId]) => Number(tableId))
      ),
    [openOrders]
  );

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
    const { includeTip18: withTip, tipPercent: pctTip } = useOrderStore.getState();
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
            percent: pctTip,
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

  const handleMoveItems = async (
    itemsToMove: Array<{ orderItemId: number; quantity: number }>,
    targetTableId: number
  ) => {
    setActionBusy(true);
    try {
      const { sourceCleared } = await moveItems(itemsToMove, targetTableId);
      await refresh();
      if (sourceCleared) {
        toast.success('Items movidos. Mesa liberada');
        onBack();
      } else {
        toast.success('Items movidos');
      }
    } finally {
      setActionBusy(false);
    }
  };

  const handleMerge = async (targetTableId: number) => {
    setActionBusy(true);
    try {
      await mergeToTable(targetTableId);
      await refresh();
      toast.success('Mesas unidas');
      onBack();
    } finally {
      setActionBusy(false);
    }
  };

  const handleSendOrder = async () => {
    if (!currentOrder?.items?.some((it) => (it.status ?? 'pending') === 'pending')) {
      toast.error('No hay productos nuevos para enviar');
      return;
    }
    setActionBusy(true);
    try {
      await sendOrder();
      await refresh();
      toast.success('Pedido enviado');
      onBack();
    } finally {
      setActionBusy(false);
    }
  };

  const handleRequestVoid = async (item: OrderItem) => {
    if (!currentOrder) return;
    setActionBusy(true);
    setApprovalOpen(true);
    setApprovalStatus('pending');
    setApprovalError('');
    try {
      const request = await approvalsApi.create({
        actionType: 'void_item',
        orderId: currentOrder.id,
        orderItemId: item.id,
        quantity: item.quantity,
        reason: `Anular ${item.productName}`,
        payload: {
          productName: item.productName,
          quantity: item.quantity,
        },
      });

      let finalStatus: ApprovalStatus = request.status;
      for (let i = 0; i < 120 && finalStatus === 'pending'; i += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
        const latest = await approvalsApi.getById(request.id);
        finalStatus = latest.status;
        setApprovalStatus(finalStatus);
        if (latest.error) setApprovalError(latest.error);
      }

      if (finalStatus === 'approved') {
        await useOrderStore.getState().refreshOrder();
        await refresh();
        toast.success('Anulacion aprobada');
      } else if (finalStatus === 'pending') {
        setApprovalStatus('expired');
        setApprovalError('La aprobacion tardo demasiado');
      } else {
        setApprovalError(
          finalStatus === 'rejected'
            ? 'Solicitud rechazada por el jefe'
            : approvalError || 'La solicitud no fue aprobada'
        );
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo solicitar aprobacion';
      setApprovalStatus('failed');
      setApprovalError(message);
      toast.error(message);
    } finally {
      setActionBusy(false);
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
      const { includeTip18: withTip, tipPercent: pctTip } = useOrderStore.getState();
      const payload = buildPreBillPayload(currentOrder, settings, withTip, pctTip);
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
    <div className="flex h-full w-full flex-col bg-[var(--bg)] overflow-hidden">
      {/* Grid Principal: [Productos] [Categorías] [Ticket] */}
      <div className="grid h-full min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_240px_420px]">
        
        {/* Columna 1: Selección de Productos */}
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--bg-subtle)]">
          {/* Header del Panel */}
          <div className="shrink-0 border-b border-[var(--border)] bg-white/50 px-6 py-4 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button
                type="button"
                onClick={async () => {
                  await refresh();
                  onBack();
                }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--text2)] shadow-sm transition-all hover:bg-[var(--bg3)] active:scale-90"
              >
                <span className="text-xl font-bold">←</span>
              </button>
              <div>
                <h1 className="text-2xl font-black text-[var(--text)] leading-tight tracking-tight">{headerTitle}</h1>
                <p className="text-[10px] font-extrabold text-[var(--text3)] uppercase tracking-[0.2em]">Menú Principal</p>
              </div>
            </div>
          </div>
          
          {/* Grid de Productos con Scroll Interno */}
          <div className="min-h-0 flex-1 overflow-y-auto p-6 scrollbar-none scroll-smooth">
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

        {/* Columna 2: Sidebar de Categorías (Glassmorphism) */}
        <div className="hidden lg:flex flex-col h-full overflow-hidden border-x border-[var(--border)] bg-white/30 backdrop-blur-xl">
          <div className="shrink-0 p-5 border-b border-[var(--border)] bg-white/20">
             <p className="text-[10px] font-black text-[var(--text2)] uppercase tracking-widest text-center">Categorías</p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-none p-2">
            {catLoading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner className="h-6 w-6 border-t-[var(--green)]" />
              </div>
            ) : (
              <CategoryGrid
                categories={categories}
                activeCategory={activeCategory}
                onSelect={(c) => setActiveCategory(c)}
              />
            )}
          </div>
        </div>

        {/* Columna 3: Ticket / Carrito (Persistent) */}
        <div className="h-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.06)] z-10 border-l border-[var(--border)]">
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
            onSendOrder={handleSendOrder}
            onPrintPreBill={handlePrintPreBill}
            includeTip18={includeTip18}
            onToggleTip18={setIncludeTip18}
            tipPercent={tipPercent}
            onTipPercentChange={setTipPercent}
            tipAmount={tipAmount}
            grandTotal={grandTotal}
            onSaveNote={handleSaveNote}
            busy={actionBusy}
            tables={tables.filter((t) => t.active)}
            currentTableId={currentOrder.tableId}
            openOrderTableIds={occupiedOrderTableIds}
            onMoveItems={handleMoveItems}
            onMerge={handleMerge}
            onRequestVoid={handleRequestVoid}
          />
        </div>
      </div>

      {/* Modales */}
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

      <ApprovalWaitingModal
        open={approvalOpen}
        status={approvalStatus}
        title="Solicitud enviada"
        detail="Esperando aprobacion del jefe por Telegram..."
        error={approvalError}
        onClose={() => setApprovalOpen(false)}
      />
    </div>
  );
}
