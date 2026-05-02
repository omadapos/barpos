import React, { useCallback, useState } from 'react';
import TableMapScreen from '@/screens/TableMapScreen.jsx';
import OrderScreen from '@/screens/OrderScreen.jsx';
import ReportsScreen from '@/screens/ReportsScreen.jsx';
import { useOrderStore } from '@/store/useOrderStore';

export default function App() {
  const [screen, setScreen] = useState('tables');
  const openOrderFromStore = useOrderStore((s) => s.openOrder);

  const goOrder = useCallback(
    async (payload) => {
      await openOrderFromStore(payload);
      setScreen('order');
    },
    [openOrderFromStore]
  );

  const goTables = useCallback(() => setScreen('tables'), []);
  const goReports = useCallback(() => setScreen('reports'), []);

  return (
    <div className="h-full min-h-screen bg-slate-950 text-white">
      {screen === 'tables' && (
        <TableMapScreen onOpenOrder={goOrder} onReports={goReports} />
      )}
      {screen === 'order' && (
        <OrderScreen onBack={goTables} onPaid={goTables} />
      )}
      {screen === 'reports' && <ReportsScreen onBack={goTables} />}
    </div>
  );
}
