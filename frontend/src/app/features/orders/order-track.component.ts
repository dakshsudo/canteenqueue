import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { Subscription, timer, switchMap } from 'rxjs';
import { QueueService } from '../../core/services/queue.service';
import { OrderService } from '../../core/services/order.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { TokenChipComponent } from '../../shared/components/token-chip.component';
import { OrderTrackInfo } from '../../core/models/queue';

@Component({
  selector: 'app-order-track',
  standalone: true,
  imports: [CommonModule, RouterModule, QRCodeComponent, StatusBadgeComponent, TokenChipComponent],
  template: `
    <div class="track-container" *ngIf="trackData">
      <div class="track-card">
        <div class="card-top">
          <app-token-chip [tokenNo]="trackData.token_no" size="large"></app-token-chip>
          <app-status-badge [status]="trackData.status"></app-status-badge>
        </div>

        <div class="stepper">
          <div class="step" [class.active]="stepActive('Placed')" [class.completed]="stepDone('Placed')">
            <div class="circle">1</div>
            <span>Placed</span>
          </div>
          <div class="step-line" [class.active]="stepDone('Placed')"></div>
          
          <div class="step" [class.active]="stepActive('Preparing')" [class.completed]="stepDone('Preparing')">
            <div class="circle">2</div>
            <span>Preparing</span>
          </div>
          <div class="step-line" [class.active]="stepDone('Preparing')"></div>

          <div class="step" [class.active]="stepActive('Ready')" [class.completed]="stepDone('Ready')">
            <div class="circle">3</div>
            <span>Ready</span>
          </div>
          <div class="step-line" [class.active]="stepDone('Ready')"></div>

          <div class="step" [class.active]="stepActive('Collected')">
            <div class="circle">4</div>
            <span>Collected</span>
          </div>
        </div>

        <!-- Live Metrics -->
        <div class="metrics-grid" *ngIf="trackData.status === 'Placed' || trackData.status === 'Preparing'">
          <div class="metric-box">
            <span class="label">Orders Ahead</span>
            <span class="val">{{ trackData.orders_ahead }}</span>
          </div>
          <div class="metric-box">
            <span class="label">Est. Wait Time</span>
            <span class="val">{{ trackData.est_minutes }} mins</span>
          </div>
          <div class="metric-box">
            <span class="label">Now Serving</span>
            <span class="val highlight">{{ trackData.now_serving }}</span>
          </div>
        </div>

        <!-- Ready Alert -->
        <div class="ready-banner" *ngIf="trackData.status === 'Ready'">
          🔔 Your order is READY! Please present the QR code below at the counter.
        </div>

        <!-- QR Code Section -->
        <div class="qr-section">
          <div class="qr-wrapper">
            <qrcode [qrdata]="trackData.qr_code" [width]="220" [errorCorrectionLevel]="'M'"></qrcode>
          </div>
          <p class="qr-instruction">Show this QR code to canteen staff to collect your food</p>
        </div>

        <!-- Cancel Button -->
        <div class="actions" *ngIf="trackData.status === 'Placed'">
          <button class="cancel-btn" (click)="cancelOrder()">Cancel Order</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .track-container { max-width: 600px; margin: 0 auto; padding: 2rem 1rem; color: #fff; }
    .track-card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .card-top { display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    .stepper { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; padding: 0 0.5rem; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: #64748b; font-weight: 600; }
    .circle { width: 32px; height: 32px; border-radius: 9999px; background: #334155; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-weight: 700; }
    .step.active .circle { background: #2563eb; color: #fff; box-shadow: 0 0 12px rgba(37,99,235,0.6); }
    .step.completed .circle { background: #10b981; color: #fff; }
    .step.active span, .step.completed span { color: #fff; }
    .step-line { flex: 1; height: 3px; background: #334155; margin: 0 4px; margin-bottom: 1.25rem; }
    .step-line.active { background: #10b981; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .metric-box { background: #0f172a; border: 1px solid #334155; padding: 1rem; border-radius: 12px; text-align: center; }
    .label { display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem; }
    .val { font-size: 1.25rem; font-weight: 800; color: #fff; }
    .val.highlight { color: #60a5fa; }
    .ready-banner { background: #059669; color: #fff; padding: 1rem; border-radius: 12px; font-weight: 700; text-align: center; margin-bottom: 1.5rem; animation: pulse 1.5s infinite; }
    .qr-section { display: flex; flex-direction: column; align-items: center; background: #0f172a; padding: 1.5rem; border-radius: 16px; border: 1px solid #334155; }
    .qr-wrapper { background: #fff; padding: 1rem; border-radius: 12px; margin-bottom: 0.75rem; }
    .qr-instruction { font-size: 0.85rem; color: #94a3b8; text-align: center; }
    .actions { margin-top: 1.5rem; text-align: center; }
    .cancel-btn { background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 0.6rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .cancel-btn:hover { background: rgba(239,68,68,0.2); }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.8;} }
  `]
})
export class OrderTrackComponent implements OnInit, OnDestroy {
  orderId = 0;
  trackData: OrderTrackInfo | null = null;
  private pollSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private queueService: QueueService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.orderId) {
      this.startPolling();
    }
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private startPolling(): void {
    this.pollSub = timer(0, 5000).pipe(
      switchMap(() => this.queueService.trackOrder(this.orderId))
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.trackData = res.data;
        }
      }
    });
  }

  stepActive(status: string): boolean {
    return this.trackData?.status === status;
  }

  stepDone(status: string): boolean {
    const order = ['Placed', 'Preparing', 'Ready', 'Collected'];
    const currentIdx = order.indexOf(this.trackData?.status || '');
    const checkIdx = order.indexOf(status);
    return currentIdx > checkIdx;
  }

  cancelOrder(): void {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.orderService.cancelOrder(this.orderId).subscribe({
        next: () => {
          this.queueService.trackOrder(this.orderId).subscribe(res => {
            if (res.data) this.trackData = res.data;
          });
        }
      });
    }
  }
}
