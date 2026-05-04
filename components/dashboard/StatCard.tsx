import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, bgColor }) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md flex items-center justify-between transition-transform duration-300 hover:scale-105 hover:shadow-xl">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`w-14 h-14 flex items-center justify-center rounded-full ${color} ${bgColor}`}>
        <i className={`${icon} text-2xl`}></i>
      </div>
    </div>
  );
};

export default StatCard;