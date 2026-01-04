import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Zap, Clock, TrendingUp, RefreshCw, Server, Cloud } from 'lucide-react';

export function AICostDisplay() {
    const { token } = useAuth();
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsage = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ai/usage', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch usage');
            const data = await res.json();
            setUsage(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchUsage();
        }
    }, [token]);

    const formatCost = (cost) => {
        if (cost === 0) return '$0.00';
        if (cost < 0.01) return '<$0.01';
        return `$${cost.toFixed(4)}`;
    };

    const formatTokens = (tokens) => {
        if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
        if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
        return tokens.toString();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <RefreshCw className="animate-spin text-muted-foreground" size={24} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                Failed to load usage data: {error}
            </div>
        );
    }

    if (!usage) return null;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                {/* Today */}
                <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Clock size={12} />
                        Today
                    </div>
                    <p className="text-2xl font-bold">{formatCost(usage.today?.cost || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                        {usage.today?.requests || 0} requests · {formatTokens(usage.today?.tokens || 0)} tokens
                    </p>
                </div>

                {/* This Month */}
                <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <TrendingUp size={12} />
                        This Month
                    </div>
                    <p className="text-2xl font-bold">{formatCost(usage.thisMonth?.cost || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                        {usage.thisMonth?.requests || 0} requests · {formatTokens(usage.thisMonth?.tokens || 0)} tokens
                    </p>
                </div>

                {/* All Time */}
                <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Zap size={12} />
                        All Time
                    </div>
                    <p className="text-2xl font-bold">{formatCost(usage.total?.cost || 0)}</p>
                    <p className="text-xs text-muted-foreground">
                        {usage.total?.requests || 0} requests · {formatTokens(usage.total?.tokens || 0)} tokens
                    </p>
                </div>
            </div>

            {/* Cost by Model */}
            <div>
                <h3 className="text-sm font-medium mb-3">Cost by Model</h3>
                <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">Model</th>
                                    <th className="px-3 py-2 text-right font-medium">Requests</th>
                                    <th className="px-3 py-2 text-right font-medium">Tokens</th>
                                    <th className="px-3 py-2 text-right font-medium">Est. Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {usage.usageByModel && usage.usageByModel.length > 0 ? (
                                    usage.usageByModel.map((item, index) => (
                                        <tr key={index} className="bg-card hover:bg-muted/50 transition-colors">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                        {item.provider === 'ollama' ? (
                                                            <Server size={10} className="text-green-500" />
                                                        ) : (
                                                            <Cloud size={10} className="text-blue-500" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]" title={item.model}>
                                                        {item.model || 'Unknown model'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right text-muted-foreground">{item.requests}</td>
                                            <td className="px-3 py-2 text-right text-muted-foreground">{formatTokens(item.tokens)}</td>
                                            <td className="px-3 py-2 text-right font-medium">
                                                {item.cost === 0 ? <span className="text-green-500">Free</span> : formatCost(item.cost)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground text-xs">
                                            No usage data recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Recent Requests */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Recent Requests</h3>
                    <button
                        onClick={fetchUsage}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                        <RefreshCw size={12} />
                        Refresh
                    </button>
                </div>

                {usage.recentRequests?.length === 0 ? (
                    <div className="p-6 rounded-lg border bg-muted/30 text-center text-sm text-muted-foreground">
                        No AI requests yet. Use Stack Analysis or AI Chat to get started.
                    </div>
                ) : (
                    <div className="rounded-lg border divide-y overflow-hidden">
                        {usage.recentRequests?.map((req) => (
                            <div key={req.id} className="p-3 text-sm flex items-center justify-between bg-card hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                        {req.provider === 'ollama' ? (
                                            <Server size={12} className="text-green-500" />
                                        ) : (
                                            <Cloud size={12} className="text-blue-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-xs">
                                            {req.model || 'Unknown model'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {req.request_type} · {formatTokens(req.total_tokens || 0)} tokens
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-medium text-xs ${req.cost_usd === 0 ? 'text-green-500' : ''}`}>
                                        {req.cost_usd === 0 ? 'Free' : formatCost(req.cost_usd)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Note */}
            <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                    <DollarSign size={14} />
                    <span>
                        <strong>Cost tracking:</strong> OpenRouter requests show actual API costs.
                        Ollama (local) requests are always free.
                    </span>
                </p>
            </div>
        </div>
    );
}
