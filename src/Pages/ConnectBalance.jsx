import React from 'react';

const ConnectBalance = ({ connects }) => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-800">Your Connects</h2>
      <p className="text-3xl text-blue-600 font-bold">{connects}</p>
    </div>
  );
};

export default ConnectBalance;


