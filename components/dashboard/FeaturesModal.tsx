'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FiX,
    FiCheck,
    FiAlertCircle,
    FiAlertTriangle,
    FiChevronDown,
    FiChevronUp,
} from 'react-icons/fi'
import { fadeInOut, scaleIn } from '../../lib/motion'
import {
    getNetworkIconSrc,
    getNetworkShortLabel,
    NETWORK_IDS,
} from '../../lib/web3/config'
import { FEATURES_REGISTRY, type FeatureSupport } from '../../lib/web3/features'

interface FeaturesModalProps {
    isOpen: boolean
    onClose: () => void
}

function MobileFeatureCard({ feature }: { feature: FeatureSupport }) {
    const [isExpanded, setIsExpanded] = useState(false)

    const supportedNetworks = NETWORK_IDS.filter(
        (networkId) => feature.support[networkId].status !== 'unsupported'
    )

    return (
        <div className="rounded-xl border border-white/10 bg-zinc-950/20 overflow-hidden transition-all duration-200">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/2 cursor-pointer text-left gap-3 select-none"
            >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-sm font-semibold text-zinc-100 truncate">
                        {feature.name}
                    </span>
                    {!isExpanded && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-zinc-500 mr-0.5">Supported on:</span>
                            <div className="flex items-center gap-1">
                                {supportedNetworks.map((networkId) => (
                                    <img
                                        key={networkId}
                                        src={getNetworkIconSrc(networkId)}
                                        alt={getNetworkShortLabel(networkId)}
                                        className="w-4.5 h-4.5 object-contain rounded-sm"
                                        title={getNetworkShortLabel(networkId)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="text-zinc-500 hover:text-zinc-300 shrink-0">
                    {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </div>
            </button>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1 flex flex-col gap-3.5 border-t border-white/5 bg-zinc-950/10">
                            <p className="text-xs text-zinc-500 leading-normal">
                                {feature.description}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {NETWORK_IDS.map((networkId) => {
                                    const supportInfo = feature.support[networkId]
                                    return (
                                        <div
                                            key={networkId}
                                            className="flex items-center justify-between p-2.5 rounded-lg bg-white/2 border border-white/5"
                                        >
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={getNetworkIconSrc(networkId)}
                                                    alt=""
                                                    className="w-5 h-5 object-contain rounded-md"
                                                />
                                                <span className="text-[11px] font-medium text-zinc-300">
                                                    {getNetworkShortLabel(networkId)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {supportInfo.status === 'supported' && (
                                                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                                        <FiCheck size={10} />
                                                        {supportInfo.details}
                                                    </span>
                                                )}
                                                {supportInfo.status === 'partial' && (
                                                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium animate-pulse">
                                                        <FiAlertTriangle size={10} />
                                                        {supportInfo.details}
                                                    </span>
                                                )}
                                                {supportInfo.status === 'unsupported' && (
                                                    <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                                        <FiAlertCircle size={10} />
                                                        {supportInfo.details}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function FeaturesModal({ isOpen, onClose }: FeaturesModalProps) {
    const backdropRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [isOpen, onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={backdropRef}
                    variants={fadeInOut}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === backdropRef.current) onClose()
                    }}
                >
                    <motion.div
                        variants={scaleIn}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full max-w-4xl rounded-2xl bg-[#18181b] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#141416]/50">
                            <div>
                                <h2 className="text-lg font-semibold text-zinc-100">
                                    Network Capabilities Registry
                                </h2>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    Availability of features across supported blockchain networks.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                                aria-label="Close features"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        <div className="hidden md:block flex-1 overflow-x-auto p-6 bg-[#18181b]">
                            <div className="rounded-xl border border-white/10 overflow-hidden bg-zinc-950/20 min-w-[768px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/2">
                                            <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[240px]">
                                                Feature
                                            </th>
                                            {NETWORK_IDS.map((networkId) => (
                                                <th
                                                    key={networkId}
                                                    className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-center"
                                                >
                                                    <div className="flex flex-col items-center gap-1.5 justify-center">
                                                        <img
                                                            src={getNetworkIconSrc(networkId)}
                                                            alt={getNetworkShortLabel(networkId)}
                                                            className="w-6 h-6 object-contain rounded-md"
                                                        />
                                                        <div className="flex flex-col items-center">
                                                            {getNetworkShortLabel(networkId).split(' ').map((part, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="text-[11px] font-medium text-zinc-300 block leading-tight text-center"
                                                                >
                                                                    {part}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {FEATURES_REGISTRY.map((feature, idx) => (
                                            <tr
                                                key={idx}
                                                className="hover:bg-white/2 transition-colors"
                                            >
                                                <td className="p-4 align-top">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm font-medium text-zinc-200">
                                                            {feature.name}
                                                        </span>
                                                        <span className="text-xs text-zinc-500 leading-normal">
                                                            {feature.description}
                                                        </span>
                                                    </div>
                                                </td>
                                                {NETWORK_IDS.map((networkId) => {
                                                    const supportInfo = feature.support[networkId]
                                                    return (
                                                        <td
                                                            key={networkId}
                                                            className="p-4 text-center align-middle"
                                                        >
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                {supportInfo.status === 'supported' && (
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400">
                                                                        <FiCheck size={14} />
                                                                    </div>
                                                                )}
                                                                {supportInfo.status === 'partial' && (
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 animate-pulse">
                                                                        <FiAlertTriangle size={12} />
                                                                    </div>
                                                                )}
                                                                {supportInfo.status === 'unsupported' && (
                                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-400">
                                                                        <FiAlertCircle size={14} />
                                                                    </div>
                                                                )}
                                                                <span
                                                                    className={`text-[11px] font-medium whitespace-normal wrap-break-word text-center block max-w-[85px] mx-auto ${supportInfo.status === 'supported'
                                                                        ? 'text-zinc-300'
                                                                        : supportInfo.status === 'partial'
                                                                            ? 'text-amber-400/90'
                                                                            : 'text-zinc-500'
                                                                        }`}
                                                                >
                                                                    {supportInfo.details}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="block md:hidden flex-1 overflow-y-auto p-4 bg-[#18181b] space-y-3 max-h-[70vh]">
                            {FEATURES_REGISTRY.map((feature, idx) => (
                                <MobileFeatureCard key={idx} feature={feature} />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
