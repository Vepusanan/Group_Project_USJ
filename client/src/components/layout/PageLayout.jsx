import React from 'react';

const PageLayout = ({ children }) => {
  return (
    <div className="relative z-10 px-4 py-8 md:px-8 lg:px-12">
      {children}
    </div>
  );
};

export default PageLayout;