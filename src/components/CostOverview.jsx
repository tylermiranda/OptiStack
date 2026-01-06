import React from 'react';
import { DollarSign, TrendingUp, Calendar, Award, Zap, CreditCard, BarChart3 } from 'lucide-react';

const CostOverview = ({ supplements }) => {
    // Only active supplements
    const activeSupplements = supplements.filter(s => !s.archived);

    let dailyTotal = 0;
    const supplementStats = activeSupplements.map(sup => {
        if (sup.price > 0 && sup.quantity > 0) {
            const pricePerPill = sup.price / sup.quantity;
            const dailyPills = (sup.schedule?.am ? (sup.schedule.amPills || 1) : 0) +
                (sup.schedule?.pm ? (sup.schedule.pmPills || 1) : 0);
            const dailyCost = pricePerPill * dailyPills;

            // Value score: rating / daily cost (higher is better)
            // Normalized to handle 0 ratings or costs
            const valueScore = sup.rating > 0 ? sup.rating / dailyCost : 0;

            return {
                ...sup,
                dailyCost,
                valueScore,
                pricePerPill
            };
        }
        return { ...sup, dailyCost: 0, valueScore: 0, pricePerPill: 0 };
    });

    dailyTotal = supplementStats.reduce((acc, s) => acc + s.dailyCost, 0);
    const monthlyTotal = dailyTotal * 30;
    const yearlyTotal = dailyTotal * 365;
    const totalStockValue = activeSupplements.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);

    // Filter for supplements with valid cost data for comparisons
    const validStats = supplementStats.filter(s => s.dailyCost > 0);

    // Insights
    const mostExpensive = validStats.length > 0
        ? [...validStats].sort((a, b) => b.dailyCost - a.dailyCost)[0]
        : null;

    const bestValue = validStats.length > 0 && validStats.some(s => s.rating > 0)
        ? [...validStats].filter(s => s.rating > 0).sort((a, b) => b.valueScore - a.valueScore)[0]
        : null;

    const leastExpensive = validStats.length > 0
        ? [...validStats].sort((a, b) => a.dailyCost - b.dailyCost)[0]
        : null;

    if (dailyTotal === 0) return null;

    return (
        <section className="mt-8 mb-12">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400">
                    <DollarSign size={20} />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Cost Analysis</h2>
            </div>

            {/* Core Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Daily Burn</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-bold tracking-tight">${dailyTotal.toFixed(2)}</p>
                        <span className="text-xs text-muted-foreground">/ day</span>
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Run Rate</p>
                    <p className="text-2xl font-bold tracking-tight">${monthlyTotal.toFixed(2)}</p>
                </div>

                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Yearly Forecast</p>
                    <p className="text-2xl font-bold tracking-tight">${yearlyTotal.toFixed(2)}</p>
                </div>

                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Stock Value</p>
                    <p className="text-2xl font-bold tracking-tight">${totalStockValue.toFixed(2)}</p>
                </div>
            </div>

            {/* AI-Style Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mostExpensive && (
                    <div className="flex items-start gap-4 p-4 rounded-xl border bg-orange-50/30 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/30">
                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/40 rounded-full text-orange-600 dark:text-orange-400 mt-0.5">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">Top Spender</p>
                            <h3 className="font-bold text-base mb-1">{mostExpensive.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                This supplement costs you <span className="font-semibold text-foreground">${mostExpensive.dailyCost.toFixed(2)}</span> per day,
                                making it <span className="font-semibold text-foreground">{((mostExpensive.dailyCost / dailyTotal) * 100).toFixed(0)}%</span> of your daily budget.
                            </p>
                        </div>
                    </div>
                )}

                {bestValue && (
                    <div className="flex items-start gap-4 p-4 rounded-xl border bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-emerald-600 dark:text-emerald-400 mt-0.5">
                            <Award size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Best Bang for Buck</p>
                            <h3 className="font-bold text-base mb-1">{bestValue.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                High efficiency with a {bestValue.rating}-star rating at only <span className="font-semibold text-foreground">${bestValue.dailyCost.toFixed(2)}/day</span>.
                                This is your most cost-effective performance booster.
                            </p>
                        </div>
                    </div>
                )}

                {leastExpensive && leastExpensive.id !== mostExpensive?.id && (
                    <div className="flex items-start gap-4 p-4 rounded-xl border bg-blue-50/30 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400 mt-0.5">
                            <Zap size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Most Affordable</p>
                            <h3 className="font-bold text-base mb-1">{leastExpensive.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                At just <span className="font-semibold text-foreground">${leastExpensive.dailyCost.toFixed(2)}</span> per day,
                                this is a highly sustainable part of your routine.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-start gap-4 p-4 rounded-xl border bg-purple-50/30 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/30">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-full text-purple-600 dark:text-purple-400 mt-0.5">
                        <BarChart3 size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">Budget Optimization</p>
                        <h3 className="font-bold text-base mb-1">Efficiency Metrics</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your average cost per supplement is <span className="font-semibold text-foreground">${(dailyTotal / (activeSupplements.length || 1)).toFixed(2)}</span>.
                            {dailyTotal > 5 ? " Consider reviewing your top 3 expenses for high-dose alternatives." : " Your stack is highly cost-optimized."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Cost by Goal Breakdown */}
            <div className="mt-6 bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Investment by Health Goal</h3>
                <div className="space-y-4">
                    {(() => {
                        const goals = {};
                        supplementStats.forEach(s => {
                            const reason = s.reason?.trim() || 'General Health';
                            goals[reason] = (goals[reason] || 0) + s.dailyCost;
                        });

                        return Object.entries(goals)
                            .sort((a, b) => b[1] - a[1])
                            .map(([goal, cost]) => {
                                const percentage = (cost / dailyTotal) * 100;
                                return (
                                    <div key={goal} className="space-y-1.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium truncate max-w-[200px] sm:max-w-xs">{goal}</span>
                                            <span className="text-muted-foreground font-medium">${cost.toFixed(2)} / day ({percentage.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            });
                    })()}
                </div>
            </div>
        </section>
    );
};

export default CostOverview;
