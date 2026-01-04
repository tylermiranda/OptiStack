import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Link2, Copy, Check, Eye, Trash2, Loader2 } from 'lucide-react';

export function PublicShareDialog({ open, onOpenChange, supplements }) {
    const { token } = useAuth();
    const [title, setTitle] = useState('My Supplement Stack');
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [shareUrl, setShareUrl] = useState(null);
    const [copied, setCopied] = useState(false);
    const [myShares, setMyShares] = useState([]);
    const [isLoadingShares, setIsLoadingShares] = useState(false);
    const [error, setError] = useState(null);

    // Load existing shares when dialog opens
    React.useEffect(() => {
        if (open && token) {
            loadMyShares();
        }
    }, [open, token]);

    const loadMyShares = async () => {
        setIsLoadingShares(true);
        try {
            const res = await fetch('/api/stacks/my-shares', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const shares = await res.json();
                setMyShares(shares);
            }
        } catch (err) {
            console.error('Failed to load shares:', err);
        } finally {
            setIsLoadingShares(false);
        }
    };

    const handleCreateShare = async () => {
        if (isCreating) return;

        setIsCreating(true);
        setError(null);

        try {
            const res = await fetch('/api/stacks/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create share link');
            }

            const fullUrl = `${window.location.origin}${data.shareUrl}`;
            setShareUrl(fullUrl);
            loadMyShares(); // Refresh list

        } catch (err) {
            setError(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopyLink = async () => {
        if (shareUrl) {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDeleteShare = async (shareCode) => {
        try {
            const res = await fetch(`/api/stacks/shared/${shareCode}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMyShares(myShares.filter(s => s.share_code !== shareCode));
            }
        } catch (err) {
            console.error('Failed to delete share:', err);
        }
    };

    const handleNewShare = () => {
        setShareUrl(null);
        setTitle('My Supplement Stack');
        setDescription('');
        setError(null);
    };

    const activeSupplements = supplements?.filter(s => !s.archived) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary" />
                        Share Stack Publicly
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {shareUrl ? (
                        // Success State
                        <div className="space-y-4">
                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">
                                    ✓ Share link created!
                                </p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={shareUrl}
                                        readOnly
                                        className="flex-1 px-3 py-2 text-sm rounded-md border bg-background text-foreground"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleNewShare}
                                className="text-sm text-primary hover:underline"
                            >
                                Create another share link
                            </button>
                        </div>
                    ) : (
                        // Create Form
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Create a public link to share your current stack ({activeSupplements.length} supplements) with others.
                            </p>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                                    placeholder="My Supplement Stack"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[80px]"
                                    placeholder="What goals does this stack support?"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleCreateShare}
                                disabled={isCreating || activeSupplements.length === 0}
                                className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Link2 size={16} className="mr-2" />
                                        Create Share Link
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Existing Shares */}
                    {myShares.length > 0 && (
                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium mb-3">Your Shared Stacks</h4>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {myShares.map(share => (
                                    <div
                                        key={share.share_code}
                                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 text-sm"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{share.title}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Eye size={12} /> {share.view_count} views
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/shared/${share.share_code}`);
                                                }}
                                                className="p-2 rounded-md hover:bg-background"
                                                title="Copy link"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteShare(share.share_code)}
                                                className="p-2 rounded-md hover:bg-destructive/10 text-destructive"
                                                title="Delete share"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default PublicShareDialog;
