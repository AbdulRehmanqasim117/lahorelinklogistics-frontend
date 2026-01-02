import React from 'react';

const StatusCard = ({ icon: Icon, title, count, bgColor }) => {
  return (
    <div className={`bg-white p-5 rounded-xl border border-gray-100 shadow-sm ${bgColor}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-gray-500" />}
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <h3 className="text-xl font-bold text-secondary">{count}</h3>
        </div>
      </div>
    </div>
  );
};

export default StatusCard;