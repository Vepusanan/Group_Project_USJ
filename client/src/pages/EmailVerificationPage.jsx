import React from 'react';
import { Link } from 'react-router-dom';
import EmailVerification from '../components/auth/EmailVerification';

const EmailVerificationPage = () => {
  return (
    <div className="w-full max-w-md mx-auto self-start mt-4 md:mt-8">
      <EmailVerification />
    </div>
  );
};

export default EmailVerificationPage;