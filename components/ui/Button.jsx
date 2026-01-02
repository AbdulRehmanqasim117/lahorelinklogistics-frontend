import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20',
    secondary: 'bg-secondary hover:bg-black text-white',
    outline: 'border border-gray-300 text-secondary hover:bg-gray-50 bg-white',
    ghost: 'text-gray-600 hover:text-primary hover:bg-primary/5',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

