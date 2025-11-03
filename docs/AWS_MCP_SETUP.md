# AWS MCP Server Setup Guide

Complete guide for setting up and using AWS Model Context Protocol (MCP) servers.

## Overview

AWS MCP servers allow you to interact with AWS services directly from your AI assistant (Cursor/Claude), enabling:
- ✅ AWS infrastructure management via natural language
- ✅ Automated deployments
- ✅ Resource provisioning
- ✅ Cost analysis
- ✅ And much more!

## What's Been Added

Your `mcp.json` now includes:

1. **AWS Core MCP Server** (`awslabs.core-mcp-server`)
   - General AWS operations
   - Resource management
   - Infrastructure queries

2. **AWS Serverless MCP Server** (`awslabs.aws-serverless-mcp-server`)
   - Serverless application development
   - Lambda deployments
   - SAM templates
   - API Gateway management

## Prerequisites

### 1. Install uv (Package Manager)

The AWS MCP servers use `uvx` which requires `uv` to be installed.

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Or using pip:**
```bash
pip install uv
```

**Verify installation:**
```bash
uv --version
```

### 2. Configure AWS CLI

You need AWS credentials configured to use the MCP servers.

#### Install AWS CLI

**Windows:**
```powershell
# Download and run MSI installer from:
# https://awscli.amazonaws.com/AWSCLIV2.msi

# Or using winget:
winget install -e --id Amazon.AWSCLI
```

**Or using pip:**
```bash
pip install awscli
```

#### Configure AWS Credentials

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Get from AWS Console → IAM → Users → Security Credentials
- **AWS Secret Access Key**: Generated when you create access keys
- **Default region**: e.g., `us-east-1`, `us-west-2`, `eu-west-1`
- **Default output format**: `json`

**Or set up a named profile:**
```bash
aws configure --profile myprofile
```

#### Verify AWS Configuration

```bash
aws sts get-caller-identity
```

Should return your AWS account ID, user ARN, etc.

### 3. Update mcp.json Configuration

Your `mcp.json` has been updated with AWS MCP servers. Update these values:

```json
{
  "awslabs.core-mcp-server": {
    "env": {
      "AWS_PROFILE": "default",  // ← Change if using named profile
      "AWS_REGION": "us-east-1"  // ← Change to your preferred region
    }
  },
  "awslabs.aws-serverless-mcp-server": {
    "env": {
      "AWS_PROFILE": "default",  // ← Change if using named profile
      "AWS_REGION": "us-east-1"  // ← Change to your preferred region
    }
  }
}
```

### 4. Restart Cursor

After updating `mcp.json`, restart Cursor completely for changes to take effect.

## Available AWS MCP Servers

AWS offers many specialized MCP servers. Here are the most useful ones:

### Core Servers (Recommended)
- ✅ **Core MCP Server** - Already added
- ✅ **AWS Serverless MCP Server** - Already added

### Additional Servers You Can Add

#### ECS MCP Server (For Container Deployments)
```json
"awslabs.ecs-mcp-server": {
  "command": "uvx",
  "args": ["awslabs.ecs-mcp-server@latest"],
  "env": {
    "AWS_PROFILE": "default",
    "AWS_REGION": "us-east-1",
    "FASTMCP_LOG_LEVEL": "ERROR"
  },
  "disabled": false
}
```

#### Cloud Control API MCP Server (Infrastructure Management)
```json
"awslabs.cloudcontrolapi-mcp-server": {
  "command": "uvx",
  "args": ["awslabs.cloudcontrolapi-mcp-server@latest"],
  "env": {
    "AWS_PROFILE": "default",
    "AWS_REGION": "us-east-1",
    "FASTMCP_LOG_LEVEL": "ERROR"
  },
  "disabled": false
}
```

#### Pricing MCP Server (Cost Analysis)
```json
"awslabs.aws-pricing-mcp-server": {
  "command": "uvx",
  "args": ["awslabs.aws-pricing-mcp-server@latest"],
  "env": {
    "AWS_PROFILE": "default",
    "FASTMCP_LOG_LEVEL": "ERROR"
  },
  "disabled": false
}
```

## Usage Examples

Once set up, you can ask your AI assistant things like:

### Infrastructure Management
- "Create an EC2 instance for my worker"
- "Set up an S3 bucket for storing application assets"
- "Create a VPC for my application"

### Deployments
- "Deploy my Next.js app to AWS Amplify"
- "Create a Lambda function for my worker"
- "Set up CloudFront distribution"

### Cost Analysis
- "What's my AWS bill this month?"
- "Show me the cost breakdown by service"
- "Create a cost report"

### Resource Queries
- "List all my EC2 instances"
- "Show me my S3 buckets"
- "What resources are in us-east-1?"

## Troubleshooting

### Issue: "uvx: command not found"

**Solution:**
```bash
# Install uv
pip install uv

# Or on Windows:
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Verify:
uvx --version
```

### Issue: "AWS_PROFILE not found"

**Solution:**
1. Check your AWS credentials:
   ```bash
   aws configure list
   ```

2. If you have multiple profiles, list them:
   ```bash
   aws configure list-profiles
   ```

3. Update `mcp.json` to use the correct profile name

### Issue: "Access Denied" errors

**Solution:**
1. Ensure your AWS credentials have sufficient permissions
2. Check IAM policies for your user
3. Minimum permissions needed:
   - `ec2:DescribeInstances`
   - `s3:ListBuckets`
   - `lambda:ListFunctions`
   - And others depending on what you're trying to do

### Issue: MCP server not loading

**Solution:**
1. Check Cursor logs for errors
2. Verify `uvx` is in your PATH
3. Try running manually:
   ```bash
   uvx awslabs.core-mcp-server@latest
   ```
4. Restart Cursor completely

### Issue: Region-specific errors

**Solution:**
- Ensure you're using the correct AWS region in `AWS_REGION`
- Some services are region-specific
- Check service availability: https://aws.amazon.com/about-aws/global-infrastructure/regions_az/

## Testing the Setup

### Test AWS CLI
```bash
aws sts get-caller-identity
```

### Test MCP Server Manually
```bash
uvx awslabs.core-mcp-server@latest
```

### Test in Cursor
1. Restart Cursor
2. Open a new chat
3. Ask: "List my AWS regions"
4. If it works, you're all set! 🎉

## Security Best Practices

1. **Use IAM Roles** instead of access keys when possible
2. **Limit Permissions** - only grant what's needed
3. **Use Named Profiles** for different environments
4. **Rotate Credentials** regularly
5. **Monitor Usage** in CloudTrail

## Next Steps

1. ✅ Install `uv` package manager
2. ✅ Configure AWS CLI with credentials
3. ✅ Update `AWS_PROFILE` and `AWS_REGION` in `mcp.json`
4. ✅ Restart Cursor
5. ✅ Test with a simple query
6. ✅ Start using for deployments!

## Additional Resources

- [AWS MCP Servers GitHub](https://github.com/awslabs/mcp)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review Cursor's MCP logs
3. Verify AWS credentials with `aws sts get-caller-identity`
4. Test MCP servers manually with `uvx`

---

**You're now ready to use AWS MCP servers for automated deployments! 🚀**

