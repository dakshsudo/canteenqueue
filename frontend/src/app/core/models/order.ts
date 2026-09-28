import { MenuItem } from './menu';

export type OrderStatus = 'Placed' | 'Preparing' | 'Ready' | 'Collected' | 'Cancelled';

export interface OrderItem {
  id?: number;
  menu_item_id?: number;
  item_name: string;
  unit_price: string | number;
  quantity: number;
  line_total: string | number;
}

export interface OrderStatusHistory {
  id: number;
  old_status?: OrderStatus | null;
  new_status: OrderStatus;
  changed_at: string;
  changed_by_name?: string;
}

export interface Order {
  id: number;
  user_id?: number;
  token_date?: string;
  token_no: number;
  token_code?: string;
  qr_code: string;
  status: OrderStatus;
  total_amount: string | number;
  note?: string | null;
  est_ready_at?: string;
  created_at?: string;
  customer_name?: string;
  customer_phone?: string;
  items?: OrderItem[];
  history?: OrderStatusHistory[];
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}
