import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

const SettingsContext = createContext()

export function SettingsProvider({ children, storageKey = "optistack-settings" }) {
    const [aiStatus, setAiStatus] = useState({
        available: false,
        provider: 'openrouter',
        defaultModel: 'google/gemini-2.0-flash-001',
        ollamaUrl: null
    })
    const [availableModels, setAvailableModels] = useState([])

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem(storageKey)
        return saved ? JSON.parse(saved) : {
            aiModel: "google/gemini-2.0-flash-001"
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

    // Check AI status on mount
    useEffect(() => {
        refreshAIStatus()
    }, [refreshAIStatus])

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

    const value = {
        settings: {
            ...settings,
            // AI is enabled if the server reports it as available
            aiEnabled: aiStatus.available
        },
        aiStatus,
        updateSettings,
        availableModels,
        refreshAIStatus
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
