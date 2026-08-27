'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface OrdersBarChartProps {
  data: Array<{ month: string; revenue: number; orders: number }>
}

export function OrdersBarChart({ data }: OrdersBarChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  const highlightIndex = data.reduce((best, d, i) => d.revenue > data[best].revenue ? i : best, 0)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}€`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(14, 149, 189, 0.06)' }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}
          formatter={(value, name) => [
            name === 'revenue' ? `${Number(value ?? 0).toFixed(2)}€` : value,
            name === 'revenue' ? 'Të ardhura' : 'Porosi',
          ]}
        />
        <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={48}>
          {data.map((entry, index) => (
            <Cell
              key={entry.month}
              fill={index === highlightIndex ? '#0e95bd' : entry.revenue === maxRevenue ? '#0e95bd' : '#b8e8f4'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
