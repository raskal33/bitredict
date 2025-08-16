"use client";

import tailwindConfig from "@/tailwind.config";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
);

const StakedChartData = {
  labels: ["Jun 16", "Jun 17", "Jun 18", "Jun 19", "Jun 20"],
  datasets: [
    {
      label: "Staked ($/Svent Staked)",
      data: [100, 150, 200, 170, 130],
      borderColor: tailwindConfig.theme.extend.colors.primary,
      fill: true,
      tension: 0.1,
    },
  ],
};

const PriceTrendCharData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  datasets: [
    {
      label: "BITR Price",
      data: [0.45, 0.52, 0.48, 0.60, 0.55, 0.65, 0.70, 0.75],
      backgroundColor: "rgba(34, 199, 255, 0.1)",
      borderColor: tailwindConfig.theme.extend.colors.primary,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: tailwindConfig.theme.extend.colors.primary,
      pointBorderColor: "#fff",
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
};

function StakedChart() {
  return (
    <div className="col-span-full h-full rounded-lg bg-dark-2 xl:col-span-2">
      <Line
        data={StakedChartData}
        className="h-full w-full"
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { beginAtZero: true },
            y: { beginAtZero: true },
          },
        }}
      />
    </div>
  );
}

function PriceTrendChart() {
  return (
    <div className="h-full w-full">
      <Line
        data={PriceTrendCharData}
        className="h-full w-full"
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: 'rgba(228, 228, 250, 0.8)',
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(22, 24, 48, 0.9)',
              titleColor: '#E4E4FA',
              bodyColor: '#E4E4FA',
              borderColor: 'rgba(34, 199, 255, 0.3)',
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `$${context.raw}`;
                }
              }
            }
          },
          scales: {
            x: { 
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(228, 228, 250, 0.6)'
              }
            },
            y: { 
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(228, 228, 250, 0.6)',
                callback: function(value) {
                  return '$' + value;
                }
              }
            },
          },
        }}
      />
    </div>
  );
}

export { StakedChart, PriceTrendChart };
