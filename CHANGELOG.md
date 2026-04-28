# Changelog

All notable changes to this project are documented here.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## Unreleased

### Changed

- Replaced normal Playwright UI serial searches with direct POST requests to the IQ Timeline endpoint.
- Normal runs now skip only rows already marked `RIQD_Connected = Y`; blank and `N` values are checked.

### Added

- Added Node test coverage for API response detection and row processing rules.
- Added automatic CSRF token capture during `pnpm run auth`.
