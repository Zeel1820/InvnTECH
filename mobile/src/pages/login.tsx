'use client';

import { useToast } from '../hooks/use-toast';
import { useState } from 'react';

export default function Login() {
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Clear UI errors
    if (!emailRegex.test(email)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
      });
      return;
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: data.message || 'Invalid email or password.',
      });
      return;
    }

    // Success toast
    toast({
      title: 'Login Successful',
      description: 'Redirecting to dashboard...',
    });

    if (remember) {
      localStorage.setItem('token', data.token);
    }

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full dark:bg-gray-950 bg-background px-3">
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg px-8 py-6 max-w-md w-full">
        {/* Heading */}
        <h1 className="text-2xl font-bold text-center mb-2 dark:text-gray-200">Welcome Back!</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">Login to continue</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              placeholder="you@example.com"
              className="shadow-sm rounded-md w-full px-3 py-2 border border-gray-300 
                         focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                required
                placeholder="Enter your password"
                className="shadow-sm rounded-md w-full px-3 py-2 border border-gray-300
                           focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 
                           dark:bg-gray-800 dark:text-gray-200 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Show/Hide Password */}
              <span
                className="absolute right-3 top-2.5 cursor-pointer text-gray-600 dark:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17c-3.79 0-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4m0 5a2.5 2.5 0 0 0 0 5a2.5 2.5 0 0 0 0-5Z" />
                  </svg>
                ) : (
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0-3C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4Z" />
                  </svg>
                )}
              </span>
            </div>
          </div>

          {/* Remember Me + Signup Link */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="remember" className="ml-2 block text-sm dark:text-gray-300">
                Remember me
              </label>
            </div>

            <a href="/signup" className="text-xs text-indigo-500 hover:text-indigo-700 underline">
              Create Account
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium 
                       text-white bg-indigo-600 hover:bg-indigo-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
