import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { QueueStatus, OrderTrackInfo } from '../models/queue';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class QueueService {
  private readonly baseUrl = `${environment.apiBaseUrl}/queue`;

  constructor(private http: HttpClient) {}

  getPublicQueueStatus(): Observable<ApiResponse<QueueStatus>> {
    return this.http.get<ApiResponse<QueueStatus>>(`${this.baseUrl}/status.php`);
  }

  trackOrder(orderId: number): Observable<ApiResponse<OrderTrackInfo>> {
    return this.http.get<ApiResponse<OrderTrackInfo>>(`${this.baseUrl}/track.php?order_id=${orderId}`);
  }
}
