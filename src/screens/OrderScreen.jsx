import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import CategoryGrid from '@/components/CategoryGrid.jsx';
import ProductGrid from '@/components/ProductGrid.jsx';
import MeasureModal from '@/components/MeasureModal.jsx';
import TicketPanel from '@/components/TicketPanel.jsx';
import PaymentModal from '@/components/PaymentModal.jsx';
import { useOrderStore } from '@/store/useOrderStore';

export default function OrderScreen({ onBack, onPaid }) {
  const s = useOrderStore();
  const {
    currentOrder, activeCategory, categories, products,
    showMeasureModal, activeProduct, showPaymentModal, taxPercent,
    setCategory, selectProduct, closeMeasureModal, addMeasureSelection,
    updateQuantity, removeItem, openPayment, closePayment, payOrder, cancelOrder,
  } = s;

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

  const headerTitle = currentOrder?.table_id == null
    ? currentOrder?.table_name || 'Ticket directo'
    : currentOrder?.table_name || 'Mesa';

  const confirmCancel = async () => {
    if (!currentOrder?.id) return;
    if (!window.confirm('¿Cancelar esta orden?')) return;
    await cancelOrder();
    onBack();
  };

  const handlePayConfirm = async (method) => {
    const res = await payOrder(method);
    if (!res?.error) onPaid?.();
  };

  if (!currentOrder) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: 'background.default' }}>
      <Box component="header" sx={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2,
        borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
        px: { xs: 3, md: 4 }, py: 2, boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
      }}>
        <Button variant="outlined" color="inherit" onClick={onBack} startIcon={<ArrowLeft size={18} />}
          sx={{ borderRadius: 3, py: 1.2, fontWeight: 800, borderColor: 'divider', color: 'text.secondary' }}>
          Mesas
        </Button>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <UtensilsCrossed size={20} color="#6366f1" />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Orden activa</Typography>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' } }}>
        <Box sx={{ minHeight: 0, overflowY: 'auto', borderRight: { lg: '1px solid' }, borderColor: 'divider', p: { xs: 3, md: 4 } }}>
          <Box sx={{ mb: 3 }}>
            <CategoryGrid categories={categories} activeCategory={activeCategory} onSelect={(c) => setCategory(c)} />
          </Box>
          <ProductGrid products={products} isBottleCategory={!!activeCategory?.is_bottle_category} onProduct={(p) => selectProduct(p)} />
        </Box>
        <TicketPanel title={headerTitle} items={currentOrder.items} subtotal={currentOrder.subtotal}
          tax={currentOrder.tax} total={currentOrder.total} taxPercent={taxPercent}
          onQuantity={(id, q) => updateQuantity(id, q)} onRemove={(id) => removeItem(id)}
          onCancelOrder={confirmCancel} onPay={() => {
            if (!currentOrder.items?.length) { toast.error('Agrega artículos antes de cobrar'); return; }
            openPayment();
          }} />
      </Box>

      <MeasureModal product={activeProduct} open={showMeasureModal} onClose={closeMeasureModal} onSelectMeasure={(m) => addMeasureSelection(m)} />
      <PaymentModal open={showPaymentModal} total={currentOrder.total} onClose={closePayment} onConfirm={(method) => handlePayConfirm(method)} />
    </Box>
  );
}
