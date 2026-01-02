import React from 'react';
import { useSettings } from './SettingsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"
import { Bot, Key, Settings, AlertTriangle } from 'lucide-react';

export function SettingsDialog({ open, onOpenChange }) {
    const { settings, updateSettings, availableModels } = useSettings();

    const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Configure global application settings and AI preferences.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* AI Toggle */}
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

                    {settings.aiEnabled && (
                        <div className="space-y-4 pt-4 border-t">
                            {/* API Key */}
                            <div className="space-y-2">
                                <Label htmlFor="api-key" className="flex items-center gap-2">
                                    <Key size={14} /> OpenRouter API Key
                                </Label>
                                <input
                                    id="api-key"
                                    type="password"
                                    className={inputClassName}
                                    placeholder="sk-or-..."
                                    value={settings.apiKey}
                                    onChange={(e) => updateSettings({ apiKey: e.target.value })}
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Leave blank to use the system default key (if available).
                                </p>
                            </div>

                            {/* Model Selection */}
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
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex gap-2 items-start mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-600 dark:text-amber-400 text-xs">
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                    <span>
                                        <strong>Privacy Note:</strong> Free models through OpenRouter may have rate limits and often require training data usage.
                                        If your OpenRouter profile is set to deny training, selecting a free model may cause errors.
                                        Use paid models for better privacy guarantees.
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
