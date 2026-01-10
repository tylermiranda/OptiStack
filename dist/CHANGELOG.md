# Changelog


## [2.4.1] - 2026-01-08
### Fixed
- **iOS UI Compatibility**: Fixed an issue where modal close buttons and toggles overlapped with the iOS status bar (notch/safe area). UI elements now dynamically adjust their vertical position based on the device's safe area insets.

## [2.4.0] - 2026-01-05
### Added
- **Enhanced Cost Analysis**: Extended the cost analysis dashboard with deeper insights.
    - **Top Spender**: Identification of the most expensive daily supplement and its budget impact.
    - **Best Bang for Buck**: Value analysis comparing personal ratings to daily cost to find the most efficient supplements.
    - **Most Affordable**: Highlights low-cost, high-value additions to your routine.
    - **Investment by Health Goal**: New breakdown showing daily spending allocated by health objectives (e.g., Sleep, Focus, Longevity).
    - **Total Stock Value**: View the total estimated value of your current on-hand supplement inventory.
    - **Efficiency Metrics**: Average cost per supplement tracking for better budget optimization.

## [2.3.5] - 2026-01-05
### Fixed
- **Supplement Addition**: Fixed a critical bug where adding supplements failed silently due to a database error.
- **URL Validation**: Fixed an issue where supplement URLs without `https://` could not be saved. URLs are now automatically corrected.

## [2.3.0] - 2026-01-04
### Added
- **AI Prompt Editor**: Admins can now view and edit the AI prompts used for analysis, optimization, and safety checks directly from the Admin panel in settings. This allows for fine-tuning AI behavior and customizing responses.
- **Dynamic AI Prompts**: All AI features (Individual Supplement Analysis, Stack Analysis, Optimizer, Interaction Checker, and PDF Export) now use the user-customizable prompts.

## [2.2.0] - 2026-01-04
### Added
- **AI Cost Tracking**: New "Usage" tab in Settings showing per-user Cloud AI (OpenRouter) costs. View today's usage, monthly totals, all-time statistics, and a list of recent AI requests with token counts and costs. Local AI (Ollama) usage is tracked as free.

## [2.1.2] - 2026-01-03
### Added
- **Project Acknowledgment**: Added recognition in the README for project development using Antigravity and Gemini Pro.

### Fixed
- Some model responses were not being parsed correctly.

## [2.1.0] - 2026-01-03
### Changed
- **Unified Settings & Admin**: Merged the Admin Dashboard into the Settings menu. Admin features are now accessible via a dedicated "Admin" tab within Settings, visible only to users with admin privileges. This simplifies the interface by removing the separate admin button.

## [2.0.0] - 2026-01-03
### Added
- **Local AI Support (Ollama)**: Run AI features entirely locally for complete privacy. Your supplement data never leaves your machine when using Ollama. Supports any Ollama-compatible model including Llama 3.1, Mistral, and Gemma 2.
- **In-App AI Configuration**: Configure AI provider, Ollama URL, and OpenRouter API key directly from the Settings dialog—no environment variables required.
- **Ollama Connection Testing**: Test your Ollama connection directly from settings and see available models before saving.

### Changed
- **AI Provider Abstraction**: Backend now supports multiple AI providers (OpenRouter cloud or Ollama local) through a unified interface.
- **Dynamic Model Discovery**: Settings now automatically fetches available models from your configured AI provider.
- **Enhanced Settings UI**: Redesigned settings dialog with provider selection cards, connection status, and privacy indicators.

## [1.9.0] - 2026-01-03
### Added
- **Bioavailability Tips**: Each supplement card now displays absorption tips including what to take with (synergies), what to avoid (conflicts), timing recommendations, and food guidance. Data covers 20+ common supplements with links to Examine.com research.
- **Stack Templates**: Browse curated supplement stacks for common goals: Athletic Performance, Sleep & Recovery, Focus & Cognition, and Longevity. Import an entire stack with one click.
- **Influencer Stacks**: Pre-built templates based on publicly shared protocols from Andrew Huberman, Peter Attia, David Sinclair, and more—all with source attribution.
- **Public Stack Sharing**: Generate shareable links to your supplement stack. Others can view your stack and import it to their own account.

## [1.8.0] - 2026-01-03
### Added
- **AI Chat Assistant**: New conversational AI feature for discussing your supplements. Ask about interactions, get recommendations for specific health goals (e.g., "what supplements help with athletic performance?"), and evaluate potential new additions to your stack. The AI has full context of your current supplements and maintains conversation history.

## [1.7.0] - 2026-01-03
### Added
- **AI Analysis History**: Stack analyses are now automatically saved and can be viewed later. Access your analysis history via the new "History" button in the AI Stack Analysis section. Each saved analysis includes the summary, benefits, synergies, risks, and a snapshot of which supplements were analyzed.

## [1.6.0] - 2026-01-02
### Added
- **Stack Optimizer**: New AI-powered feature that analyzes your current stack and suggests missing cofactors and complementary supplements. Recommendations can be added directly to your stack with one click.

## [1.5.2] - 2026-01-02
### Fixed
- **URL Auto-Fix**: Amazon product URLs pasted without `https://` are now automatically normalized, preventing fetch errors.

## [1.5.0] - 2026-01-02
### Added
- **Enhanced Doctor Export**: Updated the "Share with Doctor" feature to optionally include a full AI-generated safety analysis (interactions & summary) directly in the PDF report.

## [1.4.0] - 2026-01-02
### Added
- **AI Analysis Export**: Added ability to export AI stack analysis results to formatted PDF.

## [1.3.0] - 2026-01-02
### Added
- **Volume-based Costing**: Added support for non-pill units (grams, ml, oz) with decimal dosage support and accurate cost tracking.

## [1.2.0] - 2026-01-02
### Added
- **Data Backup & Restore**: Added ability for admins to download database backups and restore them directly from the Admin Dashboard.
- **Cost Analysis**: New dashboard widget providing daily and monthly cost breakdowns of your current stack.
- **Interaction Checker**: Added a safety check tool to analyze your stack for potential negative interactions using AI.
- **Single User Mode**: New `DISABLE_AUTH` environment variable to bypass login for personal use.
- **Branding**: Updated application branding to "Supplement & Medication Manager".

## [1.1.1] - 2026-01-02
### Added
- **Tooltips**: Integrated informative tooltips for buttons, icons, and form fields to improve user experience.

## [1.1.0] - 2026-01-01
### Added
- **Release Notes**: Added a new release notes modal to viewing changelogs directly within the application.
- **Unraid Template**: Added support for Unraid deployments.
- **Docker Deployment**: Improved Docker support with GHCR integration.

## [1.0.1] - 2025-12-31
### Fixed
- **Mobile Header**: Fixed header layout issues on mobile devices.
- **OIDC Redirect**: Fixed hardcoded redirect URL after OIDC login.

## [1.0.0] - 2025-12-25
### Initial Release
- Basic supplement tracking functionality.
- Admin dashboard.
- OIDC Authentication.
