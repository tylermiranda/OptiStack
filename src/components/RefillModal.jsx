import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Sun, Moon, CheckCircle2, Circle } from 'lucide-react';
import { cn } from "@/lib/utils"

export function RefillModal({ open, onOpenChange, supplements }) {
    // Only active supplements
    const activeSupplements = supplements.filter(s => !s.archived);

    // Filter for AM and PM
    const amStack = activeSupplements.filter(s => s.schedule?.am);
    const pmStack = activeSupplements.filter(s => s.schedule?.pm);

    const [checkedItems, setCheckedItems] = useState({});

    const toggleCheck = (id, time) => {
        const key = `${id}-${time}`;
        setCheckedItems(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const SupplementList = ({ items, time, icon: Icon, colorClass, bgClass }) => (
        <div className={`rounded-xl border ${bgClass} p-4 sm:p-6`}>
            <div className={`flex items-center gap-2 mb-4 ${colorClass} font-bold text-lg`}>
                <Icon size={24} />
                <h3>{time === 'AM' ? 'Morning Slots' : 'Evening Slots'}</h3>
                <span className="ml-auto text-xs font-normal bg-background/50 px-2 py-1 rounded-full border">
                    {items.length} items
                </span>
            </div>

            <div className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-muted-foreground text-sm italic text-center py-4">No supplements for this time.</p>
                ) : (
                    items.map(sup => {
                        const isChecked = checkedItems[`${sup.id}-${time}`];
                        return (
                            <div
                                key={sup.id}
                                onClick={() => toggleCheck(sup.id, time)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border bg-background cursor-pointer transition-all duration-200 select-none",
                                    isChecked ? "opacity-40 grayscale" : "hover:shadow-sm hover:border-primary/30"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn("transition-colors", isChecked ? "text-muted-foreground" : colorClass)}>
                                        {isChecked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                    </div>
                                    <div>
                                        <p className={cn("font-medium leading-none", isChecked && "line-through")}>{sup.shortName || sup.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{sup.dosage}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={cn(
                                        "inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-md font-bold text-sm",
                                        isChecked ? "bg-muted text-muted-foreground" : "bg-secondary text-foreground"
                                    )}>
                                        {time === 'AM' ? (sup.schedule.amPills || 1) : (sup.schedule.pmPills || 1)}x
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Weekly Refill Assistant</DialogTitle>
                    <DialogDescription>
                        Use this guide to fill your pill organizer. Click items to check them off as you go.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <SupplementList
                        items={amStack}
                        time="AM"
                        icon={Sun}
                        colorClass="text-orange-500"
                        bgClass="bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/50"
                    />
                    <SupplementList
                        items={pmStack}
                        time="PM"
                        icon={Moon}
                        colorClass="text-indigo-500"
                        bgClass="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
