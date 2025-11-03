# AWS MCP Server Setup Script for Windows
# Run this script in PowerShell to set up prerequisites

Write-Host "🚀 Setting up AWS MCP Servers..." -ForegroundColor Cyan
Write-Host ""

# Check if uv is installed
Write-Host "📦 Checking for 'uv' package manager..." -ForegroundColor Yellow
try {
    $uvVersion = uv --version 2>$null
    Write-Host "✅ uv is installed: $uvVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ uv is not installed" -ForegroundColor Red
    Write-Host "Installing uv..." -ForegroundColor Yellow
    Invoke-Expression "powershell -ExecutionPolicy ByPass -c `"irm https://astral.sh/uv/install.ps1 | iex`""
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Verify installation
    Start-Sleep -Seconds 2
    try {
        $uvVersion = uv --version 2>$null
        Write-Host "✅ uv installed successfully: $uvVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install uv. Please install manually:" -ForegroundColor Red
        Write-Host "   pip install uv" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Check if AWS CLI is installed
Write-Host "🔍 Checking for AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>$null
    Write-Host "✅ AWS CLI is installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed" -ForegroundColor Red
    Write-Host "Please install AWS CLI:" -ForegroundColor Yellow
    Write-Host "   1. Download from: https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Yellow
    Write-Host "   2. Or run: winget install -e --id Amazon.AWSCLI" -ForegroundColor Yellow
    Write-Host ""
    $install = Read-Host "Do you want to install AWS CLI now? (y/n)"
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Host "Installing AWS CLI via winget..." -ForegroundColor Yellow
        winget install -e --id Amazon.AWSCLI
    } else {
        Write-Host "Skipping AWS CLI installation. Please install manually." -ForegroundColor Yellow
    }
}

Write-Host ""

# Check AWS credentials
Write-Host "🔐 Checking AWS credentials..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity 2>$null | ConvertFrom-Json
    if ($awsIdentity) {
        Write-Host "✅ AWS credentials configured:" -ForegroundColor Green
        Write-Host "   Account ID: $($awsIdentity.Account)" -ForegroundColor Cyan
        Write-Host "   User ARN: $($awsIdentity.Arn)" -ForegroundColor Cyan
        Write-Host "   User ID: $($awsIdentity.UserId)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ AWS credentials not configured" -ForegroundColor Red
    Write-Host "Please configure AWS CLI:" -ForegroundColor Yellow
    Write-Host "   1. Run: aws configure" -ForegroundColor Yellow
    Write-Host "   2. Enter your AWS Access Key ID" -ForegroundColor Yellow
    Write-Host "   3. Enter your AWS Secret Access Key" -ForegroundColor Yellow
    Write-Host "   4. Enter your default region (e.g., us-east-1)" -ForegroundColor Yellow
    Write-Host "   5. Enter default output format (json)" -ForegroundColor Yellow
    Write-Host ""
    $configure = Read-Host "Do you want to configure AWS CLI now? (y/n)"
    if ($configure -eq "y" -or $configure -eq "Y") {
        aws configure
    }
}

Write-Host ""

# Verify MCP servers can be accessed
Write-Host "🧪 Testing MCP servers..." -ForegroundColor Yellow
try {
    Write-Host "Testing Core MCP Server..." -ForegroundColor Cyan
    uvx awslabs.core-mcp-server@latest --help 2>$null | Out-Null
    Write-Host "✅ Core MCP Server is accessible" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not verify Core MCP Server (this is okay if it's the first run)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update mcp.json with your AWS_PROFILE and AWS_REGION" -ForegroundColor Yellow
Write-Host "   2. Restart Cursor completely" -ForegroundColor Yellow
Write-Host "   3. Test by asking: 'List my AWS regions'" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 See docs/AWS_MCP_SETUP.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""

