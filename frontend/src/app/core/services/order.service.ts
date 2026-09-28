import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order } from '../models/order';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly baseUrl = `${environment.apiBaseUrl}/orders`;

  constructor(private http: HttpClient) {}

  placeOrder(items: { menu_item_id: number; quantity: number }[], note?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/place.php`, { items, note });
  }

  getMyOrders(page = 1, limit = 20): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(`${this.baseUrl}/my.php?page=${page}&limit=${limit}`);
  }

  getOrderDetails(id: number): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.baseUrl}/get.php?id=${id}`);
  }

  cancelOrder(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/cancel.php`, { id });
  }
}
