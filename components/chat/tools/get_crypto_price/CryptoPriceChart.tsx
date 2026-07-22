'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, AreaSeries, type UTCTimestamp } from 'lightweight-charts'
import { CryptoChartPoint } from '@/types'

interface CryptoPriceChartProps {
    data: CryptoChartPoint[]
    isPositive: boolean
}

export default function CryptoPriceChart({ data, isPositive }: CryptoPriceChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return

        const container = chartContainerRef.current

        const chart = createChart(container, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
                fontSize: 10,
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
            },
            width: container.clientWidth,
            height: 140,
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                vertLine: { color: 'rgba(255, 255, 255, 0.2)', width: 1, style: 3 },
                horzLine: { color: 'rgba(255, 255, 255, 0.2)', width: 1, style: 3 },
            },
            handleScroll: false,
            handleScale: false,
        })

        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: isPositive ? '#10b981' : '#f43f5e',
            topColor: isPositive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
            bottomColor: isPositive ? 'rgba(16, 185, 129, 0.0)' : 'rgba(244, 63, 94, 0.0)',
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
        })

        const formattedData = data.map(pt => ({
            time: pt.time as UTCTimestamp,
            value: pt.value,
        }))

        areaSeries.setData(formattedData)
        chart.timeScale().fitContent()

        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length > 0 && container) {
                const { width } = entries[0].contentRect
                if (width > 0) {
                    chart.applyOptions({ width })
                }
            }
        })

        resizeObserver.observe(container)

        return () => {
            resizeObserver.disconnect()
            chart.remove()
        }
    }, [data, isPositive])

    return (
        <div className="w-full mt-3 pt-3 border-t border-white/5">
            <div className="flex justify-between items-center text-[11px] text-neutral-400 mb-1 px-1">
                <span>7-Day Price Trend</span>
                <span className="font-mono text-neutral-500">USD</span>
            </div>
            <div ref={chartContainerRef} className="w-full h-35 relative" />
        </div>
    )
}
