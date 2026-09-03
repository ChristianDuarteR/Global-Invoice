import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-toast-host',
  template: `
    <div class="pointer-events-none fixed top-4 right-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      @for (t of toasts.toasts(); track t.id) {
        <div
          class="pointer-events-auto gi-in rounded-2xl border px-4 py-3 shadow-2xl"
          [class]="
            t.kind === 'ok'
              ? 'border-teal-400/30 bg-[#0e1b1a]/95 text-teal-50'
              : t.kind === 'err'
                ? 'border-rose-400/30 bg-[#1b1014]/95 text-rose-50'
                : 'border-white/10 bg-[#12151d]/95 text-white'
          "
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold tracking-wide uppercase opacity-70">{{ t.title }}</p>
              <p class="mt-1 text-sm leading-snug">{{ t.message }}</p>
            </div>
            <button class="text-white/50 hover:text-white" type="button" (click)="toasts.dismiss(t.id)">×</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  readonly toasts = inject(ToastService);
}
