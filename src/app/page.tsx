"use client";
import React, { ReactNode, useRef } from "react";
import { motion } from "framer-motion"; // Add this import for animations
import { Activity, CheckCircle } from "lucide-react";
// import { Button } from "@/components/ui/button";

import { useState, useEffect } from "react";
import Link from "next/link";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 5000);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll handler
  const handleMenuClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 ${isScrolled
        ? "bg-white/95 backdrop-blur-sm border-b border-gray-200"
        : "bg-transparent backdrop-blur-sm"
        } z-50 transition-all duration-300`}
    >
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex cursor-pointer items-center gap-2">
            <img src="/logo.png" alt="logo" className="h-16" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              onClick={e => handleMenuClick(e, "how-it-works")}
              className="text-gray-700 hover:text-gray-900 transition-colors text-base"
            >
              How it works
            </a>
            <a
              href="#pricing"
              onClick={e => handleMenuClick(e, "pricing")}
              className="text-gray-700 hover:text-gray-900 transition-colors text-base"
            >
              Pricing
            </a>
            <a
              href="#support"
              onClick={e => handleMenuClick(e, "support")}
              className="text-gray-700 hover:text-gray-900 transition-colors text-base"
            >
              Support
            </a>
            <a
              href="#resources"
              onClick={e => handleMenuClick(e, "resources")}
              className="text-gray-700 hover:text-gray-900 transition-colors text-base"
            >
              Resources
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in" className="cursor-pointer">
              <Button variant="outline" className="font-medium hover:text-[#53d1df] hover:border-[#53d1df] cursor-pointer text-sm">
                SIGN IN
              </Button>
            </Link>
            <Link href="/auth/sign-up" className="cursor-pointer">
              <Button className="bg-[#53d1df] cursor-pointer hover:bg-[#33c7d8] font-medium text-sm">
                SIGN UP
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

type ButtonProps = {
  children: ReactNode;
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  [key: string]: any;
  type?: "button" | "submit" | "reset";
};
const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...props
}) => {
  const baseStyles: string =
    "rounded-lg font-medium transition-colors duration-200";
  const variants: any = {
    default: "bg-[#53d1df] text-white hover:bg-[#33c7d8]",
    outline: "bg-transparent border-2",
  };
  const sizes: any = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const HeroSection = () => {
  const cardRef: any = useRef(null);
  const [ripplePosition, setRipplePosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  return (
    <section className="min-h-screen pt-32 pb-20 px-6 bg-gradient-to-br from-cyan-50 via-cyan-50 to-cyan-100 relative overflow-hidden flex items-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-200/40 via-transparent to-transparent"></div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative w-full"
      >
        <div className="space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight"
          >
            The First Patent-Pending AI Assistant Built to Transform Healthcare Workflows — Not Just Document Them
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-base md:text-lg text-gray-700 leading-relaxed max-w-xl"
          >
            Powerful yet simple features that automate the routine, so medical examiners can focus on care, not paperwork
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-wrap gap-4"
          >
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-semibold px-8 text-base"
            >
              BOOK A DEMO
            </Button>
            <Button
              size="lg"
              className="bg-[#53d1df] hover:bg-[#33c7d8] font-semibold px-8 text-base"
            >
              START YOUR 15-DAY FREE TRIAL
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="relative"
          style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
        >
          <motion.div
            ref={cardRef}
            className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200 cursor-pointer relative overflow-hidden"
            whileHover={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onMouseMove={(e) => {
              if (!cardRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;

              // Update ripple position
              setRipplePosition({
                x: (x / rect.width) * 100,
                y: (y / rect.height) * 100,
              });

              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const rotateY = ((y - centerY) / centerY) * -5;
              const rotateX = ((x - centerX) / centerX) * 5;
              cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
              setIsHovering(false);
              if (!cardRef.current) return;
              cardRef.current.style.transform =
                "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
            }}
          >
            {/* Ripple Effect */}
            {isHovering && (
              <motion.div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <motion.div
                  className="absolute w-64 h-64 bg-[#53d1df]/30 rounded-full blur-xl"
                  animate={{
                    scale: [0, 2.5, 0],
                    opacity: [0.6, 0.3, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  style={{
                    left: `${ripplePosition.x}%`,
                    top: `${ripplePosition.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
                <motion.div
                  className="absolute w-96 h-96 bg-[#1fbdd2]/20 rounded-full blur-2xl"
                  animate={{
                    scale: [0, 2, 0],
                    opacity: [0.4, 0.2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.3,
                  }}
                  style={{
                    left: `${ripplePosition.x}%`,
                    top: `${ripplePosition.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </motion.div>
            )}

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#53d1df]" />
                <span className="font-semibold text-gray-900 text-sm">
                  DocLatch AI
                </span>
              </div>
              <Button
                size="sm"
                className="bg-[#53d1df] hover:bg-[#33c7d8] text-xs relative z-10 inline-block"
              >
                New Case
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
              <div className="space-y-2">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-gray-200"></div>
                  <span>Home</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[200px]">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-gray-700">
                      DocLatch
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-cyan-100 rounded border border-cyan-200"></div>
                  <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200"></div>
                </div>
                <div className="bg-white rounded-lg border-2 border-gray-300 p-4 min-h-[200px]">
                  <div className="text-xs font-semibold mb-3">
                    Medical Record
                  </div>
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-2 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-cyan-50 rounded border border-cyan-200"></div>
                  <div className="w-6 h-6 bg-cyan-50 rounded border border-cyan-200"></div>
                  <div className="w-6 h-6 bg-cyan-50 rounded border border-cyan-200"></div>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[80px]">
                    <div className="space-y-2">
                      <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  </div>
                  <div className="bg-[#53d1df] rounded-lg p-3 text-white min-h-[80px]">
                    <div className="text-[10px] font-medium">
                      Summary Generated
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-600 pt-4 border-t border-gray-200 relative z-10">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span>Health</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span>Non-billable</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span>Admin Items</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span>Signed</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};
const FeaturesSection = () => {
  const features = [
    {
      icon: (
        <svg
          className="w-12 h-12 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4 4h16v2H4zM4 8h16v12H4z" />
          <path d="M2 6h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
        </svg>
      ),
      title: "Scan any record",
      description:
        "Upload or scan handwritten and digital medical records with high accuracy using AI-powered document recognition.",
    },
    {
      icon: (
        <svg
          className="w-12 h-12 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3a5.5 5.5 0 0 1 0 11H12v6H6V10H3" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      ),
      title: "Precise summarization",
      description:
        "Generate concise, physician-grade summaries within minutes—highlighting key findings, diagnoses, and recommendations.",
    },
    {
      icon: (
        <svg
          className="w-12 h-12 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      ),
      title: "Auto Task Trigger",
      description:
        "Automatically create and assign clinical or administrative tasks based on AI-analyzed reports and findings.",
    },
    {
      icon: (
        <svg
          className="w-12 h-12 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M8 8h8v2H8zM8 12h6v2H8zM8 16h4v2H8z" />
        </svg>
      ),
      title: "Follow Up Visit Intake",
      description:
        "AI intelligently detects follow-up requirements, prepares pre-visit summaries, and aligns tasks for clinical teams.",
    },
    {
      icon: (
        <svg
          className="w-12 h-12 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      ),
      title: "Treatment Updates",
      description:
        "Track patient progress, treatment plans, and AI-generated updates across multiple reports in one place.",
    },
    {
      icon: (
        <svg
          className="w-12 h-12 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="12" cy="9" r="2" fill="currentColor" />
        </svg>
      ),
      title: "Security & Compliance",
      description:
        "All data is encrypted and processed within HIPAA-compliant standards, ensuring full patient data protection.",
    },
  ];


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="min-h-screen py-20 px-6 bg-gradient-to-br from-[#53d1df] via-[#1fbdd2] to-[#53d1df] flex items-center">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto w-full"
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-4"
        >
          AI-powered tools that make medical workflows faster, simpler, and more precise
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="flex justify-center mb-6"
              >
                <div className="w-20 h-20 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  {feature.icon}
                </div>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-xl md:text-2xl font-bold text-white mb-4"
              >
                {feature.title}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-cyan-50 text-sm md:text-base leading-relaxed max-w-sm mx-auto"
              >
                {feature.description}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Upload Medical Records",
      description:
        "Easily upload medical records in PDF or image format — including scanned or handwritten notes. The system automatically detects and prepares files for processing",
    },
    {
      number: "02",
      title: "AI-Powered Analysis",
      description:
        "Our AI engine extracts and structures key medical details, identifies important findings, and organizes information in chronological order for review",
    },
    {
      number: "03",
      title: "Automated Task Creation",
      description:
        "Relevant tasks and follow-ups are generated automatically for physicians and staff — streamlining reviews, recommendations, and next steps.",
    },
    {
      number: "04",
      title: "Review Insights",
      description:
        "Physicians can quickly review AI summaries, verify critical details, and take informed actions — all within a simple, secure interface.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <section id="how-it-works" className="min-h-screen py-20 px-6 bg-white flex items-center">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
          >
            How DocLatch AI Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Transform your medical record review process in four simple steps
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-6xl font-bold text-cyan-100 mb-4"
              >
                {step.number}
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl font-bold text-gray-900 mb-3"
              >
                {step.title}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-gray-600 leading-relaxed text-sm md:text-base"
              >
                {step.description}
              </motion.p>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-4 w-8 h-0.5 bg-cyan-200"></div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      price: "99",
      period: "month",
      description: "Perfect for individual practitioners",
      features: [
        "Up to 50 records per month",
        "AI-powered summaries",
        "Basic chronologies",
        "Email support",
        "5GB storage",
        "Export to PDF",
      ],
      popular: false,
    },
    {
      name: "Professional",
      price: "249",
      period: "month",
      description: "Ideal for small practices and teams",
      features: [
        "Up to 200 records per month",
        "Advanced AI chat & search",
        "Priority chronologies",
        "Priority email & chat support",
        "25GB storage",
        "Export to PDF & Word",
        "Team collaboration (up to 5 users)",
        "Custom branding",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Unlimited records",
        "Advanced AI capabilities",
        "Dedicated account manager",
        "24/7 phone support",
        "Unlimited storage",
        "Advanced security features",
        "Unlimited team members",
        "API access",
        "Custom integrations",
      ],
      popular: false,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <section id="pricing" className="min-h-screen py-20 px-6 bg-gradient-to-br from-gray-50 to-cyan-50 flex items-center">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Choose the plan that fits your practice. All plans include a 15-day
            free trial.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${plan.popular ? "ring-2 ring-[#53d1df] relative" : ""
                }`}
            >
              {plan.popular && (
                <div className="bg-[#53d1df] text-white text-center py-2 text-sm font-semibold">
                  MOST POPULAR
                </div>
              )}
              <div className="p-8">
                <motion.h3
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-xl md:text-2xl font-bold text-gray-900 mb-2"
                >
                  {plan.name}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="text-gray-600 mb-6 text-sm md:text-base"
                >
                  {plan.description}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="mb-6"
                >
                  <span className="text-4xl md:text-5xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600">/{plan.period}</span>
                  )}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <Button
                    className={`w-full mb-6 ${plan.popular
                      ? "bg-[#53d1df] hover:bg-[#33c7d8]"
                      : "bg-gray-900 hover:bg-gray-800"
                      }`}
                    size="lg"
                  >
                    {plan.price === "Custom"
                      ? "Contact Sales"
                      : "Start Free Trial"}
                  </Button>
                </motion.div>
                <motion.ul
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="space-y-3"
                >
                  {plan.features.map((feature, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-3 text-sm md:text-base"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

const ContactSection = () => {
  return (
    <section id="support" className="min-h-screen py-20 px-6 bg-white flex items-start">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto w-full"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-2 gap-12 items-start"
        >
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
            >
              Get in Touch
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="text-base md:text-lg text-gray-600 mb-8"
            >
              Have questions about DocLatch AI? Our team is here to help. Fill out
              the form and we'll get back to you within 24 hours.
            </motion.p>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                viewport={{ once: true }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-[#53d1df]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-base">
                    Email
                  </h3>
                  <p className="text-gray-600 text-sm md:text-base">
                    support@DocLatchai.com
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                viewport={{ once: true }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-[#53d1df]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-base">
                    Phone
                  </h3>
                  <p className="text-gray-600 text-sm md:text-base">
                    +1 (555) 123-4567
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                viewport={{ once: true }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-[#53d1df]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-base">
                    Office
                  </h3>
                  <p className="text-gray-600 text-sm md:text-base">
                    123 Medical Plaza, Suite 500
                    <br />
                    San Francisco, CA 94102
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gray-50 rounded-2xl p-8 border border-gray-200"
          >
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#53d1df] focus:border-transparent outline-none transition text-base"
                    placeholder="John"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#53d1df] focus:border-transparent outline-none transition text-base"
                    placeholder="Doe"
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#53d1df] focus:border-transparent outline-none transition text-base"
                  placeholder="john.doe@example.com"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                viewport={{ once: true }}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#53d1df] focus:border-transparent outline-none transition text-base"
                  placeholder="+1 (555) 000-0000"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                viewport={{ once: true }}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Practice Type
                </label>
                <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#53d1df] focus:border-transparent outline-none transition text-base">
                  <option>Select practice type</option>
                  <option>Individual Practitioner</option>
                  <option>Small Practice (2-10)</option>
                  <option>Medium Practice (11-50)</option>
                  <option>Large Organization (50+)</option>
                  <option>Legal Firm</option>
                  <option>Other</option>
                </select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                viewport={{ once: true }}
              >
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Message *
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#53d1df] focus:border-transparent outline-none transition resize-none text-base"
                  placeholder="Tell us about your needs..."
                ></textarea>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                viewport={{ once: true }}
              >
                <Button
                  type="submit"
                  className="w-full bg-[#53d1df] hover:bg-[#33c7d8]"
                  size="lg"
                >
                  Send Message
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                viewport={{ once: true }}
                className="text-xs text-gray-500 text-center"
              >
                By submitting this form, you agree to our Privacy Policy and
                Terms of Service.
              </motion.p>
            </form>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer id="resources" className="bg-gray-900 text-gray-300 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-6 h-6 text-[#1fbdd2]" />
              <span className="text-xl font-semibold text-white">
                DocLatch AI
              </span>
            </div>
            <p className="text-sm text-gray-400  md:text-sm">

            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-base">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  Security
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-base">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-base">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  HIPAA Compliance
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-white transition text-xs md:text-sm"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400  md:text-sm">
            © 2025 DocLatch AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FAQSection = () => {
  const faqs = [
    {
      question: "What is DocLatch AI?",
      answer:
        "DocLatch AI is a next-generation AI-powered medical legal record analysis tool built for physicians and attorneys. It ingests medical records — like PDFs, notes, and reports — and automatically turns them into structured summaries, chronologies, and action items. Zero setup. Zero training.",
    },
    {
      question: "How does DocLatch AI improve daily workflow?",
      answer:
        "DocLatch AI removes bottlenecks. Instead of manually reviewing lengthy records or chasing details, get accurate summaries and chronologies in minutes, with AI chat for quick searches and collaboration built in. Focus on what matters — analysis and decisions.",
    },
    {
      question: "What is the AI Analysis Engine?",
      answer:
        "Our patent-pending AI Analysis Engine is the core intelligence of DocLatch AI. Think of it as the 'smart processor' that extracts key information, organizes data chronologically, and generates insights from any medical document, instantly. Legal-grade accuracy starts here.",
    },
    {
      question: "Is DocLatch AI just for workers' comp or legal cases?",
      answer:
        "No. DocLatch AI works across all medical practices and legal contexts — including personal injury, malpractice, family medicine, ortho, and more. It’s designed to adapt to your workflow, whether handling case reviews, insurance disputes, or high-volume documentation.",
    },
    {
      question: "Do I need to install or integrate anything with my EMR?",
      answer:
        "Nope. DocLatch AI lives alongside your current system. You keep your EMR — we handle the record analysis. There’s no setup cost, no contracts, and no IT burden. You’re up and running the same day.",
    },
    {
      question:
        "What makes DocLatch AI different from other AI tools or EHR features?",
      answer:
        "Most AI tools help with note-taking or basic summaries. DocLatch AI is built for legal medical analysis, converting unstructured records into searchable, chronological workflows with HIPAA compliance and team collaboration. That’s what makes us different — and why we’re trusted by professionals.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="min-h-screen py-20 px-6 bg-white flex items-center">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto w-full"
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-4"
        >
          Frequently Asked Questions
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-base md:text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto"
        >
          Got questions? We've got answers. Discover how DocLatch AI can
          transform your record review process.
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-6"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200"
            >
              <motion.h3
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="text-lg md:text-xl font-semibold text-gray-900 mb-3 cursor-pointer hover:text-[#53d1df] transition-colors"
              >
                {faq.question}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                whileInView={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-gray-600 leading-relaxed text-sm md:text-base"
              >
                {faq.answer}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};
export default function DocLatchLanding() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased leading-relaxed">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <ContactSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
