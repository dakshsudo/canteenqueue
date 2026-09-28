import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-token-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="token-chip" [class.large]="size === 'large'">
      T-{{ tokenNo | number:'3.0-0' }}
    </span>
  `,
  styles: [`
    .token-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #ffffff;
      font-weight: 800;
      font-family: monospace;
      padding: 0.35rem 0.85rem;
      border-radius: 8px;
      letter-spacing: 0.05em;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    .token-chip.large {
      font-size: 2.2rem;
      padding: 0.75rem 2rem;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    }
  `]
})
export class TokenChipComponent {
  @Input({ required: true }) tokenNo: number = 0;
  @Input() size: 'normal' | 'large' = 'normal';
}
