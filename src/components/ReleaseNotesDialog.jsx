import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy } from 'lucide-react';

const ReleaseNotesDialog = ({ open, onOpenChange }) => {
    const [markdown, setMarkdown] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            setLoading(true);
            fetch('/CHANGELOG.md')
                .then(res => {
                    if (!res.ok) throw new Error("Failed to load changelog");
                    return res.text();
                })
                .then(text => {
                    setMarkdown(text);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setMarkdown("Failed to load release notes.");
                    setLoading(false);
                });
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Release Notes
                    </DialogTitle>
                    <DialogDescription>
                        What's new in OptiStack
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4 mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center p-8 text-muted-foreground">
                            Loading notes...
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{markdown}</ReactMarkdown>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default ReleaseNotesDialog;
