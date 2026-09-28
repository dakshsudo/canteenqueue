import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { StaffService } from '../../core/services/staff.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="scanner-container">
      <h1>Staff Food Collection Scanner</h1>
      <p>Scan student QR code or enter token number manually</p>

      <div class="scanner-card">
        <!-- Manual token search -->
        <div class="manual-section">
          <h3>Manual Token Entry Fallback</h3>
          <div class="input-group">
            <input type="number" [(ngModel)]="tokenInput" placeholder="Enter token number (e.g., 47)" />
            <button (click)="searchToken()">Search Token</button>
          </div>
        </div>

        <div class="divider"><span>OR SCAN QR CODE</span></div>

        <!-- Camera Scanner container -->
        <div id="reader"></div>

        <!-- Scan result modal / card -->
        <div class="result-card" *ngIf="scanResult" [class.success]="scanSuccess" [class.error]="!scanSuccess">
          <div class="result-header">
            <h3>{{ scanSuccess ? '✅ Handover Approved' : '❌ Handover Refused' }}</h3>
          </div>
          <p class="result-msg">{{ scanMessage }}</p>

          <div class="result-details" *ngIf="scanResult.items">
            <div class="token-code">{{ scanResult.token_code }}</div>
            <div class="result-items">
              <div class="item" *ngFor="let it of scanResult.items">
                {{ it.quantity }}x {{ it.item_name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scanner-container { max-width: 600px; margin: 0 auto; padding: 2rem 1rem; color: #fff; text-align: center; }
    h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.25rem; }
    p { color: #94a3b8; margin-bottom: 2rem; }
    .scanner-card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 2rem; }
    .manual-section h3 { font-size: 1rem; margin-bottom: 0.75rem; text-align: left; color: #cbd5e1; }
    .input-group { display: flex; gap: 0.5rem; }
    .input-group input { flex: 1; padding: 0.75rem; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; outline: none; }
    .input-group button { background: #2563eb; color: #fff; border: none; padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .divider { margin: 1.5rem 0; border-bottom: 1px solid #334155; line-height: 0.1em; }
    .divider span { background: #1e293b; padding: 0 10px; font-size: 0.75rem; color: #64748b; font-weight: 700; }
    #reader { margin-top: 1rem; border-radius: 12px; overflow: hidden; }
    .result-card { margin-top: 1.5rem; padding: 1.5rem; border-radius: 12px; text-align: left; }
    .result-card.success { background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #a7f3d0; }
    .result-card.error { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; }
    .result-header h3 { font-size: 1.2rem; font-weight: 800; margin-bottom: 0.5rem; }
    .token-code { font-size: 1.8rem; font-weight: 900; font-family: monospace; color: #fff; margin: 0.5rem 0; }
    .result-items { margin-top: 0.5rem; font-weight: 600; }
  `]
})
export class QrScannerComponent implements OnInit, OnDestroy {
  tokenInput: number | null = null;
  scanResult: any = null;
  scanSuccess = false;
  scanMessage = '';
  private html5QrcodeScanner?: Html5QrcodeScanner;

  constructor(private staffService: StaffService) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.initScanner();
    }, 300);
  }

  ngOnDestroy(): void {
    try {
      this.html5QrcodeScanner?.clear();
    } catch {}
  }

  private initScanner(): void {
    try {
      this.html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      this.html5QrcodeScanner.render(
        (qrCode) => this.onScanSuccess(qrCode),
        (error) => {}
      );
    } catch {}
  }

  onScanSuccess(qrCode: string): void {
    this.staffService.scanQrCode(qrCode).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.scanSuccess = true;
          this.scanMessage = res.data.message;
          this.scanResult = res.data;
        }
      },
      error: (err) => {
        this.scanSuccess = false;
        this.scanMessage = err.error?.error?.message || 'Invalid or expired QR code.';
        this.scanResult = {};
      }
    });
  }

  searchToken(): void {
    if (!this.tokenInput) return;
    this.staffService.findByToken(this.tokenInput).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (res.data.status === 'Ready') {
            this.staffService.updateOrderStatus(res.data.id, 'Collected').subscribe({
              next: () => {
                this.scanSuccess = true;
                this.scanMessage = `Token T-${this.tokenInput} collected successfully!`;
                this.scanResult = res.data;
              }
            });
          } else {
            this.scanSuccess = false;
            this.scanMessage = `Order T-${this.tokenInput} is currently ${res.data.status}`;
            this.scanResult = res.data;
          }
        }
      },
      error: (err) => {
        this.scanSuccess = false;
        this.scanMessage = err.error?.error?.message || 'Token not found today.';
        this.scanResult = {};
      }
    });
  }
}
