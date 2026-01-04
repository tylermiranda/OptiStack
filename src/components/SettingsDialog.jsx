import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Bot, AlertTriangle, Info, Cloud, Server, CheckCircle2, XCircle, Loader2, RefreshCw, Settings, Shield, DollarSign, Ban, Activity, Clock } from 'lucide-react';

// Lazy load AdminDashboard to avoid bloating the bundle for non-admins
const AdminDashboard = lazy(() => import('./AdminDashboard'));
// Lazy load AICostDisplay to keep initial bundle small
const AICostDisplay = lazy(() => import('./AICostDisplay').then(m => ({ default: m.AICostDisplay })));

export function SettingsDialog({ open, onOpenChange }) {
    const { settings, aiStatus, updateSettings, availableModels, refreshAIStatus, wakeTime, updateWakeTime } = useSettings();
    const { token, user } = useAuth();

    const [aiConfig, setAiConfig] = useState({
        provider: 'openrouter',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.1:8b',
        openRouterKey: '',
        hasOpenRouterKey: false
    });
    const [initialConfig, setInitialConfig] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [testingOllama, setTestingOllama] = useState(false);
    const [ollamaTestResult, setOllamaTestResult] = useState(null);
    const [ollamaModels, setOllamaModels] = useState([]);
    const [testingOpenRouter, setTestingOpenRouter] = useState(false);
    const [openRouterTestResult, setOpenRouterTestResult] = useState(null);
    const [openRouterValidated, setOpenRouterValidated] = useState(false);
    const [openRouterModels, setOpenRouterModels] = useState([]);
    const [activeTab, setActiveTab] = useState("general");
    // Popular cheap models for cost‑conscious usage
    const popularModels = [
        // OpenRouter identifiers (example list – adjust as needed)
        "meta-llama/Meta-Llama-3-8B-Instruct",
        "google/gemma-2b",
        "mistralai/mistral-7b-instruct",
        "openai/gpt-3.5-turbo",
        "openai/gpt-4o-mini"
    ];

    const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    const buttonClassName = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    // Fetch AI settings on open
    useEffect(() => {
        if (open && token) {
            fetch('/api/ai/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    const config = {
                        provider: data.provider || 'openrouter',
                        ollamaUrl: data.ollamaUrl || 'http://localhost:11434',
                        ollamaModel: data.ollamaModel || 'llama3.1:8b',
                        defaultModel: data.defaultModel,
                        openRouterKey: '',
                        hasOpenRouterKey: data.hasOpenRouterKey
                    };
                    setAiConfig(config);
                    setInitialConfig(config);
                    setSaved(false);
                    // If OpenRouter key is already configured, mark as validated
                    if (data.hasOpenRouterKey && data.provider === 'openrouter') {
                        setOpenRouterValidated(true);
                    }
                })
                .catch(console.error);
        }
    }, [open, token]);

    const testOllamaConnection = async () => {
        setTestingOllama(true);
        setOllamaTestResult(null);

        try {
            const res = await fetch('/api/ai/test-ollama', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ url: aiConfig.ollamaUrl })
            });
            const data = await res.json();
            setOllamaTestResult(data);
            if (data.models) {
                setOllamaModels(data.models);
            }
        } catch (error) {
            setOllamaTestResult({ success: false, message: 'Connection test failed' });
        } finally {
            setTestingOllama(false);
        }
    };

    const testOpenRouterConnection = async () => {
        const keyToTest = aiConfig.openRouterKey;
        if (!keyToTest) {
            setOpenRouterTestResult({ success: false, message: 'Please enter an API key' });
            return;
        }

        setTestingOpenRouter(true);
        setOpenRouterTestResult(null);

        try {
            const res = await fetch('/api/ai/test-openrouter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ apiKey: keyToTest })
            });

            const data = await res.json();
            setOpenRouterTestResult(data);
            if (data.success) {
                setOpenRouterValidated(true);
                if (data.models && data.models.length > 0) {
                    setOpenRouterModels(data.models);

                    // Default to Gemini Flash 2.0 if not already set or invalid
                    const defaultModelId = "google/gemini-2.0-flash-exp:free"; // Or similar ID
                    // Check if current generic default needs update or if user hasn't selected one
                    if (!settings.aiModel || !data.models.find(m => m.id === settings.aiModel)) {
                        const gemini = data.models.find(m => m.id.includes("gemini-2.0-flash"));
                        if (gemini) {
                            updateSettings({ aiModel: gemini.id });
                        }
                    }
                }
            }
        } catch (error) {
            setOpenRouterTestResult({ success: false, message: 'Connection test failed' });
        } finally {
            setTestingOpenRouter(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const body = {
                provider: aiConfig.provider,
                ollamaUrl: aiConfig.ollamaUrl,
                ollamaModel: aiConfig.ollamaModel,
                defaultModel: settings.aiModel
            };

            // Only send API key if user entered a new one
            if (aiConfig.openRouterKey) {
                body.openRouterKey = aiConfig.openRouterKey;
            }

            await fetch('/api/ai/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            // Refresh AI status after saving
            if (refreshAIStatus) {
                refreshAIStatus();
            }

            // Mark as saved and update initial config to match current
            const newConfig = { ...aiConfig, openRouterKey: '', hasOpenRouterKey: aiConfig.openRouterKey ? true : aiConfig.hasOpenRouterKey };
            setAiConfig(newConfig);
            setInitialConfig(newConfig);
            setSaved(true);
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    // Track if changes have been made
    const hasChanges = initialConfig && (
        aiConfig.provider !== initialConfig.provider ||
        aiConfig.ollamaUrl !== initialConfig.ollamaUrl ||
        aiConfig.ollamaModel !== initialConfig.ollamaModel ||
        aiConfig.openRouterKey !== '' ||
        settings.aiModel !== aiConfig.defaultModel
    );

    // Clear saved state when changes are made
    const updateConfig = (updates) => {
        setSaved(false);
        setAiConfig(prev => ({ ...prev, ...updates }));
    };

    const isOllama = aiConfig.provider === 'ollama';
    const isNoAI = aiConfig.provider === 'none';
    const isOpenRouter = aiConfig.provider === 'openrouter';
    const isAdmin = user?.is_admin === 1 || user?.is_admin === true;
    const isAIEnabled = !isNoAI && aiStatus.available;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`${activeTab === 'admin' ? 'sm:max-w-4xl' : 'sm:max-w-2xl'} max-h-[95vh] overflow-y-auto transition-all duration-300`}>
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Configure application preferences and system options.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {(() => {
                        const colCount = 2 + (isAIEnabled ? 1 : 0) + (isAdmin ? 1 : 0);
                        const gridClass = {
                            2: 'grid-cols-2',
                            3: 'grid-cols-3',
                            4: 'grid-cols-4'
                        }[colCount];

                        return (
                            <TabsList className={`grid w-full ${gridClass} mb-4`}>
                                <TabsTrigger value="general" className="flex items-center gap-2">
                                    <Settings size={16} /> General
                                </TabsTrigger>
                                {isAIEnabled && (
                                    <TabsTrigger value="usage" className="flex items-center gap-2">
                                        <DollarSign size={16} /> Usage
                                    </TabsTrigger>
                                )}
                                <TabsTrigger value="biohacking" className="flex items-center gap-2">
                                    <Activity size={16} /> Bio-Hacking
                                </TabsTrigger>
                                {isAdmin && (
                                    <TabsTrigger value="admin" className="flex items-center gap-2">
                                        <Shield size={16} /> Admin
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        );
                    })()}

                    <TabsContent value="general" className="space-y-6">
                        <div className="grid gap-6 py-4">
                            {/* AI Provider Selection */}
                            <div className="space-y-4">
                                <Label className="text-base font-semibold">AI Provider</Label>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* OpenRouter Option */}
                                    <button
                                        onClick={() => updateConfig({ provider: 'openrouter' })}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${isOpenRouter
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-muted-foreground/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Cloud size={18} className={isOpenRouter ? 'text-primary' : 'text-muted-foreground'} />
                                            <span className="font-medium">Cloud AI</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">OpenRouter</p>
                                    </button>

                                    {/* Ollama Option */}
                                    <button
                                        onClick={() => updateConfig({ provider: 'ollama' })}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${isOllama
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-muted-foreground/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Server size={18} className={isOllama ? 'text-primary' : 'text-muted-foreground'} />
                                            <span className="font-medium">Local AI</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Ollama (Private)</p>
                                    </button>

                                    {/* No AI Option */}
                                    <button
                                        onClick={() => updateConfig({ provider: 'none' })}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${isNoAI
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-muted-foreground/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Ban size={18} className={isNoAI ? 'text-primary' : 'text-muted-foreground'} />
                                            <span className="font-medium">No AI</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Disabled</p>
                                    </button>
                                </div>
                            </div>

                            {/* Provider-specific settings */}
                            {isNoAI ? (
                                <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Info size={16} />
                                        <span className="text-sm font-medium">AI Features Disabled</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        The following features will not be available: Stack Analysis, AI Chat, Interaction Checker, Stack Optimizer, and AI-powered supplement insights.
                                    </p>
                                </div>
                            ) : isOllama ? (
                                <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <CheckCircle2 size={16} />
                                        <span className="text-sm font-medium">All data stays local</span>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ollama-url">Ollama Server URL</Label>
                                        <div className="flex gap-2">
                                            <input
                                                id="ollama-url"
                                                className={inputClassName}
                                                value={aiConfig.ollamaUrl}
                                                onChange={(e) => updateConfig({ ollamaUrl: e.target.value })}
                                                placeholder="http://localhost:11434"
                                            />
                                            <button
                                                onClick={testOllamaConnection}
                                                disabled={testingOllama}
                                                className={`${buttonClassName} border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3`}
                                            >
                                                {testingOllama ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                            </button>
                                        </div>

                                        {ollamaTestResult && (
                                            <div className={`flex items-center gap-2 text-sm ${ollamaTestResult.success ? 'text-green-600' : 'text-destructive'
                                                }`}>
                                                {ollamaTestResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                <span>{ollamaTestResult.message}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ollama-model">Default Model</Label>
                                        {ollamaModels.length > 0 ? (
                                            <select
                                                id="ollama-model"
                                                className={inputClassName}
                                                value={aiConfig.ollamaModel}
                                                onChange={(e) => updateConfig({ ollamaModel: e.target.value })}
                                            >
                                                {ollamaModels.map(model => (
                                                    <option key={model} value={model}>{model}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                id="ollama-model"
                                                className={inputClassName}
                                                value={aiConfig.ollamaModel}
                                                onChange={(e) => updateConfig({ ollamaModel: e.target.value })}
                                                placeholder="llama3.1:8b"
                                            />
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Run <code className="bg-background px-1 rounded">ollama pull llama3.1:8b</code> to install a model
                                        </p>
                                    </div>
                                </div>
                            ) : isOpenRouter ? (
                                <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                                    <div className="space-y-2">
                                        <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
                                        <div className="flex gap-2">
                                            <input
                                                id="openrouter-key"
                                                type="password"
                                                className={`${inputClassName} flex-1`}
                                                value={aiConfig.openRouterKey}
                                                onChange={(e) => {
                                                    updateConfig({ openRouterKey: e.target.value });
                                                    setOpenRouterValidated(false);
                                                    setOpenRouterTestResult(null);
                                                }}
                                                placeholder={aiConfig.hasOpenRouterKey ? '••••••••••••••••' : 'sk-or-v1-...'}
                                            />
                                            <button
                                                onClick={testOpenRouterConnection}
                                                disabled={testingOpenRouter || !aiConfig.openRouterKey}
                                                className={`${buttonClassName} border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 shrink-0`}
                                            >
                                                {testingOpenRouter ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin mr-2" />
                                                        Testing...
                                                    </>
                                                ) : (
                                                    'Validate'
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Get a free key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/keys</a>
                                        </p>
                                        {openRouterTestResult && (
                                            <p className={`text-xs ${openRouterTestResult.success ? 'text-green-600' : 'text-red-500'}`}>
                                                {openRouterTestResult.success ? '✓' : '✗'} {openRouterTestResult.message}
                                            </p>
                                        )}
                                        {!openRouterTestResult && aiConfig.hasOpenRouterKey && (
                                            <p className="text-xs text-green-600">✓ API key configured</p>
                                        )}

                                        {(openRouterValidated || (!aiConfig.openRouterKey && aiConfig.hasOpenRouterKey)) && (
                                            <div className="space-y-2 pt-2 border-t border-border/50">
                                                <Label htmlFor="openrouter-model" className="flex items-center gap-2">
                                                    <Bot size={14} /> AI Model
                                                </Label>
                                                <select
                                                    id="openrouter-model"
                                                    className={inputClassName}
                                                    value={settings.aiModel}
                                                    onChange={(e) => updateSettings({ aiModel: e.target.value })}
                                                >
                                                    {(openRouterModels.length > 0
                                                        ? openRouterModels
                                                        : availableModels
                                                    ).map(model => (
                                                        <option key={model.id} value={model.id}>
                                                            {model.name || model.id}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Showing all available models. Validate key to refresh list.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 items-start p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-600 dark:text-amber-400 text-xs">
                                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                        <span>
                                            <strong>Privacy Note:</strong> Data is sent to cloud AI providers.
                                            For complete privacy, use Local AI (Ollama) instead.
                                        </span>
                                    </div>
                                </div>
                            ) : null}

                            {/* Save Button */}
                            <button
                                onClick={saveSettings}
                                disabled={saving || (!hasChanges && !saved && settings.aiModel === (aiConfig.ollamaModel || aiConfig.defaultModel))}
                                className={`${buttonClassName} ${saved ? 'bg-green-600 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'} text-primary-foreground h-10 px-4 w-full`}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : saved ? (
                                    <>
                                        <CheckCircle2 size={16} className="mr-2" />
                                        Saved!
                                    </>
                                ) : (
                                    'Save AI Settings'
                                )}
                            </button>


                        </div>
                    </TabsContent>

                    {isAIEnabled && (
                        <TabsContent value="usage">
                            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
                                <AICostDisplay />
                            </Suspense>
                        </TabsContent>
                    )}

                    <TabsContent value="biohacking" className="space-y-6">
                        <div className="grid gap-6 py-4">
                            <div className="space-y-4">
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    <Clock size={16} /> Circadian Rhythm
                                </Label>
                                <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                    <div className="space-y-2">
                                        <Label htmlFor="wake-time">Average Wake Time</Label>
                                        <div className="flex gap-4 items-center">
                                            <input
                                                id="wake-time"
                                                type="time"
                                                className={inputClassName}
                                                value={wakeTime}
                                                onChange={(e) => updateWakeTime(e.target.value)}
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Used to calculate relative supplement timing (e.g. "Take 2 hours after waking").
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 text-blue-900 text-sm">
                                    <strong>Why track this?</strong> Aligning supplements with your circadian rhythm (Cortisol Awakening Response) can improve efficacy.
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {isAdmin && (
                        <TabsContent value="admin">
                            <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
                                <AdminDashboard />
                            </Suspense>
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog >
    );
}
