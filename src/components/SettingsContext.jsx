import React, { createContext, useContext, useState, useEffect } from "react"

const SettingsContext = createContext()

export function SettingsProvider({ children, storageKey = "optistack-settings" }) {
    const [aiAvailable, setAiAvailable] = useState(false)

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem(storageKey)
        return saved ? JSON.parse(saved) : {
            aiEnabled: true,
            apiKey: "",
            aiModel: "google/gemini-2.0-flash-001"
        }
    })

    // Check if AI is available on the server
    useEffect(() => {
        fetch('/api/ai/status')
            .then(res => res.json())
            .then(data => setAiAvailable(data.available))
            .catch(() => setAiAvailable(false))
    }, [])

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(settings))
    }, [settings, storageKey])

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }))
    }

    const availableModels = [
        { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
        { id: "google/gemini-2.0-pro-exp-02-05:free", name: "Gemini Pro Experimental" },
        { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
        { id: "openai/gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
        { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B (Free)" },
    ]

    const value = {
        settings: {
            ...settings,
            // AI is only truly enabled if server has the key AND user wants it
            aiEnabled: settings.aiEnabled && aiAvailable
        },
        aiAvailable,
        updateSettings,
        availableModels
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
