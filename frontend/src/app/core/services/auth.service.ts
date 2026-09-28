import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user';
import { ApiResponse } from '../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  // Signals state
  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem('cq_token'));

  isLoggedIn = computed(() => !!this.token() && !!this.currentUser());
  userRole = computed(() => this.currentUser()?.role || null);

  constructor(private http: HttpClient, private router: Router) {}

  private getStoredUser(): User | null {
    const raw = localStorage.getItem('cq_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<{ token: string; user: User; expires_at: string }>> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/login.php`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data.token, res.data.user);
        }
      })
    );
  }

  register(userData: { name: string; email: string; password: string; phone?: string; college_id?: string }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/register.php`, userData);
  }

  logout(): void {
    if (this.token()) {
      this.http.post(`${this.baseUrl}/logout.php`, {}).subscribe();
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  fetchMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/me.php`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
          localStorage.setItem('cq_user', JSON.stringify(res.data));
        }
      }),
      catchError(err => {
        this.clearSession();
        return of({ success: false, error: err.error?.error } as ApiResponse<User>);
      })
    );
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem('cq_token', token);
    localStorage.setItem('cq_user', JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem('cq_token');
    localStorage.removeItem('cq_user');
    this.token.set(null);
    this.currentUser.set(null);
  }

  hasRole(allowedRoles: UserRole[]): boolean {
    const role = this.userRole();
    return !!role && allowedRoles.includes(role);
  }
}
