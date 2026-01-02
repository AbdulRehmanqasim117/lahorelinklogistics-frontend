import React, { useState } from 'react';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SignupRider = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cnic: '',
    vehicleType: '',
    vehicleNumber: '',
    vehicleModel: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

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

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.cnic.trim()) {
      errors.cnic = 'CNIC is required';
    }

    if (!formData.vehicleType) {
      errors.vehicleType = 'Vehicle type is required';
    }

    if (!formData.vehicleNumber.trim()) {
      errors.vehicleNumber = 'Vehicle number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { confirmPassword, ...userData } = formData;
      
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...userData, 
          role: 'RIDER' 
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      navigate('/');
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-2xl font-bold text-secondary mb-6">Sign up as Rider</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <Input 
              label="Name" 
              name="name"
              value={formData.name} 
              onChange={handleChange} 
              error={formErrors.name}
              required 
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
          </div>
          
          <div>
            <Input 
              label="Email" 
              type="email" 
              name="email"
              value={formData.email} 
              onChange={handleChange} 
              error={formErrors.email}
              required 
            />
            {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
          </div>
          
          <div>
            <Input 
              label="Password" 
              type={showPassword ? 'text' : 'password'} 
              name="password"
              value={formData.password} 
              onChange={handleChange} 
              error={formErrors.password}
              required 
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
            {formErrors.password && <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>}
          </div>
          
          <div>
            <Input 
              label="Confirm Password" 
              type={showConfirmPassword ? 'text' : 'password'} 
              name="confirmPassword"
              value={formData.confirmPassword} 
              onChange={handleChange} 
              error={formErrors.confirmPassword}
              required 
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
            {formErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{formErrors.confirmPassword}</p>
            )}
          </div>

          <div>
            <Input
              label="CNIC"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              placeholder="#####-#######-#"
              error={formErrors.cnic}
              required
            />
            {formErrors.cnic && (
              <p className="mt-1 text-sm text-red-500">{formErrors.cnic}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-lg border ${formErrors.vehicleType ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary focus:ring-primary/20'} bg-white text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200`}
              required
            >
              <option value="">Select vehicle type</option>
              <option value="Bike">Bike</option>
              <option value="Car">Car</option>
              <option value="Van">Van</option>
              <option value="Pickup">Pickup</option>
              <option value="Other">Other</option>
            </select>
            {formErrors.vehicleType && (
              <p className="mt-1 text-sm text-red-500">{formErrors.vehicleType}</p>
            )}
          </div>

          <div>
            <Input
              label="Vehicle Number / Registration"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              placeholder="e.g. LEA-1234"
              error={formErrors.vehicleNumber}
              required
            />
            {formErrors.vehicleNumber && (
              <p className="mt-1 text-sm text-red-500">{formErrors.vehicleNumber}</p>
            )}
          </div>

          <div>
            <Input
              label="Vehicle Model (optional)"
              name="vehicleModel"
              value={formData.vehicleModel}
              onChange={handleChange}
              placeholder="e.g. Honda CD-70 2020"
              error={formErrors.vehicleModel}
            />
          </div>
          
          <Button 
            type="submit" 
            fullWidth 
            className="mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SignupRider;

