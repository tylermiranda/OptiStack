import React from 'react';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

const CostOverview = ({ supplements }) => {
    // Only active supplements
    const activeSupplements = supplements.filter(s => !s.archived);

    let dailyTotal = 0;

    activeSupplements.forEach(sup => {
        if (sup.price > 0 && sup.quantity > 0) {
            const pricePerPill = sup.price / sup.quantity;
            const dailyPills = (sup.schedule?.am ? (sup.schedule.amPills || 1) : 0) +
                (sup.schedule?.pm ? (sup.schedule.pmPills || 1) : 0);
            dailyTotal += pricePerPill * dailyPills;
        }
    });

    const monthlyTotal = dailyTotal * 30;
    const yearlyTotal = dailyTotal * 365;

    if (dailyTotal === 0) return null;

    return (
        <section className="mt-8 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400">
                    <DollarSign size={20} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Cost Analysis</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Daily Cost</p>
                        <p className="text-2xl font-bold tracking-tight">${dailyTotal.toFixed(2)}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                        <TrendingUp size={20} />
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Estimated Monthly</p>
                        <p className="text-2xl font-bold tracking-tight">${monthlyTotal.toFixed(2)}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                        <Calendar size={20} />
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Yearly Forecast</p>
                        <p className="text-2xl font-bold tracking-tight">${yearlyTotal.toFixed(2)}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                        <TrendingUp size={20} />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CostOverview;
