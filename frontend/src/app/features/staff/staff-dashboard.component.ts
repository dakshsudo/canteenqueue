import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, timer, switchMap } from 'rxjs';
import { StaffService } from '../../core/services/staff.service';
import { Order, OrderStatus } from '../../core/models/order';
import { TokenChipComponent } from '../../shared/components/token-chip.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TokenChipComponent, StatusBadgeComponent],
  template: `
    <div class="staff-container">
      <div class="staff-header">
        <h1>Staff Kitchen Dashboard</h1>
        <p>Live active orders for preparation and fulfillment</p>
      </div>

      <div class="orders-grid">
        <div class="order-card" *ngFor="let order of orders">
          <div class="card-header">
            <app-token-chip [tokenNo]="order.token_no"></app-token-chip>
            <app-status-badge [status]="order.status"></app-status-badge>
          </div>

          <div class="customer-info">
            👤 {{ order.customer_name }} ({{ order.customer_phone || 'No phone' }})
          </div>

          <div class="items-list">
            <div class="item-row" *ngFor="let item of order.items">
              <span class="qty">{{ item.quantity }}x</span>
              <span class="name">{{ item.item_name }}</span>
            </div>
          </div>

          <div class="note-box" *ngIf="order.note">
            📝 Note: {{ order.note }}
          </div>

          <div class="action-buttons">
            <button
              class="action-btn prep"
              *ngIf="order.status === 'Placed'"
              (click)="updateStatus(order.id, 'Preparing')"
            >
              Start Preparing 🍳
            </button>

            <button
              class="action-btn ready"
              *ngIf="order.status === 'Preparing'"
              (click)="updateStatus(order.id, 'Ready')"
            >
              Mark Ready 🔔
            </button>

            <button
              class="action-btn collect"
              *ngIf="order.status === 'Ready'"
              (click)="updateStatus(order.id, 'Collected')"
            >
              Hand Over / Collected ✅
            </button>

            <button
              class="cancel-btn"
              *ngIf="order.status === 'Placed' || order.status === 'Preparing'"
              (click)="updateStatus(order.id, 'Cancelled')"
            >
              Cancel ❌
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .staff-container { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; color: #fff; }
    .staff-header { text-align: center; margin-bottom: 2rem; }
    .staff-header h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.25rem; }
    .staff-header p { color: #94a3b8; }
    .orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    .order-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .customer-info { font-size: 0.85rem; color: #94a3b8; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #334155; }
    .items-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
    .item-row { display: flex; gap: 0.75rem; font-size: 1rem; font-weight: 600; }
    .qty { color: #60a5fa; font-weight: 800; }
    .note-box { background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; color: #fef08a; padding: 0.5rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; }
    .action-buttons { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
    .action-btn { width: 100%; padding: 0.75rem; border: none; border-radius: 8px; font-weight: 800; cursor: pointer; color: #fff; font-size: 0.95rem; }
    .action-btn.prep { background: #f59e0b; color: #1e1b4b; }
    .action-btn.ready { background: #10b981; color: #064e3b; }
    .action-btn.collect { background: #2563eb; }
    .cancel-btn { background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 0.4rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
  `]
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  private pollSub?: Subscription;

  constructor(private staffService: StaffService) {}

  ngOnInit(): void {
    this.pollSub = timer(0, 5000).pipe(
      switchMap(() => this.staffService.getStaffQueue())
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.orders = res.data;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  updateStatus(orderId: number, status: OrderStatus): void {
    this.staffService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.staffService.getStaffQueue().subscribe(res => {
          if (res.data) this.orders = res.data;
        });
      }
    });
  }
}
