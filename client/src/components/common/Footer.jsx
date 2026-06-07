import React from "react";

const Footer = () => {
  return (
    <footer className="relative mt-auto w-full border-t border-line bg-surface text-content">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-12 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start max-w-6xl mx-auto">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-soft">
                <img
                  src="/images/home/rocketicon.png"
                  alt="StartHub Capital Logo"
                  className="w-5 h-6 object-contain brightness-0 invert"
                />
              </div>
              <span className="text-xl font-bold text-content">
                StartHub <span className="text-primary">Capital</span>
              </span>
            </div>
            <p className="text-sm max-w-sm text-content-secondary leading-relaxed">
              Connect startups with the right investors.
            </p>
          </div>

          <div className="md:justify-self-end w-full max-w-md">
            <h4 className="font-semibold text-base md:text-lg mb-4 text-content">
              Join the StartHub Capital Community
            </h4>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-surface-alt border border-line rounded-2xl sm:rounded-pill overflow-hidden shadow-soft">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-4 py-3 bg-transparent text-sm text-content placeholder:text-content-muted focus:outline-none min-w-0"
              />
              <button
                type="button"
                className="btn-primary-token m-1 px-6 py-2.5 text-sm shrink-0"
              >
                Join Us
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-line max-w-6xl mx-auto">
          <p className="text-sm text-content-muted text-center">
            © {new Date().getFullYear()} StartHub Capital. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
