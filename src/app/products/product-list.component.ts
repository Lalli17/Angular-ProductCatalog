import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  error = '';

  constructor(private api: ProductService, private router: Router) {}

  ngOnInit() {
    this.api.list().subscribe({
      next: res => { this.products = res; this.loading = false; },
      error: (err) => {
        const msg = err?.error?.message || err?.message || '';
        const status = err?.status ? ` (status ${err.status})` : '';
        this.error = `Failed to load products${status}${msg ? `: ${msg}` : ''}`;
        this.loading = false;
        console.error('Products load failed:', err);
      }
    });
  }

  add() { this.router.navigate(['/create']); }

  edit(p: Product) { this.router.navigate(['/edit', p.id]); }
  remove(p: Product) {
    if (confirm(`Delete product: ${p.name}?`)) {
      this.api.delete(p.id).subscribe(() => {
        this.products = this.products.filter(x => x.id !== p.id);
      });
    }
  }
}
