'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Plus, Clock, Link2, HelpCircle } from 'lucide-react'
import { createRevisit } from '@/actions/revisits'
import { useRevisitsStore } from '@/stores/revisits'
import { cn } from '@/lib/utils'

export function QuickCaptureModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { addRevisit } = useRevisitsStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const todayStr = new Date().toISOString().split('T')[0]
    const [formData, setFormData] = useState({
        title: '',
        type: 'tech',
        custom_type: '',
        resource_url: '',
        reason_to_return: '',
        estimated_time_min: '15',
        next_review_at: todayStr,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const form = new FormData()
        Object.entries(formData).forEach(([key, val]) => form.append(key, val))

        const result = await createRevisit(form)

        if (result.success && result.data) {
            addRevisit(result.data as any)
            onClose()
            setFormData({
                title: '',
                type: 'tech',
                custom_type: '',
                resource_url: '',
                reason_to_return: '',
                estimated_time_min: '15',
                next_review_at: new Date().toISOString().split('T')[0],
            })
        }

        setIsSubmitting(false)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
                    >
                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <Zap className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">Quick Capture</h2>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Add to your Return Stack</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                                        Learning Title
                                    </label>
                                    <input
                                        required
                                        autoFocus
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Prisma Migrations Deep Dive"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-5 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value, custom_type: '' })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-5 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="tech">Tech</option>
                                            <option value="leetcode">LeetCode</option>
                                            <option value="math">Math</option>
                                            <option value="book">Book</option>
                                            <option value="college">College</option>
                                            <option value="misc">Misc</option>
                                            <option value="custom">＋ Custom…</option>
                                        </select>
                                        {formData.type === 'custom' && (
                                            <input
                                                value={formData.custom_type}
                                                onChange={e => setFormData({ ...formData, custom_type: e.target.value })}
                                                placeholder="e.g. Interview Prep, OS Concepts…"
                                                className="w-full mt-2 bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-5 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                                            Estimated Time
                                        </label>
                                        <select
                                            value={formData.estimated_time_min}
                                            onChange={e => setFormData({ ...formData, estimated_time_min: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-5 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="5">5 mins</option>
                                            <option value="15">15 mins</option>
                                            <option value="30">30 mins</option>
                                            <option value="60">60 mins</option>
                                        </select>
                                    </div>
                                </div>

                                {/* First Review Date */}
                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                                        First Review Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        min={todayStr}
                                        value={formData.next_review_at}
                                        onChange={e => setFormData({ ...formData, next_review_at: e.target.value })}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-5 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        Reason to Return <span className="text-zinc-600 normal-case font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.reason_to_return}
                                        onChange={e => setFormData({ ...formData, reason_to_return: e.target.value })}
                                        placeholder="Why do you need to revisit this? (e.g. Memory of shadowing tables is fuzzy)"
                                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-5 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                                        Resource URL (Optional)
                                    </label>
                                    <div className="relative">
                                        <Link2 size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="url"
                                            value={formData.resource_url}
                                            onChange={e => setFormData({ ...formData, resource_url: e.target.value })}
                                            placeholder="https://..."
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl pl-12 pr-5 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] px-4 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Saving...' : (
                                        <>
                                            <Zap size={18} fill="white" />
                                            Add to Stack
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )
            }
        </AnimatePresence >
    )
}
