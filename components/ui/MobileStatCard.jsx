import React from 'react';

const MobileStatCard = ({ icon: Icon, title, count, onClick, colorClass = "text-green-600" }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between h-28 relative overflow-hidden transition-colors ${onClick ? "active:bg-gray-50 cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-1.5 rounded-full bg-gray-50 ${colorClass}`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right max-w-[70%] leading-tight">
          {title}
        </span>
      </div>
      <div className="mt-auto">
        <span className="text-2xl font-bold text-gray-800">{count}</span>
      </div>
    </div>
  );
};

export default MobileStatCard;
