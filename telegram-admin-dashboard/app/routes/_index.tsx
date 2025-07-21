import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import "~/styles/landing.css";

export const meta: MetaFunction = () => {
  return [
    { title: "TeleAdmin - Make every subscriber using accurate audience segmentation" },
    { name: "description", content: "Automate your Telegram channel management with accurate audience segmentation and real-time subscriber insights." },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <img 
            src="/logo-light.png" 
            alt="TeleAdmin" 
            className="h-10 w-auto block dark:hidden" 
          />
          <img 
            src="/logo-dark.png" 
            alt="TeleAdmin" 
            className="h-10 w-auto hidden dark:block" 
          />
          <span className="ml-3 text-xl font-bold text-gray-900">TeleAdmin</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
          <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
          <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
          <a href="#docs" className="text-gray-600 hover:text-gray-900">Documentation</a>
          <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-gray-600 hover:text-gray-900">Sign in</Link>
          <Link 
            to="/dashboard" 
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Make every subscriber using accurate{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              audience segmentation
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Automate your Telegram channel management with intelligent subscriber segmentation and real-time behavioral insights that drive engagement and subscription revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              to="/dashboard" 
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-lg"
            >
              Start automating
            </Link>
            <button className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Watch demo
            </button>
          </div>
          
          {/* Telegram Integration Logos */}
          <div className="flex items-center justify-center space-x-12 opacity-60">
            <span className="text-lg font-semibold text-gray-400">Telegram</span>
            <span className="text-lg font-semibold text-gray-400">Bot API</span>
            <span className="text-lg font-semibold text-gray-400">Webhooks</span>
            <span className="text-lg font-semibold text-gray-400">Payments</span>
            <span className="text-lg font-semibold text-gray-400">Analytics</span>
            <span className="text-lg font-semibold text-gray-400">Automation</span>
          </div>
        </div>
        
        {/* Floating Cards */}
        <div className="relative mt-20">
          <div className="absolute top-0 left-1/4 transform -translate-x-1/2 -translate-y-8">
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 rotate-12">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-blue-600 font-bold">📊</span>
              </div>
              <p className="text-sm font-medium text-gray-900">Subscriber Analytics</p>
              <p className="text-xs text-gray-500">Real-time insights</p>
            </div>
          </div>
          
          <div className="absolute top-0 right-1/4 transform translate-x-1/2 -translate-y-4">
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 -rotate-12">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-orange-600 font-bold">🎯</span>
              </div>
              <p className="text-sm font-medium text-gray-900">Smart Targeting</p>
              <p className="text-xs text-gray-500">Precise segments</p>
            </div>
          </div>
          
          <div className="absolute bottom-0 right-1/3 transform translate-x-1/2 translate-y-8">
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 rotate-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-yellow-600 font-bold">⚡</span>
              </div>
              <p className="text-sm font-medium text-gray-900">Bot Automation</p>
              <p className="text-xs text-gray-500">Smart workflows</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Identify patterns among your most valuable subscribers with{" "}
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  real-time insights
                </span>{" "}
                into behaviour
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Analyze subscriber behavior and engagement patterns to create targeted campaigns that convert. Our AI-powered segmentation helps you understand what drives subscription renewals and premium upgrades.
              </p>
              <Link 
                to="/dashboard" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Try for free
              </Link>
            </div>
            <div className="lg:w-1/2">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Channel Insights</h3>
                  <span className="text-2xl font-bold text-blue-600">2,340 subs</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold text-sm">A</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Active Subscribers</p>
                        <p className="text-sm text-gray-500">High engagement</p>
                      </div>
                    </div>
                    <span className="text-green-600 font-semibold">+24%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-orange-600 font-bold text-sm">P</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Premium Members</p>
                        <p className="text-sm text-gray-500">Revenue drivers</p>
                      </div>
                    </div>
                    <span className="text-green-600 font-semibold">+18%</span>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-end justify-center p-4">
                    <div className="flex items-end space-x-2">
                      <div className="w-4 h-16 bg-blue-400 rounded-t"></div>
                      <div className="w-4 h-20 bg-blue-500 rounded-t"></div>
                      <div className="w-4 h-24 bg-blue-600 rounded-t"></div>
                      <div className="w-4 h-18 bg-purple-400 rounded-t"></div>
                      <div className="w-4 h-22 bg-purple-500 rounded-t"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Section */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Increase revenue by{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              automating
            </span>{" "}
            the entire{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              subscription process
            </span>
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            Streamline Telegram channel subscription management with automated workflows that handle everything from user onboarding to payment processing and renewal reminders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              to="/dashboard" 
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-lg"
            >
              Start automating
            </Link>
            <button className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Watch demo
            </button>
          </div>
          
          {/* Integration Logos */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center justify-center opacity-60">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">T</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">$</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">W</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold">A</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold">S</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 font-bold">B</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Telegram Bot Dashboard</h3>
                    <span className="text-sm text-gray-500 bg-green-100 px-2 py-1 rounded">Live</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">👥</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Active Subscribers</p>
                          <p className="text-sm text-gray-500">Last 24 hours</p>
                        </div>
                      </div>
                      <span className="text-blue-600 font-bold text-lg">1,247</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">💰</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Subscription Revenue</p>
                          <p className="text-sm text-gray-500">This month</p>
                        </div>
                      </div>
                      <span className="text-green-600 font-bold text-lg">$12,450</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Save time and also allows us to accurately segment the Telegram audience that we wish to target
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our intelligent Telegram bot learns from subscriber behavior to create precise audience segments, enabling you to deliver personalized content and subscription offers that drive engagement and conversions.
              </p>
              <Link 
                to="/dashboard" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Try for free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img 
                src="/logo-light.png" 
                alt="TeleAdmin" 
                className="h-8 w-auto block dark:hidden" 
              />
              <img 
                src="/logo-dark.png" 
                alt="TeleAdmin" 
                className="h-8 w-auto hidden dark:block" 
              />
              <span className="ml-3 text-lg font-bold text-gray-900">TeleAdmin</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-900">Terms</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} TeleAdmin. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature section data
const features = [
  {
    title: "Automated Subscription Management",
    description: "Our bot automatically adds users when they subscribe and removes them when their subscription expires, eliminating manual work.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Subscription Tracking",
    description: "Monitor all active subscriptions, expiration dates, and renewal status from a single dashboard interface.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Bulk Messaging",
    description: "Send announcements, updates, or promotional messages to all subscribers with just a few clicks.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
];

// How it works steps
const steps = [
  {
    title: "Connect Your Channel",
    description: "Link your Telegram channel to our dashboard in just a few clicks.",
  },
  {
    title: "Set Up Subscription Plans",
    description: "Create subscription tiers with different durations and pricing.",
  },
  {
    title: "Share Access Codes",
    description: "Generate and distribute access codes to your subscribers.",
  },
  {
    title: "Automated Management",
    description: "Let our system handle everything else automatically.",
  },
];

// Testimonials
const testimonials = [
  {
    name: "Alex Johnson",
    role: "Finance Channel Owner",
    quote: "Since using TeleAdmin, I've saved hours each week that I used to spend manually managing subscribers. The automated system is flawless.",
  },
  {
    name: "Sarah Williams",
    role: "Education Content Creator",
    quote: "My subscriber base grew 3x after implementing TeleAdmin. The seamless subscription process made it much easier for new members to join.",
  },
  {
    name: "Michael Chen",
    role: "Tech Newsletter Publisher",
    quote: "The bulk messaging feature has transformed how I communicate with my audience. Engagement has increased by 40% since I started using TeleAdmin.",
  },
];

// Note: Animation styles should be added to your global CSS file
// The following classes are used for the blob animation:
// .animate-blob, .animation-delay-2000, .animation-delay-4000
