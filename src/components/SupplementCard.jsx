import React, { useState, useMemo } from 'react';
import { ExternalLink, Star, Tag, AlertTriangle, Sparkles, User, Beaker, Pencil, Sun, Moon, ChevronDown, ChevronUp, Trash2, Archive, ArchiveRestore, FlaskConical, CheckCircle2, Clock, Activity } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import { findSupplementResearch } from '../data/supplementResearch';

import { useSettings } from './SettingsContext';

const SupplementCard = ({ supplement, onDelete, onEdit, onArchive }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { wakeTime } = useSettings();

    // Lookup research data for this supplement
    const research = useMemo(() => {
        return findSupplementResearch(supplement.name);
    }, [supplement.name]);

    const timingInfo = useMemo(() => {
        if (supplement.timing?.type === 'relative_wake' && wakeTime) {
            const [wh, wm] = wakeTime.split(':').map(Number);
            const offset = supplement.timing.offsetMinutes || 0;
            const totalMinutes = (wh * 60) + wm + offset;

            const h = Math.floor(totalMinutes / 60) % 24;
            const m = totalMinutes % 60;
            const ampm = h >= 12 ? 'PM' : 'AM';
            const dh = h % 12 || 12;
            const dm = m < 10 ? `0${m}` : m;

            return {
                text: `${dh}:${dm} ${ampm}`,
                detail: offset === 0 ? 'Upon Waking' : `${Math.floor(offset / 60)}h ${offset % 60}m after wake`
            };
        }
        return null;
    }, [supplement.timing, wakeTime]);

    const cycleStatus = useMemo(() => {
        if (!supplement.cycle?.onDays || !supplement.cycle?.offDays || !supplement.cycle?.startDate) return null;

        const start = new Date(supplement.cycle.startDate);
        const now = new Date();
        const diffTime = now - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { isOn: true, daysRemaining: 0, dayInCycle: 1 }; // Future start date

        const cycleLength = supplement.cycle.onDays + supplement.cycle.offDays;
        const dayInCycle = diffDays % cycleLength;

        const isOn = dayInCycle < supplement.cycle.onDays;
        const daysRemaining = isOn
            ? supplement.cycle.onDays - dayInCycle
            : cycleLength - dayInCycle;

        return { isOn, daysRemaining, dayInCycle: dayInCycle + 1 };
    }, [supplement.cycle]);

    return (
        <div className={`rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md ${cycleStatus && !cycleStatus.isOn ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            {/* Header: Name, Price, Actions, Toggle */}
            <div
                className="flex flex-col xs:flex-row items-start xs:items-center justify-between p-4 sm:p-5 cursor-pointer gap-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-base sm:text-lg leading-tight tracking-tight">{supplement.name}</h3>
                    {cycleStatus && (
                        <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cycleStatus.isOn ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'}`}>
                            {cycleStatus.isOn ? (
                                <><Activity size={10} /> Day {cycleStatus.dayInCycle}</>
                            ) : (
                                <><Moon size={10} /> Paused ({cycleStatus.daysRemaining}d)</>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col gap-0.5 items-start">
                        <div className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] sm:text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground whitespace-nowrap">
                            <Tag size={10} className="mr-1 sm:size-[12px]" />
                            ${supplement.price}
                        </div>
                        {/* Cost Per Day Calculation */}
                        {supplement.price > 0 && supplement.quantity > 0 && (
                            <span className="text-[10px] text-muted-foreground font-medium ml-0.5">
                                ${((supplement.price / supplement.quantity) * ((supplement.schedule?.am ? (supplement.schedule.amPills || 1) : 0) + (supplement.schedule?.pm ? (supplement.schedule.pmPills || 1) : 0))).toFixed(2)} / day
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between xs:justify-end w-full xs:w-auto gap-3">
                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {onEdit && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(supplement.id); }}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary hover:bg-secondary"
                                    >
                                        <Pencil size={18} className="sm:size-[16px]" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Edit</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {onArchive && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onArchive(supplement.id); }}
                                        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 w-9 sm:h-8 sm:w-8 ${supplement.archived
                                            ? "text-muted-foreground hover:text-green-600 hover:bg-green-50"
                                            : "text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                                            }`}
                                    >
                                        {supplement.archived ? <ArchiveRestore size={18} className="sm:size-[16px]" /> : <Archive size={18} className="sm:size-[16px]" />}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{supplement.archived ? "Unarchive" : "Archive"}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {onDelete && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(supplement.id); }}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 size={18} className="sm:size-[16px]" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Delete</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    {/* Toggle Icon */}
                    <div className="text-muted-foreground px-1">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="px-5 pb-5 pt-0 animate-accordion-down">
                    <div className="h-px bg-border my-4" />

                    {/* Meta Row: Link, Dosage Badge, Schedule Badge, Rating */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <a
                                href={supplement.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline hover:text-primary/80"
                            >
                                View Product <ExternalLink size={12} />
                            </a>

                            {supplement.dosage && (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground bg-secondary">
                                    {supplement.dosage}
                                </span>
                            )}

                            {/* Schedule Badges */}
                            <div className="flex gap-2">
                                {supplement.schedule?.am && (
                                    <div className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                                        <Sun size={12} /> {supplement.schedule.amPills} {supplement.unitType === 'pills' ? 'pills' : supplement.unitType} AM
                                    </div>
                                )}
                                {supplement.schedule?.pm && (
                                    <div className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                        <Moon size={12} /> {supplement.schedule.pmPills} {supplement.unitType === 'pills' ? 'pills' : supplement.unitType} PM
                                    </div>
                                )}
                                {timingInfo && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-help inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-700/10">
                                                <Clock size={12} /> {timingInfo.text}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{timingInfo.detail}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={14}
                                    fill={i < supplement.rating ? "currentColor" : "transparent"}
                                    className={i < supplement.rating ? "text-amber-400" : "text-input"}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Cost Breakdown Section */}
                    {supplement.price > 0 && supplement.quantity > 0 && (
                        <div className="mb-6 grid grid-cols-3 gap-2 border rounded-lg p-3 bg-muted/20">
                            <div className="text-center">
                                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Daily</p>
                                <p className="font-semibold text-sm">
                                    ${((supplement.price / supplement.quantity) * ((supplement.schedule?.am ? (supplement.schedule.amPills || 1) : 0) + (supplement.schedule?.pm ? (supplement.schedule.pmPills || 1) : 0))).toFixed(2)}
                                </p>
                            </div>
                            <div className="text-center border-l border-border/50">
                                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Monthly</p>
                                <p className="font-semibold text-sm">
                                    ${(((supplement.price / supplement.quantity) * ((supplement.schedule?.am ? (supplement.schedule.amPills || 1) : 0) + (supplement.schedule?.pm ? (supplement.schedule.pmPills || 1) : 0))) * 30).toFixed(2)}
                                </p>
                            </div>
                            <div className="text-center border-l border-border/50">
                                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Yearly</p>
                                <p className="font-semibold text-sm">
                                    ${(((supplement.price / supplement.quantity) * ((supplement.schedule?.am ? (supplement.schedule.amPills || 1) : 0) + (supplement.schedule?.pm ? (supplement.schedule.pmPills || 1) : 0))) * 365).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Details: Taking For */}
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <User size={16} className="text-primary mt-1 shrink-0" />
                            <div>
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Taking For</span>
                                <p className="text-sm font-medium text-foreground mt-0.5">{supplement.reason}</p>
                            </div>
                        </div>

                        {/* AI Insight */}
                        {(supplement.aiAnalysis || supplement.recommendedDosage) && (
                            <div className="bg-muted/50 rounded-lg p-4 border border-muted">
                                <div className="flex gap-3">
                                    <Sparkles size={16} className="text-primary mt-1 shrink-0" />
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Insight</span>
                                        {supplement.aiAnalysis && (
                                            <p className="text-sm text-muted-foreground italic mt-1 leading-relaxed">"{supplement.aiAnalysis}"</p>
                                        )}
                                    </div>
                                </div>

                                {supplement.recommendedDosage && (
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-muted/60">
                                        <Beaker size={14} className="text-primary" />
                                        <span className="text-xs text-muted-foreground">
                                            Rec. Dosage: <span className="font-medium text-foreground">{supplement.recommendedDosage}</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Side Effects */}
                    {supplement.sideEffects && (
                        <div className="mt-4 rounded-md bg-destructive/10 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-destructive mb-1">
                                <AlertTriangle size={14} />
                                <span>Side Effects</span>
                            </div>
                            <p className="text-sm text-destructive/90">{supplement.sideEffects}</p>
                        </div>
                    )}

                    {/* Bioavailability Tips - from research data */}
                    {research?.bioavailability && (
                        <div className="mt-4 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">
                                <FlaskConical size={14} />
                                <span>Absorption Tips</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                {research.bioavailability.takeWith?.length > 0 && (
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 size={14} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                                        <p className="text-green-700 dark:text-green-300">
                                            <span className="font-medium">Take with:</span> {research.bioavailability.takeWith.join(", ")}
                                        </p>
                                    </div>
                                )}
                                {research.bioavailability.avoidWith?.length > 0 && (
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                        <p className="text-amber-700 dark:text-amber-300">
                                            <span className="font-medium">Avoid with:</span> {research.bioavailability.avoidWith.join(", ")}
                                        </p>
                                    </div>
                                )}
                                {research.bioavailability.withFood && (
                                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-2">
                                        💡 {research.bioavailability.withFood}
                                    </p>
                                )}
                            </div>
                            {research.researchLinks?.[0] && (
                                <a
                                    href={research.researchLinks[0].url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-3"
                                >
                                    View Research on {research.researchLinks[0].title} <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default SupplementCard;
