import React from 'react';

const Google2FA: React.FC = () => {
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Google Two-Factor Authentication (2FA)</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                         <i className="ri-error-warning-fill text-yellow-500 text-xl"></i>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            This feature is currently under development and will be available soon.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Google2FA;
