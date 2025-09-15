import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  id?: number;
  uploading = false;
  progress = 0;
  imageFile?: File;
  preview?: string;   // 👈 added for preview
  saving = false;
  error = '';

  form = this.fb.group({
    name: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0.01)]],
  });

  constructor(private fb: FormBuilder, private route: ActivatedRoute,
              private api: ProductService, private router: Router) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id') || 0) || undefined;
    if (this.id) {
      this.api.get(this.id).subscribe(p => {
        this.form.patchValue({ name: p.name, price: p.price });

        // If editing & product already has an image, show it
        if (p.imageUrl) {
          this.preview = p.imageUrl;
        }
      });
    }
  }

  onFile(e: any) {
    const file = e.target.files?.[0];
    this.imageFile = file;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.preview = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.preview = undefined;
    }
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.error = '';
    const value = this.form.value as { name: string; price: any };
    const payload = {
      name: (value.name || '').trim(),
      price: Number(value.price)
    };
    if (!payload.name || isNaN(payload.price)) {
      this.error = 'Please provide a valid name and price.';
      return;
    }
    this.saving = true;

    console.log('Sending payload:', payload, 'Image file:', this.imageFile);

    if (this.id) {
      this.api.update(this.id, payload, this.imageFile).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/']); },
        error: (err) => { 
          this.saving = false; 
          console.error('Update error:', err);
          this.error = this.toMessage(err); 
        }
      });
    } else {
      this.api.create(payload, this.imageFile).subscribe({
        next: (res) => { this.id = res.id; this.saving = false; this.router.navigate(['/']); },
        error: (err) => { 
          this.saving = false; 
          console.error('Create error:', err);
          this.error = this.toMessage(err); 
        }
      });
    }
  }

  cancel() {
    this.form.reset({ name: '', price: 0 });
    this.imageFile = undefined;
    this.preview = undefined;   // 👈 reset preview
    this.uploading = false;
    this.progress = 0;
    this.id = undefined;
    this.router.navigate(['/']);
  }

  private toMessage(err: any): string {
    const payload = err?.error;
    if (payload?.errors && typeof payload.errors === 'object') {
      const parts: string[] = [];
      for (const key of Object.keys(payload.errors)) {
        const val = payload.errors[key];
        const text = Array.isArray(val) ? val.join(', ') : String(val);
        parts.push(`${key}: ${text}`);
      }
      const joined = parts.join(' | ');
      const status = err?.status ? ` (status ${err.status})` : '';
      return `${payload.title || 'Validation failed'}${status}${joined ? ` - ${joined}` : ''}`;
    }
    const raw = payload && typeof payload === 'object' ? JSON.stringify(payload) : payload;
    const msg = raw || err?.message || 'Request failed';
    const status = err?.status ? ` (status ${err.status})` : '';
    return `${msg}${status}`;
  }
}
