import React, { useState } from 'react';
import { useSettings } from './SettingsContext';
import { DEFAULT_PROMPTS, PROMPT_DESCRIPTIONS } from '../data/aiPrompts';
import { RefreshCw, Save, Code, AlertTriangle } from 'lucide-react';
import { Label } from "./ui/label";

const AIPromptManager = () => {
    const { settings, updateSettings } = useSettings();
    const [editingPrompts, setEditingPrompts] = useState(settings.prompts || DEFAULT_PROMPTS);
    const [isDirty, setIsDirty] = useState(false);
    const [activeSection, setActiveSection] = useState('individual_analysis');

    const handlePromptChange = (key, value) => {
        setEditingPrompts(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleSave = () => {
        updateSettings({ prompts: editingPrompts });
        setIsDirty(false);
    };

    const handleReset = (key) => {
        if (window.confirm("Reset this prompt to default?")) {
            setEditingPrompts(prev => ({ ...prev, [key]: DEFAULT_PROMPTS[key] }));
            setIsDirty(true);
        }
    };

    const promptKeys = Object.keys(DEFAULT_PROMPTS);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Code className="h-5 w-5" /> AI Prompts
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Customize the exact instructions sent to the AI for each feature.
                    </p>
                </div>
                {isDirty && (
                    <button
                        onClick={handleSave}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        <Save className="h-4 w-4 mr-2" /> Save Changes
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="md:col-span-1 space-y-1">
                    {promptKeys.map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveSection(key)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === key
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted text-muted-foreground'
                                }`}
                        >
                            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>

                {/* Editor */}
                <div className="md:col-span-3 space-y-4">
                    <div className="p-4 border rounded-lg bg-card">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-semibold text-lg capitalize">
                                    {activeSection.split('_').join(' ')}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {PROMPT_DESCRIPTIONS[activeSection]}
                                </p>
                            </div>
                            <button
                                onClick={() => handleReset(activeSection)}
                                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                title="Reset to default"
                            >
                                <RefreshCw className="h-3 w-3" /> Reset
                            </button>
                        </div>

                        <Label className="sr-only">Prompt Template</Label>
                        <textarea
                            value={editingPrompts[activeSection]}
                            onChange={(e) => handlePromptChange(activeSection, e.target.value)}
                            className="w-full h-[400px] font-mono text-xs p-4 rounded-md border bg-muted/30 focus:bg-background transition-colors resize-none leading-relaxed"
                            spellCheck="false"
                        />

                        <div className="mt-4 flex gap-2 p-3 bg-amber-50/50 border border-amber-100 rounded-md text-amber-800 dark:bg-amber-900/10 dark:text-amber-200 dark:border-amber-800 text-xs">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <p>
                                <strong>Caution:</strong> The AI relies on specific JSON structures requested in these prompts.
                                If you modify the JSON schema request, the application may fail to parse the response.
                                Keep the JSON structure instructions intact.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIPromptManager;
