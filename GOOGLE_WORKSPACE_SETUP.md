# Google Workspace Alias API Setup

This document explains how to set up the Google Workspace alias creation API.

## Prerequisites

1. A Google Workspace account with admin access
2. A service account with domain-wide delegation enabled
3. Required API scopes enabled

## Installation

Install the required package:

```bash
npm install googleapis
```

## Environment Variables

Add the following environment variables to your `.env.local` or `.env` file:

```env
# Google Workspace Service Account Email
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Google Service Account Private Key (from JSON key file)
# Note: Replace \n with actual newlines or use \\n in the env file
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Google Workspace Domain
GOOGLE_WORKSPACE_DOMAIN=yourdomain.com

# Google Admin Email (for domain-wide delegation)
# This should be a super admin email in your Google Workspace
GOOGLE_ADMIN_EMAIL=admin@yourdomain.com
```

## Setting Up Google Workspace Service Account

### Step 1: Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Fill in the details and create the account
6. Note the service account email address

### Step 2: Create and Download Service Account Key

1. Click on the created service account
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Choose **JSON** format
5. Download the JSON file
6. Extract the following from the JSON:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`

### Step 3: Enable Domain-Wide Delegation

1. In the service account details, check **Enable Google Workspace Domain-wide Delegation**
2. Note the **Client ID** (you'll need this for the next step)

### Step 4: Authorize API Scopes in Google Workspace Admin

1. Go to [Google Admin Console](https://admin.google.com/)
2. Navigate to **Security** > **API Controls** > **Domain-wide Delegation**
3. Click **Add new**
4. Enter the **Client ID** from Step 3
5. Add the following OAuth scopes:
   ```
   https://www.googleapis.com/auth/admin.directory.user
   https://www.googleapis.com/auth/admin.directory.user.alias
   ```
6. Click **Authorize**

### Step 5: Enable Admin SDK API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Library**
3. Search for "Admin SDK API"
4. Click on it and enable it

## API Usage

### Create an Alias (POST)

**Endpoint:** `/api/create-alias`

**Method:** `POST`

**Request Body:**
```json
{
  "email": "user@yourdomain.com",
  "alias": "alias@yourdomain.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Alias alias@yourdomain.com successfully created for user user@yourdomain.com",
  "email": "user@yourdomain.com",
  "alias": "alias@yourdomain.com"
}
```

**Response (Error):**
```json
{
  "error": "User not found in Google Workspace",
  "details": "User user@yourdomain.com does not exist in the workspace"
}
```

### List Aliases (GET)

**Endpoint:** `/api/create-alias?email=user@yourdomain.com`

**Method:** `GET`

**Response (Success):**
```json
{
  "success": true,
  "email": "user@yourdomain.com",
  "aliases": [
    "alias1@yourdomain.com",
    "alias2@yourdomain.com"
  ]
}
```

## Authentication

The API requires NextAuth session authentication. Users must be logged in to use this endpoint.

## Error Codes

- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (not logged in)
- `403` - Permission Denied (service account lacks permissions)
- `404` - User Not Found (user doesn't exist in Google Workspace)
- `409` - Conflict (alias already exists)
- `500` - Internal Server Error

## Troubleshooting

### Error: "Permission denied"
- Ensure domain-wide delegation is enabled
- Verify the OAuth scopes are correctly added in Google Admin Console
- Check that `GOOGLE_ADMIN_EMAIL` is set to a super admin email

### Error: "User not found"
- Verify the user exists in Google Workspace
- Check that the email format is correct (user@domain.com)

### Error: "Alias already exists"
- The alias is already assigned to a user
- Check existing aliases using the GET endpoint

### Error: "Missing Google Workspace credentials"
- Ensure all required environment variables are set
- Check that `GOOGLE_PRIVATE_KEY` has proper newline characters (`\n`)

## Security Notes

- Never commit your `.env` file or service account JSON key to version control
- Keep your private key secure
- Use environment variables for all sensitive credentials
- Regularly rotate service account keys

