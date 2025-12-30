import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function VoltageChart({ data, labels, color, title, average }) {
  const chartRef = useRef(null)

  const chartData = {
    labels: labels || [],
    datasets: [{
      label: 'Voltage (V)',
      data: data || [],
      borderColor: color || 'rgb(74, 144, 226)',
      backgroundColor: color ? color.replace('rgb', 'rgba').replace(')', ', 0.2)') : 'rgba(74, 144, 226, 0.2)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      spanGaps: false
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return 'Voltage: ' + context.parsed.y.toFixed(2) + ' V'
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Voltage (V)',
          color: '#ECF0F1',
          font: { size: 14, weight: 'bold' }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ECF0F1'
        }
      },
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Time',
          color: '#ECF0F1',
          font: { size: 14, weight: 'bold' }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ECF0F1',
          autoSkip: true,
          maxTicksLimit: 10
        }
      }
    }
  }

  return (
    <div className="chart-container" style={{ position: 'relative', height: '300px' }}>
      <Line ref={chartRef} data={chartData} options={options} />
      {average !== undefined && (
        <div className="chart-average-box">
          <div className="chart-average-label">1-Min Avg</div>
          <div className="chart-average-value">{average.toFixed(2)}V</div>
        </div>
      )}
    </div>
  )
}

export default VoltageChart

