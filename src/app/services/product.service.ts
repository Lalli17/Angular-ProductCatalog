import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Product } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = `${environment.apiBaseUrl}/products`;

  constructor(private http: HttpClient) {}

  list(): Observable<Product[]> {
    return this.http.get<Product[]>(this.base).pipe(
      map(items => items.map(p => this.withQualifiedImageUrl(p)))
    );
  }

  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/${id}`).pipe(
      map(p => this.withQualifiedImageUrl(p))
    );
  }

  create(data: Pick<Product, 'name' | 'price'>, imageFile?: File): Observable<Product> {
    const body = this.buildBody(data, imageFile);
    return this.http.post<Product>(this.base, body).pipe(
      map(p => this.withQualifiedImageUrl(p))
    );
  }

  update(id: number, data: Pick<Product, 'name' | 'price'>, imageFile?: File): Observable<void> {
    const body = this.buildBody(data, imageFile);
    return this.http.put<void>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadImage(id: number, file: File): Observable<HttpEvent<any>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${this.base}/${id}/image`, form, {
      reportProgress: true,
      observe: 'events'
    });
  }

  private withQualifiedImageUrl(product: Product): Product {
    if (!product?.imageUrl) { return product; }
    const url = String(product.imageUrl);
    if (/^https?:\/\//i.test(url)) { return product; }
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return { ...product, imageUrl: `${base}${path}` };
  }

  private buildBody(data: Pick<Product, 'name' | 'price'>, imageFile?: File): FormData {
    const form = new FormData();
    form.append('name', String(data.name));
    form.append('price', String(data.price));
    // Only append image if provided (API expects IFormFile? which can be null)
    if (imageFile) {
      form.append('image', imageFile);
    }
    return form;
  }
}
