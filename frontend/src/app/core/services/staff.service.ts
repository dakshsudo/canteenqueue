import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, OrderStatus } from '../models/order';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private readonly baseUrl = `${environment.apiBaseUrl}/staff`;

  constructor(private http: HttpClient) {}

  getStaffQueue(): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(`${this.baseUrl}/queue.php`);
  }

  updateOrderStatus(orderId: number, newStatus: OrderStatus): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.baseUrl}/update_status.php`, {
      order_id: orderId,
      new_status: newStatus
    });
  }

  scanQrCode(qrCode: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/scan.php`, { qr_code: qrCode });
  }

  findByToken(tokenNo: number): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.baseUrl}/find_by_token.php?token_no=${tokenNo}`);
  }
}
