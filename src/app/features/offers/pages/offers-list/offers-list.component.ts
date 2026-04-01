import { CommonModule, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { combineLatest, Subscription } from 'rxjs';
import { CatalogService, VendorProduct } from '../../../../services/catalog.service';
import { AppPanelHeaderComponent } from '../../../../shared/components/ui/layout/panel-header/panel-header.component';
import { AppPageHeaderComponent } from '../../../../shared/components/ui/layout/page-header/page-header.component';
import { AppPillTabsComponent } from '../../../../shared/components/ui/navigation/pill-tabs/pill-tabs.component';
import {
  CategoryCampaign,
  ClearanceOffer,
  CouponOffer,
  OffersService
} from '../../services/offers.service';

type OffersView = 'direct' | 'coupons' | 'categories' | 'clearance';

@Component({
  selector: 'app-offers-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NgClass,
    AppPageHeaderComponent,
    AppPanelHeaderComponent,
    AppPillTabsComponent
  ],
  template: `
    <div class="space-y-6" [dir]="currentLang === 'ar' ? 'rtl' : 'ltr'">
      <app-page-header
        [title]="'OFFERS.TITLE' | translate"
        [description]="'OFFERS.SUBTITLE' | translate"
        customClass="mb-0"
      ></app-page-header>

      @if (isFiltersExpanded) {
      <div class="overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-sm animate-in slide-in-from-top-2 duration-300">
        <app-panel-header
          [title]="'OFFERS.FILTERS.TITLE'"
          [subtitle]="'OFFERS.FILTERS.SUBTITLE'"
          containerClass="border-b border-slate-100 px-6 py-4"
          contentClass="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          titleClass="text-[0.95rem] font-black text-slate-900"
          subtitleClass="text-[0.72rem] font-bold text-slate-500"
        >
          <div actions>
            <button
              type="button"
              (click)="resetFilters()"
              class="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[0.72rem] font-black text-rose-600 transition hover:bg-rose-100">
              {{ 'OFFERS.FILTERS.RESET' | translate }}
            </button>
          </div>
        </app-panel-header>

        <div class="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
          <label class="space-y-2">
            <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.SEARCH' | translate }}</span>
            <div class="relative group">
              <span class="absolute inset-y-0 start-4 flex items-center text-slate-400 group-focus-within:text-zadna-primary transition-colors">
                <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"></path>
                </svg>
              </span>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                [placeholder]="'OFFERS.SEARCH_PLACEHOLDER' | translate"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 pe-4 ps-11 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
            </div>
          </label>

          @if (activeView === 'direct') {
            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.CATEGORY' | translate }}</span>
              <select
                [(ngModel)]="directFilters.category"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="">{{ 'OFFERS.FILTERS.ALL_CATEGORIES' | translate }}</option>
                @for (category of availableDirectCategories; track category.value) {
                  <option [value]="category.value">{{ category.label }}</option>
                }
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.MIN_DISCOUNT' | translate }}</span>
              <select
                [(ngModel)]="directFilters.discountBand"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'OFFERS.FILTERS.ALL_DISCOUNTS' | translate }}</option>
                <option value="10">10%+</option>
                <option value="20">20%+</option>
                <option value="30">30%+</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.STOCK' | translate }}</span>
              <select
                [(ngModel)]="directFilters.stockBand"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'OFFERS.FILTERS.ALL_STOCK' | translate }}</option>
                <option value="low">{{ 'OFFERS.FILTERS.LOW_STOCK' | translate }}</option>
                <option value="healthy">{{ 'OFFERS.FILTERS.HEALTHY_STOCK' | translate }}</option>
              </select>
            </label>
          }

          @if (activeView === 'coupons') {
            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.STATUS' | translate }}</span>
              <select
                [(ngModel)]="couponFilters.status"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'OFFERS.FILTERS.ALL_STATUSES' | translate }}</option>
                <option value="active">{{ 'COMMON.STATUS_ACTIVE' | translate }}</option>
                <option value="inactive">{{ 'COMMON.STATUS_INACTIVE' | translate }}</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.TYPE' | translate }}</span>
              <select
                [(ngModel)]="couponFilters.type"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'OFFERS.FILTERS.ALL_TYPES' | translate }}</option>
                <option value="percentage">{{ 'OFFERS.FILTERS.TYPE_PERCENTAGE' | translate }}</option>
                <option value="fixed">{{ 'OFFERS.FILTERS.TYPE_FIXED' | translate }}</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.EXPIRY' | translate }}</span>
              <select
                [(ngModel)]="couponFilters.expiry"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'OFFERS.FILTERS.ALL_EXPIRY' | translate }}</option>
                <option value="soon">{{ 'OFFERS.FILTERS.EXPIRING_SOON' | translate }}</option>
                <option value="later">{{ 'OFFERS.FILTERS.EXPIRING_LATER' | translate }}</option>
              </select>
            </label>
          }

          @if (activeView === 'categories') {
            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.CATEGORY' | translate }}</span>
              <select
                [(ngModel)]="categoryFilters.category"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="">{{ 'OFFERS.FILTERS.ALL_CATEGORIES' | translate }}</option>
                @for (category of availableCampaignCategories; track category.value) {
                  <option [value]="category.value">{{ category.label }}</option>
                }
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.MIN_DISCOUNT' | translate }}</span>
              <select
                [(ngModel)]="categoryFilters.discountBand"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'OFFERS.FILTERS.ALL_DISCOUNTS' | translate }}</option>
                <option value="10">10%+</option>
                <option value="15">15%+</option>
                <option value="20">20%+</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.EXPIRY' | translate }}</span>
              <select
                [(ngModel)]="categoryFilters.expiry"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'OFFERS.FILTERS.ALL_EXPIRY' | translate }}</option>
                <option value="soon">{{ 'OFFERS.FILTERS.EXPIRING_SOON' | translate }}</option>
                <option value="later">{{ 'OFFERS.FILTERS.EXPIRING_LATER' | translate }}</option>
              </select>
            </label>
          }

          @if (activeView === 'clearance') {
            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.URGENCY' | translate }}</span>
              <select
                [(ngModel)]="clearanceFilters.urgency"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'OFFERS.FILTERS.ALL_URGENCY' | translate }}</option>
                <option value="critical">{{ 'OFFERS.FILTERS.URGENCY_CRITICAL' | translate }}</option>
                <option value="warning">{{ 'OFFERS.FILTERS.URGENCY_WARNING' | translate }}</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.STOCK_LIMIT' | translate }}</span>
              <select
                [(ngModel)]="clearanceFilters.stockLimit"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="all">{{ 'OFFERS.FILTERS.ALL_STOCK' | translate }}</option>
                <option value="5">5 {{ 'OFFERS.FILTERS.PIECES_OR_LESS' | translate }}</option>
                <option value="10">10 {{ 'OFFERS.FILTERS.PIECES_OR_LESS' | translate }}</option>
                <option value="12">12 {{ 'OFFERS.FILTERS.PIECES_OR_LESS' | translate }}</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-400">{{ 'OFFERS.FILTERS.CATEGORY' | translate }}</span>
              <select
                [(ngModel)]="clearanceFilters.category"
                class="h-11 w-full rounded-[16px] border border-slate-200 bg-slate-50 px-4 text-[0.8rem] font-bold text-slate-900 transition-all focus:border-zadna-primary/30 focus:bg-white focus:ring-4 focus:ring-zadna-primary/5 outline-none">
                <option value="">{{ 'OFFERS.FILTERS.ALL_CATEGORIES' | translate }}</option>
                @for (category of availableClearanceCategories; track category.value) {
                  <option [value]="category.value">{{ category.label }}</option>
                }
              </select>
            </label>
          }
        </div>
      </div>
      }

      <div class="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-sm shadow-slate-200/50">
        @if (isLoading) {
          <div class="flex h-72 flex-col items-center justify-center gap-3">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-zadna-primary/20 border-t-zadna-primary"></div>
            <span class="text-sm font-bold text-slate-400">{{ 'COMMON.LOADING' | translate }}</span>
          </div>
        } @else {
          <app-panel-header
            [title]="getActiveViewTitle()"
            [subtitle]="getActiveViewSubtitle()"
          >
            <div actions class="flex flex-wrap items-center gap-3">
              <app-pill-tabs
                [tabs]="views"
                [activeValue]="activeView"
                (activeValueChange)="onViewChange($event)">
              </app-pill-tabs>

              <button
                type="button"
                (click)="isFiltersExpanded = !isFiltersExpanded"
                class="inline-flex items-center gap-3 self-start rounded-full border border-slate-200/70 bg-white px-5 py-2.5 text-[0.74rem] font-black text-slate-700 shadow-sm transition-all hover:border-zadna-primary/20 hover:text-zadna-primary"
                [ngClass]="isFiltersExpanded ? 'border-zadna-primary/20 bg-teal-50 text-zadna-primary' : ''">
                <svg class="h-4.5 w-4.5 transition-transform" [ngClass]="isFiltersExpanded ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 5h18M6 12h12M10 19h4"></path>
                </svg>
                <span>{{ 'OFFERS.FILTERS.TITLE' | translate }}</span>
                @if (hasActiveFilters) {
                  <span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-100 px-1.5 text-[0.62rem] font-black text-rose-600">!</span>
                }
              </button>
            </div>
          </app-panel-header>

          <div class="overflow-x-auto">
            @if (activeView === 'direct') {
              @if (filteredProductOffers.length > 0) {
                <table class="w-full min-w-[980px] text-start">
                  <thead class="bg-slate-50/80 text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th class="px-6 py-4 text-start">{{ 'OFFERS.TABLE.PRODUCT' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.CATEGORY' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.ORIGINAL_PRICE' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.FINAL_PRICE' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.DISCOUNT' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.STOCK' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'COMMON.ACTIONS' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (product of filteredProductOffers; track product.id) {
                      <tr class="hover:bg-slate-50/50">
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-3">
                            <div class="h-14 w-14 shrink-0 overflow-hidden rounded-[16px] border border-slate-100 bg-slate-50">
                              <img [src]="product.imageUrl || 'assets/images/placeholders/product.png'" class="h-full w-full object-cover">
                            </div>
                            <div class="min-w-0">
                              <div class="truncate text-[0.86rem] font-black text-slate-900">{{ currentLang === 'ar' ? product.nameAr : product.nameEn }}</div>
                              <div class="text-[0.72rem] font-bold text-slate-400">{{ currentLang === 'ar' ? (product.brandNameAr || ('COMMON.BRAND_GENERAL' | translate)) : (product.brandNameEn || ('COMMON.BRAND_GENERAL' | translate)) }}</div>
                            </div>
                          </div>
                        </td>
                        <td class="px-4 py-4 text-[0.8rem] font-bold text-slate-600">
                          {{ currentLang === 'ar' ? (product.categoryNameAr || ('COMMON.NO_DATA' | translate)) : (product.categoryNameEn || ('COMMON.NO_DATA' | translate)) }}
                        </td>
                        <td class="px-4 py-4 text-[0.8rem] font-bold text-slate-400 line-through">
                          {{ product.compareAtPrice | number:'1.2-2' }} {{ 'COMMON.EGP' | translate }}
                        </td>
                        <td class="px-4 py-4 text-[0.82rem] font-black text-slate-900">
                          {{ product.sellingPrice | number:'1.2-2' }} {{ 'COMMON.EGP' | translate }}
                        </td>
                        <td class="px-4 py-4">
                          <span class="inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-[0.7rem] font-black text-orange-700">
                            {{ 'PRODUCTS.OFFER_BADGE' | translate:{ value: product.discountPercentage || 0 } }}
                          </span>
                        </td>
                        <td class="px-4 py-4 text-[0.8rem] font-bold text-slate-700">{{ product.stockQty }}</td>
                        <td class="px-4 py-4">
                          <a
                            [routerLink]="['/products', product.id]"
                            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[0.76rem] font-black text-slate-700 transition hover:border-zadna-primary/20 hover:bg-zadna-primary/5 hover:text-zadna-primary">
                            {{ 'OFFERS.EDIT_OFFER' | translate }}
                          </a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <div class="p-8 text-center text-[0.82rem] font-bold text-slate-500">{{ 'OFFERS.EMPTY_DIRECT' | translate }}</div>
              }
            }

            @if (activeView === 'coupons') {
              @if (filteredCoupons.length > 0) {
                <table class="w-full min-w-[980px] text-start">
                  <thead class="bg-slate-50/80 text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th class="px-6 py-4 text-start">{{ 'OFFERS.TABLE.COUPON_CODE' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.DISCOUNT_VALUE' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.MIN_ORDER' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.AUDIENCE' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.USAGE' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.ENDS_AT' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'COMMON.STATUS' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (coupon of filteredCoupons; track coupon.id) {
                      <tr class="hover:bg-slate-50/50">
                        <td class="px-6 py-4">
                          <div class="text-[0.86rem] font-black text-slate-900">{{ coupon.code }}</div>
                          <div class="mt-1 text-[0.72rem] font-bold text-slate-400">{{ currentLang === 'ar' ? coupon.noteAr : coupon.noteEn }}</div>
                        </td>
                        <td class="px-4 py-4 text-[0.8rem] font-black text-slate-900">{{ formatCouponValue(coupon) }}</td>
                        <td class="px-4 py-4 text-[0.8rem] font-bold text-slate-700">{{ coupon.minOrder }} {{ 'COMMON.EGP' | translate }}</td>
                        <td class="px-4 py-4 text-[0.8rem] font-bold text-slate-600">{{ currentLang === 'ar' ? coupon.audienceAr : coupon.audienceEn }}</td>
                        <td class="px-4 py-4 text-[0.8rem] font-bold text-slate-700">{{ coupon.usageCount }}/{{ coupon.usageLimit }}</td>
                        <td class="px-4 py-4 text-[0.8rem] font-bold" [ngClass]="isEndingSoon(coupon.endsAt) ? 'text-orange-600' : 'text-slate-600'">
                          {{ coupon.endsAt }}
                        </td>
                        <td class="px-4 py-4">
                          <span class="inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-black"
                            [ngClass]="coupon.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                            {{ coupon.isActive ? ('COMMON.STATUS_ACTIVE' | translate) : ('COMMON.STATUS_INACTIVE' | translate) }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <div class="p-8 text-center text-[0.82rem] font-bold text-slate-500">{{ 'OFFERS.EMPTY_COUPONS' | translate }}</div>
              }
            }

            @if (activeView === 'categories') {
              @if (filteredCategoryCampaigns.length > 0) {
                <table class="w-full min-w-[980px] text-start">
                  <thead class="bg-slate-50/80 text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th class="px-6 py-4 text-start">{{ 'OFFERS.TABLE.CATEGORY' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.CAMPAIGN' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.DISCOUNT' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.INCLUDED_PRODUCTS' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.ENDS_AT' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'COMMON.ACTIONS' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (campaign of filteredCategoryCampaigns; track campaign.id) {
                      <tr class="hover:bg-slate-50/50">
                        <td class="px-6 py-4 text-[0.82rem] font-black text-slate-900">{{ currentLang === 'ar' ? campaign.categoryNameAr : campaign.categoryNameEn }}</td>
                        <td class="px-4 py-4">
                          <div class="text-[0.8rem] font-black text-slate-900">{{ currentLang === 'ar' ? campaign.headlineAr : campaign.headlineEn }}</div>
                          <div class="mt-1 text-[0.72rem] font-bold text-slate-400">{{ currentLang === 'ar' ? campaign.noteAr : campaign.noteEn }}</div>
                        </td>
                        <td class="px-4 py-4 text-[0.8rem] font-black text-sky-700">{{ campaign.discountPercentage }}%</td>
                        <td class="px-4 py-4 text-[0.8rem] font-bold text-slate-700">{{ campaign.productsIncluded }}</td>
                        <td class="px-4 py-4 text-[0.8rem] font-bold text-slate-600">{{ campaign.endsAt }}</td>
                        <td class="px-4 py-4">
                          <a
                            routerLink="/products"
                            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[0.76rem] font-black text-slate-700 transition hover:border-zadna-primary/20 hover:bg-zadna-primary/5 hover:text-zadna-primary">
                            {{ 'OFFERS.REVIEW_PRODUCTS' | translate }}
                          </a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <div class="p-8 text-center text-[0.82rem] font-bold text-slate-500">{{ 'OFFERS.EMPTY_CATEGORIES' | translate }}</div>
              }
            }

            @if (activeView === 'clearance') {
              @if (filteredClearanceOffers.length > 0) {
                <table class="w-full min-w-[980px] text-start">
                  <thead class="bg-slate-50/80 text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th class="px-6 py-4 text-start">{{ 'OFFERS.TABLE.PRODUCT' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.CATEGORY' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.STOCK_LEFT' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.RECOMMENDED_DISCOUNT' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.FINAL_PRICE' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'OFFERS.TABLE.ORIGINAL_PRICE' | translate }}</th>
                      <th class="px-4 py-4 text-start">{{ 'COMMON.ACTIONS' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (item of filteredClearanceOffers; track item.productId) {
                      <tr class="hover:bg-slate-50/50">
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-3">
                            <div class="h-14 w-14 shrink-0 overflow-hidden rounded-[16px] border border-slate-100 bg-slate-50">
                              <img [src]="item.imageUrl || 'assets/images/placeholders/product.png'" class="h-full w-full object-cover">
                            </div>
                            <div class="min-w-0">
                              <div class="truncate text-[0.86rem] font-black text-slate-900">{{ currentLang === 'ar' ? item.nameAr : item.nameEn }}</div>
                              <div class="mt-1">
                                <span class="inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-black"
                                  [ngClass]="item.urgency === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'">
                                  {{ item.stockQty <= 5 ? ('OFFERS.LAST_PIECES_BADGE' | translate) : ('OFFERS.LOW_STOCK_BADGE' | translate) }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td class="px-4 py-4 text-[0.8rem] font-bold text-slate-600">
                          {{ currentLang === 'ar' ? (item.categoryNameAr || ('COMMON.NO_DATA' | translate)) : (item.categoryNameEn || ('COMMON.NO_DATA' | translate)) }}
                        </td>
                        <td class="px-4 py-4 text-[0.8rem] font-black" [ngClass]="item.urgency === 'critical' ? 'text-rose-700' : 'text-orange-700'">{{ item.stockQty }}</td>
                        <td class="px-4 py-4 text-[0.8rem] font-black text-slate-700">{{ item.discountPercentage }}%</td>
                        <td class="px-4 py-4 text-[0.82rem] font-black text-slate-900">{{ item.sellingPrice | number:'1.2-2' }} {{ 'COMMON.EGP' | translate }}</td>
                        <td class="px-4 py-4 text-[0.8rem] font-bold text-slate-400 line-through">{{ item.compareAtPrice | number:'1.2-2' }} {{ 'COMMON.EGP' | translate }}</td>
                        <td class="px-4 py-4">
                          <a
                            [routerLink]="['/products', item.productId]"
                            class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[0.76rem] font-black text-slate-700 transition hover:border-zadna-primary/20 hover:bg-zadna-primary/5 hover:text-zadna-primary">
                            {{ 'OFFERS.ACTIVATE_CLEARANCE' | translate }}
                          </a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <div class="p-8 text-center text-[0.82rem] font-bold text-slate-500">{{ 'OFFERS.EMPTY_CLEARANCE' | translate }}</div>
              }
            }
          </div>
        }
      </div>
    </div>
  `
})
export class OffersListComponent implements OnInit, OnDestroy {
  isLoading = true;
  searchTerm = '';
  currentLang = 'ar';
  activeView: OffersView = 'direct';
  isFiltersExpanded = false;
  productOffers: VendorProduct[] = [];
  coupons: CouponOffer[] = [];
  categoryCampaigns: CategoryCampaign[] = [];
  clearanceOffers: ClearanceOffer[] = [];
  directFilters = { category: '', discountBand: 'all', stockBand: 'all' };
  couponFilters = { status: 'all', type: 'all', expiry: 'all' };
  categoryFilters = { category: '', discountBand: 'all', expiry: 'all' };
  clearanceFilters = { urgency: 'all', stockLimit: 'all', category: '' };
  private langSub: Subscription;

  readonly views: Array<{ value: OffersView; label: string }> = [
    { value: 'direct', label: 'OFFERS.VIEWS.DIRECT' },
    { value: 'coupons', label: 'OFFERS.VIEWS.COUPONS' },
    { value: 'categories', label: 'OFFERS.VIEWS.CATEGORIES' },
    { value: 'clearance', label: 'OFFERS.VIEWS.CLEARANCE' }
  ];

  constructor(
    private readonly catalogService: CatalogService,
    private readonly offersService: OffersService,
    private readonly translate: TranslateService
  ) {
    this.currentLang = this.translate.currentLang || 'ar';
    this.langSub = this.translate.onLangChange.subscribe((event) => this.currentLang = event.lang);
  }

  ngOnInit(): void {
    combineLatest([
      this.catalogService.getVendorProducts({ pageNumber: 1, pageSize: 100 }),
      this.catalogService.getCategories(),
      this.offersService.getCouponOffers()
    ]).subscribe({
      next: ([productsResponse, categories, coupons]) => {
        const products = productsResponse.items;
        this.productOffers = products.filter((product) => this.catalogService.hasActiveOffer(product));
        this.coupons = coupons;
        this.categoryCampaigns = this.offersService.buildCategoryCampaigns(categories, products);
        this.clearanceOffers = this.offersService.buildClearanceOffers(products);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
  }

  get filteredProductOffers(): VendorProduct[] {
    return this.productOffers.filter((product) =>
      this.matchesSearch([
        product.nameAr,
        product.nameEn,
        product.categoryNameAr,
        product.categoryNameEn
      ]) &&
      this.matchesDirectFilters(product)
    );
  }

  get filteredCoupons(): CouponOffer[] {
    return this.coupons.filter((coupon) =>
      this.matchesSearch([
        coupon.code,
        coupon.audienceAr,
        coupon.audienceEn,
        coupon.noteAr,
        coupon.noteEn
      ]) &&
      this.matchesCouponFilters(coupon)
    );
  }

  get filteredCategoryCampaigns(): CategoryCampaign[] {
    return this.categoryCampaigns.filter((campaign) =>
      this.matchesSearch([
        campaign.categoryNameAr,
        campaign.categoryNameEn,
        campaign.headlineAr,
        campaign.headlineEn,
        campaign.noteAr,
        campaign.noteEn
      ]) &&
      this.matchesCategoryFilters(campaign)
    );
  }

  get filteredClearanceOffers(): ClearanceOffer[] {
    return this.clearanceOffers.filter((item) =>
      this.matchesSearch([
        item.nameAr,
        item.nameEn,
        item.categoryNameAr,
        item.categoryNameEn
      ]) &&
      this.matchesClearanceFilters(item)
    );
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim()
      || !!this.directFilters.category
      || this.directFilters.discountBand !== 'all'
      || this.directFilters.stockBand !== 'all'
      || this.couponFilters.status !== 'all'
      || this.couponFilters.type !== 'all'
      || this.couponFilters.expiry !== 'all'
      || !!this.categoryFilters.category
      || this.categoryFilters.discountBand !== 'all'
      || this.categoryFilters.expiry !== 'all'
      || this.clearanceFilters.urgency !== 'all'
      || this.clearanceFilters.stockLimit !== 'all'
      || !!this.clearanceFilters.category;
  }

  get availableDirectCategories(): Array<{ value: string; label: string }> {
    return this.buildCategoryOptions(this.productOffers.map((item) => ({
      value: item.categoryId,
      label: this.currentLang === 'ar' ? (item.categoryNameAr || this.translate.instant('COMMON.NO_DATA')) : (item.categoryNameEn || this.translate.instant('COMMON.NO_DATA'))
    })));
  }

  get availableCampaignCategories(): Array<{ value: string; label: string }> {
    return this.buildCategoryOptions(this.categoryCampaigns.map((item) => ({
      value: item.categoryId,
      label: this.currentLang === 'ar' ? item.categoryNameAr : item.categoryNameEn
    })));
  }

  get availableClearanceCategories(): Array<{ value: string; label: string }> {
    return this.buildCategoryOptions(this.clearanceOffers.map((item) => ({
      value: this.currentLang === 'ar' ? (item.categoryNameAr || '') : (item.categoryNameEn || ''),
      label: this.currentLang === 'ar' ? (item.categoryNameAr || this.translate.instant('COMMON.NO_DATA')) : (item.categoryNameEn || this.translate.instant('COMMON.NO_DATA'))
    })));
  }

  formatCouponValue(coupon: CouponOffer): string {
    return coupon.type === 'percentage'
      ? `${coupon.value}%`
      : `${coupon.value} ${this.translate.instant('COMMON.EGP')}`;
  }

  isEndingSoon(dateText: string): boolean {
    const endDate = new Date(dateText);
    const diff = endDate.getTime() - Date.now();
    const days = diff / (1000 * 60 * 60 * 24);
    return days <= 7;
  }

  getActiveViewTitle(): string {
    switch (this.activeView) {
      case 'coupons':
        return 'OFFERS.COUPONS_TITLE';
      case 'categories':
        return 'OFFERS.CATEGORY_TITLE';
      case 'clearance':
        return 'OFFERS.CLEARANCE_TITLE';
      default:
        return 'OFFERS.DIRECT_OFFERS';
    }
  }

  getActiveViewSubtitle(): string {
    switch (this.activeView) {
      case 'coupons':
        return 'OFFERS.COUPONS_SUBTITLE';
      case 'categories':
        return 'OFFERS.CATEGORY_SUBTITLE';
      case 'clearance':
        return 'OFFERS.CLEARANCE_SUBTITLE';
      default:
        return 'OFFERS.DIRECT_SECTION_HINT';
    }
  }

  onViewChange(view: string): void {
    this.activeView = view as OffersView;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.directFilters = { category: '', discountBand: 'all', stockBand: 'all' };
    this.couponFilters = { status: 'all', type: 'all', expiry: 'all' };
    this.categoryFilters = { category: '', discountBand: 'all', expiry: 'all' };
    this.clearanceFilters = { urgency: 'all', stockLimit: 'all', category: '' };
  }

  private matchesDirectFilters(product: VendorProduct): boolean {
    if (this.directFilters.category && product.categoryId !== this.directFilters.category) {
      return false;
    }

    const discount = product.discountPercentage || 0;
    if (this.directFilters.discountBand !== 'all' && discount < Number(this.directFilters.discountBand)) {
      return false;
    }

    if (this.directFilters.stockBand === 'low' && product.stockQty > 20) {
      return false;
    }

    if (this.directFilters.stockBand === 'healthy' && product.stockQty <= 20) {
      return false;
    }

    return true;
  }

  private matchesCouponFilters(coupon: CouponOffer): boolean {
    if (this.couponFilters.status === 'active' && !coupon.isActive) {
      return false;
    }

    if (this.couponFilters.status === 'inactive' && coupon.isActive) {
      return false;
    }

    if (this.couponFilters.type !== 'all' && coupon.type !== this.couponFilters.type) {
      return false;
    }

    if (this.couponFilters.expiry === 'soon' && !this.isEndingSoon(coupon.endsAt)) {
      return false;
    }

    if (this.couponFilters.expiry === 'later' && this.isEndingSoon(coupon.endsAt)) {
      return false;
    }

    return true;
  }

  private matchesCategoryFilters(campaign: CategoryCampaign): boolean {
    if (this.categoryFilters.category && campaign.categoryId !== this.categoryFilters.category) {
      return false;
    }

    if (this.categoryFilters.discountBand !== 'all' && campaign.discountPercentage < Number(this.categoryFilters.discountBand)) {
      return false;
    }

    if (this.categoryFilters.expiry === 'soon' && !this.isEndingSoon(campaign.endsAt)) {
      return false;
    }

    if (this.categoryFilters.expiry === 'later' && this.isEndingSoon(campaign.endsAt)) {
      return false;
    }

    return true;
  }

  private matchesClearanceFilters(item: ClearanceOffer): boolean {
    if (this.clearanceFilters.urgency !== 'all' && item.urgency !== this.clearanceFilters.urgency) {
      return false;
    }

    if (this.clearanceFilters.stockLimit !== 'all' && item.stockQty > Number(this.clearanceFilters.stockLimit)) {
      return false;
    }

    const categoryName = this.currentLang === 'ar' ? (item.categoryNameAr || '') : (item.categoryNameEn || '');
    if (this.clearanceFilters.category && categoryName !== this.clearanceFilters.category) {
      return false;
    }

    return true;
  }

  private buildCategoryOptions(items: Array<{ value: string; label: string }>): Array<{ value: string; label: string }> {
    const seen = new Set<string>();

    return items.filter((item) => {
      if (!item.value || seen.has(item.value)) {
        return false;
      }

      seen.add(item.value);
      return true;
    });
  }

  private matchesSearch(values: Array<string | undefined | null>): boolean {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return true;
    }

    return values.some((value) => (value || '').toLowerCase().includes(term));
  }
}
