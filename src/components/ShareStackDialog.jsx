import React, { useState } from 'react';
import { Share2, Download, X, Sun, Moon, FileText, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useAuth } from '../context/AuthContext';
import { useSettings } from './SettingsContext';

const ShareStackDialog = ({ open, onOpenChange, supplements }) => {
    const { user, token } = useAuth();
    const { settings, aiStatus } = useSettings();
    const [isGenerating, setIsGenerating] = useState(false);
    const [includeAI, setIncludeAI] = useState(false);

    // Filter stacks
    const morningStack = supplements.filter(s => s.schedule?.am && !s.archived);
    const nightStack = supplements.filter(s => s.schedule?.pm && !s.archived);

    const generatePDF = async () => {
        setIsGenerating(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let yPosition = 20;

            // Helper function for adding lines
            const addLine = (text, fontSize = 11, isBold = false, color = [0, 0, 0]) => {
                doc.setFontSize(fontSize);
                doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                doc.setTextColor(...color);
                const lines = doc.splitTextToSize(text, contentWidth);
                lines.forEach(line => {
                    if (yPosition > 270) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    doc.text(line, margin, yPosition);
                    yPosition += fontSize * 0.5;
                });
                yPosition += 2;
            };

            // Header
            doc.setFillColor(59, 130, 246);
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('DAILY SUPPLEMENT PROTOCOL', pageWidth / 2, 22, { align: 'center' });

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Patient: ${user?.username || 'Unknown'}`, pageWidth / 2, 32, { align: 'center' });

            yPosition = 50;

            // Date
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(10);
            const dateStr = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            doc.text(`Generated: ${dateStr}`, margin, yPosition);
            yPosition += 15;

            // Morning Stack Section
            if (morningStack.length > 0) {
                doc.setFillColor(255, 247, 237);
                doc.rect(margin - 5, yPosition - 5, contentWidth + 10, 12, 'F');
                doc.setTextColor(234, 88, 12);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('☀ MORNING PROTOCOL', margin, yPosition + 4);
                yPosition += 18;

                morningStack.forEach((supplement) => {
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');

                    const displayName = supplement.shortName || supplement.name;
                    const pillCount = supplement.schedule?.amPills || 1;
                    const dosageInfo = supplement.dosage ? ` | ${supplement.dosage}` : '';
                    const pillText = ` | ${pillCount} ${pillCount === 1 ? 'pill' : 'pills'}`;

                    doc.text(`• ${displayName}${dosageInfo}${pillText}`, margin + 5, yPosition);
                    yPosition += 6;

                    if (supplement.reason) {
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'italic');
                        doc.setTextColor(100, 100, 100);
                        const reasonLines = doc.splitTextToSize(`Reason: ${supplement.reason}`, contentWidth - 10);
                        reasonLines.forEach(line => {
                            doc.text(line, margin + 10, yPosition);
                            yPosition += 5;
                        });
                    }
                    yPosition += 4;
                });
                yPosition += 8;
            }

            // Evening Stack Section
            if (nightStack.length > 0) {
                doc.setFillColor(238, 242, 255);
                doc.rect(margin - 5, yPosition - 5, contentWidth + 10, 12, 'F');
                doc.setTextColor(99, 102, 241);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('🌙 EVENING PROTOCOL', margin, yPosition + 4);
                yPosition += 18;

                nightStack.forEach((supplement) => {
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');

                    const displayName = supplement.shortName || supplement.name;
                    const pillCount = supplement.schedule?.pmPills || 1;
                    const dosageInfo = supplement.dosage ? ` | ${supplement.dosage}` : '';
                    const pillText = ` | ${pillCount} ${pillCount === 1 ? 'pill' : 'pills'}`;

                    doc.text(`• ${displayName}${dosageInfo}${pillText}`, margin + 5, yPosition);
                    yPosition += 6;

                    if (supplement.reason) {
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'italic');
                        doc.setTextColor(100, 100, 100);
                        const reasonLines = doc.splitTextToSize(`Reason: ${supplement.reason}`, contentWidth - 10);
                        reasonLines.forEach(line => {
                            doc.text(line, margin + 10, yPosition);
                            yPosition += 5;
                        });
                    }
                    yPosition += 4;
                });
            }

            // AI Analysis Section
            if (includeAI) {
                try {
                    // Check page break before starting AI section
                    if (yPosition > 200) {
                        doc.addPage();
                        yPosition = 20;
                    } else {
                        yPosition += 10;
                    }

                    doc.setFillColor(240, 253, 244);
                    doc.rect(margin - 5, yPosition - 5, contentWidth + 10, 12, 'F');
                    doc.setTextColor(21, 128, 61);
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('🤖 AI SAFETY ANALYSIS', margin, yPosition + 4);
                    yPosition += 18;

                    // Fetch Analysis
                    const fullStackNames = supplements.filter(s => !s.archived).map(s => s.name);
                    const prompt = `
                        Analyze this supplement stack strictly for NEGATIVE INTERACTIONS and SAFETY WARNINGS.
                        STACK: ${fullStackNames.join(', ')}
                        Provide the response in JSON format with keys: "interactions" (array of objects with severity, substances, description) and "summary".
                    `;

                    const response = await fetch("/api/ai/analyze", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ model: settings.aiModel, prompt })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const content = data.choices[0].message.content;
                        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
                        const result = JSON.parse(cleanContent);

                        // Summary
                        doc.setTextColor(0, 0, 0);
                        doc.setFontSize(11);
                        doc.setFont('helvetica', 'bold');
                        doc.text('Summary:', margin, yPosition);
                        yPosition += 5;

                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'normal');
                        const summaryLines = doc.splitTextToSize(result.summary, contentWidth);
                        summaryLines.forEach(line => {
                            if (yPosition > 270) { doc.addPage(); yPosition = 20; }
                            doc.text(line, margin, yPosition);
                            yPosition += 5;
                        });
                        yPosition += 8;

                        // Interactions
                        if (result.interactions && result.interactions.length > 0) {
                            doc.setFontSize(11);
                            doc.setFont('helvetica', 'bold');
                            doc.text('Potential Interactions:', margin, yPosition);
                            yPosition += 6;

                            result.interactions.forEach(item => {
                                if (yPosition > 260) { doc.addPage(); yPosition = 20; }

                                doc.setFontSize(10);
                                doc.setFont('helvetica', 'bold');
                                // Color code based on severity
                                if (item.severity === 'HIGH') doc.setTextColor(220, 38, 38);
                                else if (item.severity === 'MODERATE') doc.setTextColor(234, 88, 12);
                                else doc.setTextColor(37, 99, 235);

                                doc.text(`• ${item.severity}: ${item.substances.join(' + ')}`, margin, yPosition);
                                yPosition += 5;

                                doc.setTextColor(60, 60, 60);
                                doc.setFont('helvetica', 'normal');
                                const descLines = doc.splitTextToSize(item.description, contentWidth - 5);
                                descLines.forEach(line => {
                                    doc.text(line, margin + 5, yPosition);
                                    yPosition += 5;
                                });
                                yPosition += 3;
                            });
                        } else {
                            doc.setTextColor(22, 163, 74);
                            doc.text('✓ No clear negative interactions identified.', margin, yPosition);
                            yPosition += 10;
                        }

                        // Disclaimer
                        yPosition += 5;
                        doc.setFontSize(8);
                        doc.setTextColor(150, 150, 150);
                        doc.setFont('helvetica', 'italic');
                        doc.text("Disclaimer: AI analysis is for informational purposes only and not medical advice.", margin, yPosition);
                    }
                } catch (error) {
                    console.error("AI Analysis failed", error);
                    doc.setTextColor(220, 38, 38);
                    doc.text("Error generating AI analysis.", margin, yPosition);
                }
            }

            // Footer
            const footerY = doc.internal.pageSize.getHeight() - 15;
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal'); // Reset font
            doc.text('Generated by OptiStack - Supplement & Medication Manager', pageWidth / 2, footerY, { align: 'center' });

            // Download
            const filename = `supplement-protocol-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);

        } catch (error) {
            console.error('PDF generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const hasSomething = morningStack.length > 0 || nightStack.length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        Share Stack with Doctor
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                        Generate a professional PDF of your daily supplement protocol to share with your healthcare provider.
                    </p>

                    {!hasSomething ? (
                        <div className="p-4 bg-muted/50 rounded-lg text-center">
                            <p className="text-muted-foreground text-sm">
                                No supplements scheduled. Assign AM or PM schedules to your supplements first.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Preview */}
                            <div className="border rounded-lg p-4 bg-card space-y-4">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Patient: {user?.username}</span>
                                    <span>{new Date().toLocaleDateString()}</span>
                                </div>

                                {morningStack.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 text-orange-500 font-medium text-sm mb-2">
                                            <Sun size={14} />
                                            Morning ({morningStack.length})
                                        </div>
                                        <ul className="text-xs space-y-1 text-muted-foreground">
                                            {morningStack.slice(0, 3).map(s => (
                                                <li key={s.id}>• {s.shortName || s.name}{s.dosage && ` - ${s.dosage}`}</li>
                                            ))}
                                            {morningStack.length > 3 && (
                                                <li className="italic">...and {morningStack.length - 3} more</li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {nightStack.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 text-indigo-500 font-medium text-sm mb-2">
                                            <Moon size={14} />
                                            Evening ({nightStack.length})
                                        </div>
                                        <ul className="text-xs space-y-1 text-muted-foreground">
                                            {nightStack.slice(0, 3).map(s => (
                                                <li key={s.id}>• {s.shortName || s.name}{s.dosage && ` - ${s.dosage}`}</li>
                                            ))}
                                            {nightStack.length > 3 && (
                                                <li className="italic">...and {nightStack.length - 3} more</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {aiStatus.available && (
                                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30 mb-4">
                                    <input
                                        type="checkbox"
                                        id="includeAI"
                                        checked={includeAI}
                                        onChange={(e) => setIncludeAI(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="includeAI" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                                        <Sparkles size={14} className="text-purple-500" />
                                        Include AI Safety Analysis
                                    </label>
                                </div>
                            )}

                            <button
                                onClick={generatePDF}
                                disabled={isGenerating}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                {isGenerating ? (
                                    <>Generating...</>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        Download PDF
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ShareStackDialog;
