'use client';
import React, { useState } from 'react';
import { ChevronDown, Star, Check, Menu, X, Instagram, Linkedin, Youtube, Facebook } from 'lucide-react';
import Link from 'next/link';

const KebilioLandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const testimonials = [
    {
      text: "Kebilo has transformed our clinic's efficiency and reduced administrative burden.",
      author: "Dr. Sarah Thompson",
      role: "Medical director, City Health Clinic"
    },
    {
      text: "The AI-driven insights have been game-changing for our patient management.",
      author: "Dr. Michael Rodriguez",
      role: "Chief physician, Regional Medical Center"
    },
    {
      text: "Seamless integration and robust compliance features make Kebilo a must-have tool.",
      author: "Emily Chen",
      role: "Healthcare administrator, Wellness Group"
    }
  ];

  const pricingPlans = [
    {
      name: "Basic plan",
      price: "$19",
      yearly: "$199 yearly",
      features: [
        "Essential document processing",
        "Basic workflow management",
        "Standard security features"
      ]
    },
    {
      name: "Business plan",
      price: "$29",
      yearly: "$299 yearly",
      features: [
        "Advanced document processing",
        "Comprehensive workflow tools",
        "Enhanced security protocols",
        "Priority support"
      ],
      highlighted: true
    },
    {
      name: "Enterprise plan",
      price: "$49",
      yearly: "$499 yearly",
      features: [
        "Full AI-powered solutions",
        "Custom workflow design",
        "Advanced compliance features",
        "Dedicated support team",
        "Unlimited integrations"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-slate-700 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="text-xl font-bold italic">Kebilo</div>
              <div className="hidden md:flex space-x-6">
                <a href="#" className="hover:text-gray-300 transition">Link One</a>
                <a href="#" className="hover:text-gray-300 transition">Link Two</a>
                <a href="#" className="hover:text-gray-300 transition">Link Three</a>
                <button className="flex items-center hover:text-gray-300 transition">
                  Link Four <ChevronDown className="ml-1 w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="hidden md:flex space-x-3">
              <Link href="/auth/sign-in" className="px-4 py-2 hover:bg-slate-600 rounded transition">Login</Link>
              <Link href="/auth/sign-up" className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded transition">Sign Up</Link>
            </div>
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-600 px-4 py-4 space-y-3">
            <a href="#" className="block hover:text-gray-300">Link One</a>
            <a href="#" className="block hover:text-gray-300">Link Two</a>
            <a href="#" className="block hover:text-gray-300">Link Three</a>
            <a href="#" className="block hover:text-gray-300">Link Four</a>
            <button className="w-full px-4 py-2 bg-slate-700 rounded mt-4">Button</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gray-200 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
              Simplify healthcare with intelligent AI assistance
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Kebilo streamlines clinical workflows and document management. Save time, reduce errors, and maintain HIPAA compliance with our intuitive healthcare assistant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium">
                Start now
              </button>
              <button className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium border border-gray-300">
                Learn more
              </button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <img
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop"
              alt="Healthcare professionals"
              className="w-full h-96 object-cover rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Automated Document Processing */}
      <section className="bg-slate-800 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-4xl mb-6 font-serif italic">es</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Automated document processing made simple
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Transform complex medical paperwork into efficient digital workflows. Our AI handles documentation with precision and speed.
            </p>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition font-medium">
                Explore features
              </button>
              <button className="px-6 py-3 border border-white rounded-lg hover:bg-white hover:text-gray-900 transition font-medium">
                Watch demo →
              </button>
            </div>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=600&fit=crop"
              alt="Professional working"
              className="w-full h-96 object-cover rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-20">
            <div className="order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=500&fit=crop"
                alt="Healthcare analytics"
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
              />
            </div>
            <div className="order-1 md:order-2">
              <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Insights</p>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Powerful dashboards for clinical insights
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Track patient data, monitor performance, and make informed decisions with real-time analytics.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition font-medium">
                  View details
                </button>
                <button className="px-6 py-3 border border-gray-300 hover:bg-gray-100 rounded-lg transition font-medium">
                  Get started →
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Efficiency</p>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Intelligent task management for healthcare professionals
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Streamline your daily workflows with AI-powered task prioritization and automation.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition font-medium">
                  Learn more
                </button>
                <button className="px-6 py-3 border border-gray-300 hover:bg-gray-100 rounded-lg transition font-medium">
                  Start trial →
                </button>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&h=500&fit=crop"
                alt="Healthcare professional"
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Kebilo Section */}
      <section className="py-20 px-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Why Kebilo</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Healthcare technology that works for you
            </h2>
            <p className="text-gray-600 mt-4 text-lg">
              Designed to support medical professionals with cutting-edge solutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition">
              <div className="relative h-64">
                <img
                  src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=300&fit=crop"
                  alt="HIPAA Compliance"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <p className="text-sm font-semibold mb-2 uppercase tracking-wide">Compliance</p>
                  <h3 className="text-2xl font-bold mb-2">HIPAA-compliant platform ensuring data security and privacy</h3>
                  <p className="text-sm text-gray-200 mb-4">Protect patient information with robust security measures</p>
                  <div className="flex gap-3">
                    <button className="text-sm font-medium hover:underline">Learn more</button>
                    <button className="text-sm font-medium hover:underline">Explore →</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-teal-600 rounded-xl p-8 text-white shadow-lg hover:shadow-xl transition">
              <div className="mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold mb-2 uppercase tracking-wide">User-friendly interface</p>
                <h3 className="text-2xl font-bold mb-3">Intuitive design for seamless clinical workflow integration</h3>
                <p className="text-white/90 mb-6">Get started in minutes with our easy-to-use platform</p>
                <button className="font-medium hover:underline">Explore →</button>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition">
              <div className="relative h-64">
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop"
                  alt="Dedicated Support"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <p className="text-sm font-semibold mb-2 uppercase tracking-wide">Dedicated support</p>
                  <h3 className="text-2xl font-bold mb-2">Expert assistance to help you maximize your healthcare technology</h3>
                  <p className="text-sm text-gray-200 mb-4">24/7 support from our healthcare technology experts</p>
                  <button className="font-medium hover:underline">Contact us →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">01 Onboarding</p>
            <p className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Setup</p>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              Quick and seamless integration
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Connect your existing systems and start streamlining workflows within minutes.
            </p>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition font-medium">
                Get started
              </button>
              <button className="px-6 py-3 border border-gray-300 hover:bg-gray-100 rounded-lg transition font-medium">
                Watch tutorial →
              </button>
            </div>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&h=500&fit=crop"
              alt="Healthcare professional setup"
              className="w-full h-96 object-cover rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Continuous Support Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=500&fit=crop"
              alt="Healthcare professional working"
              className="w-full h-96 object-cover rounded-2xl shadow-lg"
            />
          </div>
          <div className="order-1 md:order-2">
            <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">03 Continuous support</p>
            <p className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Optimize</p>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              Ongoing performance improvement
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Receive insights and recommendations to enhance your clinical workflows.
            </p>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition font-medium">
                Get insights
              </button>
              <button className="px-6 py-3 border border-gray-300 hover:bg-gray-100 rounded-lg transition font-medium">
                Contact support →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">What our clients say</h2>
            <p className="text-gray-600 text-lg">Real experiences from healthcare professionals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl shadow-md">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">{testimonial.text}</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-slate-700 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-2 uppercase tracking-wide text-gray-300">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Flexible plans for every healthcare practice
            </h2>
            <p className="text-gray-300 text-lg">Choose the right solution for your clinical needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl p-8 ${plan.highlighted ? 'bg-slate-600 ring-2 ring-teal-400' : 'bg-slate-800'}`}
              >
                <p className="text-sm font-semibold mb-2 uppercase tracking-wide text-gray-300">{plan.name}</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <p className="text-gray-400 mt-2">or {plan.yearly}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-teal-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 bg-teal-400 hover:bg-teal-500 text-gray-900 font-semibold rounded-lg transition">
                  Get started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Ready to transform your healthcare workflow
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-3xl mx-auto">
            Experience the power of AI-driven clinical assistance with a personalized demo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition font-medium">
              Request demo
            </button>
            <button className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition font-medium">
              Contact sales
            </button>
          </div>

          <div className="max-w-4xl mx-auto">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=500&fit=crop"
              alt="Team collaboration"
              className="w-full h-96 object-cover rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative mb-12">
            <img
              src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=300&fit=crop"
              alt="Newsletter"
              className="w-full h-64 object-cover rounded-2xl opacity-70"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Stay updated with healthcare innovations
              </h2>
              <p className="text-gray-200 mb-6">
                Receive the latest insights, tips, and technology updates directly in your inbox.
              </p>
              <div className="flex w-full max-w-md gap-3">
                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <button className="px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-medium transition">
                  Sign up
                </button>
              </div>
              <p className="text-xs text-gray-300 mt-4">
                By signing up, you agree to our terms and privacy policy.
              </p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-8">
            <h3 className="text-xl font-bold mb-2">Join our newsletter</h3>
            <p className="text-gray-400 text-sm mb-6">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <div className="flex max-w-md mx-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <button className="px-6 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              By subscribing you agree to with our Privacy Policy
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-bold italic mb-4">Logo</div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Column One</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Link One</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Two</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Three</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Four</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Five</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Column Two</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Link Six</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Seven</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Eight</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Nine</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Ten</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Column Three</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Link Eleven</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Twelve</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Thirteen</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Fourteen</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Fifteen</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Column Four</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Link Sixteen</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Seventeen</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Eighteen</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Nineteen</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Twenty</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Column Five</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Link Twenty One</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Twenty Two</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Twenty Three</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Twenty Four</a></li>
                <li><a href="#" className="hover:text-gray-900">Link Twenty Five</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 mb-4 md:mb-0">
              © 2025 Relume. All rights reserved
            </p>
            <div className="flex gap-6 text-sm text-gray-600 mb-4 md:mb-0">
              <a href="#" className="hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900">Terms of Service</a>
              <a href="#" className="hover:text-gray-900">Cookies Settings</a>
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <X className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default KebilioLandingPage