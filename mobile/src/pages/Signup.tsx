'use client';

import { useState } from 'react';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff'); // default
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // toggle

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Password validation: 1 uppercase, 1 number, min 8 chars
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        'Password must contain at least 1 uppercase letter, 1 number, and be at least 8 characters long.',
      );
      return;
    }

    // Split full name
    const [firstName, ...rest] = fullName.trim().split(' ');
    const lastName = rest.join(' ');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Signup failed');
        return;
      }

      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => (window.location.href = '/login'), 1500);
    } catch (e) {
      setError('Something went wrong');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center w-full dark:bg-gray-950 bg-background">
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg px-8 py-6 max-w-md w-full">
        {/* Heading */}
        <h1 className="text-2xl font-bold text-center mb-2 dark:text-gray-200">
          Create a new account
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
          Enter your details to register.
        </p>

        {/* Error / Success */}
        {error && <p className="text-red-500 text-center text-sm mb-2">{error}</p>}
        {success && <p className="text-green-500 text-center text-sm mb-2">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Full Name *
            </label>

            <input
              id="fullName"
              type="text"
              required
              placeholder="James Brown"
              className="shadow-sm rounded-md w-full px-3 py-2 border border-gray-300
                         focus:ring-indigo-500 focus:border-indigo-500 
                         dark:bg-gray-800 dark:text-gray-200"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email Address *
            </label>

            <input
              id="email"
              type="email"
              required
              placeholder="hello@company.com"
              className="shadow-sm rounded-md w-full px-3 py-2 border border-gray-300 
                         focus:ring-indigo-500 focus:border-indigo-500 
                         dark:bg-gray-800 dark:text-gray-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {email && !emailRegex.test(email) && (
              <p className="text-red-500 text-xs mt-1">Invalid email format.</p>
            )}
          </div>

          {/* Role Select */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Select Role *
            </label>

            <select
              id="role"
              className="shadow-sm rounded-md w-full px-3 py-2 border border-gray-300
                         dark:bg-gray-800 dark:text-gray-200 
                         focus:ring-indigo-500 focus:border-indigo-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Password *
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="shadow-sm rounded-md w-full px-3 py-2 border border-gray-300
                           focus:ring-indigo-500 focus:border-indigo-500 
                           dark:bg-gray-800 dark:text-gray-200 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Show/Hide Icon */}
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 cursor-pointer text-gray-600 dark:text-gray-300"
              >
                {showPassword ? (
                  /* Hide Icon */
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17c-3.79 0-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4m0 5a2.5 2.5 0 0 0 0 5a2.5 2.5 0 0 0 0-5Z" />
                  </svg>
                ) : (
                  /* Show Icon */
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0-3C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4Z" />
                  </svg>
                )}
              </span>
            </div>

            {/* Password Validation */}
            {password && !passwordRegex.test(password) && (
              <p className="text-red-500 text-xs mt-1">
                Must have 1 uppercase letter, 1 number, min. 8 characters.
              </p>
            )}

            {password && passwordRegex.test(password) && (
              <p className="text-green-500 text-xs mt-1">Strong password ✓</p>
            )}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent 
                       rounded-md shadow-sm text-sm font-medium text-white 
                       bg-indigo-600 hover:bg-indigo-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-indigo-500"
          >
            Register
          </button>

          {/* Terms */}
          <p className="text-gray-600 dark:text-gray-400 text-xs text-center mt-2">
            By clicking Register, you agree to our{' '}
            <a href="#" className="text-indigo-500 hover:text-indigo-700 underline">
              Terms and Conditions
            </a>
            .
          </p>
        </form>

        {/* Already have account */}
        <p className="text-center mt-4 text-sm dark:text-gray-300">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-500 hover:text-indigo-700 underline">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}
