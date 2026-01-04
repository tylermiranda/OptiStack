import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import {
    Dumbbell, Moon, Brain, Heart, Users, ChevronRight,
    Plus, Check, AlertTriangle, ExternalLink, Sun
} from 'lucide-react';
import { stackTemplates, getTemplateById } from '../data/stackTemplates';

const iconMap = {
    Dumbbell: Dumbbell,
    Moon: Moon,
    Brain: Brain,
    Heart: Heart,
    Users: Users
};

export function StackTemplatesDialog({ open, onOpenChange, onImportStack }) {
    const { token } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(null);
    const [error, setError] = useState(null);

    const handleSelectTemplate = (templateId) => {
        const template = getTemplateById(templateId);
        setSelectedTemplate(template);
        setImportSuccess(null);
        setError(null);
    };

    const handleImportTemplate = async () => {
        if (!selectedTemplate || isImporting) return;

        setIsImporting(true);
        setError(null);

        try {
            // Import each supplement from the template
            for (const supp of selectedTemplate.supplements) {
                const res = await fetch('/api/supplements', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: supp.name,
                        dosage: supp.dosage,
                        unitType: supp.unitType || 'pills',
                        schedule: supp.schedule,
                        reason: supp.reason,
                        price: 0,
                        quantity: null
                    })
                });

                if (!res.ok) {
                    throw new Error(`Failed to import ${supp.name}`);
                }
            }

            setImportSuccess(`Successfully imported ${selectedTemplate.supplements.length} supplements!`);

            // Notify parent to refresh supplements list
            if (onImportStack) {
                onImportStack();
            }

            // Close dialog after a delay
            setTimeout(() => {
                setSelectedTemplate(null);
                setImportSuccess(null);
                onOpenChange(false);
            }, 2000);

        } catch (err) {
            console.error('Import error:', err);
            setError(err.message || 'Failed to import template');
        } finally {
            setIsImporting(false);
        }
    };

    const handleBack = () => {
        setSelectedTemplate(null);
        setImportSuccess(null);
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        {selectedTemplate ? (
                            <>
                                <button
                                    onClick={handleBack}
                                    className="text-muted-foreground hover:text-foreground mr-2"
                                >
                                    ←
                                </button>
                                {selectedTemplate.name}
                            </>
                        ) : (
                            'Browse Stack Templates'
                        )}
                    </DialogTitle>
                </DialogHeader>

                {selectedTemplate ? (
                    // Template Detail View
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1 px-6 py-4">
                            <div className="space-y-6">
                                {/* Template Header */}
                                <div>
                                    <span className="text-xs font-medium text-primary uppercase tracking-wider">
                                        {selectedTemplate.category}
                                    </span>
                                    <p className="text-muted-foreground mt-2">
                                        {selectedTemplate.description}
                                    </p>
                                    {selectedTemplate.attribution && (
                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                            <ExternalLink size={12} />
                                            {selectedTemplate.attribution}
                                        </p>
                                    )}
                                </div>

                                {/* Disclaimer for influencer stacks */}
                                {selectedTemplate.disclaimer && (
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            {selectedTemplate.disclaimer}
                                        </p>
                                    </div>
                                )}

                                {/* Supplements List */}
                                <div>
                                    <h3 className="font-semibold mb-3">
                                        Supplements ({selectedTemplate.supplements.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedTemplate.supplements.map((supp, i) => (
                                            <div
                                                key={i}
                                                className="flex items-start justify-between p-3 rounded-lg border bg-card"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{supp.name}</span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                            {supp.dosage}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {supp.reason}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 ml-4 shrink-0">
                                                    {supp.schedule?.am && (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 dark:bg-orange-950/50 px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-300">
                                                            <Sun size={10} /> AM
                                                        </span>
                                                    )}
                                                    {supp.schedule?.pm && (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                                            <Moon size={10} /> PM
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Import Button */}
                        <div className="px-6 py-4 border-t shrink-0">
                            {error && (
                                <div className="mb-3 p-2 rounded bg-destructive/10 text-destructive text-sm">
                                    {error}
                                </div>
                            )}
                            {importSuccess ? (
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <Check size={20} />
                                    {importSuccess}
                                </div>
                            ) : (
                                <button
                                    onClick={handleImportTemplate}
                                    disabled={isImporting}
                                    className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
                                >
                                    <Plus size={18} className="mr-2" />
                                    {isImporting ? 'Importing...' : `Import ${selectedTemplate.supplements.length} Supplements to My Stack`}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    // Category Browser View
                    <Tabs defaultValue={stackTemplates.categories[0].id} className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="mx-6 mt-4 grid grid-cols-5 h-auto">
                            {stackTemplates.categories.map(cat => {
                                const Icon = iconMap[cat.icon] || Heart;
                                return (
                                    <TabsTrigger
                                        key={cat.id}
                                        value={cat.id}
                                        className="flex flex-col gap-1 py-2 px-1 text-xs"
                                    >
                                        <Icon size={18} />
                                        <span className="hidden sm:inline">{cat.name}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        {stackTemplates.categories.map(cat => (
                            <TabsContent
                                key={cat.id}
                                value={cat.id}
                                className="flex-1 overflow-hidden mt-0"
                            >
                                <ScrollArea className="h-full px-6 py-4">
                                    <div className="mb-4">
                                        <p className="text-muted-foreground text-sm">{cat.description}</p>
                                    </div>
                                    <div className="grid gap-3">
                                        {cat.templates.map(template => (
                                            <button
                                                key={template.id}
                                                onClick={() => handleSelectTemplate(template.id)}
                                                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-colors text-left"
                                            >
                                                <div>
                                                    <h4 className="font-semibold">{template.name}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                        {template.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {template.supplements.length} supplements
                                                        </span>
                                                        {template.attribution && (
                                                            <span className="text-xs text-primary">
                                                                • {template.attribution.split('(')[0].replace('Source:', '').trim()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} className="text-muted-foreground shrink-0 ml-4" />
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default StackTemplatesDialog;
