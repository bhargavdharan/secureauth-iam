import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginApi({ email, password, mfaCode: mfaCode || undefined });
      if (data.mfaRequired) {
        setMfaRequired(true);
        toast('Please enter your MFA code');
      } else {
        login(data.accessToken, data.refreshToken, data.user);
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <HiOutlineShieldCheck className="text-blue-500 text-5xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">SecureAuth IAM</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl border border-gray-800 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              placeholder="admin@secureauth.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              placeholder="Enter your password"
            />
          </div>

          {mfaRequired && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">MFA Code</label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="6-digit code"
                maxLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-400">
              Create one
            </Link>
          </p>
        </form>

        <p className="text-center text-gray-600 text-xs mt-6">
          Demo: admin@secureauth.com / Admin@123
        </p>
      </div>
    </div>
  );
}
