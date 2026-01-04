// Stack Templates - Curated supplement stacks for common goals
// Includes category-based templates and influencer stacks

export const stackTemplates = {
    categories: [
        {
            id: "performance",
            name: "Athletic Performance",
            icon: "Dumbbell",
            description: "Optimize training, recovery, and physical output",
            templates: [
                {
                    id: "endurance-athlete",
                    name: "Endurance Athlete Stack",
                    description: "Optimized for runners, cyclists, swimmers, and endurance sports. Focuses on sustained energy and recovery.",
                    supplements: [
                        { name: "Creatine Monohydrate", dosage: "5g", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "grams", reason: "Muscle endurance, power output, and faster recovery" },
                        { name: "Beta-Alanine", dosage: "3.2g", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "grams", reason: "Buffer lactic acid for longer high-intensity efforts" },
                        { name: "Electrolytes", dosage: "1 serving", schedule: { am: true, pm: true, amPills: 1, pmPills: 1 }, unitType: "pills", reason: "Maintain hydration and prevent cramping" },
                        { name: "Magnesium Glycinate", dosage: "400mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 2 }, unitType: "pills", reason: "Muscle recovery, sleep quality, and prevention of cramps" },
                        { name: "Omega-3 Fish Oil", dosage: "2g EPA/DHA", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "Reduce inflammation and support joint health" }
                    ]
                },
                {
                    id: "strength-power",
                    name: "Strength & Power Stack",
                    description: "For weightlifters and strength athletes focused on muscle and power development.",
                    supplements: [
                        { name: "Creatine Monohydrate", dosage: "5g", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "grams", reason: "Increased strength, power, and muscle cell hydration" },
                        { name: "Vitamin D3", dosage: "5000 IU", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Hormone optimization and muscle function" },
                        { name: "Zinc", dosage: "30mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 1 }, unitType: "pills", reason: "Testosterone support and recovery" },
                        { name: "Ashwagandha KSM-66", dosage: "600mg", schedule: { am: false, pm: true, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Reduce cortisol, support testosterone, improve recovery" },
                        { name: "Magnesium", dosage: "400mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 2 }, unitType: "pills", reason: "Muscle recovery and sleep quality" }
                    ]
                }
            ]
        },
        {
            id: "sleep",
            name: "Sleep & Recovery",
            icon: "Moon",
            description: "Improve sleep quality, duration, and recovery",
            templates: [
                {
                    id: "deep-sleep",
                    name: "Deep Sleep Stack",
                    description: "Optimize sleep quality and wake up refreshed. All supplements taken in the evening.",
                    supplements: [
                        { name: "Magnesium Glycinate", dosage: "400mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 2 }, unitType: "pills", reason: "Relaxation and sleep quality" },
                        { name: "L-Theanine", dosage: "200mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 1 }, unitType: "pills", reason: "Calm mind without drowsiness" },
                        { name: "Glycine", dosage: "3g", schedule: { am: false, pm: true, amPills: 0, pmPills: 1 }, unitType: "grams", reason: "Improve sleep quality and reduce time to fall asleep" },
                        { name: "Apigenin", dosage: "50mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 1 }, unitType: "pills", reason: "Natural sleep aid from chamomile" }
                    ]
                },
                {
                    id: "jet-lag-recovery",
                    name: "Jet Lag & Shift Work Stack",
                    description: "Reset circadian rhythm and adapt to new time zones or schedules.",
                    supplements: [
                        { name: "Melatonin", dosage: "0.5mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 1 }, unitType: "pills", reason: "Reset circadian rhythm (low dose is more effective)" },
                        { name: "Magnesium Glycinate", dosage: "400mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 2 }, unitType: "pills", reason: "Relaxation and sleep quality" },
                        { name: "L-Theanine", dosage: "200mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 1 }, unitType: "pills", reason: "Reduce anxiety and promote calm" }
                    ]
                }
            ]
        },
        {
            id: "focus",
            name: "Focus & Cognition",
            icon: "Brain",
            description: "Enhance mental clarity, memory, and productivity",
            templates: [
                {
                    id: "productivity-focus",
                    name: "Productivity & Focus Stack",
                    description: "Enhance focus, mental clarity, and sustained attention for deep work.",
                    supplements: [
                        { name: "L-Theanine", dosage: "200mg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Calm focus, especially synergistic with caffeine" },
                        { name: "Alpha-GPC", dosage: "300mg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Acetylcholine precursor for memory and focus" },
                        { name: "Lion's Mane", dosage: "1000mg", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "Nerve growth factor support and cognitive enhancement" },
                        { name: "Omega-3 Fish Oil", dosage: "2g EPA/DHA", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "Brain health and reduced inflammation" }
                    ]
                },
                {
                    id: "memory-learning",
                    name: "Memory & Learning Stack",
                    description: "Support memory formation, recall, and accelerated learning.",
                    supplements: [
                        { name: "Bacopa Monnieri", dosage: "300mg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Memory formation and retention" },
                        { name: "Lion's Mane", dosage: "1000mg", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "Neurogenesis and cognitive function" },
                        { name: "Omega-3 Fish Oil", dosage: "2g EPA/DHA", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "Brain structure and function" },
                        { name: "Phosphatidylserine", dosage: "100mg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Cell membrane health and memory" }
                    ]
                }
            ]
        },
        {
            id: "longevity",
            name: "Longevity & Healthspan",
            icon: "Heart",
            description: "Support healthy aging and long-term vitality",
            templates: [
                {
                    id: "foundation-longevity",
                    name: "Longevity Foundation Stack",
                    description: "Core supplements for healthy aging based on current longevity research.",
                    supplements: [
                        { name: "Vitamin D3", dosage: "5000 IU", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Immune function, bone health, and disease prevention" },
                        { name: "Vitamin K2 (MK-7)", dosage: "200mcg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Direct calcium to bones, protect arteries" },
                        { name: "Omega-3 Fish Oil", dosage: "2g EPA/DHA", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "Reduce inflammation and support cardiovascular health" },
                        { name: "Magnesium Glycinate", dosage: "400mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 2 }, unitType: "pills", reason: "Essential for 300+ enzymatic reactions" },
                        { name: "CoQ10 (Ubiquinol)", dosage: "100mg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Cellular energy and heart health" }
                    ]
                },
                {
                    id: "advanced-longevity",
                    name: "Advanced Longevity Stack",
                    description: "Research-backed compounds for those serious about longevity optimization.",
                    supplements: [
                        { name: "NMN (Nicotinamide Mononucleotide)", dosage: "500mg", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "NAD+ precursor for cellular energy and DNA repair" },
                        { name: "Resveratrol", dosage: "500mg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Sirtuin activation and antioxidant" },
                        { name: "Vitamin D3", dosage: "5000 IU", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Foundational health and immune function" },
                        { name: "Omega-3 Fish Oil", dosage: "2g EPA/DHA", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "Reduce inflammation" },
                        { name: "Quercetin", dosage: "500mg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Senolytic properties and immune support" }
                    ]
                }
            ]
        },
        {
            id: "influencer",
            name: "Influencer Stacks",
            icon: "Users",
            description: "Popular protocols from health and fitness influencers",
            disclaimer: "These stacks are based on publicly shared information. Always consult a healthcare provider before starting any supplement regimen.",
            templates: [
                {
                    id: "huberman-foundation",
                    name: "Huberman Foundation Stack",
                    description: "Based on Andrew Huberman's publicly shared supplement protocol from the Huberman Lab Podcast.",
                    attribution: "Source: Huberman Lab Podcast (hubermanlab.com)",
                    supplements: [
                        { name: "Vitamin D3", dosage: "5000 IU", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Immune function, mood, hormone support" },
                        { name: "Omega-3 (EPA/DHA)", dosage: "2g", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "Brain health, mood, inflammation" },
                        { name: "Magnesium Threonate", dosage: "145mg elemental", schedule: { am: false, pm: true, amPills: 0, pmPills: 2 }, unitType: "pills", reason: "Sleep, cognitive function (crosses blood-brain barrier)" },
                        { name: "L-Theanine", dosage: "200mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 1 }, unitType: "pills", reason: "Sleep onset (occasional use)" },
                        { name: "Apigenin", dosage: "50mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 1 }, unitType: "pills", reason: "Sleep quality (occasional use)" }
                    ]
                },
                {
                    id: "huberman-focus",
                    name: "Huberman Focus Protocol",
                    description: "Andrew Huberman's focus and cognitive enhancement supplements.",
                    attribution: "Source: Huberman Lab Podcast (hubermanlab.com)",
                    supplements: [
                        { name: "Alpha-GPC", dosage: "300mg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Acetylcholine for focus and memory" },
                        { name: "L-Tyrosine", dosage: "500mg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Dopamine precursor for motivation" },
                        { name: "Phenylethylamine", dosage: "500mg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Short-term focus boost" }
                    ]
                },
                {
                    id: "attia-longevity",
                    name: "Peter Attia Essentials",
                    description: "Core supplements discussed by Dr. Peter Attia on The Drive Podcast.",
                    attribution: "Source: The Drive Podcast (peterattiamd.com)",
                    supplements: [
                        { name: "Vitamin D3", dosage: "5000 IU", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Foundational health" },
                        { name: "Omega-3 (EPA/DHA)", dosage: "4g", schedule: { am: true, pm: true, amPills: 2, pmPills: 2 }, unitType: "pills", reason: "Cardiovascular and brain health (higher dose)" },
                        { name: "Magnesium", dosage: "400mg", schedule: { am: false, pm: true, amPills: 0, pmPills: 2 }, unitType: "pills", reason: "Essential mineral" },
                        { name: "Methylfolate + B12", dosage: "1000mcg each", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Methylation support" }
                    ]
                },
                {
                    id: "rogan-essentials",
                    name: "Joe Rogan Essentials",
                    description: "Commonly discussed supplements on The Joe Rogan Experience.",
                    attribution: "Source: The Joe Rogan Experience Podcast",
                    supplements: [
                        { name: "Athletic Greens (AG1)", dosage: "1 scoop", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "grams", reason: "Comprehensive daily greens and vitamins" },
                        { name: "Vitamin D3", dosage: "5000 IU", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Immune function" },
                        { name: "Omega-3 Fish Oil", dosage: "2g", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "Brain and joint health" },
                        { name: "Alpha Brain", dosage: "2 capsules", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "Cognitive enhancement (Onnit)" }
                    ]
                },
                {
                    id: "sinclair-longevity",
                    name: "David Sinclair Longevity",
                    description: "Longevity researcher Dr. David Sinclair's publicly shared protocol.",
                    attribution: "Source: Lifespan Podcast, interviews",
                    supplements: [
                        { name: "NMN", dosage: "1g", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "NAD+ precursor for cellular health" },
                        { name: "Resveratrol", dosage: "1g", schedule: { am: true, pm: false, amPills: 2, pmPills: 0 }, unitType: "pills", reason: "SIRT1 activation (take with fat)" },
                        { name: "Vitamin D3", dosage: "4000 IU", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Foundational health" },
                        { name: "Vitamin K2", dosage: "200mcg", schedule: { am: true, pm: false, amPills: 1, pmPills: 0 }, unitType: "pills", reason: "Calcium metabolism" },
                        { name: "Metformin", dosage: "1g", schedule: { am: false, pm: true, amPills: 0, pmPills: 1 }, unitType: "pills", reason: "AMPK activation (prescription, consult doctor)" }
                    ]
                }
            ]
        }
    ]
};

/**
 * Get all categories
 */
export const getCategories = () => {
    return stackTemplates.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        templateCount: cat.templates.length
    }));
};

/**
 * Get templates by category ID
 */
export const getTemplatesByCategory = (categoryId) => {
    const category = stackTemplates.categories.find(c => c.id === categoryId);
    return category ? category.templates : [];
};

/**
 * Get a specific template by ID
 */
export const getTemplateById = (templateId) => {
    for (const category of stackTemplates.categories) {
        const template = category.templates.find(t => t.id === templateId);
        if (template) {
            return {
                ...template,
                category: category.name,
                categoryId: category.id,
                disclaimer: category.disclaimer
            };
        }
    }
    return null;
};

/**
 * Get all influencer templates
 */
export const getInfluencerTemplates = () => {
    return getTemplatesByCategory('influencer');
};

export default stackTemplates;
