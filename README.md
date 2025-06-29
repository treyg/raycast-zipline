# Zipline Raycast Extension

A Raycast extension for managing your self-hosted Zipline uploads. Browse, upload, and share files with ease directly from Raycast.

## Features

- **Browse Uploads**: View and search through your uploaded files with pagination
- **Upload Files**: Upload new files with customizable options (filename format, password protection, expiration, etc.)
- **Recent Uploads**: Quick access to your most recently uploaded files
- **File Management**: Copy URLs, toggle favorites, and delete files
- **Rich Previews**: See file types, sizes, upload dates, and view counts at a glance

## Setup

1. Install the extension in Raycast
2. Configure your Zipline instance URL and API token in the extension preferences
3. Optionally set your preferred page size for browsing uploads

### Required Preferences

- **Zipline URL**: Your Zipline instance URL (e.g., `https://zipline.example.com`)
- **API Token**: Your Zipline API token (found in your Zipline user settings)

### Optional Preferences

- **Page Size**: Number of uploads to display per page (default: 20)

## Commands

### Browse Uploads
- Search and filter through all your uploads
- Pagination support for large collections
- Copy URLs, toggle favorites, and delete files
- Keyboard shortcuts for quick navigation

### Upload File
- Upload single or multiple files
- Customize filename format (Random, Date, UUID, Gfycat-style, Original)
- Optional password protection
- Set expiration dates and view limits
- Automatic URL copying to clipboard

### Recent Uploads
- Quick access to your 10 most recent uploads
- Relative time display (e.g., "2 hours ago")
- Same file management actions as Browse Uploads

## Keyboard Shortcuts

- `⌘ + F`: Toggle favorite status
- `⌘ + R`: Refresh current view
- `⌘ + ←/→`: Navigate between pages (in Browse Uploads)
- `⌘ + Delete`: Delete file

## Requirements

- Raycast 1.26.0 or higher
- A self-hosted Zipline instance
- Valid Zipline API token

## Development

This extension is built with:
- TypeScript
- React
- Raycast API
- Node.js fetch for API calls

To contribute or modify:

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev` to start development mode
4. Make your changes and test in Raycast

## License

MIT License - see LICENSE file for details

## Support

For issues or feature requests, please create an issue in the GitHub repository.