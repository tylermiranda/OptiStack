import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Send, Trash2, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";

const SUGGESTED_PROMPTS = [
    "Are there any interactions I should be aware of in my current stack?",
    "What supplements would help with athletic performance?",
    "What's missing from my current routine?",
    "What supplements are good for improving sleep quality?",
    "Should I take my supplements with or without food?",
];

export function AIChatDialog({ open, onOpenChange }) {
    const { settings } = useSettings();
    const { token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Load chat history when dialog opens
    useEffect(() => {
        if (open && token) {
            fetchChatHistory();
        }
    }, [open, token]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when dialog opens
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const fetchChatHistory = async () => {
        try {
            const response = await fetch('/api/ai/chat-history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const history = await response.json();
                setMessages(history);
            }
        } catch (err) {
            console.error('Failed to fetch chat history:', err);
        }
    };

    const sendMessage = async (messageText) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        setError(null);
        setInput('');

        // Add user message optimistically
        const userMessage = { role: 'user', content: text, id: Date.now() };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: text,
                    model: settings.aiModel
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response');
            }

            const data = await response.json();
            const assistantMessage = { role: 'assistant', content: data.message, id: Date.now() + 1 };
            setMessages(prev => [...prev, assistantMessage]);

        } catch (err) {
            console.error('Chat error:', err);
            setError(err.message);
            // Remove the optimistic user message on error
            setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = async () => {
        try {
            const response = await fetch('/api/ai/chat-history', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setMessages([]);
            }
        } catch (err) {
            console.error('Failed to clear chat history:', err);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handlePromptClick = (prompt) => {
        sendMessage(prompt);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-primary" />
                            AI Supplement Assistant
                        </DialogTitle>
                        {messages.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground"
                                title="Clear chat history"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 py-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <div className="bg-primary/10 p-4 rounded-full mb-4">
                                <Sparkles className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Ask me anything about supplements</h3>
                            <p className="text-muted-foreground text-sm mb-6 max-w-md">
                                I can help you understand interactions, recommend supplements for specific goals,
                                and optimize your current stack.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                                {SUGGESTED_PROMPTS.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePromptClick(prompt)}
                                        className="text-xs px-3 py-2 rounded-full border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={msg.id || i}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Bot size={16} className="text-primary" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                            <User size={16} className="text-primary-foreground" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Bot size={16} className="text-primary" />
                                    </div>
                                    <div className="bg-muted rounded-2xl px-4 py-3">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </ScrollArea>

                {error && (
                    <div className="px-6 py-2 bg-destructive/10 text-destructive text-sm border-t">
                        {error}
                    </div>
                )}

                <div className="px-6 py-4 border-t shrink-0">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about supplements, interactions, or recommendations..."
                            className="flex-1 px-4 py-2 rounded-full border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            className="inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default AIChatDialog;
