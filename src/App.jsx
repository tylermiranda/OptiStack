import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Sparkles, LayoutGrid, Plus, LogOut, Shield, Share2, MessageCircle, LayoutTemplate, Link2 } from 'lucide-react';
import SupplementCard from './components/SupplementCard';
import AddSupplementForm from './components/AddSupplementForm';
import DailyVisualization from './components/DailyVisualization';
import CostOverview from './components/CostOverview';
const StackAnalysis = lazy(() => import('./components/StackAnalysis'));
const StackOptimizer = lazy(() => import('./components/StackOptimizer'));
import { ThemeProvider } from "./components/theme-provider"
import { ModeToggle } from "./components/mode-toggle"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { SettingsProvider, useSettings } from "./components/SettingsContext"
import { SettingsDialog } from "./components/SettingsDialog"
import ReleaseNotesDialog from "./components/ReleaseNotesDialog"
import { RefillModal } from "./components/RefillModal"
import ShareStackDialog from "./components/ShareStackDialog"
import { Settings, Pill, FileText, Stethoscope } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip"
import { InteractionChecker } from "./components/InteractionChecker"
import { AIChatDialog } from "./components/AIChatDialog"
import { StackTemplatesDialog } from "./components/StackTemplatesDialog"
import { PublicShareDialog } from "./components/PublicShareDialog"
import { SharedStackPage } from "./components/SharedStackPage"

import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';

function Dashboard() {
    const { user, token, logout, isAuthDisabled } = useAuth();
    const { settings } = useSettings();
    const [supplements, setSupplements] = useState([]);

    const [editingId, setEditingId] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);
    const [isRefillOpen, setIsRefillOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isInteractionOpen, setIsInteractionOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const [isPublicShareOpen, setIsPublicShareOpen] = useState(false);

    const fetchSupplements = async () => {
        if (!token) return;
        try {
            const res = await fetch('/api/supplements', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401 || res.status === 403) {
                logout();
                return;
            }
            const data = await res.json();
            if (Array.isArray(data)) setSupplements(data);
        } catch (err) {
            console.error("Failed to fetch supplements", err);
        }
    };

    useEffect(() => {
        if (token) {
            // Check for update
            const lastSeenVersion = localStorage.getItem('lastSeenVersion');
            const currentVersion = __APP_VERSION__;

            if (currentVersion && lastSeenVersion !== currentVersion) {
                setIsReleaseNotesOpen(true);
                localStorage.setItem('lastSeenVersion', currentVersion);
            }

            fetchSupplements();
        }
    }, [token, logout]);

    const addSupplement = async (supplement) => {
        try {
            const res = await fetch('/api/supplements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(supplement)
            });
            if (res.ok) {
                const newSup = await res.json();
                setSupplements([newSup, ...supplements]);
                setIsDialogOpen(false);
            }
        } catch (error) {
            console.error("Failed to add supplement", error);
        }
    };

    const updateSupplement = async (updatedSupplement) => {
        try {
            const res = await fetch(`/api/supplements/${updatedSupplement.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedSupplement)
            });
            if (res.ok) {
                const savedSup = await res.json();
                setSupplements(supplements.map(s => s.id === savedSup.id ? savedSup : s));
                setEditingId(null);
                setIsDialogOpen(false);
            }
        } catch (error) {
            console.error("Failed to update supplement", error);
        }
    };

    const deleteSupplement = async (id) => {
        try {
            const res = await fetch(`/api/supplements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSupplements(supplements.filter(s => s.id !== id));
                if (editingId === id) {
                    setEditingId(null);
                    setIsDialogOpen(false);
                }
            }
        } catch (error) {
            console.error("Failed to delete supplement", error);
        }
    };

    const toggleArchive = async (id) => {
        const sup = supplements.find(s => s.id === id);
        if (sup) {
            await updateSupplement({ ...sup, archived: !sup.archived });
        }
    };

    const startEditing = (id) => {
        setEditingId(id);
        setIsDialogOpen(true);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setIsDialogOpen(false);
    };

    const onOpenChange = (open) => {
        setIsDialogOpen(open);
        if (!open) setEditingId(null);
    }

    const editingSupplement = supplements.find(s => s.id === editingId);

    // Filter lists
    const activeSupplements = supplements.filter(s => !s.archived);
    const archivedSupplements = supplements.filter(s => s.archived);

    if (!user) {
        return <AuthPage />;
    }

    return (
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-5xl text-foreground bg-background min-h-screen transition-colors duration-300 pb-24 md:pb-8 pt-[env(safe-area-inset-top,1rem)] overflow-x-hidden">
            <header className="mb-8 md:mb-12 pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg shadow-lg shadow-primary/20">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-primary">
                            OptiStack
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">Supplement & Medication Manager</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-0.5 sm:gap-1 bg-muted/50 p-1 rounded-lg shrink-0">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setIsRefillOpen(true)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-background hover:text-accent-foreground h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground shadow-sm"
                                    aria-label="Refill Assistant"
                                >
                                    <Pill size={16} className="sm:size-[18px]" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refill Assistant</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setIsInteractionOpen(true)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-background hover:text-accent-foreground h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground shadow-sm"
                                    aria-label="Safety Check"
                                >
                                    <Stethoscope size={16} className="sm:size-[18px]" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Interaction Checker</p>
                            </TooltipContent>
                        </Tooltip>
                        {settings.aiEnabled && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setIsChatOpen(true)}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-background hover:text-accent-foreground h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground shadow-sm"
                                        aria-label="AI Chat"
                                    >
                                        <MessageCircle size={16} className="sm:size-[18px]" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>AI Chat Assistant</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-background hover:text-accent-foreground h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground shadow-sm"
                                    aria-label="Settings"
                                >
                                    <Settings size={16} className="sm:size-[18px]" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Settings</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setIsShareOpen(true)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-background hover:text-accent-foreground h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground shadow-sm"
                                    aria-label="Share Stack"
                                >
                                    <Share2 size={16} className="sm:size-[18px]" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Share with Doctor</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setIsPublicShareOpen(true)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-background hover:text-accent-foreground h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground shadow-sm"
                                    aria-label="Share Publicly"
                                >
                                    <Link2 size={16} className="sm:size-[18px]" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Share Public Link</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setIsTemplatesOpen(true)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-background hover:text-accent-foreground h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground shadow-sm"
                                    aria-label="Browse Templates"
                                >
                                    <LayoutTemplate size={16} className="sm:size-[18px]" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Stack Templates</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setIsReleaseNotesOpen(true)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-background hover:text-accent-foreground h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground shadow-sm"
                                    aria-label="Release Notes"
                                >
                                    <FileText size={16} className="sm:size-[18px]" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Release Notes</p>
                            </TooltipContent>
                        </Tooltip>
                        <div className="h-4 w-[1px] bg-border mx-0.5 sm:mx-1" />
                        <ModeToggle />
                        {!isAuthDisabled && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={logout}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-background hover:text-accent-foreground h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground shadow-sm"
                                        aria-label="Logout"
                                    >
                                        <LogOut size={16} className="sm:size-[18px]" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Logout</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
                        <DialogTrigger asChild>
                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-lg shadow-primary/20 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                                <Plus className="mr-2 h-4 w-4" /> <span>Add Supplement</span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[95vh] sm:max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-lg p-4 sm:p-6">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit Supplement' : 'Add New Supplement'}</DialogTitle>
                            </DialogHeader>
                            <AddSupplementForm
                                onAdd={addSupplement}
                                onUpdate={updateSupplement}
                                onCancel={cancelEditing}
                                initialData={editingSupplement}
                            />
                        </DialogContent>
                    </Dialog>
                    <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
                    <ReleaseNotesDialog open={isReleaseNotesOpen} onOpenChange={setIsReleaseNotesOpen} />
                    <RefillModal open={isRefillOpen} onOpenChange={setIsRefillOpen} supplements={supplements} />
                    <InteractionChecker open={isInteractionOpen} onOpenChange={setIsInteractionOpen} supplements={supplements} />
                    <ShareStackDialog open={isShareOpen} onOpenChange={setIsShareOpen} supplements={supplements} />
                    {settings.aiEnabled && <AIChatDialog open={isChatOpen} onOpenChange={setIsChatOpen} />}
                    <StackTemplatesDialog
                        open={isTemplatesOpen}
                        onOpenChange={setIsTemplatesOpen}
                        onImportStack={fetchSupplements}
                    />
                    <PublicShareDialog
                        open={isPublicShareOpen}
                        onOpenChange={setIsPublicShareOpen}
                        supplements={supplements}
                    />
                </div>
            </header>

            <main className="space-y-12">
                <Tabs defaultValue="active" className="w-full">
                    <div className="flex items-center justify-between border-b pb-4 mb-6">
                        <h2 className="text-xl font-semibold tracking-tight">My Stack</h2>
                        <TabsList>
                            <TabsTrigger value="active">Active ({activeSupplements.length})</TabsTrigger>
                            <TabsTrigger value="archived">Archived ({archivedSupplements.length})</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="active" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activeSupplements.length === 0 ? (
                                <div className="col-span-full bg-card border rounded-xl p-12 text-center text-muted-foreground shadow-sm">
                                    <p className="font-medium">Your active stack is empty.</p>
                                    <p className="text-sm mt-2">Add a supplement to get started.</p>
                                </div>
                            ) : (
                                activeSupplements.map(sup => (
                                    <SupplementCard
                                        key={sup.id}
                                        supplement={sup}
                                        onDelete={deleteSupplement}
                                        onEdit={startEditing}
                                        onArchive={toggleArchive}
                                    />
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="archived" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {archivedSupplements.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-muted-foreground">
                                    <p className="font-medium">No archived supplements.</p>
                                </div>
                            ) : (
                                archivedSupplements.map(sup => (
                                    <SupplementCard
                                        key={sup.id}
                                        supplement={sup}
                                        onDelete={deleteSupplement}
                                        onEdit={startEditing}
                                        onArchive={toggleArchive}
                                    />
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="mt-16 space-y-12">
                    <DailyVisualization supplements={activeSupplements} />
                    <CostOverview supplements={activeSupplements} />
                    <Suspense fallback={<div className="text-center py-4 text-muted-foreground">Loading analysis...</div>}>
                        <StackAnalysis supplements={activeSupplements} />
                    </Suspense>
                    <Suspense fallback={<div className="text-center py-4 text-muted-foreground">Loading optimizer...</div>}>
                        <StackOptimizer supplements={activeSupplements} onAddSupplement={addSupplement} />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}

function App() {
    // Simple URL-based routing for shared stacks
    const [shareCode, setShareCode] = useState(null);

    useEffect(() => {
        const path = window.location.pathname;
        const match = path.match(/^\/shared\/([a-z0-9]+)$/i);
        if (match) {
            setShareCode(match[1]);
        }
    }, []);

    // If viewing a shared stack, render the public page
    if (shareCode) {
        return (
            <SettingsProvider>
                <AuthProvider>
                    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                        <SharedStackPage shareCode={shareCode} />
                    </ThemeProvider>
                </AuthProvider>
            </SettingsProvider>
        );
    }

    return (
        <SettingsProvider>
            <AuthProvider>
                <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                    <TooltipProvider>
                        <Dashboard />
                    </TooltipProvider>
                </ThemeProvider>
            </AuthProvider>
        </SettingsProvider>
    );
}

export default App;
