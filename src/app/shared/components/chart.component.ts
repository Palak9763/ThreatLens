import { Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

/** Thin reusable wrapper around Chart.js. Pass a Chart.js configuration; it re-renders when it changes. */
@Component({
  selector: 'app-chart',
  template: `<div class="chart-box" [style.height.px]="height()"><canvas #canvas></canvas></div>`,
  styles: [`.chart-box{position:relative;width:100%}`]
})
export class ChartComponent implements OnDestroy {
  config = input.required<ChartConfiguration>();
  height = input(260);
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      const cfg = this.config();
      const el = this.canvas().nativeElement;
      this.chart?.destroy();
      const css = getComputedStyle(document.documentElement);
      Chart.defaults.color = css.getPropertyValue('--text-dim').trim() || '#8b98b3';
      Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
      Chart.defaults.borderColor = css.getPropertyValue('--border').trim() || '#243049';
      this.chart = new Chart(el, { ...cfg, options: { responsive: true, maintainAspectRatio: false, ...cfg.options } });
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
