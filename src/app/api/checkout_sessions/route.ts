// app/api/checkout_sessions/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/services/authSErvice";
import { prisma } from "@/lib/prisma";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripe();
    const physicianId = session.user.id;

    const { plan, price } = await req.json();
    
    // Validate plan
    const validPlans = ['basic', 'pro', 'premium'] as const;
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json({ 
        error: "Invalid plan. Choose basic, pro, or premium" 
      }, { status: 400 });
    }

    // Validate price
    if (!price || typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ 
        error: "Invalid price" 
      }, { status: 400 });
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        physicianId: physicianId,
        status: "active",
      }
    });

    if (existingSubscription) {
      return NextResponse.json({ 
        error: "You already have an active subscription" 
      }, { status: 400 });
    }

    // Convert to cents for Stripe
    const priceInCents = price * 100;

    console.log("🔑 Creating checkout for physician:", physicianId, "plan:", plan, "price:", price);

    // Create Stripe checkout session with USD currency
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd", // ✅ Explicitly set to USD
            product_data: {
              name: `${plan.toUpperCase()} Plan`,
              description: `Healthcare subscription - ${plan} tier`
            },
            unit_amount: priceInCents, // Price in cents
          },
          quantity: 1,
        },
      ],
      // Metadata for webhook processing
      metadata: {
        physicianId: physicianId,
        plan: plan,
        price: price.toString(),
        source: "healthcare_app"
      },
      // Also add to payment intent for redundancy
      payment_intent_data: {
        metadata: {
          physicianId: physicianId,
          plan: plan,
          price: price.toString(),
        },
      },
      // Client reference as additional fallback
      client_reference_id: physicianId,
      // URLs
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/packages`,
      // Expire after 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    });

    // Store checkout session in database for webhook lookup
    await prisma.checkoutSession.create({
      data: {
        stripeSessionId: stripeSession.id,
        physicianId: physicianId,
        plan: plan,
        amount: priceInCents,
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });

    console.log("✅ Checkout session created:", stripeSession.id);

    return NextResponse.json({ 
      url: stripeSession.url,
      sessionId: stripeSession.id 
    });

  } catch (error: any) {
    console.error("❌ Checkout error:", error.message);
    return NextResponse.json({ 
      error: "Failed to create checkout session" 
    }, { status: 500 });
  }
}