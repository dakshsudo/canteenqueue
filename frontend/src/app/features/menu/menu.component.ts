import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuService } from '../../core/services/menu.service';
import { CartService } from '../../core/services/cart.service';
import { Category, MenuItem } from '../../core/models/menu';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="menu-container">
      <div class="menu-header">
        <h1>Delicious Canteen Menu</h1>
        <p>Select your favorite dishes and place your order for fast pickup</p>
      </div>

      <div class="category-tabs" *ngIf="categories.length > 0">
        <button
          *ngFor="let cat of categories"
          class="tab-btn"
          [class.active]="selectedCategoryId === cat.id"
          (click)="selectedCategoryId = cat.id"
        >
          {{ cat.name }} ({{ cat.items?.length || 0 }})
        </button>
      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading menu items...</p>
      </div>

      <div class="error-state" *ngIf="error">
        ⚠️ {{ error }}
      </div>

      <div class="menu-grid" *ngFor="let cat of categories">
        <div *ngIf="selectedCategoryId === cat.id">
          <div class="grid" *ngIf="cat.items && cat.items.length > 0; else emptyCategory">
            <div class="item-card" *ngFor="let item of cat.items" [class.sold-out]="item.is_available === 0">
              <div class="card-badge" [class.veg]="item.is_veg === 1" [class.non-veg]="item.is_veg === 0">
                {{ item.is_veg === 1 ? '🟢 Veg' : '🔴 Non-Veg' }}
              </div>
              
              <div class="item-details">
                <h3 class="item-name">{{ item.name }}</h3>
                <p class="item-desc">{{ item.description || 'Tasty canteen delicacy' }}</p>
                
                <div class="item-meta">
                  <span class="prep-time">⏱️ {{ item.prep_time_minutes }} mins</span>
                  <span class="item-price">Rs. {{ item.price | number:'1.2-2' }}</span>
                </div>
              </div>

              <div class="card-actions">
                <button
                  class="add-btn"
                  [disabled]="item.is_available === 0"
                  (click)="addToCart(item)"
                >
                  {{ item.is_available === 1 ? '+ Add to Cart' : 'Sold Out' }}
                </button>
              </div>
            </div>
          </div>
          <ng-template #emptyCategory>
            <div class="empty-state">No items available in this category.</div>
          </ng-template>
        </div>
      </div>

      <!-- Floating Cart Bar -->
      <div class="floating-cart" *ngIf="cart.totalCount() > 0">
        <div class="cart-info">
          <span class="cart-items-count">{{ cart.totalCount() }} item(s)</span>
          <span class="cart-total-price">Total: Rs. {{ cart.totalPrice() | number:'1.2-2' }}</span>
        </div>
        <a routerLink="/cart" class="view-cart-btn">View Cart & Checkout ➔</a>
      </div>
    </div>
  `,
  styles: [`
    .menu-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem 6rem;
      color: #fff;
    }
    .menu-header { text-align: center; margin-bottom: 2rem; }
    .menu-header h1 { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.5rem; }
    .menu-header p { color: #94a3b8; }
    .category-tabs {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      padding-bottom: 0.75rem;
      margin-bottom: 2rem;
    }
    .tab-btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1;
      padding: 0.6rem 1.25rem;
      border-radius: 9999px;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active, .tab-btn:hover {
      background: #2563eb;
      color: #fff;
      border-color: #3b82f6;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .item-card {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      transition: transform 0.2s;
    }
    .item-card:hover { transform: translateY(-4px); }
    .item-card.sold-out { opacity: 0.6; filter: grayscale(0.6); }
    .card-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      display: inline-block;
      width: fit-content;
      margin-bottom: 0.75rem;
    }
    .card-badge.veg { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .card-badge.non-veg { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
    .item-name { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.35rem; }
    .item-desc { color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.25rem; min-height: 2.5rem; }
    .item-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .prep-time { font-size: 0.8rem; color: #94a3b8; }
    .item-price { font-size: 1.3rem; font-weight: 800; color: #60a5fa; }
    .add-btn {
      width: 100%;
      padding: 0.75rem;
      background: #059669;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .add-btn:hover:not(:disabled) { background: #047857; }
    .add-btn:disabled { background: #475569; cursor: not-allowed; }
    .floating-cart {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 600px;
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
      padding: 1rem 1.5rem;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
      z-index: 999;
    }
    .cart-info { display: flex; flex-direction: column; }
    .cart-items-count { font-size: 0.85rem; opacity: 0.9; }
    .cart-total-price { font-size: 1.2rem; font-weight: 800; }
    .view-cart-btn {
      background: #fff;
      color: #1e40af;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
    }
    .loading-state, .empty-state { text-align: center; padding: 3rem; color: #94a3b8; }
  `]
})
export class MenuComponent implements OnInit {
  categories: Category[] = [];
  selectedCategoryId: number = 0;
  loading = true;
  error = '';

  constructor(private menuService: MenuService, public cart: CartService) {}

  ngOnInit(): void {
    this.loadMenu();
  }

  loadMenu(): void {
    this.loading = true;
    this.menuService.getPublicMenu().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.categories = res.data;
          if (this.categories.length > 0) {
            this.selectedCategoryId = this.categories[0].id;
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load canteen menu.';
      }
    });
  }

  addToCart(item: MenuItem): void {
    this.cart.addItem(item);
  }
}
