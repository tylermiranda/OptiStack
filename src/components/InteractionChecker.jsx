import React, { useState } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle, Search, Plus, X, Stethoscope, AlertOctagon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"

export function InteractionChecker({ open, onOpenChange, supplements }) {
    const { settings } = useSettings();
    const { token } = useAuth();

    // State for hypothetical supplements
    const [hypotheticals, setHypotheticals] = useState([]);
    const [newItem, setNewItem] = useState('');

    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const activeSupplements = supplements.filter(s => !s.archived);

    const addHypothetical = (e) => {
        e.preventDefault();
        if (newItem.trim()) {
            setHypotheticals([...hypotheticals, newItem.trim()]);
            setNewItem('');
            // Clear previous results as stack changed
            setResult(null);
        }
    };

    const removeHypothetical = (index) => {
        const newList = [...hypotheticals];
        newList.splice(index, 1);
        setHypotheticals(newList);
        setResult(null);
    };

    const checkInteractions = async () => {
        setIsAnalyzing(true);
        setError(null);
        setResult(null);

        const currentStackNames = activeSupplements.map(s => s.name);
        // Combine current stack with hypotheticals
        const fullStack = [...currentStackNames, ...hypotheticals];

        if (fullStack.length < 2) {
            setError("Need at least 2 supplements to check for interactions.");
            setIsAnalyzing(false);
            return;
        }

        const prompt = `
            Analyze this supplement stack strictly for NEGATIVE INTERACTIONS and SAFETY WARNINGS.
            
            STACK: 
            ${fullStack.join(', ')}

            Provide the response in JSON format with the following keys:
            - "interactions": Array of objects, each with:
                - "severity": "HIGH", "MODERATE", or "LOW"
                - "substances": Array of strings (the distinct supplements involved)
                - "description": Short description of the interaction risk.
            - "summary": A brief safety summary.
            
            If there are no known interactions, return an empty array for interactions.
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
            setResult(parsed);

        } catch (err) {
            console.error(err);
            setError("Failed to check interactions. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'HIGH': return 'bg-destructive/15 text-destructive border-destructive/50';
            case 'MODERATE': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/50';
            default: return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/50';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'HIGH': return <AlertOctagon className="h-5 w-5" />;
            case 'MODERATE': return <AlertTriangle className="h-5 w-5" />;
            default: return <Stethoscope className="h-5 w-5" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Stethoscope className="text-primary" /> Stack Interaction Checker
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Active Stack Display */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Active Stack</h3>
                        <div className="flex flex-wrap gap-2">
                            {activeSupplements.length === 0 ? (
                                <span className="text-sm italic text-muted-foreground">No active supplements.</span>
                            ) : (
                                activeSupplements.map(s => (
                                    <span key={s.id} className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border">
                                        {s.name}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Hypothetical Input */}
                    <div className="bg-muted/30 p-4 rounded-lg border">
                        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Search className="h-4 w-4" /> Check Potential Additions
                        </h3>
                        <form onSubmit={addHypothetical} className="flex gap-2">
                            <input
                                value={newItem}
                                onChange={e => setNewItem(e.target.value)}
                                placeholder="e.g. Warfarin, Aspirin..."
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!newItem.trim()}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 w-9 shrink-0"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </form>

                        {hypotheticals.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {hypotheticals.map((item, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800">
                                        {item}
                                        <button onClick={() => removeHypothetical(i)} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action */}
                    <button
                        onClick={checkInteractions}
                        disabled={isAnalyzing}
                        className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        {isAnalyzing ? (
                            <>Analyzing Safety...</>
                        ) : (
                            <>Analyze For Interactions</>
                        )}
                    </button>

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="rounded-lg border bg-card p-4">
                                <h4 className="font-semibold mb-2">Summary</h4>
                                <p className="text-sm text-muted-foreground">{result.summary}</p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Identified Interactions</h4>

                                {result.interactions.length === 0 ? (
                                    <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                                        <CheckCircle className="h-5 w-5 shrink-0" />
                                        <div>
                                            <p className="font-medium">No Warning Flags Found</p>
                                            <p className="text-xs opacity-90">The AI did not identify clear negative interactions in this specific combination.</p>
                                        </div>
                                    </div>
                                ) : (
                                    result.interactions.map((interaction, idx) => (
                                        <div key={idx} className={`p-4 rounded-lg border ${getSeverityColor(interaction.severity)}`}>
                                            <div className="flex items-start gap-3">
                                                <div className="shrink-0 mt-0.5">
                                                    {getSeverityIcon(interaction.severity)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-sm tracking-wide">{interaction.severity} RISK</span>
                                                        <span className="text-xs opacity-75">• {interaction.substances.join(' + ')}</span>
                                                    </div>
                                                    <p className="text-sm font-medium opacity-95">{interaction.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <p className="text-xs text-center text-muted-foreground mt-6">
                                <strong>Disclaimer:</strong> This is an AI-generated analysis and not medical advice.
                                Always consult a healthcare professional before combining supplements, especially if you are taking medication.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
