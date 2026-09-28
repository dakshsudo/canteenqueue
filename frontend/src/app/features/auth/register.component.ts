import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-card-container">
      <div class="auth-card">
        <h2>Create Student Account</h2>
        <p class="subtitle">Join CanteenQ to order food without waiting in queue</p>

        <div class="error-banner" *ngIf="errorMessage">
          ⚠️ {{ errorMessage }}
        </div>
        <div class="success-banner" *ngIf="successMessage">
          ✅ {{ successMessage }}
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" formControlName="name" placeholder="John Doe" />
          </div>

          <div class="form-group">
            <label>Email Address *</label>
            <input type="email" formControlName="email" placeholder="student@college.local" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Phone Number (10 digits)</label>
              <input type="text" formControlName="phone" placeholder="9876543210" />
            </div>
            <div class="form-group">
              <label>College Roll ID</label>
              <input type="text" formControlName="college_id" placeholder="CSE2026001" />
            </div>
          </div>

          <div class="form-group">
            <label>Password * (min 8 chars, letters & numbers)</label>
            <input type="password" formControlName="password" placeholder="••••••••" />
          </div>

          <button type="submit" class="submit-btn" [disabled]="registerForm.invalid || loading">
            <span *ngIf="!loading">Create Account</span>
            <span *ngIf="loading">Creating...</span>
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a routerLink="/login">Sign In</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-card-container {
      min-height: calc(100vh - 120px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .auth-card {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      color: #fff;
    }
    h2 { font-size: 1.8rem; font-weight: 800; text-align: center; margin-bottom: 0.25rem; }
    .subtitle { color: #94a3b8; text-align: center; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .error-banner { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
    .success-banner { background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #a7f3d0; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
    .form-group { margin-bottom: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: #cbd5e1; }
    input { width: 100%; padding: 0.75rem; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; font-size: 0.95rem; outline: none; }
    input:focus { border-color: #3b82f6; }
    .submit-btn { width: 100%; padding: 0.85rem; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 0.5rem; }
    .submit-btn:hover:not(:disabled) { background: #1d4ed8; }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .auth-footer { text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: #94a3b8; }
    .auth-footer a { color: #60a5fa; text-decoration: none; font-weight: 600; }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      college_id: [''],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.register(this.registerForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.successMessage = 'Account created successfully! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 1500);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error?.message || 'Registration failed.';
      }
    });
  }
}
