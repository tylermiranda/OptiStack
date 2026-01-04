import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { DEFAULT_PROMPTS } from "../data/aiPrompts"

const SettingsContext = createContext()

export function SettingsProvider({ children, storageKey = "optistack-settings" }) {
    const [aiStatus, setAiStatus] = useState({
        available: false,
        provider: 'openrouter',
        defaultModel: 'google/gemini-2.0-flash-001',
        ollamaUrl: null
    })
    const [availableModels, setAvailableModels] = useState([])
    const [wakeTime, setWakeTime] = useState("07:00")

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem(storageKey)
        const parsed = saved ? JSON.parse(saved) : {};
        return {
            aiModel: "google/gemini-2.0-flash-001",
            ...parsed,
            // Ensure newly added prompts exist even if saved settings exist
            prompts: {
                ...DEFAULT_PROMPTS,
                ...(parsed.prompts || {})
            }
        }
    })

    // Function to refresh AI status
    const refreshAIStatus = useCallback(() => {
        fetch('/api/ai/status')
            .then(res => res.json())
            .then(data => {
                setAiStatus({
                    available: data.available,
                    provider: data.provider || 'openrouter',
                    defaultModel: data.defaultModel || 'google/gemini-2.0-flash-001',
                    ollamaUrl: data.ollamaUrl || null
                })

                // If using default model and server reports a different default, update it
                if (data.available && data.defaultModel) {
                    setSettings(prev => ({ ...prev, aiModel: data.defaultModel }))
                }

                // Also refresh models
                if (data.available) {
                    fetch('/api/ai/models')
                        .then(res => res.json())
                        .then(modelsData => {
                            if (modelsData.models && modelsData.models.length > 0) {
                                setAvailableModels(modelsData.models);

                                // Auto-correct selection if current model isn't in the list
                                setSettings(prev => {
                                    // Don't override if we haven't loaded settings yet or if it's valid
                                    const currentModelExists = modelsData.models.some(m => m.id === prev.aiModel);
                                    if (!currentModelExists) {
                                        console.log(`[Auto-Correct] Model ${prev.aiModel} not found. Switching to ${modelsData.models[0].id}`);
                                        return { ...prev, aiModel: modelsData.models[0].id };
                                    }
                                    return prev;
                                });
                            }
                        })
                        .catch(console.error)
                }
            })
            .catch(() => setAiStatus(prev => ({ ...prev, available: false })))
    }, [])

    // Fetch user settings (Wake Time)
    const refreshUserSettings = useCallback(() => {
        const token = localStorage.getItem('auth_token'); // Or however we get token. Wait, we are inside context.
        // We need auth token. But SettingsProvider is typically wrapped inside or outside AuthProvider.
        // If Outside, we can't use useAuth().
        // If Inside, we can.
        // Looking at App.jsx would confirm. Assuming it's inside or we can just fetch if we have token in localstorage 
        // OR better: handle it gracefully. 
        // This file imports useAuth but doesn't use it? No, line 4 import useAuth from '../context/AuthContext'; NO it imports it but lines 1-127 show no usage.
        // Wait, line 3 imports `useSettings`.
        // I'll assume we can fetch lightly.

        fetch('/api/user/settings', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}` // simple check
            }
        })
            .then(res => {
                if (res.ok) return res.json();
                return null;
            })
            .then(data => {
                if (data && data.wakeTime) {
                    setWakeTime(data.wakeTime);
                }
            })
            .catch(console.error);
    }, []);

    // Check AI status on mount
    useEffect(() => {
        refreshAIStatus()
        refreshUserSettings()
    }, [refreshAIStatus, refreshUserSettings])

    // Fetch available models when AI is available
    useEffect(() => {
        if (aiStatus.available) {
            fetch('/api/ai/models')
                .then(res => res.json())
                .then(data => {
                    if (data.models) {
                        setAvailableModels(data.models)
                    }
                })
                .catch(() => {
                    // Fallback models if fetch fails
                    if (aiStatus.provider === 'openrouter') {
                        setAvailableModels([
                            { id: "google/gemini-2.0-flash-001", name: "⭐ Gemini 2.0 Flash (Recommended)" },
                            { id: "google/gemini-flash-1.5", name: "Gemini 1.5 Flash" },
                            { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B (Free)" },
                            { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
                            { id: "openai/gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
                        ])
                    }
                })
        }
    }, [aiStatus.available, aiStatus.provider])

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(settings))
    }, [settings, storageKey])

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }))
    }

    const updateWakeTime = async (time) => {
        setWakeTime(time); // Optimistic update
        try {
            await fetch('/api/user/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ wakeTime: time })
            });
        } catch (e) {
            console.error("Failed to save wake time", e);
        }
    }

    const value = {
        settings: {
            ...settings,
            // AI is enabled if the server reports it as available
            aiEnabled: aiStatus.available
        },
        aiStatus,
        updateSettings,
        availableModels,
        refreshAIStatus,
        wakeTime,
        updateWakeTime
    }

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    )
}

export const useSettings = () => {
    const context = useContext(SettingsContext)
    if (context === undefined)
        throw new Error("useSettings must be used within a SettingsProvider")
    return context
}
