import React, { useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import LoginScreen from '@/screens/LoginScreen.jsx';
import TableMapScreen from '@/screens/TableMapScreen.jsx';
import OrderScreen from '@/screens/OrderScreen.jsx';
import ReportsScreen from '@/screens/ReportsScreen.jsx';
import { useOrderStore } from '@/store/useOrderStore';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
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

  const handleLogout = useCallback(() => {
    setLoggedIn(false);
    setScreen('tables');
  }, []);

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      {screen === 'tables' && (
        <TableMapScreen onOpenOrder={goOrder} onReports={goReports} onLogout={handleLogout} />
      )}
      {screen === 'order' && (
        <OrderScreen onBack={goTables} onPaid={goTables} />
      )}
      {screen === 'reports' && <ReportsScreen onBack={goTables} />}
    </Box>
  );
}
