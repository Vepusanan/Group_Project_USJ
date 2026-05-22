import React from "react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden mt-auto text-white w-full bg-[linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)),url('/images/footer/footer-image.png')] bg-no-repeat bg-cover bg-top">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-12 md:py-14">
        {/* TOP ROW: brand on the left, newsletter on the right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start max-w-6xl mx-auto">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <img
                  src="/images/home/rocketicon.png"
                  alt="StartHub Capital Logo"
                  className="w-5 h-6 object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white">
                StartHub <span className="text-white">Capital</span>
              </span>
            </div>
            <p className="text-sm max-w-sm text-gray-300 leading-relaxed">
              Connect startups with the right investors.
            </p>
          </div>

          {/* Newsletter CTA */}
          <div className="md:justify-self-end w-full max-w-md">
            <h4 className="font-semibold text-base md:text-lg mb-4 text-gray-100">
              Join the StartHub Capital Community
            </h4>

            <div className="flex items-center bg-black/40 border border-white/10 rounded-full overflow-hidden">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-4 py-3 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none w-0 min-w-0"
              />
              <button
                type="button"
                className="flex items-center justify-center text-sm font-medium rounded-full text-white hover:opacity-90 transition-opacity flex-shrink-0"
                style={{
                  minWidth: "100px",
                  height: "46px",
                  padding: "12px 24px",
                  border: "1px solid rgba(119, 103, 159, 0.5)",
                  boxShadow: "0px 0px 15px rgba(119, 103, 159, 0.3)",
                  background:
                    "linear-gradient(180deg, rgba(131, 110, 198, 0.3) 0%, rgba(20, 15, 42, 0.8) 100%)",
                }}
              >
                Join Us
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-10 pt-6 border-t border-white/10 max-w-6xl mx-auto">
          <p className="text-sm text-gray-400 text-center">
            © {new Date().getFullYear()} StartHub Capital. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
