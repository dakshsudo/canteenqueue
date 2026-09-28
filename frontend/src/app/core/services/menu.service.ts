import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, MenuItem } from '../models/menu';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getPublicMenu(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.baseUrl}/menu/list.php`);
  }

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.baseUrl}/categories/list.php`);
  }

  saveCategory(data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.baseUrl}/categories/save.php`, data);
  }

  deleteCategory(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/categories/delete.php`, { id });
  }

  createMenuItem(item: Partial<MenuItem>): Observable<ApiResponse<MenuItem>> {
    return this.http.post<ApiResponse<MenuItem>>(`${this.baseUrl}/menu/create.php`, item);
  }

  updateMenuItem(item: Partial<MenuItem>): Observable<ApiResponse<MenuItem>> {
    return this.http.post<ApiResponse<MenuItem>>(`${this.baseUrl}/menu/update.php`, item);
  }

  toggleAvailability(id: number, is_available: number): Observable<ApiResponse<MenuItem>> {
    return this.http.post<ApiResponse<MenuItem>>(`${this.baseUrl}/menu/toggle_availability.php`, { id, is_available });
  }

  deleteMenuItem(id: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/menu/delete.php`, { id });
  }
}
