import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Bot, AlertTriangle, Info, Cloud, Server, CheckCircle2, XCircle, Loader2, RefreshCw, Settings, Shield } from 'lucide-react';

// Lazy load AdminDashboard to avoid bloating the bundle for non-admins
const AdminDashboard = lazy(() => import('./AdminDashboard'));

export function SettingsDialog({ open, onOpenChange }) {
    const { settings, aiStatus, updateSettings, availableModels, refreshAIStatus } = useSettings();
    const { token, user } = useAuth();

    const [aiConfig, setAiConfig] = useState({
        provider: 'openrouter',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.1:8b',
        openRouterKey: '',
        hasOpenRouterKey: false
    });
    const [saving, setSaving] = useState(false);
    const [testingOllama, setTestingOllama] = useState(false);
    const [ollamaTestResult, setOllamaTestResult] = useState(null);
    const [ollamaModels, setOllamaModels] = useState([]);
    const [activeTab, setActiveTab] = useState("general");

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
                    setAiConfig({
                        provider: data.provider || 'openrouter',
                        ollamaUrl: data.ollamaUrl || 'http://localhost:11434',
                        ollamaModel: data.ollamaModel || 'llama3.1:8b',
                        openRouterKey: '',
                        hasOpenRouterKey: data.hasOpenRouterKey
                    });
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

    const saveSettings = async () => {
        setSaving(true);
        try {
            const body = {
                provider: aiConfig.provider,
                ollamaUrl: aiConfig.ollamaUrl,
                ollamaModel: aiConfig.ollamaModel
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

            // Clear the key input after saving
            setAiConfig(prev => ({ ...prev, openRouterKey: '', hasOpenRouterKey: true }));
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const isOllama = aiConfig.provider === 'ollama';
    const isAdmin = user?.is_admin === 1 || user?.is_admin === true;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`${activeTab === 'admin' ? 'sm:max-w-4xl' : 'sm:max-w-[600px]'} max-h-[95vh] overflow-y-auto transition-all duration-300`}>
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Configure application preferences and system options.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <Settings size={16} /> General
                        </TabsTrigger>
                        {isAdmin && (
                            <TabsTrigger value="admin" className="flex items-center gap-2">
                                <Shield size={16} /> Admin
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="general" className="space-y-6">
                        <div className="grid gap-6 py-4">
                            {/* AI Provider Selection */}
                            <div className="space-y-4">
                                <Label className="text-base font-semibold">AI Provider</Label>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* OpenRouter Option */}
                                    <button
                                        onClick={() => setAiConfig(prev => ({ ...prev, provider: 'openrouter' }))}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${!isOllama
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-muted-foreground/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Cloud size={18} className={!isOllama ? 'text-primary' : 'text-muted-foreground'} />
                                            <span className="font-medium">Cloud AI</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">OpenRouter</p>
                                    </button>

                                    {/* Ollama Option */}
                                    <button
                                        onClick={() => setAiConfig(prev => ({ ...prev, provider: 'ollama' }))}
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
                                </div>
                            </div>

                            {/* Provider-specific settings */}
                            {isOllama ? (
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
                                                onChange={(e) => setAiConfig(prev => ({ ...prev, ollamaUrl: e.target.value }))}
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
                                                onChange={(e) => setAiConfig(prev => ({ ...prev, ollamaModel: e.target.value }))}
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
                                                onChange={(e) => setAiConfig(prev => ({ ...prev, ollamaModel: e.target.value }))}
                                                placeholder="llama3.1:8b"
                                            />
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Run <code className="bg-background px-1 rounded">ollama pull llama3.1:8b</code> to install a model
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                                    <div className="space-y-2">
                                        <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
                                        <input
                                            id="openrouter-key"
                                            type="password"
                                            className={inputClassName}
                                            value={aiConfig.openRouterKey}
                                            onChange={(e) => setAiConfig(prev => ({ ...prev, openRouterKey: e.target.value }))}
                                            placeholder={aiConfig.hasOpenRouterKey ? '••••••••••••••••' : 'sk-or-v1-...'}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Get a free key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/keys</a>
                                        </p>
                                        {aiConfig.hasOpenRouterKey && (
                                            <p className="text-xs text-green-600">✓ API key configured</p>
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
                            )}

                            {/* Save Button */}
                            <button
                                onClick={saveSettings}
                                disabled={saving}
                                className={`${buttonClassName} bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 w-full`}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save AI Settings'
                                )}
                            </button>

                            <hr className="border-border" />

                            {/* AI Toggle & Model Selection (existing) */}
                            {aiStatus.available && (
                                <>
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="ai-mode" className="flex flex-col space-y-1">
                                            <span>Enable AI Features</span>
                                            <span className="font-normal text-xs text-muted-foreground">Allow AI to analyze ingredients and stacks.</span>
                                        </Label>
                                        <Switch
                                            id="ai-mode"
                                            checked={settings.aiEnabled}
                                            onCheckedChange={(checked) => updateSettings({ aiEnabled: checked })}
                                        />
                                    </div>

                                    {settings.aiEnabled && availableModels.length > 0 && (
                                        <div className="space-y-2">
                                            <Label htmlFor="ai-model" className="flex items-center gap-2">
                                                <Bot size={14} /> AI Model
                                            </Label>
                                            <select
                                                id="ai-model"
                                                className={inputClassName}
                                                value={settings.aiModel}
                                                onChange={(e) => updateSettings({ aiModel: e.target.value })}
                                            >
                                                {availableModels.map(model => (
                                                    <option key={model.id} value={model.id}>
                                                        {model.name || model.id}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}
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
        </Dialog>
    );
}
