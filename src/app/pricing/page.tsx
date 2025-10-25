"use client";
import { useState } from "react";
import { Check, Zap, Crown, Shield, Menu, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/navigation/sidebar";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 100,
    description: "Perfect for getting started",
    icon: Shield,
    popular: false,
    features: [
      "Up to 50 patients",
      "Basic analytics",
      "Email support",
      "5GB storage",
      "Mobile app access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 200,
    description: "Best for growing practices",
    icon: Zap,
    popular: true,
    features: [
      "Up to 200 patients",
      "Advanced analytics",
      "Priority support",
      "25GB storage",
      "API access",
      "Custom branding",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 300,
    description: "For established practices",
    icon: Crown,
    popular: false,
    features: [
      "Unlimited patients",
      "Real-time analytics",
      "24/7 dedicated support",
      "Unlimited storage",
      "API access",
      "Custom integrations",
      "White-label solution",
    ],
  },
];

export default function SubscriptionPlans() {
  const [loading, setLoading] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleCheckout = async (planId: string, price: number) => {
    setLoading(planId);
    try {
      const res = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          price: price,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout Error:", err);
      alert("Unable to start checkout. Please try again.");
      setLoading(null);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Controlled */}
      <div
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      {/* Menu Button - Changes Position When Sidebar Opens */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed top-6 z-50 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
          isSidebarOpen ? "left-[260px]" : "left-6"
        }`}
        aria-label="Toggle Menu"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6 text-slate-900" />
        ) : (
          <Menu className="w-6 h-6 text-slate-900" />
        )}
      </button>

      {/* Main Content - Full Width */}
      <main className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 mt-12">
            <Badge className="mb-4" variant="secondary">
              Pricing Plans
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Choose Your Perfect Plan
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Select the plan that best fits your practice needs. All plans
              include our core features.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.id}
                  className={`relative transition-all duration-300 hover:shadow-2xl ${
                    plan.popular
                      ? "border-2 border-blue-500 shadow-xl md:scale-105"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1 text-sm">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="text-center pb-6">
                    <div className="mb-6">
                      <span className="text-5xl font-extrabold text-slate-900">
                        ${plan.price}
                      </span>
                      <span className="text-slate-600 text-lg">/month</span>
                    </div>

                    <div className="space-y-3 text-left">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700 text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      onClick={() => handleCheckout(plan.id, plan.price)}
                      disabled={loading !== null}
                      className={`w-full py-6 text-lg font-semibold transition-all ${
                        plan.popular
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                          : "bg-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      {loading === plan.id ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">⏳</span> Processing...
                        </span>
                      ) : (
                        `Choose ${plan.name}`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Trust Badges */}
          <div className="mt-16 text-center">
            <p className="text-slate-600 mb-6">
              Trusted by healthcare professionals worldwide
            </p>
            <div className="flex justify-center items-center gap-8 flex-wrap">
              <Badge variant="outline" className="px-4 py-2">
                🔒 Secure Payment
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                ✓ Cancel Anytime
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                💯 Money-back Guarantee
              </Badge>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
