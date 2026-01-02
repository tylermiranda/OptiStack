import React from 'react';
import { Sun, Moon, Clock } from 'lucide-react';

const DailyVisualization = ({ supplements }) => {
    // Filter stacks
    const morningStack = supplements.filter(s => s.schedule?.am);
    const nightStack = supplements.filter(s => s.schedule?.pm);

    const StackList = ({ items, icon: Icon, title, color }) => (
        <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', border: `1px solid ${color}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: color }}>
                <div style={{ padding: '0.5rem', borderRadius: '12px', background: `${color}15` }}>
                    <Icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{title}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {items.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nothing scheduled.</p>
                ) : (
                    items.map(item => (
                        <div key={item.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${color}`
                        }}>
                            <span style={{ fontWeight: 500 }}>{item.name}</span>
                            {item.dosage && (
                                <span style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '2px 8px',
                                    borderRadius: '12px'
                                }}>
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
        <section style={{ marginTop: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Clock className="text-gradient" size={24} />
                <h2 style={{ fontSize: '1.5rem' }}>Daily Protocol</h2>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexDirection: 'row', flexWrap: 'wrap' }}>
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
