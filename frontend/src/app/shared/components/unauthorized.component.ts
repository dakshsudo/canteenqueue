import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="unauth-container">
      <div class="unauth-card">
        <h1>🔒 Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <a routerLink="/" class="home-btn">Return to Home</a>
      </div>
    </div>
  `,
  styles: [`
    .unauth-container { display: flex; align-items: center; justify-content: center; min-height: 60vh; color: #fff; text-align: center; }
    .unauth-card { background: #1e293b; padding: 3rem; border-radius: 20px; border: 1px solid #334155; }
    h1 { font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: #fca5a5; }
    p { color: #94a3b8; margin-bottom: 2rem; }
    .home-btn { background: #2563eb; color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 700; }
  `]
})
export class UnauthorizedComponent {}
