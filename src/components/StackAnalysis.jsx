import React, { useState } from 'react';
import { Brain, Sparkles, AlertTriangle, CheckCircle, ArrowRight, History } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { useAuth } from '../context/AuthContext';
import AnalysisHistoryDialog from './AnalysisHistoryDialog';

const StackAnalysis = ({ supplements }) => {
    const { settings } = useSettings();
    const { token } = useAuth();
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const saveAnalysis = async (analysisResult) => {
        try {
            const supplementNames = supplements.map(s => s.name);
            await fetch('/api/ai/analysis-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    summary: analysisResult.summary,
                    benefits: analysisResult.benefits,
                    synergies: analysisResult.synergies,
                    potential_risks: analysisResult.potential_risks,
                    supplements: supplementNames
                })
            });
        } catch (err) {
            console.error('Failed to save analysis to history:', err);
        }
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);

        // Prepare data for AI
        const morningStack = supplements.filter(s => s.schedule?.am).map(s => `${s.name} (${s.schedule.amPills || 1} pills)`);
        const nightStack = supplements.filter(s => s.schedule?.pm).map(s => `${s.name} (${s.schedule.pmPills || 1} pills)`);
        const otherStack = supplements.filter(s => !s.schedule?.am && !s.schedule?.pm).map(s => s.name);

        const prompt = `
            Analyze this daily supplement protocol:
            
            MORNING PROTOCOL:
            ${morningStack.length > 0 ? morningStack.join(', ') : 'None'}
            
            NIGHT PROTOCOL:
            ${nightStack.length > 0 ? nightStack.join(', ') : 'None'}
            
            OTHER SUPPLEMENTS (No specific time):
            ${otherStack.length > 0 ? otherStack.join(', ') : 'None'}
            
            Please provide a comprehensive analysis in JSON format with the following keys:
            - "benefits": (Array of strings) Key expected health benefits of this specific combination.
            - "synergies": (Array of strings) How these specific supplements work well together (e.g. Vit D and Magnesium).
            - "potential_risks": (Array of strings) Negative interactions or timing issues (e.g. taking energizing things at night).
            - "summary": (String) A 2-3 sentence overall assessment of this stack's goal and effectiveness.
        `;

        const model = settings.aiModel;

        try {
            const response = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ model, prompt, format: 'json' })
            });

            if (!response.ok) {
                throw new Error("Analysis failed");
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Robust JSON extraction
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');

            let result;
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonString = content.substring(jsonStart, jsonEnd + 1);
                result = JSON.parse(jsonString);
            } else {
                // Fallback to original cleanup just in case
                const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
                result = JSON.parse(cleanContent);
            }
            setAnalysis(result);

            // Auto-save the analysis
            await saveAnalysis(result);

        } catch (err) {
            console.error(err);
            setError("Failed to generate analysis. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (supplements.length === 0 || !settings.aiEnabled) return null;

    return (
        <section className="mt-12 mb-12">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Brain size={24} className="text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">AI Stack Analysis</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                        <History size={16} className="mr-2" />
                        History
                    </button>
                    {!analysis && (
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                        >
                            <Sparkles size={16} className="mr-2" />
                            {isAnalyzing ? 'Analyzing Protocol...' : 'Analyze Full Stack'}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 mb-6">
                    {error}
                </div>
            )}

            {analysis && (
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8 animate-fade-in">
                    <p className="text-lg leading-relaxed mb-8 text-foreground italic border-l-4 border-primary pl-4">
                        "{analysis.summary}"
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="flex items-center gap-2 text-green-600 font-semibold mb-4">
                                <CheckCircle size={20} /> Expected Benefits
                            </h3>
                            <ul className="space-y-2">
                                {analysis.benefits?.map((item, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-muted-foreground items-start">
                                        <ArrowRight size={16} className="mt-0.5 text-border shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="flex items-center gap-2 text-primary font-semibold mb-4">
                                <Sparkles size={20} /> Synergies
                            </h3>
                            <ul className="space-y-2">
                                {analysis.synergies?.map((item, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-muted-foreground items-start">
                                        <ArrowRight size={16} className="mt-0.5 text-border shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {analysis.potential_risks && analysis.potential_risks.length > 0 && (
                            <div>
                                <h3 className="flex items-center gap-2 text-destructive font-semibold mb-4">
                                    <AlertTriangle size={20} /> Things to Watch
                                </h3>
                                <ul className="space-y-2">
                                    {analysis.potential_risks.map((item, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-muted-foreground items-start">
                                            <ArrowRight size={16} className="mt-0.5 text-border shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setAnalysis(null)}
                        className="mt-8 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                    >
                        Close Analysis
                    </button>
                </div>
            )}

            <AnalysisHistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} />
        </section>
    );
};

export default StackAnalysis;
