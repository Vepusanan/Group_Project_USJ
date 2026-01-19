import React from "react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden mt-auto text-white w-full bg-[linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)),url('../../public/images/footer/footer-image.png')] bg-no-repeat bg-cover bg-top">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        {/* TOP ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-8 items-start max-w-7xl mx-auto">
          {/* Logo */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                <img
                  src="/images/home/rocketicon.png"
                  alt="StartHub Capital Logo"
                  className="w-5 h-6 object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white">
                StartHub
                <span className="text-white"> Capital</span>
              </span>
            </div>
            <p className="text-sm max-w-xs text-gray-300">
              Connect Startups with the Right
              <br />
              Investors.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-200">
              QuickLinks
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/about"
                  className="text-gray-400 hover:text-white transition"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/services"
                  className="text-gray-400 hover:text-white transition"
                >
                  Our Services
                </a>
              </li>
              <li>
                <a
                  href="/community"
                  className="text-gray-400 hover:text-white transition"
                >
                  Community
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className="text-gray-400 hover:text-white transition"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-gray-200">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/about"
                  className="text-gray-400 hover:text-white transition"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-gray-400 hover:text-white transition"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/career-tips"
                  className="text-gray-400 hover:text-white transition"
                >
                  Career Tips
                </a>
              </li>
              <li>
                <a
                  href="/careers"
                  className="text-gray-400 hover:text-white transition"
                >
                  Career
                </a>
              </li>
            </ul>
          </div>

          {/* INLINE CTA (RIGHT SIDE) */}
          <div className="md:justify-self-end w-full max-w-md">
            <h4 className="font-semibold text-lg mb-4 text-gray-200">
              Join the StartupHub Capital Community
            </h4>

            <div className="flex items-center bg-black/40 border border-white/10 rounded-full overflow-hidden">
              <input
                type="email"
                placeholder="Enter Your Gmail"
                className="flex-grow px-4 py-3 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none w-0 min-w-0"
              />

              {/* JOIN BUTTON */}
              <button
                className="flex items-center justify-center text-sm font-medium rounded-full text-white hover:opacity-90 transition-opacity flex-shrink-0"
                style={{
                  width: "auto",
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
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between text-sm max-w-7xl mx-auto">
          <p className="text-gray-400">
            © {new Date().getFullYear()} StartHub Capital. All rights reserved.
          </p>
          <div className="flex space-x-5 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition">
              Twitter
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              LinkedIn
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              Instagram
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition">
              Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
