import React from 'react';

export const Input = ({ label, error, className = '', rightElement, ...props }) => {
  const baseClasses = `w-full px-4 py-2.5 rounded-lg border ${
    error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary focus:ring-primary/20'
  } bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={`${baseClasses} ${rightElement ? 'pr-10' : ''}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;

