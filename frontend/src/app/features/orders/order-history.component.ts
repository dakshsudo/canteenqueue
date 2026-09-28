import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { TokenChipComponent } from '../../shared/components/token-chip.component';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, TokenChipComponent],
  template: `
    <div class="history-container">
      <h1>My Order History</h1>

      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading your past orders...</p>
      </div>

      <div class="empty-state" *ngIf="!loading && orders.length === 0">
        <p>You haven't placed any orders yet.</p>
        <a routerLink="/menu" class="browse-btn">Order Food Now</a>
      </div>

      <div class="orders-list" *ngIf="!loading && orders.length > 0">
        <div class="order-card" *ngFor="let order of orders" [routerLink]="['/orders', order.id]">
          <div class="card-header">
            <app-token-chip [tokenNo]="order.token_no"></app-token-chip>
            <app-status-badge [status]="order.status"></app-status-badge>
          </div>

          <div class="card-body">
            <div class="items-summary">
              <span *ngFor="let item of order.items; let last = last">
                {{ item.quantity }}x {{ item.item_name }}{{ last ? '' : ', ' }}
              </span>
            </div>

            <div class="meta-info">
              <span class="date">📅 {{ order.created_at | date:'medium' }}</span>
              <span class="total">Total: Rs. {{ order.total_amount | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-container { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; color: #fff; }
    h1 { font-size: 2rem; font-weight: 800; margin-bottom: 2rem; }
    .loading-state, .empty-state { text-align: center; padding: 3rem; background: #1e293b; border-radius: 16px; color: #94a3b8; }
    .browse-btn { display: inline-block; margin-top: 1rem; background: #2563eb; color: #fff; padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 700; }
    .orders-list { display: flex; flex-direction: column; gap: 1rem; }
    .order-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 1.5rem; cursor: pointer; transition: transform 0.2s; }
    .order-card:hover { transform: translateY(-2px); border-color: #3b82f6; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .items-summary { font-size: 1rem; font-weight: 600; color: #cbd5e1; margin-bottom: 1rem; }
    .meta-info { display: flex; justify-content: space-between; font-size: 0.85rem; color: #94a3b8; border-top: 1px solid #334155; padding-top: 0.75rem; }
    .total { font-weight: 800; color: #60a5fa; font-size: 1rem; }
  `]
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  loading = true;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.orders = res.data;
        }
      },
      error: () => this.loading = false
    });
  }
}
