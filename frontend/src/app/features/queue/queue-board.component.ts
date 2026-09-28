import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, timer, switchMap } from 'rxjs';
import { QueueService } from '../../core/services/queue.service';
import { QueueStatus } from '../../core/models/queue';
import { TokenChipComponent } from '../../shared/components/token-chip.component';

@Component({
  selector: 'app-queue-board',
  standalone: true,
  imports: [CommonModule, TokenChipComponent],
  template: `
    <div class="board-container">
      <div class="board-header">
        <h1>Public Queue Display Board</h1>
        <p class="subtitle">Live status display for canteen TV / screens</p>
      </div>

      <div class="canteen-status-badge" [class.closed]="!statusData?.orders_open">
        {{ statusData?.orders_open ? '🟢 CANTEEN IS OPEN & ACCEPTING ORDERS' : '🔴 CANTEEN IS CLOSED' }}
      </div>

      <div class="board-grid">
        <!-- Now Serving Box -->
        <div class="now-serving-box">
          <h2>NOW SERVING</h2>
          <div class="big-token">
            {{ statusData?.now_serving_code || '---' }}
          </div>
          <div class="waiting-count">
            Waiting in queue: <strong>{{ statusData?.waiting_count || 0 }}</strong> order(s)
          </div>
        </div>

        <!-- Ready to Collect Box -->
        <div class="ready-box">
          <h2>READY TO COLLECT 🔔</h2>
          <div class="ready-tokens-grid" *ngIf="statusData?.ready_tokens && statusData!.ready_tokens.length > 0; else noReady">
            <app-token-chip *ngFor="let item of statusData?.ready_tokens" [tokenNo]="item.token_no" size="large"></app-token-chip>
          </div>
          <ng-template #noReady>
            <div class="no-ready">No tokens ready right now</div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .board-container { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; color: #fff; text-align: center; }
    .board-header h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.25rem; }
    .subtitle { color: #94a3b8; font-size: 1.1rem; margin-bottom: 1.5rem; }
    .canteen-status-badge { display: inline-block; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399; font-weight: 700; padding: 0.5rem 1.5rem; border-radius: 9999px; margin-bottom: 2rem; }
    .canteen-status-badge.closed { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #fca5a5; }
    .board-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .now-serving-box { background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid #3b82f6; border-radius: 24px; padding: 2.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(59, 130, 246, 0.2); }
    .now-serving-box h2 { font-size: 1.5rem; font-weight: 800; color: #60a5fa; letter-spacing: 0.1em; margin-bottom: 1.5rem; }
    .big-token { font-size: 4rem; font-weight: 900; font-family: monospace; color: #fff; background: #2563eb; padding: 1rem 2.5rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.5); margin-bottom: 1.5rem; }
    .waiting-count { color: #cbd5e1; font-size: 1.1rem; }
    .ready-box { background: #1e293b; border: 2px solid #10b981; border-radius: 24px; padding: 2.5rem; }
    .ready-box h2 { font-size: 1.5rem; font-weight: 800; color: #34d399; letter-spacing: 0.1em; margin-bottom: 1.5rem; }
    .ready-tokens-grid { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; align-content: flex-start; }
    .no-ready { color: #64748b; font-size: 1.2rem; padding: 3rem 0; font-style: italic; }
    @media (max-width: 768px) { .board-grid { grid-template-columns: 1fr; } }
  `]
})
export class QueueBoardComponent implements OnInit, OnDestroy {
  statusData: QueueStatus | null = null;
  private pollSub?: Subscription;

  constructor(private queueService: QueueService) {}

  ngOnInit(): void {
    this.pollSub = timer(0, 5000).pipe(
      switchMap(() => this.queueService.getPublicQueueStatus())
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.statusData = res.data;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
