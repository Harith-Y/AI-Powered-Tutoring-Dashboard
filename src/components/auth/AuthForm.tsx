import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Mail, Eye, EyeOff, Sparkles, BookOpen, Brain, ArrowLeft } from 'lucide-react';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess('Password reset email sent! Check your inbox and follow the instructions to reset your password.');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('user-not-found')) {
          setError('No account found with this email address. Please check your email or create a new account.');
        } else if (error.message.includes('invalid-email')) {
          setError('Please enter a valid email address.');
        } else if (error.message.includes('too-many-requests')) {
          setError('Too many password reset attempts. Please wait a few minutes before trying again.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    }
    setLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setSuccess('');
    setShowForgotPassword(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl mb-6 shadow-xl">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Reset Password
            </h1>
            <p className="text-white/80 text-lg">
              Enter your email to receive reset instructions
            </p>
          </div>

          {/* Reset Password Card */}
          <div className="glass rounded-3xl p-8 shadow-xl-custom">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Forgot Password?
              </h2>
              <p className="text-gray-600">
                No worries! Enter your email and we'll send you reset instructions.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <p className="text-green-700 text-sm font-medium">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-modern pl-12"
                    placeholder="Enter your email address"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary w-full relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="spinner mr-3"></div>
                      Sending Reset Email...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Send Reset Email
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  resetForm();
                  setIsLogin(true);
                }}
                className="flex items-center justify-center w-full text-indigo-600 hover:text-indigo-800 font-semibold transition-colors duration-200 hover:underline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </button>
            </div>

            {/* Help Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-3">Need help?</p>
                <div className="space-y-2 text-xs text-gray-600">
                  <p>• Check your spam/junk folder for the reset email</p>
                  <p>• Make sure you entered the correct email address</p>
                  <p>• The reset link expires in 1 hour</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-white/60 text-sm">
              Remember your password? 
              <button 
                onClick={() => {
                  resetForm();
                  setIsLogin(true);
                }}
                className="text-white font-semibold ml-1 hover:underline"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-3xl mb-6 shadow-xl">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Tutor
          </h1>
          <p className="text-white/80 text-lg">
            Your personalized learning companion
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass rounded-3xl p-8 shadow-xl-custom">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to continue your learning journey' : 'Start your personalized learning adventure'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-modern pl-12"
                    placeholder="Enter your full name"
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-modern pl-12"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern pl-12 pr-12"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <div></div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200 hover:underline"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center">
                {loading ? (
                  <>
                    <div className="spinner mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors duration-200 hover:underline"
              disabled={loading}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          {/* Features Preview */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-4 text-center">What you'll get:</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center text-sm text-gray-600">
                <Brain className="w-4 h-4 text-indigo-500 mr-3 flex-shrink-0" />
                <span>AI-powered personalized learning paths</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <BookOpen className="w-4 h-4 text-emerald-500 mr-3 flex-shrink-0" />
                <span>Interactive progress tracking</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-purple-500 mr-3 flex-shrink-0" />
                <span>Smart resource recommendations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/60 text-sm">
            Join thousands of learners advancing their skills with AI
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;