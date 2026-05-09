import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import TableMapScreen from '@/screens/TableMapScreen';
import OrderScreen from '@/screens/OrderScreen';
import ReportsScreen from '@/screens/ReportsScreen';
import PosTopBar from '@/components/PosTopBar';
import { LoginScreen } from '@/screens/LoginScreen';
import CloseShiftModal from '@/components/CloseShiftModal';
import OpenShiftModal from '@/components/OpenShiftModal';
import { useConnectionStore } from '@/store/useConnectionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useShiftStore } from '@/store/useShiftStore';

type Screen = 'map' | 'order' | 'reports';

export default function App() {
  const [screen, setScreen] = useState<Screen>('map');
  const [walkInTick, setWalkInTick] = useState(0);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const returnToTablesRef = useRef<(() => Promise<void>) | null>(null);
  const queryClient = useQueryClient();
  const check = useConnectionStore((s) => s.check);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const currentOrder = useOrderStore((s) => s.currentOrder);
  const currentShift = useShiftStore((s) => s.currentShift);
  const shiftLoading = useShiftStore((s) => s.loading);
  const checkCurrentShift = useShiftStore((s) => s.checkCurrentShift);
  const clearShift = useShiftStore((s) => s.clearShift);
  const hadTokenRef = useRef(false);

  useEffect(() => {
    check();
    const id = window.setInterval(() => check(), 30_000);
    return () => window.clearInterval(id);
  }, [check]);

  useEffect(() => {
    if (token) {
      hadTokenRef.current = true;
      void checkCurrentShift();
      return;
    }
    if (hadTokenRef.current) {
      setScreen('map');
      queryClient.clear();
      clearShift();
      hadTokenRef.current = false;
    }
  }, [token, queryClient, checkCurrentShift, clearShift]);

  if (!token) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Toaster
          position="top-center"
          toastOptions={{ className: 'toast-base', duration: 2500 }}
        />
        <LoginScreen />
      </div>
    );
  }

  const orderContext =
    screen === 'order' && currentOrder
      ? currentOrder.tableId == null
        ? 'walkin'
        : 'table'
      : null;

  const goMapSafely = () => {
    if (screen === 'order' && returnToTablesRef.current) {
      void returnToTablesRef.current();
      return;
    }
    setScreen('map');
  };

  const goReportsSafely = () => {
    if (screen === 'order' && returnToTablesRef.current) {
      toast.error('Primero envia el pedido y vuelve a mesas');
      void returnToTablesRef.current();
      return;
    }
    setScreen('reports');
  };

  const quickSaleSafely = () => {
    if (!currentShift) return;
    if (screen === 'order' && returnToTablesRef.current) {
      toast.error('Primero envia el pedido actual');
      void returnToTablesRef.current();
      return;
    }
    setScreen('map');
    setWalkInTick((t) => t + 1);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bg)]">
      <Toaster
        position="top-right"
        toastOptions={{ className: 'toast-base', duration: 2500 }}
      />
      <PosTopBar
        main={screen}
        orderContext={orderContext}
        onGoMap={goMapSafely}
        onGoReports={goReportsSafely}
        onQuickSale={quickSaleSafely}
        shift={currentShift}
        canCloseShift={user?.role?.toLowerCase() === 'admin'}
        onCloseShift={() => setCloseShiftOpen(true)}
        session={{
          username: user?.username ?? 'Usuario',
          onSignOut: clearAuth,
        }}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        {shiftLoading && (
          <div className="flex h-full items-center justify-center text-sm font-bold text-[var(--text3)]">
            Verificando turno...
          </div>
        )}
        {!shiftLoading && screen === 'map' && (
          <TableMapScreen
            walkInTick={walkInTick}
            onNavigateOrder={() => setScreen('order')}
          />
        )}
        {!shiftLoading && screen === 'order' && (
          <OrderScreen
            onBack={() => setScreen('map')}
            onPaid={() => setScreen('map')}
            onRegisterReturnToTables={(handler) => {
              returnToTablesRef.current = handler;
            }}
          />
        )}
        {!shiftLoading && screen === 'reports' && <ReportsScreen />}
      </div>
      <OpenShiftModal open={!shiftLoading && !currentShift} />
      <CloseShiftModal open={closeShiftOpen} onClose={() => setCloseShiftOpen(false)} />
    </div>
  );
}
