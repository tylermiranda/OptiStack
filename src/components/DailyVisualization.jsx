import React from 'react';
import { Sun, Moon, Clock } from 'lucide-react';

const DailyVisualization = ({ supplements }) => {
    // Filter stacks
    const morningStack = supplements.filter(s => s.schedule?.am);
    const nightStack = supplements.filter(s => s.schedule?.pm);

    const StackList = ({ items, icon: Icon, title, color }) => (
        <div className="flex-1 p-4 sm:p-6 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm" style={{ borderColor: `${color}30` }}>
            <div className="flex items-center gap-3 mb-4 sm:mb-6" style={{ color: color }}>
                <div className="p-2 rounded-xl" style={{ background: `${color}15` }}>
                    <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold m-0">{title}</h3>
            </div>

            <div className="flex flex-col gap-3">
                {items.length === 0 ? (
                    <p className="text-muted-foreground italic text-sm">Nothing scheduled.</p>
                ) : (
                    items.map(item => (
                        <div key={item.id}
                            className="flex justify-between items-start sm:items-center gap-3 p-3 bg-muted/20 rounded-lg border-l-4"
                            style={{ borderLeftColor: color }}
                        >
                            <span className="font-medium text-sm sm:text-base break-words flex-1">{item.name}</span>
                            {item.dosage && (
                                <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {item.dosage}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    // If no schedules set, show a placeholder instead of nothing
    if (morningStack.length === 0 && nightStack.length === 0) {
        return (
            <section style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Clock className="text-gradient" size={24} />
                    <h2 style={{ fontSize: '1.5rem' }}>Daily Protocol</h2>
                </div>
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        Assign <strong style={{ color: '#fb923c' }}>AM</strong> or <strong style={{ color: '#818cf8' }}>PM</strong> schedules to your supplements to see your daily timeline here.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
                <Clock className="text-primary" size={24} />
                <h2 className="text-2xl font-bold tracking-tight">Daily Protocol</h2>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <StackList
                    items={morningStack}
                    icon={Sun}
                    title="Morning Stack"
                    color="#fb923c"
                />
                <StackList
                    items={nightStack}
                    icon={Moon}
                    title="Night Stack"
                    color="#818cf8"
                />
            </div>
        </section>
    );
};

export default DailyVisualization;
