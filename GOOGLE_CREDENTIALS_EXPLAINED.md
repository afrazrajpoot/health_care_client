# Google Workspace API Credentials Explained

## Overview

When using Google Workspace Admin SDK API, you need two types of credentials:

1. **Service Account** - A special Google account that represents your application
2. **Admin Email** - A super admin user in your Google Workspace for domain-wide delegation

---

## 1. GOOGLE_SERVICE_ACCOUNT_EMAIL

### What it is:

This is the **email address of your Service Account** created in Google Cloud Console.

### From your JSON file:

Looking at your `hiregenix-482220-071777b78691.json` file:

```json
{
  "client_email": "hiregenix-ai@hiregenix-482220.iam.gserviceaccount.com"
}
```

**Your GOOGLE_SERVICE_ACCOUNT_EMAIL is:**

```
hiregenix-ai@hiregenix-482220.iam.gserviceaccount.com
```

### Where to find it:

1. Open your JSON credentials file (`hiregenix-482220-071777b78691.json`)
2. Look for the `"client_email"` field
3. That's your service account email

### How it's used:

- The service account authenticates your application to Google APIs
- It's like a "robot user" that acts on behalf of your application
- It doesn't have access by default - you need to grant it permissions

---

## 2. GOOGLE_ADMIN_EMAIL

### What it is:

This is the **email address of a Super Admin user** in your Google Workspace domain.

### Examples:

- `admin@doclatch.com`
- `yourname@doclatch.com` (if you're a super admin)
- Any email address that has Super Admin privileges in your Google Workspace

### Where to find it:

1. Go to [Google Admin Console](https://admin.google.com/)
2. Navigate to **Users** or **Admin roles**
3. Find a user with **Super Admin** role
4. Use that user's email address

### How it's used:

- Used for **Domain-wide Delegation** - allows the service account to act as this admin user
- This admin user must have permissions to manage users and aliases
- The service account will impersonate this admin user to perform actions

### Important:

- This must be a **real user** in your Google Workspace
- This user must have **Super Admin** privileges
- This is NOT the service account email
- This is typically your own admin email or a dedicated admin account

---

## Current Configuration

Based on your setup:

### From JSON file (automatically detected):

- **Service Account Email**: `hiregenix-ai@hiregenix-482220.iam.gserviceaccount.com`
- **Private Key**: (extracted from JSON file)

### Default Admin Email:

- Currently defaults to: `admin@doclatch.com`
- **You need to update this** with your actual super admin email

---

## How to Set Environment Variables

### Option 1: Using .env.local file

Create or edit `.env.local` in your project root:

```env
# Service Account Email (from JSON file)
GOOGLE_SERVICE_ACCOUNT_EMAIL=hiregenix-ai@hiregenix-482220.iam.gserviceaccount.com

# Private Key (from JSON file - keep the \n as is)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Your Google Workspace Domain
GOOGLE_WORKSPACE_DOMAIN=doclatch.com

# Super Admin Email (YOUR ACTUAL ADMIN EMAIL)
GOOGLE_ADMIN_EMAIL=your-admin-email@doclatch.com
```

### Option 2: Using JSON file (current setup)

The code automatically reads from `hiregenix-482220-071777b78691.json` if it exists.

You still need to set:

```env
GOOGLE_ADMIN_EMAIL=your-admin-email@doclatch.com
GOOGLE_WORKSPACE_DOMAIN=doclatch.com
```

---

## Quick Reference

| Variable                       | Example                                                 | Where to Find                           |
| ------------------------------ | ------------------------------------------------------- | --------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `hiregenix-ai@hiregenix-482220.iam.gserviceaccount.com` | JSON file → `client_email`              |
| `GOOGLE_ADMIN_EMAIL`           | `admin@doclatch.com`                                    | Google Admin Console → Super Admin user |
| `GOOGLE_WORKSPACE_DOMAIN`      | `doclatch.com`                                          | Your Google Workspace domain            |
| `GOOGLE_PRIVATE_KEY`           | `-----BEGIN PRIVATE KEY-----\n...`                      | JSON file → `private_key`               |

---

## Common Questions

### Q: Can I use my personal Gmail as GOOGLE_ADMIN_EMAIL?

**A:** No. It must be a user in your Google Workspace domain (e.g., @doclatch.com), not a Gmail account.

### Q: What if I don't have a super admin account?

**A:** You need to either:

- Ask your Google Workspace administrator to grant you Super Admin privileges
- Use an existing super admin's email (with their permission)
- Create a dedicated service admin account

### Q: Can I use the service account email as the admin email?

**A:** No. The service account email is for authentication. The admin email is for delegation and must be a real user in your workspace.

### Q: Where do I find my Google Workspace domain?

**A:**

- Check your email address domain (e.g., if your email is `user@doclatch.com`, your domain is `doclatch.com`)
- Or go to Google Admin Console → Company profile → Company information

---

## Troubleshooting

### Error: "invalid_grant: Invalid email or User ID"

- **Cause**: The `GOOGLE_ADMIN_EMAIL` is incorrect or the user doesn't have proper permissions
- **Fix**: Verify the admin email exists in your Google Workspace and has Super Admin role

### Error: "Permission denied"

- **Cause**: Domain-wide delegation not configured or wrong admin email
- **Fix**:
  1. Verify `GOOGLE_ADMIN_EMAIL` is correct
  2. Ensure domain-wide delegation is set up in Google Admin Console
  3. Check that the service account Client ID is authorized

### Error: "User not found"

- **Cause**: The user email you're trying to create an alias for doesn't exist in Google Workspace
- **Fix**: Create the user in Google Workspace Admin Console first

---

## Next Steps

1. **Find your Super Admin email:**

   - Go to Google Admin Console
   - Check which email has Super Admin privileges
   - Use that email for `GOOGLE_ADMIN_EMAIL`

2. **Set the environment variable:**

   ```env
   GOOGLE_ADMIN_EMAIL=your-actual-admin@doclatch.com
   ```

3. **Verify domain-wide delegation is set up:**

   - Service account Client ID: `114091925446870353890` (from your JSON file)
   - Must be authorized in Google Admin Console with the required scopes

4. **Test the API:**
   - Try creating an alias for an existing Google Workspace user
   - Not a Gmail account - must be a user in your workspace domain
