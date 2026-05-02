import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import CategoryGrid from '@/components/CategoryGrid.jsx';
import ProductGrid from '@/components/ProductGrid.jsx';
import MeasureModal from '@/components/MeasureModal.jsx';
import TicketPanel from '@/components/TicketPanel.jsx';
import PaymentModal from '@/components/PaymentModal.jsx';
import { useOrderStore } from '@/store/useOrderStore';

export default function OrderScreen({ onBack, onPaid }) {
  const {
    currentOrder,
    activeCategory,
    categories,
    products,
    showMeasureModal,
    activeProduct,
    showPaymentModal,
    taxPercent,
    setCategory,
    selectProduct,
    closeMeasureModal,
    addMeasureSelection,
    updateQuantity,
    removeItem,
    openPayment,
    closePayment,
    payOrder,
    cancelOrder,
  } = useOrderStore();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showMeasureModal) closeMeasureModal();
        else if (showPaymentModal) closePayment();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showMeasureModal, showPaymentModal, closeMeasureModal, closePayment]);

  const headerTitle =
    currentOrder?.table_id == null
      ? currentOrder?.table_name || 'Ticket directo'
      : currentOrder?.table_name || 'Mesa';

  const confirmCancel = async () => {
    if (!currentOrder?.id) return;
    if (!window.confirm('¿Cancelar esta orden? Se eliminarán todos los artículos.')) return;
    await cancelOrder();
    onBack();
  };

  const handlePayConfirm = async (method) => {
    const res = await payOrder(method);
    if (!res?.error) onPaid?.();
  };

  if (!currentOrder) return null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950">
      <header className="flex shrink-0 items-center gap-4 border-b border-slate-700 bg-slate-900 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] rounded-xl bg-slate-800 px-4 font-semibold hover:bg-slate-700"
        >
          ← Mesas
        </button>
        <h1 className="text-xl font-bold text-white">Orden activa</h1>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_380px]">
        <div className="min-h-0 overflow-y-auto border-b border-slate-700 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-4">
            <CategoryGrid
              categories={categories}
              activeCategory={activeCategory}
              onSelect={(c) => setCategory(c)}
            />
          </div>
          <ProductGrid
            products={products}
            isBottleCategory={!!activeCategory?.is_bottle_category}
            onProduct={(p) => selectProduct(p)}
          />
        </div>

        <TicketPanel
          title={headerTitle}
          items={currentOrder.items}
          subtotal={currentOrder.subtotal}
          tax={currentOrder.tax}
          total={currentOrder.total}
          taxPercent={taxPercent}
          onQuantity={(id, q) => updateQuantity(id, q)}
          onRemove={(id) => removeItem(id)}
          onCancelOrder={confirmCancel}
          onPay={() => {
            if (!currentOrder.items?.length) {
              toast.error('Agrega artículos antes de cobrar');
              return;
            }
            openPayment();
          }}
        />
      </div>

      <MeasureModal
        product={activeProduct}
        open={showMeasureModal}
        onClose={closeMeasureModal}
        onSelectMeasure={(m) => addMeasureSelection(m)}
      />

      <PaymentModal
        open={showPaymentModal}
        total={currentOrder.total}
        onClose={closePayment}
        onConfirm={(method) => handlePayConfirm(method)}
      />
    </div>
  );
}
