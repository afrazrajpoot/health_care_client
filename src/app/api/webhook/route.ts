// app/api/webhook/route.ts - ENHANCED WITH FALLBACKS (UNCHANGED FROM LAST VERSION)
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  console.log("🎯 WEBHOOK RECEIVED! Timestamp:", new Date().toISOString());
  
  try {
    const sig = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!sig) {
      console.error("❌ No stripe-signature header found");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log("✅ Webhook signature VERIFIED - Event type:", event.type);
    } catch (err: any) {
      console.error("❌ Webhook signature verification FAILED:", err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      console.log("🛒 CHECKOUT.SESSION.COMPLETED EVENT!");
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("📋 Session ID:", session.id);
      await handleSuccessfulCheckout(session);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("💥 UNEXPECTED ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleSuccessfulCheckout(session: Stripe.Checkout.Session) {
  try {
    console.log("🔍 Looking up session in database:", session.id);
    
    // PRIMARY STRATEGY: Look up the session in our database
    let checkoutSession = await prisma.checkoutSession.findUnique({
      where: {
        stripeSessionId: session.id,
      },
    });

    // FALLBACK: If not found in DB, use metadata or client_reference_id
    if (!checkoutSession) {
      const physicianId = session.metadata?.physicianId || session.client_reference_id;
      const plan = session.metadata?.plan;
      
      if (physicianId && plan && session.amount_total) {
        console.log("🔄 Fallback: Using metadata for physicianId:", physicianId, "plan:", plan);
        
        // Retroactively create the checkout session record
        checkoutSession = await prisma.checkoutSession.create({
          data: {
            stripeSessionId: session.id,
            physicianId: physicianId,
            plan: plan,
            amount: session.amount_total,
            status: "pending", // Will update to completed below
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Approximate
          },
        });
        
        console.log("✅ Retroactively created checkout session:", checkoutSession.id);
      } else {
        console.error("❌ Checkout session not found in database:", session.id);
        console.error("⚠️  No fallback data available (metadata or client_reference_id missing)");
        console.error("⚠️  This is likely a test payment from Stripe dashboard/test page");
        console.error("📝 To fix: Use the checkout URL from YOUR application, not Stripe's test page");
        console.error("🔗 Your app should redirect to the URL returned from /api/checkout_sessions");
        return;
      }
    }

    console.log("✅ Found/created session in database:", {
      physicianId: checkoutSession.physicianId,
      plan: checkoutSession.plan,
      amount: checkoutSession.amount
    });

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        physicianId: checkoutSession.physicianId,
        status: "active",
      }
    });

    if (existingSubscription) {
      console.log("⚠️ Active subscription already exists for this physician");
      
      // Update checkout session status
      await prisma.checkoutSession.update({
        where: { id: checkoutSession.id },
        data: { status: "completed" }
      });
      
      return;
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        physicianId: checkoutSession.physicianId,
        plan: checkoutSession.plan,
        amountTotal: session.amount_total!,
        status: "active",
        stripeCustomerId: session.customer as string || null,
        stripeSubscriptionId: session.subscription as string || null,
      },
    });

    // Update checkout session status
    await prisma.checkoutSession.update({
      where: { id: checkoutSession.id },
      data: { status: "completed" }
    });

    console.log("✅ Successfully created subscription:", subscription.id);
    console.log("✅ Physician", checkoutSession.physicianId, "is now on", checkoutSession.plan, "plan");

  } catch (dbError: any) {
    console.error("❌ Database error:", dbError);
    console.error("Error stack:", dbError.stack);
  }
}