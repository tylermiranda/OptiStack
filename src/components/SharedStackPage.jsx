import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Sparkles, Download, Eye, Calendar, User } from 'lucide-react';

export function SharedStackPage({ shareCode }) {
    const { token, user } = useAuth();
    const [stack, setStack] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);

    useEffect(() => {
        if (shareCode) {
            loadSharedStack();
        }
    }, [shareCode]);

    const loadSharedStack = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/stacks/shared/${shareCode}`);

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to load stack');
            }

            const data = await res.json();
            setStack(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!token || isImporting) return;

        setIsImporting(true);

        try {
            const res = await fetch(`/api/stacks/shared/${shareCode}/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to import');
            }

            setImportSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsImporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading stack...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-2xl font-bold mb-2">Stack Not Found</h1>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                    >
                        Go to OptiStack
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                            <Sparkles size={20} />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Shared via OptiStack</span>
                    </div>
                    <h1 className="text-2xl font-bold">{stack.title}</h1>
                    {stack.description && (
                        <p className="text-muted-foreground mt-2">{stack.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <User size={14} />
                            {stack.author}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye size={14} />
                            {stack.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(stack.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        Supplements ({stack.supplements.length})
                    </h2>
                    {token && !importSuccess && (
                        <button
                            onClick={handleImport}
                            disabled={isImporting}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 disabled:opacity-50"
                        >
                            <Download size={16} className="mr-2" />
                            {isImporting ? 'Importing...' : 'Import to My Stack'}
                        </button>
                    )}
                    {importSuccess && (
                        <span className="text-green-600 font-medium">
                            ✓ Imported successfully!
                        </span>
                    )}
                    {!token && (
                        <a
                            href="/"
                            className="text-sm text-primary hover:underline"
                        >
                            Log in to import this stack
                        </a>
                    )}
                </div>

                <div className="grid gap-4">
                    {stack.supplements.map((supp, i) => (
                        <div
                            key={i}
                            className="rounded-xl border bg-card p-5"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{supp.name}</h3>
                                    {supp.dosage && (
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground bg-secondary mt-2">
                                            {supp.dosage}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {supp.schedule?.am && (
                                        <div className="inline-flex items-center gap-1 rounded-md bg-orange-50 dark:bg-orange-950/50 px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
                                            <Sun size={12} />
                                            {supp.schedule.amPills || 1} AM
                                        </div>
                                    )}
                                    {supp.schedule?.pm && (
                                        <div className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                            <Moon size={12} />
                                            {supp.schedule.pmPills || 1} PM
                                        </div>
                                    )}
                                </div>
                            </div>
                            {supp.reason && (
                                <p className="text-sm text-muted-foreground mt-3">
                                    {supp.reason}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-card mt-12">
                <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                    <a href="/" className="inline-flex items-center gap-2 text-primary hover:underline">
                        <Sparkles size={20} />
                        <span className="font-semibold">Create your own stack with OptiStack</span>
                    </a>
                    <p className="text-sm text-muted-foreground mt-2">
                        Track supplements, analyze interactions, and optimize your health protocol.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default SharedStackPage;
