# Chrome Browser MCP Server

A universal Chrome browser automation MCP (Model Context Protocol) server that preserves user login sessions and works across all platforms.

## Features

- **Preserves Login Sessions**: Uses your existing Chrome profile, so all your logged-in services (Gmail, GitHub, etc.) are immediately accessible
- **Cross-Platform**: Works on Windows, macOS, Linux, and WSL
- **Ready to Use**: Auto-detects Chrome and connects automatically - no configuration needed
- **Comprehensive Tools**: Navigation, interaction, content extraction, tab management, network monitoring, console logging, storage access, emulation
- **Token Efficient**: Uses accessibility tree snapshots instead of screenshots (100-500 tokens vs 2000-5000)

## Installation

### NPM

```bash
npm install -g chrome-browser-mcp
```

### From Source

```bash
git clone https://github.com/yourusername/chrome-browser-mcp.git
cd chrome-browser-mcp
npm install
npm link
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS/Linux**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "chrome-browser": {
      "command": "chrome-browser-mcp"
    }
  }
}
```

### Claude Code CLI

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "chrome-browser": {
      "command": "chrome-browser-mcp"
    }
  }
}
```

### Environment Variables (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `CHROME_PROFILE_PATH` | Custom Chrome profile path | User's default profile |
| `CHROME_EXECUTABLE_PATH` | Custom Chrome executable | Auto-detected |
| `CHROME_DEBUGGING_PORT` | Remote debugging port | 9222 |

## Available Tools

### Browser Connection

| Tool | Description |
|------|-------------|
| `browser_connect` | Connect to Chrome (auto-detect or launch) |
| `browser_disconnect` | Disconnect while preserving session |

### Navigation

| Tool | Description |
|------|-------------|
| `browser_navigate` | Go to URL |
| `browser_back` | Navigate back |
| `browser_forward` | Navigate forward |
| `browser_reload` | Reload page |

### Content

| Tool | Description |
|------|-------------|
| `browser_snapshot` | Get accessibility tree with element UIDs |
| `browser_screenshot` | Take visual screenshot |
| `browser_get_text` | Get page text content |
| `browser_get_html` | Get page HTML |
| `browser_get_url` | Get current URL |
| `browser_get_title` | Get page title |

### Interaction

| Tool | Description |
|------|-------------|
| `browser_click` | Click element (by UID or selector) |
| `browser_fill` | Fill input/textarea/select |
| `browser_type` | Type into focused element |
| `browser_hover` | Hover over element |
| `browser_press_key` | Press key/combination |
| `browser_scroll` | Scroll page |
| `browser_drag` | Drag and drop |

### Tab Management

| Tool | Description |
|------|-------------|
| `browser_new_page` | Open new tab |
| `browser_close_page` | Close tab |
| `browser_list_pages` | List all tabs |
| `browser_select_page` | Switch to tab |

### Wait & Sync

| Tool | Description |
|------|-------------|
| `browser_wait_for` | Wait for text/selector |

### JavaScript

| Tool | Description |
|------|-------------|
| `browser_evaluate` | Execute JavaScript |

### Network

| Tool | Description |
|------|-------------|
| `browser_start_network_monitor` | Start monitoring requests |
| `browser_stop_network_monitor` | Stop monitoring |
| `browser_list_network_requests` | List captured requests |

### Console

| Tool | Description |
|------|-------------|
| `browser_start_console_monitor` | Start monitoring console |
| `browser_stop_console_monitor` | Stop monitoring |
| `browser_list_console_messages` | List captured messages |

### Storage

| Tool | Description |
|------|-------------|
| `browser_get_cookies` | Get cookies |
| `browser_set_cookie` | Set cookie |
| `browser_get_local_storage` | Get localStorage |
| `browser_set_local_storage` | Set localStorage item |

### Emulation

| Tool | Description |
|------|-------------|
| `browser_emulate_viewport` | Set viewport dimensions |
| `browser_emulate_device` | Emulate device (iPhone, etc.) |
| `browser_set_user_agent` | Set user agent |
| `browser_set_geolocation` | Override geolocation |
| `browser_emulate_color_scheme` | Light/dark mode |

## Usage Examples

### Basic Navigation

```
Navigate to GitHub and check the trending repositories.
```

### Login-Preserved Automation

```
Open Gmail and compose a new email to john@example.com with subject "Meeting Tomorrow".
```

### Web Scraping

```
Go to https://news.ycombinator.com, take a snapshot, and extract the top 5 story titles.
```

### Form Filling

```
Navigate to the signup page and fill the form with name "John Doe", email "john@example.com", and click the submit button.
```

### Multi-Tab Workflow

```
Open https://example.com in a new tab, then switch back to the first tab and click the download button.
```

## How It Works

1. **Auto-Connection**: On first tool call, the server automatically:
   - Checks for existing Chrome with remote debugging (port 9222)
   - If found, connects to your existing browser
   - If not found, launches Chrome with your user profile

2. **Profile Preservation**: Uses your actual Chrome profile directory:
   - Windows: `%LOCALAPPDATA%\Google\Chrome\User Data`
   - macOS: `~/Library/Application Support/Google/Chrome`
   - Linux: `~/.config/google-chrome`

3. **Element Targeting**: Uses accessibility tree UIDs for reliable element interaction:
   - Take a snapshot first to get UIDs
   - Use UIDs in click/fill operations
   - More stable than CSS selectors

## Troubleshooting

### Chrome not found

Install Chrome or set `CHROME_EXECUTABLE_PATH`:

```bash
export CHROME_EXECUTABLE_PATH=/path/to/chrome
```

### Profile in use

Close all Chrome windows before using the MCP, or use `browser_connect` with `profilePath` pointing to a different profile.

### Connection failed

1. Ensure Chrome is installed
2. Check if remote debugging port 9222 is blocked
3. Try setting `CHROME_DEBUGGING_PORT` to a different port

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
node build/index.js

# Watch mode
npm run dev
```

## License

MIT License - see [LICENSE](LICENSE) file.

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Acknowledgments

Inspired by:
- [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [playwright-mcp](https://github.com/microsoft/playwright-mcp)
- [BrowserMCP](https://github.com/BrowserMCP/mcp)