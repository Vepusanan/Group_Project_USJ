import React from 'react';

const PageLayout = ({ children }) => {
  return (
    <div className="relative z-10">
      {children}
    </div>
  );
};

export default PageLayout;