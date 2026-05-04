import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`h-full overflow-y-auto p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;