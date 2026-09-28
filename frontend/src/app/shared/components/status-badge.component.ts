import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus } from '../../core/models/order';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="status.toLowerCase()">
      {{ status }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .placed { background: #64748b; color: #fff; }
    .preparing { background: #f59e0b; color: #1e1b4b; animation: pulse 2s infinite; }
    .ready { background: #10b981; color: #064e3b; animation: bounce 1.5s infinite; }
    .collected { background: #3b82f6; color: #fff; }
    .cancelled { background: #ef4444; color: #fff; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `]
})
export class StatusBadgeComponent {
  @Input({ required: true }) status: OrderStatus = 'Placed';
}
