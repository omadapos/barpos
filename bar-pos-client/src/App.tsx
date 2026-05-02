import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import TableMapScreen from '@/screens/TableMapScreen';
import OrderScreen from '@/screens/OrderScreen';
import ReportsScreen from '@/screens/ReportsScreen';
import PosTopBar from '@/components/PosTopBar';
import { LoginScreen } from '@/screens/LoginScreen';
import { useConnectionStore } from '@/store/useConnectionStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderStore } from '@/store/useOrderStore';

type Screen = 'map' | 'order' | 'reports';

export default function App() {
  const [screen, setScreen] = useState<Screen>('map');
  const [walkInTick, setWalkInTick] = useState(0);
  const queryClient = useQueryClient();
  const check = useConnectionStore((s) => s.check);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const currentOrder = useOrderStore((s) => s.currentOrder);
  const hadTokenRef = useRef(false);

  useEffect(() => {
    check();
    const id = window.setInterval(() => check(), 30_000);
    return () => window.clearInterval(id);
  }, [check]);

  useEffect(() => {
    if (token) {
      hadTokenRef.current = true;
      return;
    }
    if (hadTokenRef.current) {
      setScreen('map');
      queryClient.clear();
      hadTokenRef.current = false;
    }
  }, [token, queryClient]);

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

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--bg)]">
      <Toaster
        position="top-right"
        toastOptions={{ className: 'toast-base', duration: 2500 }}
      />
      <PosTopBar
        main={screen}
        orderContext={orderContext}
        onGoMap={() => setScreen('map')}
        onGoReports={() => setScreen('reports')}
        onQuickSale={() => {
          setScreen('map');
          setWalkInTick((t) => t + 1);
        }}
        session={{
          username: user?.username ?? 'Usuario',
          onSignOut: clearAuth,
        }}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        {screen === 'map' && (
          <TableMapScreen
            walkInTick={walkInTick}
            onNavigateOrder={() => setScreen('order')}
          />
        )}
        {screen === 'order' && (
          <OrderScreen onBack={() => setScreen('map')} onPaid={() => setScreen('map')} />
        )}
        {screen === 'reports' && <ReportsScreen />}
      </div>
    </div>
  );
}
