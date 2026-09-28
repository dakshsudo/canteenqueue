import { Injectable, signal, computed } from '@angular/core';
import { MenuItem } from '../models/menu';
import { CartItem } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  items = signal<CartItem[]>(this.loadCart());

  totalCount = computed(() => this.items().reduce((acc, i) => acc + i.quantity, 0));
  totalPrice = computed(() => this.items().reduce((acc, i) => acc + (Number(i.item.price) * i.quantity), 0));

  constructor() {}

  private loadCart(): CartItem[] {
    const raw = localStorage.getItem('cq_cart');
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveCart(): void {
    localStorage.setItem('cq_cart', JSON.stringify(this.items()));
  }

  addItem(item: MenuItem, qty = 1): void {
    const current = this.items();
    const index = current.findIndex(ci => ci.item.id === item.id);
    if (index > -1) {
      const updated = [...current];
      updated[index].quantity += qty;
      this.items.set(updated);
    } else {
      this.items.set([...current, { item, quantity: qty }]);
    }
    this.saveCart();
  }

  updateQuantity(itemId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }
    const current = this.items().map(ci => ci.item.id === itemId ? { ...ci, quantity } : ci);
    this.items.set(current);
    this.saveCart();
  }

  removeItem(itemId: number): void {
    const filtered = this.items().filter(ci => ci.item.id !== itemId);
    this.items.set(filtered);
    this.saveCart();
  }

  clearCart(): void {
    this.items.set([]);
    localStorage.removeItem('cq_cart');
  }
}
