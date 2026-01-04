import React, { useState, useEffect } from 'react';
import { History, Trash2, ChevronDown, ChevronUp, CheckCircle, Sparkles, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useAuth } from '../context/AuthContext';

const AnalysisHistoryDialog = ({ open, onOpenChange }) => {
    const { token } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (open && token) {
            fetchHistory();
        }
    }, [open, token]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/ai/analysis-history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (error) {
            console.error('Failed to fetch analysis history:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteAnalysis = async (id) => {
        try {
            const response = await fetch(`/api/ai/analysis-history/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setHistory(history.filter(h => h.id !== id));
                if (expandedId === id) setExpandedId(null);
            }
        } catch (error) {
            console.error('Failed to delete analysis:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History size={20} />
                        Analysis History
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">
                        Loading history...
                    </div>
                ) : history.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        <History size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">No saved analyses yet</p>
                        <p className="text-sm mt-1">Analyses are automatically saved when you run them.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((analysis) => (
                            <div
                                key={analysis.id}
                                className="border rounded-lg bg-card overflow-hidden"
                            >
                                {/* Header - always visible */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => toggleExpand(analysis.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                                <Clock size={12} />
                                                {formatDate(analysis.created_at)}
                                            </div>
                                            <p className="text-sm text-foreground line-clamp-2">
                                                {analysis.summary}
                                            </p>
                                            {analysis.supplements_snapshot?.length > 0 && (
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {analysis.supplements_snapshot.length} supplements analyzed
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteAnalysis(analysis.id);
                                                }}
                                                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                aria-label="Delete analysis"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            {expandedId === analysis.id ? (
                                                <ChevronUp size={20} className="text-muted-foreground" />
                                            ) : (
                                                <ChevronDown size={20} className="text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {expandedId === analysis.id && (
                                    <div className="px-4 pb-4 pt-2 border-t bg-muted/30 animate-fade-in">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                            {/* Benefits */}
                                            {analysis.benefits?.length > 0 && (
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-green-600 font-semibold mb-3 text-sm">
                                                        <CheckCircle size={16} /> Expected Benefits
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {analysis.benefits.map((item, i) => (
                                                            <li key={i} className="flex gap-2 text-xs text-muted-foreground items-start">
                                                                <ArrowRight size={12} className="mt-0.5 text-border shrink-0" />
                                                                <span>{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Synergies */}
                                            {analysis.synergies?.length > 0 && (
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-primary font-semibold mb-3 text-sm">
                                                        <Sparkles size={16} /> Synergies
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {analysis.synergies.map((item, i) => (
                                                            <li key={i} className="flex gap-2 text-xs text-muted-foreground items-start">
                                                                <ArrowRight size={12} className="mt-0.5 text-border shrink-0" />
                                                                <span>{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Potential Risks */}
                                            {analysis.potential_risks?.length > 0 && (
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-destructive font-semibold mb-3 text-sm">
                                                        <AlertTriangle size={16} /> Things to Watch
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {analysis.potential_risks.map((item, i) => (
                                                            <li key={i} className="flex gap-2 text-xs text-muted-foreground items-start">
                                                                <ArrowRight size={12} className="mt-0.5 text-border shrink-0" />
                                                                <span>{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {/* Supplements snapshot */}
                                        {analysis.supplements_snapshot?.length > 0 && (
                                            <div className="mt-6 pt-4 border-t">
                                                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                                                    Supplements at time of analysis:
                                                </h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {analysis.supplements_snapshot.map((name, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
                                                        >
                                                            {name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AnalysisHistoryDialog;
