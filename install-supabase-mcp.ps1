# Supabase MCP Installation Script for AutoSocial AI
# This script helps you install and configure Supabase MCP for your project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Supabase MCP Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
Write-Host "Current Python: $pythonVersion" -ForegroundColor White

# Check if Python 3.12+ exists
$python312Exists = Get-Command python3.12 -ErrorAction SilentlyContinue
$python12Exists = Get-Command py -ArgumentList "3.12", "--version" -ErrorAction SilentlyContinue

if ($pythonVersion -match "3\.1[2-9]|3\.2\d+") {
    Write-Host "✓ Python 3.12+ is already the default!" -ForegroundColor Green
    $pythonCmd = "python"
} elseif ($python312Exists) {
    Write-Host "✓ Python 3.12+ found at: python3.12" -ForegroundColor Green
    $pythonCmd = "python3.12"
} elseif ($python12Exists) {
    Write-Host "✓ Python 3.12+ found at: py -3.12" -ForegroundColor Green
    $pythonCmd = "py -3.12"
} else {
    Write-Host "✗ Python 3.12+ not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Python 3.12+ first:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "2. Or install via Microsoft Store" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Installing supabase-mcp-server..." -ForegroundColor Yellow
& $pythonCmd -m pip install supabase-mcp-server

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Installation successful!" -ForegroundColor Green
} else {
    Write-Host "✗ Installation failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy the example configuration:" -ForegroundColor Yellow
Write-Host "   cp mcp.json.example mcp.json" -ForegroundColor White
Write-Host ""
Write-Host "2. Edit mcp.json and add your Supabase credentials:" -ForegroundColor Yellow
Write-Host "   - SUPABASE_PROJECT_REF (from Supabase dashboard)" -ForegroundColor White
Write-Host "   - SUPABASE_DB_PASSWORD (your database password)" -ForegroundColor White
Write-Host "   - QUERY_API_KEY (get from https://thequery.dev)" -ForegroundColor White
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard)" -ForegroundColor White
Write-Host ""
Write-Host "3. Update the 'command' in mcp.json to use your Python 3.12 path:" -ForegroundColor Yellow
Write-Host "   ""command"": ""python3.12"" or ""command"": ""py"", ""args"": [""-3.12"", ""-m"", ""supabase_mcp_server""]" -ForegroundColor White
Write-Host ""
Write-Host "4. Restart Cursor to activate the MCP server" -ForegroundColor Yellow
Write-Host ""
Write-Host "See SETUP_SUPABASE_MCP.md for detailed instructions" -ForegroundColor Cyan

