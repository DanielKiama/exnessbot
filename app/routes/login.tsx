import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "~/utils/firebase";
import { Link } from "@remix-run/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col md:flex-row">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block mb-6">
              <div className="flex items-center justify-center">
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
            </Link>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome Back</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Sign in to manage your Telegram channels</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              Return to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Image & Branding */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 dark:bg-blue-800 text-white flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="w-20 h-20 rounded-full bg-white/10 mx-auto flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">Manage Your Telegram Channels</h1>
            <p className="text-blue-100 text-lg mb-8">
              Access your dashboard to automate subscriptions, track payments, and communicate with your subscribers.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-xl font-bold mb-1">Automated</div>
              <p className="text-blue-100">Subscription management without manual work</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-xl font-bold mb-1">Secure</div>
              <p className="text-blue-100">Protected access to your channel data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
