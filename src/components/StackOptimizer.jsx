import React, { useState } from 'react';
import { Lightbulb, Sparkles, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { useAuth } from '../context/AuthContext';

const StackOptimizer = ({ supplements, onAddSupplement }) => {
    const { settings } = useSettings();
    const { token } = useAuth();
    const [recommendations, setRecommendations] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const [dismissed, setDismissed] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true);

    const activeSupplements = supplements.filter(s => !s.archived);

    const getRecommendations = async () => {
        setIsAnalyzing(true);
        setError(null);

        const stackList = activeSupplements.map(s => {
            const timing = [];
            if (s.schedule?.am) timing.push(`${s.schedule.amPills || 1} AM`);
            if (s.schedule?.pm) timing.push(`${s.schedule.pmPills || 1} PM`);
            return `${s.name} (${s.dosage}${timing.length ? ', ' + timing.join('/') : ''})`;
        }).join('\n- ');

        const prompt = `
            You are a supplement optimization expert. Analyze this supplement stack and suggest MISSING COFACTORS or complementary supplements that would enhance absorption, effectiveness, or address common deficiency pairings.

            CURRENT STACK:
            - ${stackList}

            For each recommendation, provide:
            1. name: The supplement name (generic, not brand)
            2. reason: A concise explanation of why it complements the existing stack (1-2 sentences)
            3. priority: "ESSENTIAL" (critical cofactor), "RECOMMENDED" (notable benefit), or "OPTIONAL" (nice-to-have)
            4. dosage_suggestion: A typical daily dosage range

            Rules:
            - Do NOT recommend supplements already in the stack
            - Focus on scientifically-backed synergies (e.g., Vitamin D + K2, Zinc + Copper, Iron + Vitamin C)
            - Maximum 5 suggestions, ordered by priority
            - Return a JSON object with key "recommendations" containing an array

            Example response format:
            {
                "recommendations": [
                    {
                        "name": "Vitamin K2 (MK-7)",
                        "reason": "Essential cofactor for Vitamin D3. Directs calcium to bones instead of arteries.",
                        "priority": "ESSENTIAL",
                        "dosage_suggestion": "100-200mcg daily"
                    }
                ]
            }
        `;

        try {
            const response = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ model: settings.aiModel, prompt })
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();
            const content = data.choices[0].message.content;
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanContent);
            setRecommendations(parsed.recommendations || []);

        } catch (err) {
            console.error(err);
            setError("Failed to get recommendations. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAddToStack = (rec) => {
        onAddSupplement({
            name: rec.name,
            dosage: rec.dosage_suggestion,
            reason: rec.reason,
            schedule: { am: true, pm: false, amPills: 1, pmPills: 1 },
            price: '',
            quantity: '',
            unitType: 'pills',
            link: '',
            aiAnalysis: '',
            recommendedDosage: rec.dosage_suggestion,
            sideEffects: '',
            rating: ''
        });
        // Remove from recommendations after adding
        setRecommendations(prev => prev.filter(r => r.name !== rec.name));
    };

    const handleDismiss = (name) => {
        setDismissed(prev => [...prev, name]);
    };

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'ESSENTIAL':
                return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
            case 'RECOMMENDED':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
            default:
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
        }
    };

    const getPriorityBadge = (priority) => {
        const baseStyles = "px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide";
        switch (priority) {
            case 'ESSENTIAL':
                return <span className={`${baseStyles} bg-red-500/20 text-red-600 dark:text-red-400`}>Essential</span>;
            case 'RECOMMENDED':
                return <span className={`${baseStyles} bg-amber-500/20 text-amber-600 dark:text-amber-400`}>Recommended</span>;
            default:
                return <span className={`${baseStyles} bg-blue-500/20 text-blue-600 dark:text-blue-400`}>Optional</span>;
        }
    };

    // Don't render if AI is disabled or no supplements
    if (!settings.aiEnabled || activeSupplements.length < 1) return null;

    const visibleRecommendations = recommendations?.filter(r => !dismissed.includes(r.name)) || [];

    return (
        <section className="mt-12 mb-12">
            <div
                className="flex items-center justify-between mb-6 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <Lightbulb size={24} className="text-amber-500" />
                    <h2 className="text-2xl font-bold tracking-tight">Stack Optimizer</h2>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">AI-Powered</span>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {isExpanded && (
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    {!recommendations && !isAnalyzing && (
                        <div className="text-center py-8">
                            <Lightbulb size={48} className="mx-auto text-amber-500/50 mb-4" />
                            <p className="text-muted-foreground mb-4">
                                Get AI-powered suggestions for cofactors and complementary supplements to optimize your stack.
                            </p>
                            <button
                                onClick={getRecommendations}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2"
                            >
                                <Sparkles size={16} className="mr-2" />
                                Get Recommendations
                            </button>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="text-center py-12">
                            <div className="animate-pulse">
                                <Sparkles size={48} className="mx-auto text-primary mb-4" />
                                <p className="text-muted-foreground">Analyzing your stack for optimization opportunities...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 mb-4">
                            {error}
                        </div>
                    )}

                    {recommendations && visibleRecommendations.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">
                                {dismissed.length > 0
                                    ? "All recommendations have been addressed or dismissed."
                                    : "Your stack looks well-optimized! No additional recommendations at this time."
                                }
                            </p>
                            <button
                                onClick={() => {
                                    setRecommendations(null);
                                    setDismissed([]);
                                }}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                            >
                                Refresh Analysis
                            </button>
                        </div>
                    )}

                    {visibleRecommendations.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                Based on your current stack, here are suggested additions:
                            </p>

                            {visibleRecommendations.map((rec, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-lg border ${getPriorityStyles(rec.priority)} transition-all hover:shadow-md`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-foreground">{rec.name}</h3>
                                                {getPriorityBadge(rec.priority)}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                                            <p className="text-xs font-medium">
                                                Suggested dosage: <span className="text-foreground">{rec.dosage_suggestion}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => handleAddToStack(rec)}
                                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
                                            >
                                                <Plus size={14} className="mr-1" />
                                                Add
                                            </button>
                                            <button
                                                onClick={() => handleDismiss(rec.name)}
                                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                title="Dismiss"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-between items-center pt-4 border-t mt-6">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Disclaimer:</strong> AI-generated suggestions. Consult a healthcare professional before making changes.
                                </p>
                                <button
                                    onClick={() => {
                                        setRecommendations(null);
                                        setDismissed([]);
                                    }}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default StackOptimizer;
