import React, { useState } from 'react';
import { TrendingUp, Shield, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../src/contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setError('');
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.message || `Login failed (HTTP ${res.status})`);
      }
      
      // Update auth context with user data
      login({
        token: data.token,
        role: data.role,
        name: data.name,
        email: formData.email,
        id: data.id
      });
      
      // Redirect based on role
      const rolePath = {
        'CEO': '/dashboard/ceo',
        'MANAGER': '/manager/dashboard',
        'SHIPPER': '/shipper/dashboard',
        'RIDER': '/rider/dashboard'
      }[data.role] || '/';
      
      navigate(rolePath);
    } catch (err) {
      setError(err.message || 'Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  


  return (
    <div className="min-h-screen flex bg-[#F8F9FA]">
      <div className="hidden lg:flex flex-1 bg-secondary relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center mb-6 shadow-lg shadow-green-900/50">
            <img src="/logo.png" alt="LahoreLink Logistics logo" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">LahoreLink Logistics</h1>
          <p className="text-gray-400 text-lg max-w-md">Smart logistics dashboard for same-day deliveries. Manage your fleet, shipments, and COD with ease.</p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
               <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Real-time Tracking</h3>
              <p className="text-gray-400 text-sm">Monitor orders as they move through the city.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
               <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Secure COD Workflows</h3>
              <p className="text-gray-400 text-sm">Automated reconciliation for cash on delivery.</p>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 relative z-10">© 2023 LahoreLink Logistics Inc.</div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center">
               <div className="w-[200px] h-[200px] flex items-center justify-center ">
                <img src="/logo.png" alt="LahoreLink Logistics logo" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-secondary">Welcome back</h2>
            <p className="mt-2 text-gray-500">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  required
                  error={formErrors.email}
                />
                {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
              </div>
              <div>
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  error={formErrors.password}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-colors" />
                <span className="text-gray-500 group-hover:text-gray-700">Remember me</span>
              </label>
              <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-hover hover:underline">Forgot password?</Link>
            </div>

            <Button 
              type="submit" 
              fullWidth 
              disabled={isLoading} 
              className="h-11 text-base shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : 'Sign in to Dashboard'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Sign up</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Link to="/signup/shipper" className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600 transition-colors text-center">
                Sign up as Shipper
              </Link>
              <Link to="/signup/rider" className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-gray-600 transition-colors text-center">
                Sign up as Rider
              </Link>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500">
            Having trouble logging in? <a href="#" className="font-medium text-secondary hover:underline">Contact Administrator</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
