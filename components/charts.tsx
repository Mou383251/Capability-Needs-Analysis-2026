import React, { useEffect, useRef } from 'react';

// Make Chart.js available globally for the component
declare const Chart: any;

interface ChartProps {
  type: 'bar' | 'doughnut' | 'horizontalBar' | 'radar' | 'scatter';
  data: {
    labels?: string[];
    datasets: {
      label: string;
      data: (number | { x: number; y: number; [key: string]: any; } | null)[];
      backgroundColor: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      hoverOffset?: number;
      borderRadius?: number;
      [key: string]: any; // To allow other chart-specific properties like 'fill' for radar
    }[];
  };
  options?: any;
  chartRef?: React.RefObject<HTMLCanvasElement>;
}

export const ChartComponent: React.FC<ChartProps> = ({ type, data, options, chartRef }) => {
  const internalChartContainer = useRef<HTMLCanvasElement>(null);
  const chartContainer = chartRef || internalChartContainer;
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    const drawChart = () => {
        if (!chartContainer.current) return;
        const ctx = chartContainer.current.getContext('2d');
        if (!ctx) return;
        
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const chartType = type === 'horizontalBar' ? 'bar' : type;
            
        const isDarkMode = document.documentElement.classList.contains('dark');
        // Setting a definitive executive dark theme
        const textColor = '#475569'; // slate-600
        const gridColor = 'rgba(226, 232, 240, 0.5)'; // light slate for clean grids

        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            onHover: (event: any, chartElement: any) => {
                const target = event.native?.target;
                if (target) {
                    target.style.cursor = chartElement.length > 0 ? 'pointer' : 'default';
                }
            },
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: {
                        color: '#1e293b',
                        font: { size: 10, weight: '700', family: 'Inter' },
                        boxWidth: 8,
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#0f172a',
                    titleColor: '#fff',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { size: 12, weight: '900' },
                    bodyFont: { size: 11 }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColor, font: { size: 9, weight: '600' } },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, font: { size: 9 } },
                    grid: { color: gridColor, drawTicks: false }
                }
            }
        };
        
        const finalOptions = {
            ...defaultOptions,
            ...options,
            indexAxis: type === 'horizontalBar' ? 'y' as const : 'x' as const,
        };

        if (type === 'doughnut' || type === 'radar') {
            delete finalOptions.scales;
        }
        
        chartInstance.current = new Chart(ctx, {
            type: chartType,
            data: data as any,
            options: finalOptions
        });
    }

    drawChart();

    const observer = new MutationObserver((mutations) => {
        for(const mutation of mutations) {
            if (mutation.attributeName === 'class') {
                drawChart();
            }
        }
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, type, options]);

  return <canvas ref={chartContainer}></canvas>;
};