import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { InvoiceType } from '../../core/models/invoice.model';
import { MetricsStore } from '../../core/metrics/metrics.store';
import { toNumber } from '../../core/money';

const COLORS: Record<InvoiceType, string> = {
  NACIONAL: '#5eead4',
  EXPORTACION: '#c4b5fd',
  GUBERNAMENTAL: '#e7c56a',
};

const LABELS: Record<InvoiceType, string> = {
  NACIONAL: 'Nacional',
  EXPORTACION: 'Exportación',
  GUBERNAMENTAL: 'Gubernamental',
};

@Component({
  selector: 'app-dashboard',
  imports: [BaseChartDirective, CurrencyPipe, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class DashboardPage implements OnInit {
  readonly metrics = inject(MetricsStore);
  readonly colors = COLORS;
  readonly labels = LABELS;

  readonly rows = computed(() =>
    this.metrics.snapshot().by_type.map((row) => ({
      ...row,
      value: toNumber(row.total),
      color: COLORS[row.invoice_type],
      label: LABELS[row.invoice_type],
    })),
  );

  readonly grand = computed(() => toNumber(this.metrics.snapshot().grand_total));
  readonly count = computed(() => this.metrics.snapshot().invoice_count ?? 0);

  readonly donut = computed(() => {
    const rows = this.rows();
    const total = rows.reduce((acc, r) => acc + r.value, 0);
    return rows.map((row) => ({
      ...row,
      percent: total > 0 ? (row.value / total) * 100 : 0,
    }));
  });

  readonly donutData = computed<ChartConfiguration<'doughnut'>['data']>(() => ({
    labels: this.rows().map((row) => row.label),
    datasets: [
      {
        data: this.rows().map((row) => row.value),
        backgroundColor: this.rows().map((row) => row.color),
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }));

  readonly barData = computed<ChartConfiguration<'bar'>['data']>(() => ({
    labels: this.rows().map((row) => row.label),
    datasets: [
      {
        data: this.rows().map((row) => row.value),
        backgroundColor: this.rows().map((row) => row.color),
        borderRadius: 6,
        barThickness: 22,
      },
    ],
  }));

  readonly donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  readonly barOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(36, 36, 36, 0.1)' },
        ticks: { color: 'rgba(36, 36, 36, 0.7)' },
      },
      y: {
        grid: { display: false },
        ticks: { color: 'rgba(36, 36, 36, 0.8)' },
      },
    },
  };

  ngOnInit(): void {
    this.metrics.ensureStarted();
  }
}
