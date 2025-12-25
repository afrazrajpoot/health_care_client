# Domain-Wide Delegation Setup Guide

## Error: "unauthorized_client"

If you're seeing this error, it means **Domain-Wide Delegation** is not configured in your Google Workspace Admin Console.

## Your Service Account Information

From your JSON file (`sunlit-market-482117-q1-4713f1fee4b1.json`):

- **Service Account Email**: `alias-emails-for-doclatch@sunlit-market-482117-q1.iam.gserviceaccount.com`
- **Client ID**: `114816221692074455809` ⬅️ **You need this!**
- **Project ID**: `sunlit-market-482117-q1`

## Step-by-Step Setup Instructions

### Step 1: Enable Domain-Wide Delegation in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `sunlit-market-482117-q1`
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Find your service account: `alias-emails-for-doclatch@sunlit-market-482117-q1.iam.gserviceaccount.com`
5. Click on the service account
6. Go to the **Details** tab
7. Scroll down to **Domain-wide delegation**
8. **Check the box** to "Enable Google Workspace Domain-wide Delegation"
9. Note the **Client ID**: `114816221692074455809` (you'll need this in the next step)

### Step 2: Authorize in Google Workspace Admin Console

1. Go to [Google Admin Console](https://admin.google.com/)
2. Sign in with a **Super Admin** account
3. Navigate to **Security** > **API Controls** > **Domain-wide Delegation**
4. Click **Add new** (or **+** button)
5. Fill in the form:
   - **Client ID**: `114816221692074455809`
   - **OAuth Scopes** (add both, one per line):
     ```
     https://www.googleapis.com/auth/admin.directory.user
     https://www.googleapis.com/auth/admin.directory.user.alias
     ```
6. Click **Authorize**

### Step 3: Verify Setup

After completing the above steps:

1. Wait 1-2 minutes for changes to propagate
2. Try creating an alias again
3. Check the server logs for confirmation messages

## Visual Guide

### In Google Cloud Console:
```
Service Accounts
  └── alias-emails-for-doclatch@...
      └── Details Tab
          └── Domain-wide delegation
              └── ✅ Enable Google Workspace Domain-wide Delegation
```

### In Google Admin Console:
```
Security
  └── API Controls
      └── Domain-wide Delegation
          └── Add new
              ├── Client ID: 114816221692074455809
              └── OAuth Scopes:
                  ├── https://www.googleapis.com/auth/admin.directory.user
                  └── https://www.googleapis.com/auth/admin.directory.user.alias
```

## Common Issues

### Issue 1: "Client ID not found"
- **Solution**: Make sure you copied the Client ID correctly: `114816221692074455809`
- Double-check there are no extra spaces

### Issue 2: "OAuth scopes invalid"
- **Solution**: Copy the scopes exactly as shown above (including the `https://` prefix)
- Make sure each scope is on a separate line

### Issue 3: "You don't have permission"
- **Solution**: You need to be a **Super Admin** in Google Workspace
- Contact your Google Workspace administrator if you don't have access

### Issue 4: Still getting "unauthorized_client" after setup
- **Solution**: 
  1. Wait 2-3 minutes for changes to propagate
  2. Double-check the Client ID matches exactly
  3. Verify both OAuth scopes are added
  4. Make sure domain-wide delegation is enabled in Google Cloud Console

## Verify Your Setup

After completing the setup, you should see:

1. In Google Cloud Console:
   - ✅ Domain-wide delegation enabled for your service account

2. In Google Admin Console:
   - ✅ Your Client ID (`114816221692074455809`) listed in Domain-wide Delegation
   - ✅ Both OAuth scopes authorized

## Next Steps

Once domain-wide delegation is set up:

1. Set your admin email in `.env.local`:
   ```env
   GOOGLE_ADMIN_EMAIL=your-admin@doclatch.com
   GOOGLE_WORKSPACE_DOMAIN=doclatch.com
   ```

2. Make sure the admin email you use:
   - Exists in your Google Workspace
   - Has Super Admin privileges
   - Is the same domain as your workspace (e.g., @doclatch.com)

3. Test the API again

## Quick Reference

| Item | Value |
|------|-------|
| Client ID | `114816221692074455809` |
| Service Account | `alias-emails-for-doclatch@sunlit-market-482117-q1.iam.gserviceaccount.com` |
| OAuth Scope 1 | `https://www.googleapis.com/auth/admin.directory.user` |
| OAuth Scope 2 | `https://www.googleapis.com/auth/admin.directory.user.alias` |
| Admin Console URL | https://admin.google.com/ |
| Cloud Console URL | https://console.cloud.google.com/ |

## Still Having Issues?

1. Check server logs for detailed error messages
2. Verify the Client ID in your JSON file matches what you entered
3. Ensure you're using a Super Admin account in Google Admin Console
4. Wait a few minutes after making changes (propagation delay)

