import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OrderStatus } from '../../models/orders.models';

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <span [ngClass]="getClasses()" class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.65rem] font-black uppercase tracking-wider transition-all">
      <span class="h-1.5 w-1.5 rounded-full" [ngClass]="getDotClasses()"></span>
      {{ 'ORDERS.STATUS_' + status | translate }}
    </span>
  `,
  styles: [`
    :host { display: inline-block; }
  `]
})
export class OrderStatusBadgeComponent {
  @Input({ required: true }) status!: OrderStatus;

  getClasses(): string {
    switch (this.status) {
      case 'NEW':
        return 'bg-blue-50 text-blue-600 border border-blue-100/50';
      case 'CONFIRMED':
        return 'bg-cyan-50 text-cyan-600 border border-cyan-100/50';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-600 border border-amber-100/50';
      case 'READY_FOR_PICKUP':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-100/50';
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-50 text-purple-600 border border-purple-100/50';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100/50';
      case 'CANCELLED':
      case 'RETURNED':
        return 'bg-rose-50 text-rose-600 border border-rose-100/50';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-100/50';
    }
  }

  getDotClasses(): string {
    switch (this.status) {
      case 'NEW': return 'bg-blue-500 animate-pulse';
      case 'CONFIRMED': return 'bg-cyan-500';
      case 'IN_PROGRESS': return 'bg-amber-500';
      case 'READY_FOR_PICKUP': return 'bg-indigo-500';
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY': return 'bg-purple-500';
      case 'DELIVERED':
      case 'COMPLETED': return 'bg-emerald-500';
      case 'CANCELLED':
      case 'RETURNED': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  }
}
