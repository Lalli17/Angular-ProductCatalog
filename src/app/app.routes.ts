import { Routes } from '@angular/router';
import { ProductListComponent } from './products/product-list.component';
import { ProductFormComponent } from './products/product-form.component';

export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'create', component: ProductFormComponent },
  { path: 'edit/:id', component: ProductFormComponent },
  { path: '**', redirectTo: '' }
];
