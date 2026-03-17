import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineShieldCheck, HiCheck, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /\d/.test(p) },
  { label: 'Special character', test: (p: string) => /[@$!%*?&#]/.test(p) },
];

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await registerApi({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      });
      login(data.accessToken, data.refreshToken, data.user);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <HiOutlineShieldCheck className="text-blue-500 text-5xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-500 mt-2">Join SecureAuth IAM</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl border border-gray-800 p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
              <input type="text" value={form.firstName} onChange={update('firstName')} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
              <input type="text" value={form.lastName} onChange={update('lastName')} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input type="email" value={form.email} onChange={update('email')} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input type="password" value={form.password} onChange={update('password')} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
            <div className="mt-2 space-y-1">
              {passwordRules.map((rule) => (
                <div key={rule.label} className="flex items-center gap-2 text-xs">
                  {rule.test(form.password)
                    ? <HiCheck className="text-green-500" />
                    : <HiX className="text-gray-600" />
                  }
                  <span className={rule.test(form.password) ? 'text-green-500' : 'text-gray-600'}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
            <input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-400">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
