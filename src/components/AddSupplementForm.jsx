import React, { useState } from 'react';
import { Plus, Link as LinkIcon, DollarSign, Activity, Sparkles, AlertTriangle, Download, X, Save, Sun, Moon, AlertCircle, Info, Clock, Timer } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

const AddSupplementForm = ({ onAdd, onUpdate, onCancel, initialData }) => {
    const defaultState = {
        name: '',
        shortName: '',
        link: '',
        price: '',
        quantity: '',
        dosage: '',
        unitType: 'pills',
        schedule: { am: false, pm: false, amPills: 1, pmPills: 1 },
        reason: '',
        aiAnalysis: '',
        aiTimingRecommendation: '',
        recommendedDosage: '',
        sideEffects: '',
        rating: '',
        cycle: { onDays: '', offDays: '', startDate: '' },
        timing: { type: 'fixed', offsetMinutes: 0 }
    };



    const [formData, setFormData] = useState(defaultState);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultState,
                ...initialData,
                timing: initialData.timing || defaultState.timing
            });
        } else {
            setFormData(defaultState);
        }
        setError(null);
    }, [initialData]);
    const { settings, wakeTime } = useSettings();
    const { token } = useAuth();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [aiCycleRecommendation, setAiCycleRecommendation] = useState('');

    // Helper for offset to HH:MM display
    const getOffsetDisplay = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const handleOffsetChange = (h, m) => {
        const totalMinutes = (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
        setFormData(prev => ({
            ...prev,
            timing: { ...prev.timing, offsetMinutes: totalMinutes }
        }));
    };

    const ensureProtocol = (url) => {
        if (!url) return url;
        if (!/^https?:\/\//i.test(url)) {
            return `https://${url}`;
        }
        return url;
    };

    const handleUrlBlur = () => {
        setFormData(prev => ({
            ...prev,
            link: ensureProtocol(prev.link)
        }));
    };

    const fetchProductDetails = async () => {
        if (!formData.link) return;

        // Ensure protocol before fetching
        const validLink = ensureProtocol(formData.link);
        if (validLink !== formData.link) {
            setFormData(prev => ({ ...prev, link: validLink }));
        }

        setIsFetching(true);
        try {
            // Use the proxy to call our backend
            const response = await fetch(`/api/scrape?url=${encodeURIComponent(validLink)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch details');
            }

            const data = await response.json();

            setFormData(prev => ({
                ...prev,
                name: data.name || prev.name,
                price: data.price ? String(data.price) : prev.price,
                dosage: data.dosage || prev.dosage,
                quantity: data.quantity ? String(data.quantity) : prev.quantity,
                unitType: data.unitType || prev.unitType
            }));
        } catch (error) {
            console.error("Fetch failed:", error);
            setError("Could not extract product details. Please fill manually.");
        } finally {
            setIsFetching(false);
        }
    };

    const analyzeSupplement = async () => {
        if (!formData.name) return;

        const model = settings.aiModel;

        let promptTemplate = settings.prompts?.individual_analysis;
        if (!promptTemplate) {
            // Fallback if settings haven't loaded yet or key missing
            promptTemplate = `Analyze the supplement "\${name}". 
            My average wake time is \${wakeTime}.
            
            Return a JSON object with these keys:
            - "shortName": Clean ingredient name.
            - "aiAnalysis": Short summary of benefits.
            - "aiTimingRecommendation": A short, human-readable sentence on when to take this (e.g. "Take 30 minutes after waking for cortisol management" or "Take with dinner").
            - "recommendedDosage": Standard dosage.
            - "sideEffects": Potential side effects.
            - "cycleRecommendation": Object with "onDays" (number) and "offDays" (number) if cycling is common, else null.
            - "timing": Object with:
                - "type": "fixed" (for standard AM/PM) or "relative_wake" (if best taken relative to waking, e.g. cortisol support, morning energy).
                - "offsetMinutes": Number (minutes after wake time, use 0 for immediately upon waking).
                - "fixedSchedule": Object with "am" (boolean) and "pm" (boolean) - ONLY used if type is "fixed".

            If the supplement is best taken in the morning to align with circadian rhythm (e.g. Vitamin D, B-Vitamins, Cortisol managers), prefer "relative_wake" with appropriate offset.
            Do not include markdown.`;
        }

        const prompt = promptTemplate
            .replace(/\${name}/g, formData.name)
            .replace(/\${wakeTime}/g, wakeTime);

        setIsAnalyzing(true);
        setError(null);
        try {
            const response = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    format: 'json'
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0]) {
                throw new Error("Invalid AI response: No choices returned");
            }

            const content = data.choices[0].message.content;

            // Parse JSON from content - Robust parsing logic
            let cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

            const firstBrace = cleanContent.indexOf('{');
            const lastBrace = cleanContent.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
            }

            const result = JSON.parse(cleanContent);

            let newSchedule = {
                am: false,
                pm: false,
                amPills: formData.schedule?.amPills || 1,
                pmPills: formData.schedule?.pmPills || 1
            };

            let newTiming = { type: 'fixed', offsetMinutes: 0 };

            // Handle new timing format
            if (result.timing) {
                if (result.timing.type === 'relative_wake') {
                    newTiming = {
                        type: 'relative_wake',
                        offsetMinutes: result.timing.offsetMinutes || 0
                    };
                    // Clear fixed schedule
                    newSchedule.am = false;
                    newSchedule.pm = false;
                } else {
                    // Fixed timing
                    newTiming = { type: 'fixed', offsetMinutes: 0 };
                    if (result.timing.fixedSchedule) {
                        newSchedule.am = result.timing.fixedSchedule.am || false;
                        newSchedule.pm = result.timing.fixedSchedule.pm || false;
                    }
                    // Fallback to "bestTime" if new format fails or valid old format exists (though model should follow prompt)
                    else if (result.bestTime) {
                        if (result.bestTime === 'AM' || result.bestTime === 'Both') newSchedule.am = true;
                        if (result.bestTime === 'PM' || result.bestTime === 'Both') newSchedule.pm = true;
                    }
                }
            } else if (result.bestTime) {
                // Legacy fallback
                if (result.bestTime === 'Wake') {
                    newTiming = { type: 'relative_wake', offsetMinutes: 30 };
                } else {
                    if (result.bestTime === 'AM' || result.bestTime === 'Both') newSchedule.am = true;
                    if (result.bestTime === 'PM' || result.bestTime === 'Both') newSchedule.pm = true;
                }
            }

            let finalDosage = result.recommendedDosage || '';
            // Add timing context to dosage if useful
            if (newTiming.type === 'relative_wake') {
                finalDosage += ` (Best taken ${newTiming.offsetMinutes === 0 ? 'upon waking' : `${newTiming.offsetMinutes} mins after waking`})`;
            }

            // Handle cycle info separately
            let analysisSummary = result.aiAnalysis || '';
            let cycleText = '';

            if (result.cycleRecommendation?.onDays && result.cycleRecommendation?.offDays) {
                cycleText = `Recommended Cycle: ${result.cycleRecommendation.onDays} days on, ${result.cycleRecommendation.offDays} days off.`;
            } else {
                cycleText = "No cycling required.";
            }
            setAiCycleRecommendation(cycleText);

            setFormData(prev => ({
                ...prev,
                shortName: result.shortName || prev.name,
                name: result.shortName || prev.name,
                aiAnalysis: analysisSummary,
                aiTimingRecommendation: result.aiTimingRecommendation || '',
                recommendedDosage: finalDosage,
                sideEffects: result.sideEffects || '',
                schedule: newSchedule,
                timing: newTiming,
                cycle: result.cycleRecommendation ? {
                    onDays: result.cycleRecommendation.onDays,
                    offDays: result.cycleRecommendation.offDays,
                    startDate: new Date().toISOString().split('T')[0]
                } : prev.cycle
            }));
        } catch (error) {
            console.error("AI Analysis failed:", error);
            let message = error.message;
            try {
                if (message.includes('{')) {
                    const jsonPart = message.substring(message.indexOf('{'));
                    const parsed = JSON.parse(jsonPart);
                    if (parsed.error && parsed.error.message) {
                        message = parsed.error.message;
                    }
                }
            } catch (e) { }
            setError(`Analysis failed: ${message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const submissionData = {
            ...formData,
            price: parseFloat(formData.price) || 0,
            quantity: formData.quantity ? parseFloat(formData.quantity) : null,
            unitType: formData.unitType,
            rating: formData.rating ? parseInt(formData.rating) : 0,
            cycle: {
                onDays: formData.cycle.onDays ? parseInt(formData.cycle.onDays) : null,
                offDays: formData.cycle.offDays ? parseInt(formData.cycle.offDays) : null,
                startDate: formData.cycle.startDate || null
            },
            timing: {
                type: formData.timing.type,
                offsetMinutes: parseInt(formData.timing.offsetMinutes) || 0
            }
        };

        try {
            if (initialData) {
                await onUpdate(submissionData);
            } else {
                await onAdd({
                    ...submissionData,
                    id: Date.now().toString()
                });
                setFormData(defaultState);
            }
        } catch (err) {
            console.error("Submission failed:", err);
            setError("Failed to save supplement. Please try again.");
        }
    };

    const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>{error}</span>
                        <button type="button" onClick={() => setError(null)} className="ml-2 hover:bg-destructive/10 rounded-full p-1">
                            <X size={14} />
                        </button>
                    </AlertDescription>
                </Alert>
            )}
            <div className="space-y-5">
                <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                        Supplement Name <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        className={inputClassName}
                        placeholder="e.g. Magnesium Glycinate"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Price ($)</label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="number"
                                step="0.01"
                                className={`${inputClassName} pl-9`}
                                placeholder="0.00"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-1 mb-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Quantity / Unit</label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info size={14} className="text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Total amount in container (count or weight)</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min="0.1"
                                step="any"
                                className={inputClassName}
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                placeholder="e.g. 500"
                            />
                            <select
                                className={`${inputClassName} w-[110px]`}
                                value={formData.unitType}
                                onChange={e => setFormData({ ...formData, unitType: e.target.value })}
                            >
                                <option value="pills">Pills</option>
                                <option value="grams">Grams</option>
                                <option value="mg">mg</option>
                                <option value="ml">ml</option>
                                <option value="oz">oz</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                            Dosage <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            className={inputClassName}
                            placeholder="e.g. 500mg"
                            value={formData.dosage}
                            onChange={e => setFormData({ ...formData, dosage: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-1 mb-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Personal Rating</label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info size={14} className="text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Rate from 1 to 5 stars</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            className={inputClassName}
                            value={formData.rating}
                            onChange={e => setFormData({ ...formData, rating: e.target.value })}
                            placeholder="-"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Product Link</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="url"
                                className={`${inputClassName} pl-9`}
                                placeholder="https://..."
                                value={formData.link}
                                onChange={e => setFormData({ ...formData, link: e.target.value })}
                                onBlur={handleUrlBlur}
                            />
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={fetchProductDetails}
                                    disabled={isFetching || !formData.link}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                >
                                    <Download size={16} className="mr-2" />
                                    {isFetching ? 'Fetching...' : 'Fetch'}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Auto-fill details from URL</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Timing Strategy Selection */}
                <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
                    <label className="text-sm font-medium leading-none mb-2 block flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Timer size={16} /> Timing Strategy
                        </div>
                        {/* Toggle Style Switch */}
                        <div className="flex bg-muted rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, timing: { ...prev.timing, type: 'fixed' } }))}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${formData.timing?.type !== 'relative_wake' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Standard (AM/PM)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, timing: { ...prev.timing, type: 'relative_wake' } }))}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${formData.timing?.type === 'relative_wake' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Bio-Rhythm
                            </button>
                        </div>
                    </label>

                    {formData.timing?.type === 'relative_wake' ? (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="mb-3 text-xs text-muted-foreground bg-blue-50/50 p-2 rounded border border-blue-100 flex gap-2 items-center">
                                <Activity size={12} className="text-blue-600" />
                                <span>Based on your Wake Time (<strong>{wakeTime}</strong>)</span>
                            </div>

                            <div className="flex items-end gap-3">
                                <div>
                                    <label className="text-xs font-medium mb-1.5 block">Time after waking</label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="23"
                                                className={`${inputClassName} w-16 text-center`}
                                                value={Math.floor((formData.timing?.offsetMinutes || 0) / 60)}
                                                onChange={e => handleOffsetChange(e.target.value, (formData.timing?.offsetMinutes || 0) % 60)}
                                            />
                                            <span className="text-[10px] text-muted-foreground absolute -bottom-4 left-1/2 -translate-x-1/2">Hours</span>
                                        </div>
                                        <span className="text-muted-foreground font-bold pb-4">:</span>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                className={`${inputClassName} w-16 text-center`}
                                                value={(formData.timing?.offsetMinutes || 0) % 60}
                                                onChange={e => handleOffsetChange(Math.floor((formData.timing?.offsetMinutes || 0) / 60), e.target.value)}
                                            />
                                            <span className="text-[10px] text-muted-foreground absolute -bottom-4 left-1/2 -translate-x-1/2">Mins</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pb-1 text-sm text-foreground/70 font-medium">
                                    {(formData.timing?.offsetMinutes || 0) > 0 ? (
                                        <>≈ {(() => {
                                            const [wh, wm] = wakeTime.split(':').map(Number);
                                            const totalOffset = (wh * 60) + wm + (formData.timing?.offsetMinutes || 0);
                                            const h = Math.floor(totalOffset / 60) % 24;
                                            const m = totalOffset % 60;
                                            const ampm = h >= 12 ? 'PM' : 'AM';
                                            const dh = h % 12 || 12;
                                            // Format 2 digits
                                            const dm = m < 10 ? `0${m}` : m;
                                            return `${dh}:${dm} ${ampm}`;
                                        })()}</>
                                    ) : (
                                        "Upon Waking"
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-4 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2">
                                <label className={`
                                flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer transition-all
                                ${formData.schedule?.am ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-background border-input text-muted-foreground hover:bg-accent'}
                            `}>
                                    <input
                                        type="checkbox"
                                        checked={formData.schedule?.am || false}
                                        onChange={e => setFormData({ ...formData, schedule: { ...formData.schedule, am: e.target.checked } })}
                                        className="hidden"
                                    />
                                    <Sun size={16} /> AM
                                </label>
                                {formData.schedule?.am && (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="any"
                                            className={`${inputClassName} w-[70px] text-center px-1`}
                                            value={formData.schedule?.amPills || 1}
                                            onChange={e => setFormData({ ...formData, schedule: { ...formData.schedule, amPills: parseFloat(e.target.value) || 1 } })}
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formData.unitType === 'pills' ? 'pills' : formData.unitType}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <label className={`
                                flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer transition-all
                                ${formData.schedule?.pm ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-background border-input text-muted-foreground hover:bg-accent'}
                            `}>
                                    <input
                                        type="checkbox"
                                        checked={formData.schedule?.pm || false}
                                        onChange={e => setFormData({ ...formData, schedule: { ...formData.schedule, pm: e.target.checked } })}
                                        className="hidden"
                                    />
                                    <Moon size={16} /> PM
                                </label>
                                {formData.schedule?.pm && (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="any"
                                            className={`${inputClassName} w-[70px] text-center px-1`}
                                            value={formData.schedule?.pmPills || 1}
                                            onChange={e => setFormData({ ...formData, schedule: { ...formData.schedule, pmPills: parseFloat(e.target.value) || 1 } })}
                                        />
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formData.unitType === 'pills' ? 'pills' : formData.unitType}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cycle Manager Config */}
                <div className="rounded-lg border bg-card p-4">
                    <label className="text-sm font-medium leading-none mb-3 block flex items-center gap-2">
                        <Activity size={16} /> Cycle / Schedule (Optional)
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Days On</label>
                            <input
                                type="number"
                                min="1"
                                className={inputClassName}
                                placeholder="e.g. 5"
                                value={formData.cycle?.onDays || ''}
                                onChange={e => setFormData({ ...formData, cycle: { ...formData.cycle, onDays: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Days Off</label>
                            <input
                                type="number"
                                min="0"
                                className={inputClassName}
                                placeholder="e.g. 2"
                                value={formData.cycle?.offDays || ''}
                                onChange={e => setFormData({ ...formData, cycle: { ...formData.cycle, offDays: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                            <input
                                type="date"
                                className={inputClassName}
                                value={formData.cycle?.startDate || ''}
                                onChange={e => setFormData({ ...formData, cycle: { ...formData.cycle, startDate: e.target.value } })}
                            />
                        </div>
                    </div>
                    {(formData.cycle?.onDays && formData.cycle?.offDays) && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Cycle: {formData.cycle.onDays} days active, {formData.cycle.offDays} days break.
                        </p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block text-primary">Taking it for?</label>
                    <textarea
                        className={`${inputClassName} min-h-[80px] resize-y`}
                        placeholder="Why are you taking this? e.g. Sleep quality"
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    />
                </div>

                {/* AI Section */}
                {settings.aiEnabled && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                                <Sparkles size={14} className="text-primary" /> AI Analysis
                            </label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={analyzeSupplement}
                                        disabled={isAnalyzing || !formData.name}
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-primary text-primary hover:bg-primary/10 h-7 px-3"
                                    >
                                        {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Analyze ingredients using AI</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <textarea
                            className={`${inputClassName} min-h-[60px] bg-background text-foreground`}
                            placeholder="AI will generate a summary here..."
                            value={formData.aiAnalysis}
                            readOnly
                        />

                        {formData.aiTimingRecommendation && (
                            <div className="mt-3">
                                <label className="text-xs font-medium text-blue-500 block mb-1">Timing Recommendation</label>
                                <textarea
                                    className={`${inputClassName} min-h-[40px] bg-background text-foreground border-blue-200 focus-visible:ring-blue-500/20`}
                                    placeholder="When to take this..."
                                    value={formData.aiTimingRecommendation}
                                    readOnly
                                />
                            </div>
                        )}

                        <div className="mt-3">
                            <label className="text-xs font-medium text-purple-500 block mb-1">Recommended Dosage</label>
                            <textarea
                                className={`${inputClassName} min-h-[40px] bg-background text-foreground border-purple-200 focus-visible:ring-purple-500/20`}
                                placeholder="Standard dosage range..."
                                value={formData.recommendedDosage}
                                readOnly
                            />
                        </div>

                        <div className="mt-3">
                            <label className="text-xs font-medium text-destructive block mb-1">Potential Side Effects</label>
                            <textarea
                                className={`${inputClassName} min-h-[60px] bg-background text-foreground border-destructive/30 focus-visible:ring-destructive/20`}
                                placeholder="AI will list precautions..."
                                value={formData.sideEffects}
                                readOnly
                            />
                        </div>

                        {aiCycleRecommendation && (
                            <div className="mt-3">
                                <label className="text-xs font-medium text-teal-600 block mb-1">Cycle Recommendation</label>
                                <div className={`${inputClassName} min-h-[40px] flex items-center bg-background text-foreground border-teal-200 text-sm`}>
                                    {aiCycleRecommendation}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-2 justify-end mt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                        {initialData ? <Save size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
                        {initialData ? 'Update Supplement' : 'Add to Stack'}
                    </button>
                </div>
            </div>
        </form >
    );
};

export default AddSupplementForm;
