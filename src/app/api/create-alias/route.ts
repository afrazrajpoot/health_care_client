import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/services/authSErvice";
import { google } from "googleapis";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

// Initialize Google Admin SDK client
async function getAdminClient() {
  try {
    let serviceAccountEmail: string;
    let privateKey: string;
    let adminEmail: string;

    // Read credentials from JSON file in project root
    const projectRoot = process.cwd();
    let serviceAccount: any = null;
    let jsonFilePath: string | null = null;
    
    // List of known JSON file names to try first
    const knownFiles = [
      "sunlit-market-482117-q1-4713f1fee4b1.json",

    ];
    
    // Try known file names first
    for (const fileName of knownFiles) {
      const jsonPath = join(projectRoot, fileName);
      if (existsSync(jsonPath)) {
        try {
          const fileContent = readFileSync(jsonPath, "utf8");
          const parsed = JSON.parse(fileContent);
          // Verify it's a service account file
          if (parsed.type === "service_account" && parsed.client_email && parsed.private_key) {
            serviceAccount = parsed;
            jsonFilePath = jsonPath;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    // If not found, search for any JSON files with "service_account" type
    if (!serviceAccount) {
      try {
        const files = readdirSync(projectRoot);
        for (const file of files) {
          if (
            file.endsWith(".json") && 
            !file.includes("package") && 
            !file.includes("tsconfig") && 
            !file.includes("components") &&
            !file.includes("eslint")
          ) {
            const jsonPath = join(projectRoot, file);
            try {
              const fileContent = readFileSync(jsonPath, "utf8");
              const parsed = JSON.parse(fileContent);
              // Verify it's a service account file
              if (parsed.type === "service_account" && parsed.client_email && parsed.private_key) {
                serviceAccount = parsed;
                jsonFilePath = jsonPath;
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }
      } catch (e) {
        // Directory read failed
        console.error("Error reading project directory:", e);
      }
    }
    
    if (!serviceAccount) {
      throw new Error(
        "Service account JSON file not found in project root. Please place your Google service account JSON file in the project root directory."
      );
    }
    
    console.log(`✅ Found and using JSON credentials file: ${jsonFilePath}`);
    
    // Extract credentials from JSON file
    serviceAccountEmail = serviceAccount.client_email;
    privateKey = serviceAccount.private_key;
    
    // For domain-wide delegation, use an admin email from your Google Workspace
    // The admin email should be a super admin in your Google Workspace
    const workspaceDomain = process.env.GOOGLE_WORKSPACE_DOMAIN || "doclatch.com";
    adminEmail = process.env.GOOGLE_ADMIN_EMAIL || `admin@${workspaceDomain}`;
    
    console.log("✅ Using credentials from JSON file");
    console.log(`📧 Service Account: ${serviceAccountEmail}`);
    console.log(`🆔 Client ID: ${serviceAccount.client_id}`);
    console.log(`🔐 Admin Email (for delegation): ${adminEmail}`);
    console.log(`🌐 Workspace Domain: ${workspaceDomain}`);
    
    // Log important setup information
    if (!process.env.GOOGLE_ADMIN_EMAIL) {
      console.warn(`⚠️ GOOGLE_ADMIN_EMAIL not set. Using default: ${adminEmail}`);
      console.warn(`⚠️ Make sure this admin email exists in your Google Workspace and has Super Admin privileges.`);
    }
    
    console.log(`\n📋 Domain-wide Delegation Setup Required:`);
    console.log(`   1. Go to Google Admin Console: https://admin.google.com/`);
    console.log(`   2. Navigate to: Security > API Controls > Domain-wide Delegation`);
    console.log(`   3. Click "Add new"`);
    console.log(`   4. Enter Client ID: ${serviceAccount.client_id}`);
    console.log(`   5. Add these OAuth scopes:`);
    console.log(`      - https://www.googleapis.com/auth/admin.directory.user`);
    console.log(`      - https://www.googleapis.com/auth/admin.directory.user.alias`);
    console.log(`   6. Click "Authorize"`);

    // Create JWT client for service account authentication
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: [
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.user.alias",
      ],
      subject: adminEmail, // Delegate domain-wide authority
    });

    return google.admin({ version: "directory_v1", auth });
  } catch (error) {
    console.error("Error initializing Google Admin client:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, alias } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!alias) {
      return NextResponse.json(
        { error: "Alias is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate alias format
    if (!emailRegex.test(alias)) {
      return NextResponse.json(
        { error: "Invalid alias format. Alias must be a valid email address" },
        { status: 400 }
      );
    }

    // Extract domains for validation
    const emailDomain = email.split("@")[1]?.toLowerCase();
    const aliasDomain = alias.split("@")[1]?.toLowerCase();
    const workspaceDomain = process.env.GOOGLE_WORKSPACE_DOMAIN || "doclatch.com";

    // Warn if email domain doesn't match workspace domain
    if (emailDomain !== workspaceDomain) {
      console.warn(`⚠️ User email domain (${emailDomain}) doesn't match workspace domain (${workspaceDomain})`);
    }

    // Alias domain should match workspace domain
    if (aliasDomain !== workspaceDomain) {
      return NextResponse.json(
        {
          error: "Invalid alias domain",
          details: `The alias domain (${aliasDomain}) must match your Google Workspace domain (${workspaceDomain}). Aliases can only be created for your workspace domain.`,
        },
        { status: 400 }
      );
    }

    // Get Google Admin client
    const admin = await getAdminClient();

    // Use full email as userKey
    const userKey = email;

    // First, verify that the user exists in Google Workspace
    try {
      await admin.users.get({ userKey: userKey });
    } catch (userError: any) {
      if (userError.code === 404) {
        return NextResponse.json(
          {
            error: "User not found in Google Workspace",
            details: `The user ${email} does not exist in your Google Workspace. Please ensure the user is created in Google Workspace before adding aliases.`,
          },
          { status: 404 }
        );
      }
      // If it's another error, log it but continue (might be a permission issue)
      console.error("Error checking user existence:", userError);
    }

    // Create alias for the user
    try {
      await admin.users.aliases.insert({
        userKey: userKey,
        requestBody: {
          alias: alias,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: `Alias ${alias} successfully created for user ${email}`,
          email: email,
          alias: alias,
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error creating alias:", error);

      // Handle specific Google API errors
      if (error.code === 404) {
        return NextResponse.json(
          {
            error: "User not found in Google Workspace",
            details: `User ${email} does not exist in the workspace`,
          },
          { status: 404 }
        );
      }

      if (error.code === 409) {
        return NextResponse.json(
          {
            error: "Alias already exists",
            details: `The alias ${alias} is already in use`,
          },
          { status: 409 }
        );
      }

      if (error.code === 403) {
        return NextResponse.json(
          {
            error: "Permission denied",
            details:
              "Service account does not have sufficient permissions. Please ensure domain-wide delegation is enabled in Google Admin Console.",
          },
          { status: 403 }
        );
      }

      // Handle unauthorized_client error (domain-wide delegation not set up)
      if (error.message?.includes("unauthorized_client") || error.message?.includes("Client is unauthorized")) {
        // Get client ID from JSON file for error message
        let clientId = "Check your JSON file";
        try {
          const projectRoot = process.cwd();
          const jsonPath = join(projectRoot, "sunlit-market-482117-q1-4713f1fee4b1.json");
          if (existsSync(jsonPath)) {
            const fileContent = readFileSync(jsonPath, "utf8");
            const parsed = JSON.parse(fileContent);
            if (parsed.client_id) {
              clientId = parsed.client_id;
            }
          }
        } catch (e) {
          // Ignore errors, use default message
        }

        return NextResponse.json(
          {
            error: "Domain-wide delegation not configured",
            details: `The service account Client ID needs to be authorized in Google Admin Console. Go to Security > API Controls > Domain-wide Delegation and add Client ID: ${clientId} with the required OAuth scopes.`,
            clientId: clientId,
            setupSteps: [
              "1. Go to https://admin.google.com/",
              "2. Navigate to: Security > API Controls > Domain-wide Delegation",
              "3. Click 'Add new'",
              `4. Enter Client ID: ${clientId}`,
              "5. Add OAuth scopes:",
              "   - https://www.googleapis.com/auth/admin.directory.user",
              "   - https://www.googleapis.com/auth/admin.directory.user.alias",
              "6. Click 'Authorize'",
            ],
          },
          { status: 403 }
        );
      }

      // Handle invalid_grant error (usually means wrong admin email or user doesn't exist)
      if (error.message?.includes("invalid_grant") || error.message?.includes("Invalid email")) {
        return NextResponse.json(
          {
            error: "Authentication or user validation failed",
            details: `The user ${email} may not exist in your Google Workspace, or the admin email for domain-wide delegation is incorrect. Please verify: 1) The user exists in Google Workspace, 2) The admin email is correct (set GOOGLE_ADMIN_EMAIL in .env), 3) Domain-wide delegation is properly configured.`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to create alias",
          details: error.message || "Unknown error occurred",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in create-alias API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to list aliases for a user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get email from query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get Google Admin client
    const admin = await getAdminClient();

    // Use full email as userKey
    const userKey = email;

    try {
      // Get user info and aliases
      const [userResponse, aliasesResponse] = await Promise.all([
        admin.users.get({ userKey: userKey }),
        admin.users.aliases.list({ userKey: userKey }),
      ]);

      const aliases = aliasesResponse.data.aliases || [];
      const primaryEmail = userResponse.data.primaryEmail || email;

      return NextResponse.json(
        {
          success: true,
          email: primaryEmail,
          aliases: aliases.map((alias) => alias.alias),
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error fetching aliases:", error);

      if (error.code === 404) {
        return NextResponse.json(
          {
            error: "User not found in Google Workspace",
            details: `User ${email} does not exist in the workspace`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to fetch aliases",
          details: error.message || "Unknown error occurred",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in create-alias GET API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
