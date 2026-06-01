import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OrderStatus } from '../../models/orders.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <span [ngClass]="getClasses()" class="inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.15em] border transition-all duration-500 shadow-sm backdrop-blur-md">
      <span class="h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]" [ngClass]="getDotClasses()"></span>
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
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'CONFIRMED':
        return 'bg-[#00626F]/10 text-[#00626F] border-[#00626F]/20';
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'READY_FOR_PICKUP':
        return 'bg-[#004953]/10 text-[#004953] border-[#004953]/20';
      case 'DRIVER_ASSIGNMENT_IN_PROGRESS':
        return 'bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/20';
      case 'DRIVER_ASSIGNED':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-[#004953] text-white border-transparent shadow-[#004953]/20';
      case 'CANCELLED':
      case 'RETURNED':
      case 'DELIVERY_FAILED':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  }

  getDotClasses(): string {
    switch (this.status) {
      case 'NEW': return 'bg-blue-500 animate-pulse';
      case 'CONFIRMED': return 'bg-[#00626F]';
      case 'IN_PROGRESS': return 'bg-amber-500';
      case 'READY_FOR_PICKUP': return 'bg-[#004953]';
      case 'DRIVER_ASSIGNMENT_IN_PROGRESS': return 'bg-[#FF9800] animate-pulse';
      case 'DRIVER_ASSIGNED': return 'bg-emerald-500';
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY': return 'bg-purple-500';
      case 'DELIVERED':
      case 'COMPLETED': return 'bg-white';
      case 'CANCELLED':
      case 'RETURNED':
      case 'DELIVERY_FAILED': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  }
}
