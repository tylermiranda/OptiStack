import React, { useState } from 'react';
import { Plus, Link as LinkIcon, DollarSign, Activity, Sparkles, AlertTriangle, Download, X, Save, Sun, Moon, AlertCircle, Info } from 'lucide-react';
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
        recommendedDosage: '',
        sideEffects: '',
        rating: ''
    };

    const [formData, setFormData] = useState(defaultState);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData(defaultState);
        }
        setError(null);
    }, [initialData]);
    const { settings } = useSettings();
    const { token } = useAuth();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    const fetchProductDetails = async () => {
        if (!formData.link) return;

        setIsFetching(true);
        try {
            // Use the proxy to call our backend
            const response = await fetch(`/api/scrape?url=${encodeURIComponent(formData.link)}`, {
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
        const prompt = `Analyze the supplement "${formData.name}". Return a JSON object with five keys: "shortName" (clean name of the main ingredient, e.g. "Magnesium", remove brand/dosage), "aiAnalysis" (short summary, max 2 sentences), "recommendedDosage" (standard dosage range), "sideEffects" (concise list), and "bestTime" (string: strictly "AM", "PM", "Both", or "Any"). Do not include any markdown formatting, just raw JSON.`;

        setIsAnalyzing(true);
        setError(null);
        try {
            const response = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ model, prompt })
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

            // Parse JSON from content
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(cleanContent);

            let newSchedule = {
                am: false,
                pm: false,
                amPills: formData.schedule?.amPills || 1,
                pmPills: formData.schedule?.pmPills || 1
            };
            if (result.bestTime === 'AM' || result.bestTime === 'Both') newSchedule.am = true;
            if (result.bestTime === 'PM' || result.bestTime === 'Both') newSchedule.pm = true;

            let finalDosage = result.recommendedDosage || '';
            if (result.bestTime === 'Any') {
                finalDosage += " (Can be taken at any time)";
            } else if (result.bestTime) {
                // Optional: Add specific time text if needed, but badges cover AM/PM/Both
                // finalDosage += ` (Best taken in ${result.bestTime})`;
            }

            setFormData(prev => ({
                ...prev,
                shortName: result.shortName || prev.name,
                name: result.shortName || prev.name,
                aiAnalysis: result.aiAnalysis || '',
                recommendedDosage: finalDosage,
                sideEffects: result.sideEffects || '',
                schedule: newSchedule
            }));
        } catch (error) {
            console.error("AI Analysis failed:", error);
            let message = error.message;
            // Try to parse clean message from JSON error if possible
            try {
                if (message.includes('{')) {
                    const jsonPart = message.substring(message.indexOf('{'));
                    const parsed = JSON.parse(jsonPart);
                    if (parsed.error && parsed.error.message) {
                        message = parsed.error.message;
                    }
                }
            } catch (e) {
                // Keep original message
            }
            setError(`Analysis failed: ${message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const submissionData = {
            ...formData,
            price: parseFloat(formData.price) || 0,
            quantity: formData.quantity ? parseFloat(formData.quantity) : null,
            unitType: formData.unitType,
            rating: formData.rating ? parseInt(formData.rating) : 0
        };

        if (initialData) {
            onUpdate(submissionData);
        } else {
            onAdd({
                ...submissionData,
                id: Date.now().toString()
            });
            setFormData(defaultState);
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

                <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">Schedule</label>
                    <div className="flex gap-4 mt-2">
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
                </div>

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

                        <div className="mt-3">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Recommended Dosage</label>
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
