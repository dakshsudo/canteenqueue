import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="brand">
          <span class="brand-logo">⚡</span>
          <span class="brand-text">Canteen<span class="brand-accent">Q</span></span>
        </a>

        <div class="nav-links">
          <a routerLink="/menu" routerLinkActive="active" *ngIf="!auth.isLoggedIn() || auth.userRole() === 'student'">Menu</a>
          <a routerLink="/queue" routerLinkActive="active">Live Queue</a>
          <a routerLink="/orders" routerLinkActive="active" *ngIf="auth.userRole() === 'student'">My Orders</a>
          
          <a routerLink="/staff" routerLinkActive="active" *ngIf="auth.hasRole(['staff', 'admin'])">Staff Dashboard</a>
          <a routerLink="/staff/scan" routerLinkActive="active" *ngIf="auth.hasRole(['staff', 'admin'])">Scan QR</a>
          
          <a routerLink="/admin" routerLinkActive="active" *ngIf="auth.userRole() === 'admin'">Admin</a>
        </div>

        <div class="nav-actions">
          <!-- Cart button for students -->
          <a routerLink="/cart" class="cart-btn" *ngIf="!auth.isLoggedIn() || auth.userRole() === 'student'">
            🛒 <span class="cart-count" *ngIf="cart.totalCount() > 0">{{ cart.totalCount() }}</span>
          </a>

          <!-- Profile / Logout -->
          <div class="user-menu" *ngIf="auth.isLoggedIn(); else loginBtn">
            <span class="user-badge" [ngClass]="auth.userRole() || ''">{{ auth.currentUser()?.name }}</span>
            <button class="logout-btn" (click)="auth.logout()">Logout</button>
          </div>
          <ng-template #loginBtn>
            <a routerLink="/login" class="login-link-btn">Login</a>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 0.75rem 1.5rem;
      color: #fff;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      text-decoration: none;
    }
    .brand-accent { color: #3b82f6; }
    .nav-links {
      display: flex;
      gap: 1.25rem;
    }
    .nav-links a {
      color: #94a3b8;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
      transition: color 0.2s;
    }
    .nav-links a:hover, .nav-links a.active {
      color: #60a5fa;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .cart-btn {
      position: relative;
      font-size: 1.3rem;
      text-decoration: none;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.4rem 0.8rem;
      border-radius: 9999px;
      color: #fff;
    }
    .cart-count {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 9999px;
    }
    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-badge {
      font-size: 0.85rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: #334155;
      font-weight: 600;
    }
    .user-badge.admin { background: #7c3aed; color: #fff; }
    .user-badge.staff { background: #059669; color: #fff; }
    .user-badge.student { background: #2563eb; color: #fff; }
    .logout-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #cbd5e1;
      padding: 0.35rem 0.8rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .logout-btn:hover { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; }
    .login-link-btn {
      background: #2563eb;
      color: #fff;
      padding: 0.4rem 1rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
    }
    @media (max-width: 768px) {
      .nav-links { display: none; }
    }
  `]
})
export class NavbarComponent {
  constructor(public auth: AuthService, public cart: CartService) {}
}
