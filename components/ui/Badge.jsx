import React from 'react';

export const Badge = ({ status }) => {
  const getStyles = (s) => {
    switch (s) {
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Assigned':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Created':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Returned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyles(status)}`}>
      {status}
    </span>
  );
};

export default Badge;

