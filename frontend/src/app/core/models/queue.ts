import { OrderStatus } from './order';

export interface ReadyToken {
  id: number;
  token_no: number;
  token_code: string;
}

export interface QueueStatus {
  now_serving_token?: number | null;
  now_serving_code: string;
  waiting_count: number;
  ready_tokens: ReadyToken[];
  orders_open: boolean;
}

export interface OrderTrackInfo {
  order: any;
  status: OrderStatus;
  token_no: number;
  token_code: string;
  qr_code: string;
  orders_ahead: number;
  est_minutes: number;
  now_serving: string;
}
