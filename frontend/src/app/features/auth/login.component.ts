import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-card-container">
      <div class="auth-card">
        <h2>Welcome Back</h2>
        <p class="subtitle">Sign in to your CanteenQ account</p>

        <div class="error-banner" *ngIf="errorMessage">
          ⚠️ {{ errorMessage }}
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" formControlName="email" placeholder="student@college.local" [class.is-invalid]="f['email'].touched && f['email'].errors" />
            <div class="invalid-feedback" *ngIf="f['email'].touched && f['email'].errors">
              Valid email is required
            </div>
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="••••••••" [class.is-invalid]="f['password'].touched && f['password'].errors" />
            <div class="invalid-feedback" *ngIf="f['password'].touched && f['password'].errors">
              Password is required
            </div>
          </div>

          <button type="submit" class="submit-btn" [disabled]="loginForm.invalid || loading">
            <span *ngIf="!loading">Sign In</span>
            <span *ngIf="loading">Signing In...</span>
          </button>
        </form>

        <div class="demo-accounts">
          <p class="demo-title">Quick Demo Login:</p>
          <div class="demo-chips">
            <button type="button" (click)="fillDemo('student@college.local', 'Student@123')">Student</button>
            <button type="button" (click)="fillDemo('staff@canteen.local', 'Staff@123')">Staff</button>
            <button type="button" (click)="fillDemo('admin@canteen.local', 'Admin@123')">Admin</button>
          </div>
        </div>

        <div class="auth-footer">
          Don't have an account? <a routerLink="/register">Register here</a>
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
      max-width: 420px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      color: #fff;
    }
    h2 { font-size: 1.8rem; font-weight: 800; text-align: center; margin-bottom: 0.25rem; }
    .subtitle { color: #94a3b8; text-align: center; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .error-banner { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; color: #cbd5e1; }
    input { width: 100%; padding: 0.75rem; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: #3b82f6; }
    input.is-invalid { border-color: #ef4444; }
    .invalid-feedback { color: #fca5a5; font-size: 0.75rem; margin-top: 0.25rem; }
    .submit-btn { width: 100%; padding: 0.85rem; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: background 0.2s; margin-top: 0.5rem; }
    .submit-btn:hover:not(:disabled) { background: #1d4ed8; }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .demo-accounts { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #334155; text-align: center; }
    .demo-title { font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem; }
    .demo-chips { display: flex; justify-content: center; gap: 0.5rem; }
    .demo-chips button { background: #334155; border: none; color: #cbd5e1; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: background 0.2s; }
    .demo-chips button:hover { background: #3b82f6; color: #fff; }
    .auth-footer { text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: #94a3b8; }
    .auth-footer a { color: #60a5fa; text-decoration: none; font-weight: 600; }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  get f() { return this.loginForm.controls; }

  fillDemo(email: string, pass: string) {
    this.loginForm.patchValue({ email, password: pass });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          const role = res.data.user.role;
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else if (role === 'admin') {
            this.router.navigate(['/admin']);
          } else if (role === 'staff') {
            this.router.navigate(['/staff']);
          } else {
            this.router.navigate(['/menu']);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}
