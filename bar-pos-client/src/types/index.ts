export interface Table {
  id: number;
  name: string;
  capacity: number;
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  isBottleCategory: boolean;
  /** Si viene del API; por defecto visible */
  active?: boolean;
}

export interface BottleMeasure {
  id: number;
  productId: number;
  measureName: string;
  price: number;
  sortOrder: number;
}

export interface Product {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  active: boolean;
  measures?: BottleMeasure[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  categoryName: string;
  measureName: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  tableId: number | null;
  tableName: string;
  status: 'open' | 'paid' | 'cancelled';
  paymentMethod: string | null;
  subtotal: number;
  tax: number;
  total: number;
  itemCount?: number;
  /** Nota de cocina / barra; opcional según backend */
  notes?: string | null;
  createdAt: string;
  items?: OrderItem[];
}

export interface ReportSummary {
  totalSales: number;
  totalTickets: number;
  avgTicket: number;
  topPaymentMethod: string;
}

export interface CategoryReport {
  categoryName: string;
  itemsSold: number;
  total: number;
  percentage: number;
}

export interface ProductReport {
  productName: string;
  categoryName: string;
  itemsSold: number;
  /** El API a veces omite; se puede derivar de total/itemsSold */
  unitPrice?: number;
  total: number;
}

export interface TableReport {
  tableName: string;
  ticketCount: number;
  total: number;
  itemsSold?: number;
}
