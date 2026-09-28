import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="cart-container">
      <h1>Your Order Cart</h1>

      <div *ngIf="cart.items().length === 0; else cartContent" class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is currently empty</h3>
        <p>Explore our menu and add delicious items to get started.</p>
        <a routerLink="/menu" class="explore-btn">Browse Menu</a>
      </div>

      <ng-template #cartContent>
        <div class="cart-layout">
          <div class="cart-items-list">
            <div class="cart-item-card" *ngFor="let ci of cart.items()">
              <div class="item-info">
                <h3>{{ ci.item.name }}</h3>
                <span class="unit-price">Rs. {{ ci.item.price | number:'1.2-2' }} each</span>
              </div>

              <div class="quantity-controls">
                <button (click)="cart.updateQuantity(ci.item.id, ci.quantity - 1)">-</button>
                <span class="qty">{{ ci.quantity }}</span>
                <button (click)="cart.updateQuantity(ci.item.id, ci.quantity + 1)">+</button>
              </div>

              <div class="line-total">
                Rs. {{ (Number(ci.item.price) * ci.quantity) | number:'1.2-2' }}
              </div>

              <button class="remove-btn" (click)="cart.removeItem(ci.item.id)">🗑️</button>
            </div>
          </div>

          <div class="checkout-summary-card">
            <h2>Order Summary</h2>
            
            <div class="summary-row">
              <span>Total Items</span>
              <span>{{ cart.totalCount() }}</span>
            </div>

            <div class="summary-row total">
              <span>Grand Total</span>
              <span>Rs. {{ cart.totalPrice() | number:'1.2-2' }}</span>
            </div>

            <div class="note-section">
              <label>Special Instructions / Note (Optional)</label>
              <textarea [(ngModel)]="note" placeholder="E.g., Less spicy, no onions..."></textarea>
            </div>

            <div class="error-banner" *ngIf="errorMessage">
              ⚠️ {{ errorMessage }}
            </div>

            <button class="place-order-btn" [disabled]="submitting" (click)="placeOrder()">
              <span *ngIf="!submitting">Confirm & Place Order ➔</span>
              <span *ngIf="submitting">Placing Order...</span>
            </button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .cart-container { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; color: #fff; }
    h1 { font-size: 2rem; font-weight: 800; margin-bottom: 2rem; }
    .empty-cart { text-align: center; padding: 4rem 1rem; background: #1e293b; border-radius: 16px; }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .explore-btn { display: inline-block; margin-top: 1.5rem; background: #2563eb; color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 700; }
    .cart-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
    .cart-items-list { display: flex; flex-direction: column; gap: 1rem; }
    .cart-item-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; }
    .item-info h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem; }
    .unit-price { font-size: 0.85rem; color: #94a3b8; }
    .quantity-controls { display: flex; align-items: center; gap: 0.5rem; background: #0f172a; padding: 0.25rem 0.5rem; border-radius: 8px; }
    .quantity-controls button { background: #334155; border: none; color: #fff; width: 28px; height: 28px; border-radius: 6px; font-weight: 700; cursor: pointer; }
    .qty { font-weight: 700; min-width: 24px; text-align: center; }
    .line-total { font-weight: 800; font-size: 1.1rem; color: #60a5fa; }
    .remove-btn { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; }
    .checkout-summary-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 1.5rem; height: fit-content; }
    .checkout-summary-card h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 1.25rem; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; color: #cbd5e1; }
    .summary-row.total { font-size: 1.3rem; font-weight: 800; color: #fff; border-top: 1px solid #334155; padding-top: 0.75rem; margin-top: 0.75rem; }
    .note-section { margin-top: 1.25rem; margin-bottom: 1.25rem; }
    .note-section label { font-size: 0.8rem; color: #94a3b8; display: block; margin-bottom: 0.4rem; }
    .note-section textarea { width: 100%; height: 70px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 0.5rem; font-size: 0.85rem; outline: none; }
    .error-banner { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #fca5a5; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
    .place-order-btn { width: 100%; padding: 1rem; background: #059669; color: #fff; border: none; border-radius: 8px; font-weight: 800; font-size: 1rem; cursor: pointer; }
    .place-order-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    @media (max-width: 768px) { .cart-layout { grid-template-columns: 1fr; } }
  `]
})
export class CartComponent {
  note = '';
  submitting = false;
  errorMessage = '';
  Number = Number;

  constructor(
    public cart: CartService,
    private orderService: OrderService,
    private auth: AuthService,
    private router: Router
  ) {}

  placeOrder() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }

    const payload = this.cart.items().map(ci => ({
      menu_item_id: ci.item.id,
      quantity: ci.quantity
    }));

    this.submitting = true;
    this.errorMessage = '';

    this.orderService.placeOrder(payload, this.note).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success && res.data) {
          const orderId = res.data.id;
          this.cart.clearCart();
          this.router.navigate(['/orders', orderId]);
        }
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.error?.message || 'Failed to place order.';
      }
    });
  }
}
