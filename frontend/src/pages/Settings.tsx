import { useState } from 'react';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword, setupMfa, verifyMfa, disableMfa } from '../api/settings';
import { getMe } from '../api/auth';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState<'profile' | 'password' | 'mfa'>('profile');

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQrImage, setMfaQrImage] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await updateProfile(profile);
      const { data } = await getMe();
      setUser(data);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const handleMfaSetup = async () => {
    setMfaLoading(true);
    try {
      const { data } = await setupMfa();
      setMfaSecret(data.secret);
      setMfaQrImage(data.qrCodeImage);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to setup MFA');
    } finally { setMfaLoading(false); }
  };

  const handleMfaVerify = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    setMfaLoading(true);
    try {
      await verifyMfa(mfaCode);
      const { data } = await getMe();
      setUser(data);
      setMfaSecret('');
      setMfaQrImage('');
      setMfaCode('');
      toast.success('MFA enabled successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid MFA code');
    } finally { setMfaLoading(false); }
  };

  const handleMfaDisable = async () => {
    setMfaLoading(true);
    try {
      await disableMfa();
      const { data } = await getMe();
      setUser(data);
      toast.success('MFA disabled');
    } catch { toast.error('Failed to disable MFA'); }
    finally { setMfaLoading(false); }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: HiOutlineUser },
    { id: 'password' as const, label: 'Password', icon: HiOutlineLockClosed },
    { id: 'mfa' as const, label: 'Two-Factor Auth', icon: HiOutlineShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'text-gray-400 hover:bg-gray-800'
            }`}>
            <t.icon /> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        {tab === 'profile' && (
          <div className="space-y-4 max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                <input type="text" value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                <input type="text" value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <input type="email" value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition" />
            </div>
            <button onClick={handleProfileSave} disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {tab === 'password' && (
          <div className="space-y-4 max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
              <input type="password" value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
              <input type="password" value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
              <input type="password" value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition" />
            </div>
            <button onClick={handlePasswordChange} disabled={saving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        )}

        {tab === 'mfa' && (
          <div className="max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-2">Two-Factor Authentication</h2>
            <p className="text-gray-500 text-sm mb-6">
              Secure your account with TOTP-based 2FA. Works with Google Authenticator, Authy, Microsoft Authenticator, and other TOTP apps.
            </p>

            {user?.mfaEnabled ? (
              <div>
                <div className="flex items-center gap-3 p-4 bg-green-600/10 border border-green-600/20 rounded-lg mb-6">
                  <HiOutlineShieldCheck className="text-green-400 text-2xl flex-shrink-0" />
                  <div>
                    <p className="text-green-400 text-sm font-medium">MFA is enabled</p>
                    <p className="text-green-400/70 text-xs">Your account is protected with two-factor authentication</p>
                  </div>
                </div>
                <button onClick={handleMfaDisable} disabled={mfaLoading}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                  {mfaLoading ? 'Disabling...' : 'Disable MFA'}
                </button>
              </div>
            ) : mfaQrImage ? (
              <div className="space-y-6">
                {/* Step 1: Scan QR Code */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-white font-medium mb-1">Step 1: Scan QR Code</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Open your authenticator app and scan this QR code.
                  </p>
                  <div className="flex justify-center bg-white rounded-lg p-4 w-fit mx-auto">
                    <img src={mfaQrImage} alt="MFA QR Code" className="w-64 h-64" />
                  </div>
                </div>

                {/* Step 2: Manual Entry (fallback) */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-white font-medium mb-1">Can't scan? Enter manually</h3>
                  <p className="text-gray-500 text-sm mb-3">
                    Enter this secret key in your authenticator app:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-900 px-4 py-3 rounded-lg text-blue-400 text-sm font-mono tracking-wider break-all select-all">
                      {mfaSecret}
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(mfaSecret); toast.success('Secret copied'); }}
                      className="px-3 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition text-sm whitespace-nowrap">
                      Copy
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-gray-600">
                    <p>Account: {user?.email}</p>
                    <p>Issuer: SecureAuth IAM</p>
                    <p>Type: TOTP / 6 digits / 30 seconds</p>
                  </div>
                </div>

                {/* Step 3: Verify */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-white font-medium mb-1">Step 2: Verify Code</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Enter the 6-digit code from your authenticator app to confirm setup.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-blue-500 transition"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <button onClick={handleMfaVerify} disabled={mfaLoading || mfaCode.length !== 6}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium">
                      {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                    <HiOutlineShieldCheck className="text-blue-400 text-2xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">Enable Two-Factor Authentication</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Add an extra layer of security by requiring a verification code from your authenticator app when signing in.
                    </p>
                    <p className="text-gray-600 text-xs mb-4">
                      Supported apps: Google Authenticator, Authy, Microsoft Authenticator, 1Password, and any TOTP-compatible app.
                    </p>
                    <button onClick={handleMfaSetup} disabled={mfaLoading}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                      {mfaLoading ? 'Setting up...' : 'Setup MFA'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
