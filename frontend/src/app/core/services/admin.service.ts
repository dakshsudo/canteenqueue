import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/dashboard.php`);
  }

  getSalesReport(from: string, to: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/sales.php?from=${from}&to=${to}`);
  }

  getUsers(role?: UserRole, query?: string): Observable<ApiResponse<User[]>> {
    let url = `${this.baseUrl}/users.php?`;
    if (role) url += `role=${role}&`;
    if (query) url += `q=${encodeURIComponent(query)}`;
    return this.http.get<ApiResponse<User[]>>(url);
  }

  saveUser(userData: Partial<User> & { password?: string }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/user_save.php`, userData);
  }

  toggleUserActive(id: number, is_active: number): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/user_toggle.php`, { id, is_active });
  }

  getSettings(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/settings.php`);
  }

  updateSettings(settings: Record<string, string>): Observable<ApiResponse<Record<string, string>>> {
    return this.http.post<ApiResponse<Record<string, string>>>(`${this.baseUrl}/settings.php`, settings);
  }
}
