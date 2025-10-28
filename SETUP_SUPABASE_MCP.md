# Setting Up Supabase MCP for AutoSocial AI

## Overview

This guide explains how to set up Supabase MCP for your AutoSocial AI project. The MCP (Model Context Protocol) server enables the AI assistant in Cursor to interact with your Supabase database.

## Prerequisites

**Important**: Supabase MCP server requires **Python 3.12 or higher**. 

✅ You currently have Python 3.12.10 installed and configured!

### Option 1: Install Python 3.12+ (Recommended)

*Note: Python 3.12 is already installed on this system. Skip to Step 1 if you're on a new system.*

1. Download Python 3.12+ from https://www.python.org/downloads/
2. Install it (you can have multiple versions installed)
3. Verify: `python3.12 --version`

### Option 2: Use Python 3.12+ via pyenv

```bash
# Install pyenv (if not installed)
curl https://pyenv.run | bash

# Install Python 3.12
pyenv install 3.12.10
pyenv global 3.12.10
```

## Installation Steps

### Step 1: Install Supabase MCP Server

Once you have Python 3.12+:

```bash
# Using pip (if Python 3.12 is your default python)
pip install supabase-mcp-server

# OR if you installed Python 3.12 separately
python3.12 -m pip install supabase-mcp-server

# OR using pipx (recommended for global installs)
# First install pipx:
pip install pipx
pipx ensurepath

# Then install the MCP server
pipx install supabase-mcp-server
```

### Step 2: Get Your Supabase Credentials

You need to gather the following from your Supabase dashboard:

1. **Project Reference (SUPABASE_PROJECT_REF)**
   - Go to: https://app.supabase.com
   - Your project → Settings → General
   - Copy the "Reference ID"

2. **Database Password (SUPABASE_DB_PASSWORD)**
   - Go to: Settings → Database
   - This is the password you set when creating the project
   - If you forgot it, you can reset it in the dashboard

3. **Service Role Key (SUPABASE_SERVICE_ROLE_KEY)**
   - Already in your .env example ✓

4. **Query API Key (QUERY_API_KEY)** - This is for The Query service
   - Sign up at: https://thequery.dev
   - Get your API key from their dashboard

5. **Region (SUPABASE_REGION)**
   - Based on your project location
   - For Asia Pacific: `ap-southeast-1` (Singapore)

### Step 3: Configure Cursor MCP Settings

1. Copy the example configuration:
   ```bash
   cp mcp.json.example mcp.json
   ```

2. Open `mcp.json` and fill in your actual credentials:
   
   ```json
   {
     "mcpServers": {
       "supabase": {
         "command": "python3.12",
         "args": [
           "-m",
           "supabase_mcp_server"
         ],
         "env": {
           "QUERY_API_KEY": "your-actual-query-api-key",
           "SUPABASE_PROJECT_REF": "your-project-ref",
           "SUPABASE_DB_PASSWORD": "your-actual-password",
           "SUPABASE_REGION": "ap-southeast-1",
           "SUPABASE_ACCESS_TOKEN": "",
           "SUPABASE_SERVICE_ROLE_KEY": "your-actual-service-role-key"
         }
       }
     }
   }
   ```

3. **Important Notes**:
   - Replace `python3.12` with your actual Python 3.12+ path
   - Find your Python 3.12 path:
     ```powershell
     where python3.12
     # or
     py -3.12
     ```
   - Use absolute path if needed: `"command": "C:\\Python312\\python.exe"`

### Step 4: Alternative Configuration Using .env

Instead of hardcoding credentials in `mcp.json`, you can load them from your `.env` file:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "python3.12",
      "args": [
        "-m",
        "supabase_mcp_server"
      ],
      "env": {
        "DOTENV_PATH": "./.env"
      }
    }
  }
}
```

Then create your `.env.local` file from the example:
```bash
cp .env.example .env.local
```

And add your MCP credentials to `.env.local`:
```env
# ... your existing env vars ...

# Supabase MCP Configuration (for AI assistant)
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_DB_PASSWORD=your-db-password
SUPABASE_REGION=ap-southeast-1
QUERY_API_KEY=your-query-api-key
```

### Step 5: Restart Cursor

After configuring, restart Cursor to load the new MCP settings.

## How to Find Your Credentials

### From Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. **Project Ref**: Settings → General → Reference ID
4. **Database Password**: Settings → Database → Database Password
5. **Service Role Key**: Settings → API → service_role key (secret)
6. **Region**: Settings → Infrastructure → Region

### Extract Project Ref from Your URL

If your Supabase URL is `https://abcdefgh.supabase.co`, then:
- Your project ref is `abcdefgh`
- Your region can be determined from the URL structure

## Usage

Once configured, the AI assistant in Cursor will have access to:

- ✅ Query your Supabase database
- ✅ View database schema
- ✅ Execute SQL queries (with safety controls)
- ✅ Manage database operations
- ✅ Help with debugging database issues

## Troubleshooting

### Check if MCP server is installed:
```bash
python3.12 -m supabase_mcp_server --version
```

### Check Cursor's MCP configuration:
1. Open Cursor Settings (Ctrl+,)
2. Search for "MCP" or "Model Context Protocol"
3. Verify your configuration appears

### Check MCP logs:
- Open the Cursor developer console
- Look for MCP-related messages

### Common Issues

**Issue**: "Command not found: python3.12"
- **Solution**: Update the command path in `mcp.json` to your actual Python 3.12 path

**Issue**: "Module not found: supabase_mcp_server"
- **Solution**: Make sure you installed it with the correct Python version:
  ```bash
  python3.12 -m pip install supabase-mcp-server
  ```

**Issue**: Authentication errors
- **Solution**: Verify your credentials in `mcp.json` match your Supabase dashboard

## Alternative: Using uv (Fastest Installation)

If you want to avoid Python version conflicts, use `uv`:

```bash
# Install uv (if not installed)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Install Supabase MCP server with uv
uv tool install supabase-mcp-server

# Check installation
uv tool run supabase-mcp-server --version
```

Then update your `mcp.json`:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "uv",
      "args": [
        "tool",
        "run",
        "supabase-mcp-server"
      ],
      "env": {
        "QUERY_API_KEY": "...",
        "SUPABASE_PROJECT_REF": "...",
        "SUPABASE_DB_PASSWORD": "...",
        "SUPABASE_REGION": "ap-southeast-1",
        "SUPABASE_SERVICE_ROLE_KEY": "..."
      }
    }
  }
}
```

## Notes

- The MCP server allows the AI to interact with your database safely
- Credentials are stored in `mcp.json` (which is gitignored)
- You can have different credentials per project
- The MCP server supports SQL query execution with built-in safety controls

## Next Steps

1. ✅ Upgrade to Python 3.12+
2. ✅ Install supabase-mcp-server
3. ✅ Get your credentials from Supabase dashboard
4. ✅ Configure mcp.json
5. ✅ Restart Cursor
6. ✅ Start using the AI assistant to interact with your database!
