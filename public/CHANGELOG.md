# Changelog

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
