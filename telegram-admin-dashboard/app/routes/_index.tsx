import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import "~/styles/landing.css";

export const meta: MetaFunction = () => {
  return [
    { title: "TeleAdmin - Automated Telegram Subscription Management" },
    { name: "description", content: "Automate your Telegram channel subscriptions with TeleAdmin. No more manual user management." },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
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
          <span className="ml-3 text-xl font-bold text-blue-600 dark:text-blue-400">TeleAdmin</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            to="/login" 
            className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Login
          </Link>
          <Link 
            to="/dashboard" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
            Automate Your Telegram Channel Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Stop manually adding and removing subscribers. Let our bot handle subscriptions, payments, and user communication automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/dashboard" 
              className="px-8 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </Link>
            <a 
              href="#features" 
              className="px-8 py-3 border border-blue-600 text-blue-600 dark:text-blue-400 text-center rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-medium"
            >
              Learn More
            </a>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative w-full max-w-lg">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 dark:bg-indigo-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">T</div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">TeleAdmin Bot</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Now</div>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[80%]">
                    <p className="text-sm text-gray-800 dark:text-gray-200">Welcome to Premium Channel! Your subscription is active.</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[80%]">
                    <p className="text-sm text-gray-800 dark:text-gray-200">Your subscription will expire in 30 days.</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg max-w-[80%] ml-auto">
                    <p className="text-sm text-blue-800 dark:text-blue-200">How can I renew my subscription?</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[80%]">
                    <p className="text-sm text-gray-800 dark:text-gray-200">You can renew by using this code: RENEW2023</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">Why You Need TeleAdmin</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Our system automates the entire subscription process for your Telegram channels, saving you time and reducing errors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our platform makes subscription management simple and efficient.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-6">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">What Our Users Say</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Channel owners love how TeleAdmin simplifies their workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">{testimonial.quote}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-800 py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Automate Your Channel Management?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Join thousands of channel owners who have simplified their workflow with TeleAdmin.
          </p>
          <Link 
            to="/dashboard" 
            className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-lg inline-block"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 py-12">
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
              <span className="ml-3 text-lg font-bold text-gray-800 dark:text-white">TeleAdmin</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Terms</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Privacy</a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
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
