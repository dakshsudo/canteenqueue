import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container" *ngIf="dashboardData">
      <div class="admin-header">
        <h1>Admin Control Panel</h1>
        <p>Canteen management, settings, sales & user administration</p>
      </div>

      <!-- Overview Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="label">Today's Orders</span>
          <span class="value">{{ dashboardData.total_orders }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Collected Revenue</span>
          <span class="value highlight">Rs. {{ dashboardData.collected_revenue }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Avg. Wait Time</span>
          <span class="value">{{ dashboardData.avg_wait_minutes }} mins</span>
        </div>
      </div>

      <!-- Settings & Controls Section -->
      <div class="admin-sections-grid">
        <div class="admin-card">
          <h2>Canteen Settings</h2>
          <div class="form-group" *ngIf="settings">
            <label>Canteen Open Status</label>
            <select [(ngModel)]="settings['orders_open']" (change)="saveSettings()">
              <option value="1">🟢 OPEN (Accepting Orders)</option>
              <option value="0">🔴 CLOSED (Orders Blocked)</option>
            </select>
          </div>

          <div class="form-group" *ngIf="settings">
            <label>Average Prep Minutes per Order</label>
            <input type="number" [(ngModel)]="settings['avg_minutes_per_order']" (change)="saveSettings()" />
          </div>

          <div class="form-group" *ngIf="settings">
            <label>Max Items per Order</label>
            <input type="number" [(ngModel)]="settings['max_items_per_order']" (change)="saveSettings()" />
          </div>
        </div>

        <div class="admin-card">
          <h2>Today's Top Selling Items</h2>
          <div class="top-items-list">
            <div class="top-item-row" *ngFor="let item of dashboardData.top_items">
              <span class="name">{{ item.item_name }}</span>
              <span class="qty">{{ item.total_qty }} sold</span>
              <span class="rev">Rs. {{ item.total_sales | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; color: #fff; }
    .admin-header h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.25rem; }
    .admin-header p { color: #94a3b8; margin-bottom: 2rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 1.5rem; text-align: center; }
    .label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.5rem; }
    .value { font-size: 2rem; font-weight: 900; }
    .value.highlight { color: #34d399; }
    .admin-sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .admin-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 1.5rem; }
    .admin-card h2 { font-size: 1.3rem; font-weight: 700; margin-bottom: 1.25rem; border-bottom: 1px solid #334155; padding-bottom: 0.75rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.4rem; }
    input, select { width: 100%; padding: 0.75rem; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; outline: none; }
    .top-items-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .top-item-row { display: flex; justify-content: space-between; background: #0f172a; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.95rem; font-weight: 600; }
    .qty { color: #60a5fa; }
    .rev { color: #34d399; }
    @media (max-width: 768px) { .stats-grid, .admin-sections-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminDashboardComponent implements OnInit {
  dashboardData: any = null;
  settings: Record<string, string> = {};

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.adminService.getDashboardData().subscribe({
      next: (res) => { if (res.data) this.dashboardData = res.data; }
    });

    this.adminService.getSettings().subscribe({
      next: (res) => { if (res.data?.settings) this.settings = res.data.settings; }
    });
  }

  saveSettings(): void {
    this.adminService.updateSettings(this.settings).subscribe({
      next: (res) => { if (res.data) this.settings = res.data; }
    });
  }
}
