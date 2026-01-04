export const DEFAULT_PROMPTS = {
    individual_analysis: `Analyze the supplement "\${name}". 
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
Do not include markdown.`,

    stack_analysis: `Analyze this daily supplement protocol:

MORNING PROTOCOL (Fixed Time):
\${morningStack}

NIGHT PROTOCOL (Fixed Time):
\${nightStack}

BIO-RHYTHM OPTIMIZED (Relative to Wake Time):
\${relativeStack}

OTHER SUPPLEMENTS (No specific time):
\${otherStack}

Please provide a comprehensive analysis in JSON format with the following keys:
- "benefits": (Array of strings) Key expected health benefits of this specific combination.
- "synergies": (Array of strings) How these specific supplements work well together (e.g. Vit D and Magnesium).
- "potential_risks": (Array of strings) Negative interactions or timing issues (e.g. taking energizing things at night).
- "summary": (String) A 2-3 sentence overall assessment of this stack's goal and effectiveness.`,

    stack_optimizer: `You are a supplement optimization expert. Analyze this supplement stack and suggest MISSING COFACTORS or complementary supplements that would enhance absorption, effectiveness, or address common deficiency pairings.

CURRENT STACK:
- \${stackList}

For each recommendation, provide:
1. name: The supplement name (generic, not brand)
2. reason: A concise explanation of why it complements the existing stack (1-2 sentences)
3. priority: "ESSENTIAL" (critical cofactor), "RECOMMENDED" (notable benefit), or "OPTIONAL" (nice-to-have)
4. dosage_suggestion: A typical daily dosage range

Rules:
- Do NOT recommend supplements already in the stack
- Focus on scientifically-backed synergies (e.g., Vitamin D + K2, Zinc + Copper, Iron + Vitamin C)
- Maximum 5 suggestions, ordered by priority
- Return a JSON object with key "recommendations" containing an array`,

    interaction_checker: `Analyze this supplement stack strictly for NEGATIVE INTERACTIONS and SAFETY WARNINGS.

STACK: 
\${stackList}

Provide the response in STRICT JSON format. Do not include any markdown formatting, code blocks, or explanations outside the JSON.

Key requirements:
- Return ONLY a valid JSON object.
- Keys: "interactions" (array) and "summary" (string).
- "interactions" items: { "severity": "HIGH"/"MODERATE"/"LOW", "substances": ["name1", "name2"], "description": "text" }
- If no interactions, return empty array for "interactions".`,

    doctor_export_safety: `Analyze this supplement stack strictly for NEGATIVE INTERACTIONS and SAFETY WARNINGS.
STACK: \${stackList}
Provide the response in JSON format with keys: "interactions" (array of objects with severity, substances, description) and "summary".`
};

export const PROMPT_DESCRIPTIONS = {
    individual_analysis: "Used when adding/analyzing a single supplement. Variabes: ${name}, ${wakeTime}.",
    stack_analysis: "Used for the Stack Analysis dashboard tab. Variables: ${morningStack}, ${nightStack}, ${relativeStack}, ${otherStack}.",
    stack_optimizer: "Used for the Stack Optimizer recommendations. Variables: ${stackList}.",
    interaction_checker: "Used for the Interaction Checker tool. Variables: ${stackList}.",
    doctor_export_safety: "Used for the Doctor Export PDF safety section. Variables: ${stackList}."
};
