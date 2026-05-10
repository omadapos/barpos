import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock3, ClipboardList, ReceiptText, RefreshCw, Wifi } from 'lucide-react';
import { reportsApi } from '@/api/reports.api';
import { formatMoney } from '@/lib/format';
import { useConnectionStore } from '@/store/useConnectionStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useTableStore } from '@/store/useTableStore';

function todayRange() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const day = `${yyyy}-${mm}-${dd}`;
  return { from: day, to: day };
}

export default function BottomStatusBar() {
  const online = useConnectionStore((s) => s.online);
  const checking = useConnectionStore((s) => s.checking);
  const openOrders = useTableStore((s) => s.openOrders);
  const currentOrder = useOrderStore((s) => s.currentOrder);

  const { from, to } = useMemo(todayRange, []);
  const summaryQuery = useQuery({
    queryKey: ['pos', 'todaySales', from, to],
    queryFn: () => reportsApi.getSummary(from, to),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const kitchenPending =
    currentOrder?.items?.filter((it) => (it.status ?? 'pending') === 'pending').length ?? 0;
  const openTicketCount = Object.keys(openOrders).length;
  const lastSyncLabel = summaryQuery.isFetching || checking ? 'Actualizando' : 'Hace 1 min';

  const cells = [
    {
      icon: Wifi,
      title: 'Conectado',
      value: online ? 'Excelente' : 'Sin conexion',
      valueClass: online ? 'text-[var(--green2)]' : 'text-[var(--red)]',
    },
    {
      icon: Clock3,
      title: 'Cocina',
      value: `${kitchenPending} pendiente${kitchenPending === 1 ? '' : 's'}`,
      valueClass: kitchenPending > 0 ? 'text-[var(--amber)]' : 'text-[var(--green2)]',
    },
    {
      icon: ClipboardList,
      title: 'Ventas del dia',
      value: formatMoney(summaryQuery.data?.totalSales ?? 0),
      valueClass: 'text-white',
    },
    {
      icon: ReceiptText,
      title: 'Tickets abiertos',
      value: String(openTicketCount),
      valueClass: 'text-white',
    },
    {
      icon: RefreshCw,
      title: 'Sincronizado',
      value: lastSyncLabel,
      valueClass: summaryQuery.isError ? 'text-[var(--red)]' : 'text-slate-300',
    },
  ];

  return (
    <footer className="app-no-drag grid h-[62px] shrink-0 grid-cols-5 border-t border-white/10 bg-[#10151b] px-7 text-white shadow-[0_-10px_30px_rgba(15,23,42,0.22)]">
      {cells.map(({ icon: Icon, title, value, valueClass }) => (
        <div
          key={title}
          className="flex min-w-0 items-center gap-3 border-r border-white/10 px-5 last:border-r-0"
        >
          <Icon className="h-5 w-5 shrink-0 text-[var(--green2)]" />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-xs font-medium text-slate-300">{title}</div>
            <div className={`truncate text-xs font-bold ${valueClass}`}>{value}</div>
          </div>
        </div>
      ))}
    </footer>
  );
}
