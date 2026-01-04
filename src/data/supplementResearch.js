// Supplement Research Data with Bioavailability Tips
// This provides research summaries and absorption guidance for common supplements

export const supplementResearch = {
    "magnesium": {
        aliases: ["magnesium glycinate", "magnesium citrate", "magnesium oxide", "magnesium threonate", "magnesium malate", "magnesium taurate", "mag glycinate", "mag citrate"],
        summary: "Essential mineral involved in 300+ enzymatic reactions. Supports muscle relaxation, sleep quality, nervous system function, and cardiovascular health.",
        keyBenefits: ["Sleep quality", "Muscle recovery", "Stress reduction", "Blood pressure regulation", "Energy production"],
        bioavailability: {
            takeWith: ["Vitamin D3", "Vitamin B6"],
            avoidWith: ["Calcium (separate by 2+ hours)", "High-dose Zinc"],
            timing: "Best taken in the evening",
            withFood: "Can be taken with or without food"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/magnesium/" }
        ]
    },
    "vitamin_d": {
        aliases: ["vitamin d3", "cholecalciferol", "d3", "vitamin d", "vit d3", "vit d"],
        summary: "Fat-soluble vitamin critical for calcium absorption, immune function, and mood regulation. Deficiency is extremely common, especially in northern latitudes.",
        keyBenefits: ["Bone health", "Immune support", "Mood regulation", "Muscle function", "Hormone optimization"],
        bioavailability: {
            takeWith: ["Vitamin K2 (essential)", "Fat-containing meal", "Magnesium"],
            avoidWith: [],
            timing: "Best taken in the morning with breakfast",
            withFood: "Take with fat for optimal absorption (up to 50% better)"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/vitamin-d/" }
        ]
    },
    "vitamin_k2": {
        aliases: ["vitamin k2", "k2", "mk-7", "mk-4", "menaquinone"],
        summary: "Fat-soluble vitamin that directs calcium to bones and away from arteries. Essential cofactor when supplementing Vitamin D.",
        keyBenefits: ["Bone density", "Cardiovascular health", "Calcium metabolism", "Arterial health"],
        bioavailability: {
            takeWith: ["Vitamin D3", "Fat-containing meal"],
            avoidWith: ["Blood thinners (consult doctor)"],
            timing: "Take with Vitamin D3",
            withFood: "Take with fat for optimal absorption"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/vitamin-k/" }
        ]
    },
    "omega_3": {
        aliases: ["omega-3", "fish oil", "epa", "dha", "omega 3", "fish oils", "krill oil", "algae oil"],
        summary: "Essential fatty acids crucial for brain health, reducing inflammation, and cardiovascular function. Most people are deficient in EPA/DHA.",
        keyBenefits: ["Brain health", "Heart health", "Anti-inflammatory", "Joint support", "Eye health"],
        bioavailability: {
            takeWith: ["Fat-containing meal"],
            avoidWith: ["Blood thinners (high doses)"],
            timing: "Can be taken any time with food",
            withFood: "Always take with food to reduce fishy burps and improve absorption"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/fish-oil/" }
        ]
    },
    "creatine": {
        aliases: ["creatine monohydrate", "creatine hcl", "creatine"],
        summary: "One of the most well-researched supplements. Enhances ATP production for improved strength, power, and cognitive function.",
        keyBenefits: ["Strength gains", "Power output", "Muscle recovery", "Cognitive function", "Hydration"],
        bioavailability: {
            takeWith: ["Carbohydrates (optional, may enhance uptake)"],
            avoidWith: ["Caffeine (may reduce uptake, but effects still work)"],
            timing: "Timing doesn't matter; consistency is key",
            withFood: "Can be taken with or without food"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/creatine/" }
        ]
    },
    "zinc": {
        aliases: ["zinc", "zinc picolinate", "zinc citrate", "zinc gluconate", "zinc oxide"],
        summary: "Essential mineral for immune function, testosterone production, wound healing, and protein synthesis.",
        keyBenefits: ["Immune function", "Testosterone support", "Wound healing", "Taste/smell", "Protein synthesis"],
        bioavailability: {
            takeWith: ["Copper (if taking long-term)", "Food"],
            avoidWith: ["Calcium", "Iron", "High-fiber foods", "Phytates"],
            timing: "Take with a meal",
            withFood: "Take with food to prevent nausea"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/zinc/" }
        ]
    },
    "ashwagandha": {
        aliases: ["ashwagandha", "ksm-66", "sensoril", "withania somnifera"],
        summary: "Adaptogenic herb that reduces cortisol, anxiety, and stress while supporting thyroid function and testosterone.",
        keyBenefits: ["Stress reduction", "Anxiety relief", "Sleep quality", "Testosterone support", "Thyroid function"],
        bioavailability: {
            takeWith: ["Black pepper (enhances absorption)", "Fat-containing meal"],
            avoidWith: ["Thyroid medication (separate by 4+ hours)"],
            timing: "Can be taken morning or evening",
            withFood: "Take with food for better absorption"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/ashwagandha/" }
        ]
    },
    "vitamin_c": {
        aliases: ["vitamin c", "ascorbic acid", "vit c", "liposomal vitamin c"],
        summary: "Water-soluble antioxidant essential for immune function, collagen synthesis, and iron absorption.",
        keyBenefits: ["Immune support", "Collagen production", "Antioxidant", "Iron absorption", "Wound healing"],
        bioavailability: {
            takeWith: ["Iron (enhances iron absorption)"],
            avoidWith: ["Vitamin B12 (may reduce B12 absorption)"],
            timing: "Split doses throughout the day for best absorption",
            withFood: "Can be taken with or without food"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/vitamin-c/" }
        ]
    },
    "b_complex": {
        aliases: ["b complex", "b-complex", "vitamin b", "b vitamins", "b12", "vitamin b12", "methylcobalamin", "b6", "folate", "folic acid"],
        summary: "Group of essential vitamins for energy production, nervous system function, and methylation.",
        keyBenefits: ["Energy production", "Nervous system", "Mood support", "Red blood cell formation", "Methylation"],
        bioavailability: {
            takeWith: ["Food"],
            avoidWith: [],
            timing: "Best taken in the morning (may cause energy boost)",
            withFood: "Take with food to prevent nausea"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/vitamin-b12/" }
        ]
    },
    "iron": {
        aliases: ["iron", "ferrous sulfate", "iron bisglycinate", "ferritin"],
        summary: "Essential mineral for oxygen transport, energy production, and cognitive function. Common deficiency in women and vegetarians.",
        keyBenefits: ["Oxygen transport", "Energy levels", "Cognitive function", "Immune function"],
        bioavailability: {
            takeWith: ["Vitamin C (significantly enhances absorption)"],
            avoidWith: ["Calcium", "Coffee/tea", "Dairy", "Zinc", "Antacids"],
            timing: "Best taken on empty stomach if tolerated",
            withFood: "Empty stomach is best, but take with food if causes nausea"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/iron/" }
        ]
    },
    "probiotics": {
        aliases: ["probiotics", "probiotic", "lactobacillus", "bifidobacterium", "gut health"],
        summary: "Live beneficial bacteria that support gut health, immune function, and mental well-being via the gut-brain axis.",
        keyBenefits: ["Gut health", "Immune function", "Mental health", "Nutrient absorption", "Digestion"],
        bioavailability: {
            takeWith: ["Prebiotic fiber (optional)"],
            avoidWith: ["Antibiotics (separate by 2+ hours)"],
            timing: "Best taken on empty stomach or before meals",
            withFood: "Take 30 minutes before a meal"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/probiotic/" }
        ]
    },
    "coq10": {
        aliases: ["coq10", "ubiquinol", "ubiquinone", "coenzyme q10"],
        summary: "Antioxidant essential for cellular energy production. Levels decline with age and statin use.",
        keyBenefits: ["Cellular energy", "Heart health", "Antioxidant", "Statin side effect reduction", "Anti-aging"],
        bioavailability: {
            takeWith: ["Fat-containing meal", "PQQ (synergistic)"],
            avoidWith: [],
            timing: "Take with largest meal of the day",
            withFood: "Always take with fat for optimal absorption"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/coenzyme-q10/" }
        ]
    },
    "l_theanine": {
        aliases: ["l-theanine", "theanine", "l theanine"],
        summary: "Amino acid from tea that promotes calm focus without drowsiness. Synergistic with caffeine.",
        keyBenefits: ["Calm focus", "Anxiety reduction", "Sleep quality", "Cognitive function"],
        bioavailability: {
            takeWith: ["Caffeine (synergistic for focus)"],
            avoidWith: [],
            timing: "Morning for focus, evening for sleep",
            withFood: "Can be taken with or without food"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/theanine/" }
        ]
    },
    "melatonin": {
        aliases: ["melatonin"],
        summary: "Hormone that regulates sleep-wake cycles. Useful for jet lag and sleep onset issues. Start with low doses.",
        keyBenefits: ["Sleep onset", "Circadian rhythm", "Jet lag", "Antioxidant"],
        bioavailability: {
            takeWith: [],
            avoidWith: ["Bright lights before bed"],
            timing: "30-60 minutes before bedtime",
            withFood: "Can be taken with or without food"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/melatonin/" }
        ]
    },
    "turmeric": {
        aliases: ["turmeric", "curcumin", "curcuma"],
        summary: "Powerful anti-inflammatory compound with low bioavailability unless enhanced with piperine or liposomal delivery.",
        keyBenefits: ["Anti-inflammatory", "Joint health", "Antioxidant", "Brain health", "Liver support"],
        bioavailability: {
            takeWith: ["Black pepper (piperine) - increases absorption 2000%", "Fat-containing meal"],
            avoidWith: ["Blood thinners (consult doctor)"],
            timing: "Take with meals",
            withFood: "Always take with fat and black pepper"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/curcumin/" }
        ]
    },
    "collagen": {
        aliases: ["collagen", "collagen peptides", "hydrolyzed collagen", "collagen protein"],
        summary: "Structural protein supporting skin, joints, and connective tissue. Hydrolyzed forms are best absorbed.",
        keyBenefits: ["Skin health", "Joint support", "Gut lining", "Hair/nails", "Bone density"],
        bioavailability: {
            takeWith: ["Vitamin C (enhances collagen synthesis)"],
            avoidWith: [],
            timing: "Any time; consistency matters most",
            withFood: "Can be mixed into any beverage"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/type-ii-collagen/" }
        ]
    },
    "beta_alanine": {
        aliases: ["beta-alanine", "beta alanine"],
        summary: "Amino acid that buffers lactic acid during high-intensity exercise. Causes harmless tingling sensation.",
        keyBenefits: ["Endurance", "Lactic acid buffering", "High-intensity performance", "Muscle fatigue reduction"],
        bioavailability: {
            takeWith: ["Food (reduces tingling)"],
            avoidWith: [],
            timing: "Timing doesn't matter; take daily for saturation",
            withFood: "Take with food to reduce tingling (paresthesia)"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/beta-alanine/" }
        ]
    },
    "caffeine": {
        aliases: ["caffeine", "coffee", "caffeine anhydrous"],
        summary: "Stimulant that enhances alertness, focus, and physical performance. Tolerance develops with regular use.",
        keyBenefits: ["Alertness", "Focus", "Physical performance", "Fat oxidation"],
        bioavailability: {
            takeWith: ["L-Theanine (smooths out jitters)"],
            avoidWith: ["Creatine (may reduce creatine uptake)"],
            timing: "Avoid within 8-10 hours of bedtime",
            withFood: "Can be taken with or without food"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/caffeine/" }
        ]
    },
    "glycine": {
        aliases: ["glycine"],
        summary: "Amino acid that improves sleep quality, supports collagen synthesis, and acts as an inhibitory neurotransmitter.",
        keyBenefits: ["Sleep quality", "Collagen support", "Nervous system", "Blood sugar regulation"],
        bioavailability: {
            takeWith: [],
            avoidWith: [],
            timing: "Before bed for sleep benefits",
            withFood: "Can be taken with or without food"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/glycine/" }
        ]
    },
    "alpha_gpc": {
        aliases: ["alpha-gpc", "alpha gpc", "choline"],
        summary: "Highly bioavailable choline source for cognitive enhancement and acetylcholine production.",
        keyBenefits: ["Cognitive function", "Memory", "Focus", "Power output"],
        bioavailability: {
            takeWith: ["Racetams (if using)"],
            avoidWith: [],
            timing: "Morning for cognitive benefits",
            withFood: "Can be taken with or without food"
        },
        researchLinks: [
            { title: "Examine.com", url: "https://examine.com/supplements/alpha-gpc/" }
        ]
    }
};

/**
 * Normalize a supplement name for lookup
 */
const normalizeSupplementName = (name) => {
    return name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim();
};

/**
 * Find matching supplement research by name
 */
export const findSupplementResearch = (supplementName) => {
    const normalized = normalizeSupplementName(supplementName);

    // Direct key match
    for (const [key, data] of Object.entries(supplementResearch)) {
        if (normalized.includes(key.replace(/_/g, ' ')) ||
            normalized.includes(key.replace(/_/g, ''))) {
            return { key, ...data };
        }

        // Check aliases
        if (data.aliases) {
            for (const alias of data.aliases) {
                if (normalized.includes(alias.toLowerCase()) ||
                    alias.toLowerCase().includes(normalized)) {
                    return { key, ...data };
                }
            }
        }
    }

    return null;
};

/**
 * Get bioavailability tips for a supplement
 */
export const getBioavailabilityTip = (supplementName) => {
    const research = findSupplementResearch(supplementName);
    return research?.bioavailability || null;
};

/**
 * Get research summary for a supplement
 */
export const getResearchSummary = (supplementName) => {
    const research = findSupplementResearch(supplementName);
    if (!research) return null;

    return {
        summary: research.summary,
        keyBenefits: research.keyBenefits,
        researchLinks: research.researchLinks
    };
};

export default supplementResearch;
