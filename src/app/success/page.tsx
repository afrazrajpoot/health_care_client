// app/success/page.tsx - UPDATED WITH DOCUMENT PARSE LIMITS BASED ON PLAN
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authSErvice";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
};

interface SuccessPageProps {
  searchParams: {
    session_id?: string;
  };
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  // Fix: Properly handle potential undefined or array types
  const sessionId =
    typeof searchParams.session_id === "string"
      ? searchParams.session_id
      : undefined;

  if (!sessionId) {
    redirect("/packages?error=no_session_id");
    return; // Unreachable, but for clarity
  }

  // Get current user session for verification
  let session;
  try {
    session = await getServerSession(authOptions);
    if (!session?.user) {
      redirect("/api/auth/signin?callbackUrl=/packages");
      return;
    }
  } catch (error) {
    console.error("❌ Auth session error:", error);
    redirect("/api/auth/signin?callbackUrl=/packages");
    return;
  }

  const physicianId = session.user.id;

  // Look up checkout session in DB
  let checkoutSession;
  try {
    checkoutSession = await prisma.checkoutSession.findUnique({
      where: {
        stripeSessionId: sessionId,
      },
    });

    if (!checkoutSession) {
      console.error(
        "❌ Checkout session not found in success handler:",
        sessionId
      );
      redirect("/packages?error=session_not_found");
      return;
    }

    // Verify it belongs to the current user
    if (checkoutSession.physicianId !== physicianId) {
      console.error(
        "❌ Session mismatch: physicianId",
        checkoutSession.physicianId,
        "!= current",
        physicianId
      );
      redirect("/packages?error=unauthorized");
      return;
    }

    // Check if already processed
    if (checkoutSession.status === "completed") {
      redirect("/dashboard?success=already_processed");
      return;
    }

    // Fetch full Stripe session for details
    const stripe = getStripe();
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (stripeSession.payment_status !== "paid") {
      console.error("❌ Payment not completed:", stripeSession.payment_status);
      redirect("/packages?error=payment_failed");
      return;
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        physicianId: physicianId,
        status: "active",
      },
    });

    if (existingSubscription) {
      // Update checkout session status
      await prisma.checkoutSession.update({
        where: { id: checkoutSession.id },
        data: { status: "completed" },
      });

      redirect("/dashboard?success=subscription_exists");
      return;
    }

    // Assign document parse limit based on plan
    const documentParseLimit =
      checkoutSession.plan === "basic"
        ? 100 // e.g., 100 parses for basic
        : checkoutSession.plan === "pro"
        ? 500 // e.g., 500 parses for pro
        : 1000; // e.g., 1000 parses for premium (or use -1 for unlimited if preferred)

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        physicianId: checkoutSession.physicianId,
        plan: checkoutSession.plan,
        amountTotal: stripeSession.amount_total!,
        status: "active",
        stripeCustomerId: (stripeSession.customer as string) || null,
        stripeSubscriptionId: (stripeSession.subscription as string) || null,
        documentParse: documentParseLimit,
      },
    });

    // Update checkout session status
    await prisma.checkoutSession.update({
      where: { id: checkoutSession.id },
      data: { status: "completed" },
    });

    // Redirect to dashboard with success message
    redirect(`/dashboard?success=true&plan=${checkoutSession.plan}`);
    return;
  } catch (error: any) {
    // Only catch REAL errors (not redirects)
    if (error.message === "NEXT_REDIRECT") {
      // Ignore - Next.js will handle the redirect

      return;
    }

    console.error("💥 Success page error (non-redirect):", error);
    redirect("/packages?error=processing_failed");
    return;
  }
}
