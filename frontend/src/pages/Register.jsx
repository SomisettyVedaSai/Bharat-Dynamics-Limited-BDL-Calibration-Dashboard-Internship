import React, { useState } from 'react';
import { Shield, User, Lock, Mail, UserCheck, Link, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';

const Register = () => {
  const [employeeNo, setEmployeeNo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [idProofUrl, setIdProofUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', {
        employee_no: employeeNo.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        id_proof_url: idProofUrl.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { state: { registered: true } });
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1c23] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#242731] rounded-2xl shadow-xl overflow-hidden border border-gray-700">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="text-gray-400 mt-2">Register for BDL Calibration Dashboard</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>Registration successful! Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Employee Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCheck className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-xl bg-[#1a1c23] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g. EMP12345"
                  value={employeeNo}
                  onChange={(e) => setEmployeeNo(e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-xl bg-[#1a1c23] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-xl bg-[#1a1c23] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="password"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-xl bg-[#1a1c23] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
              <select
                className="block w-full px-3 py-2.5 border border-gray-600 rounded-xl bg-[#1a1c23] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading || success}
              >
                <option value="Viewer">Viewer (Read-only reports/dashboards)</option>
                <option value="Calibration Engineer">Calibration Engineer (Run calibrations)</option>
                <option value="Inspector">Inspector (Register & manage equipment)</option>
                <option value="Admin">Admin (Full system control)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">ID Proof URL (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="url"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-xl bg-[#1a1c23] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="https://example.com/id.pdf"
                  value={idProofUrl}
                  onChange={(e) => setIdProofUrl(e.target.value)}
                  disabled={loading || success}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center items-center py-2.5 px-4 mt-6 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Creating account...
                </>
              ) : (
                'Sign up'
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <RouterLink to="/login" className="text-blue-500 hover:underline">
              Sign in
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
