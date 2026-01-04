import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Send, Trash2, Sparkles, User, Bot, Loader2, Plus, MessageSquare, Menu, X, MoreVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";

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

    // Session Management
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    // Initial Load
    useEffect(() => {
        if (open && token) {
            fetchSessions().then(loadedSessions => {
                // If we have sessions, select the most recent one
                if (loadedSessions && loadedSessions.length > 0) {
                    // Check if we should start a fresh chat or load the last one
                    // Usually loading the last one is better UX unless it's very old
                    selectSession(loadedSessions[0].id);
                } else {
                    // No sessions, start fresh
                    setCurrentSessionId(null);
                    setMessages([]);
                }
            });
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

    const fetchSessions = async () => {
        setIsLoadingSessions(true);
        try {
            const response = await fetch('/api/ai/sessions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSessions(data);
                return data;
            }
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        } finally {
            setIsLoadingSessions(false);
        }
        return [];
    };

    const fetchChatHistory = async (sessionId) => {
        if (!sessionId) {
            setMessages([]);
            return;
        }

        try {
            const response = await fetch(`/api/ai/chat-history?sessionId=${sessionId}`, {
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

    const deleteSession = async (e, sessionId) => {
        e.stopPropagation(); // Prevent selection
        if (!confirm('Delete this chat?')) return;

        try {
            const response = await fetch(`/api/ai/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const updatedSessions = sessions.filter(s => s.id !== sessionId);
                setSessions(updatedSessions);

                // If deleting current session, switch to another or clear
                if (sessionId === currentSessionId) {
                    if (updatedSessions.length > 0) {
                        selectSession(updatedSessions[0].id);
                    } else {
                        startNewChat();
                    }
                }
            }
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    const selectSession = (sessionId) => {
        setCurrentSessionId(sessionId);
        fetchChatHistory(sessionId);
        // On mobile, close sidebar after selection
        if (window.innerWidth < 768) {
            setShowSidebar(false);
        }
    };

    const startNewChat = () => {
        setCurrentSessionId(null);
        setMessages([]);
        if (window.innerWidth < 768) {
            setShowSidebar(false);
        }
    };

    const sendMessage = async (messageText) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        // If no session exists but there are other sessions, create a temp marker in UI or just wait for backend?
        // Let's just proceed.

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
                    model: settings.aiModel,
                    sessionId: currentSessionId // Pass current ID (or null for new)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response');
            }

            const data = await response.json();
            const assistantMessage = { role: 'assistant', content: data.message, id: Date.now() + 1 };
            setMessages(prev => [...prev, assistantMessage]);

            // If we started a new chat, the backend returned a new sessionId
            if (!currentSessionId && data.sessionId) {
                setCurrentSessionId(data.sessionId);
                // Refresh sessions list to show the new one
                fetchSessions();
            } else {
                // Also refresh sessions to update "Updated At" timestamp or Title if changed
                fetchSessions();
            }

        } catch (err) {
            console.error('Chat error:', err);
            setError(err.message);
            // Remove the optimistic user message on error
            setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        } finally {
            setIsLoading(false);
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

    // Determine if sidebar should be visible
    // "The sidebar nav should only appear if there are multiple chats"
    // We also show it if there is 1 chat BUT the user is currently in "New Chat" mode (currentSessionId === null),
    // so they can navigate back to the existing chat.
    const shouldShowSidebar = sessions.length > 1 || (sessions.length > 0 && currentSessionId === null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden sm:flex-row">

                {/* Mobile Sidebar Toggle (Visible only on small screens) */}
                <div className="sm:hidden absolute top-4 left-4 z-50">
                    {shouldShowSidebar && (
                        <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)}>
                            {showSidebar ? <X size={20} /> : <Menu size={20} />}
                        </Button>
                    )}
                </div>

                {/* Sidebar */}
                {shouldShowSidebar && (
                    <div className={`
                        flex flex-col w-full sm:w-64 border-r bg-muted/30 shrink-0
                        ${showSidebar ? 'absolute inset-0 z-40 bg-background sm:static' : 'hidden sm:flex'}
                    `}>
                        <div className="p-4 border-b">
                            <Button
                                onClick={startNewChat}
                                className="w-full justify-start gap-2"
                                variant={currentSessionId === null ? "secondary" : "outline"}
                            >
                                <Plus size={16} />
                                New Chat
                            </Button>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {sessions.map(session => (
                                    <div
                                        key={session.id}
                                        className={`
                                            group flex items-center gap-3 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors
                                            ${currentSessionId === session.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-muted-foreground'}
                                        `}
                                        onClick={() => selectSession(session.id)}
                                    >
                                        <MessageSquare size={16} className="shrink-0" />
                                        <span className="truncate flex-1 text-left">{session.title || 'Untitled Chat'}</span>

                                        <button
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded-sm transition-all focus:opacity-100"
                                            onClick={(e) => deleteSession(e, session.id)}
                                            title="Delete chat"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col h-full min-w-0 bg-background">
                    <DialogHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2 ml-8 sm:ml-0">
                            <MessageCircle className="h-5 w-5 text-primary" />
                            <DialogTitle>AI Supplement Assistant</DialogTitle>
                        </div>

                        {/* If sidebar is hidden (single chat), show New Chat button here */}
                        {!shouldShowSidebar && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={startNewChat}
                                className="gap-2 h-8"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">New Chat</span>
                            </Button>
                        )}
                    </DialogHeader>

                    <ScrollArea className="flex-1 px-6 py-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                <div className="bg-primary/10 p-4 rounded-full mb-4">
                                    <Sparkles className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Ask me anything about supplements</h3>
                                <p className="text-muted-foreground text-sm mb-6 max-w-md">
                                    I can help you understand interactions, recommend supplements, and optimize your stack.
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
                                placeholder="Ask follow-up questions..."
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
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default AIChatDialog;
