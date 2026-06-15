# PM SHRI Schools Network — UP Shiksha Vibhag

WordPress Multisite system for 160 PM SHRI Government Schools in Uttar Pradesh.

## Structure

```
theme/          → pmshri-school WordPress child theme (Astra based)
mu-plugins/     → Must-Use plugins (network plugin + OTP login)
gas-bridge/     → Google Apps Script (OTP email bridge)
```

## Setup on New Server

### 1. WordPress Multisite
- Install WordPress at domain root
- Enable Multisite (subdirectory mode)
- Copy `theme/` → `wp-content/themes/pmshri-school/`
- Copy `mu-plugins/` files → `wp-content/mu-plugins/`

### 2. GAS Bridge
- Create new Google Sheet → copy Sheet ID
- New Apps Script project → paste `gas-bridge/Code.gs`
- Update `CONFIG.SHEET_ID` in Code.gs
- Run `setupAuthSheet()` from `gas-bridge/SetupSheet.gs`
- Deploy as Web App → copy URL
- Update `PMSHRI_GAS_URL` in `mu-plugins/pmshri-otp-login.php`

## Tech Stack
- WordPress Multisite (subdirectory)
- PHP 8.2 / MySQL
- Google Apps Script (OTP bridge)
- Google Sheets (user registry)
- Astra parent theme

## Developer
Alok Mohan — IT Manager, Educate Girls NGO  
UP Shiksha Vibhag | PM SHRI Schools Network
