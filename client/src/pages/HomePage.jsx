import React from "react";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/common/Button";
import { Link, useNavigate } from "react-router-dom";

const HomePage = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const roleLandingPath =
    user?.userType === "investor" ? "/startups" : "/investors";

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      localStorage.removeItem("userData");
    }
    navigate("/login");
  };

  return (
    <div className="relative bg-page">
      <section className="relative min-h-screen hero-gradient flex flex-col overflow-visible pb-24">
        <header className="relative z-20 w-full flex justify-between items-center px-6 py-4 md:px-8 lg:px-12 xl:px-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-soft">
              <img
                src="/images/home/rocketicon.png"
                alt="StartHub Capital Logo"
                className="w-5 h-6 object-contain brightness-0 invert"
              />
            </div>
            <span className="text-xl font-bold text-content">
              StartHub <span className="text-primary">Capital</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <Link to={roleLandingPath} className="btn-primary-token px-4 py-2 text-sm">
                  Explore
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-secondary-token px-4 py-2 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium text-content-secondary hover:text-content"
                >
                  Sign up
                </Link>
                <Link to="/login" className="btn-primary-token px-4 py-2 text-sm">
                  Login
                </Link>
              </>
            )}
          </div>
        </header>

        <div className="relative z-10 flex-1 container mx-auto px-6 md:px-10 lg:px-20 flex flex-col lg:flex-row items-center justify-center gap-12 py-12">
          <div className="lg:w-1/2 text-center lg:text-left">
            <span className="badge-class mb-6">
              ✦ Connect Startups with Investors
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-content leading-tight tracking-tight mb-6">
              Empowering Teams,{" "}
              <span className="text-gradient-primary">One Match at a Time</span>
            </h1>
            <p className="text-content-secondary text-lg leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
              A smart matching platform that helps founders showcase their ideas,
              connect with verified investors, and secure funding faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {isAuthenticated && user ? (
                <Link to={roleLandingPath}>
                  <Button variant="primary" size="lg">
                    Explore Matches
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button variant="primary" size="lg">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" size="lg">
                      Talk to us
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md animate-float">
              <img
                src="/images/home/homepagerocket.png"
                alt="Rocket Launching"
                className="w-full h-auto max-w-md mx-auto drop-shadow-card"
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 container mx-auto px-6 md:px-10 lg:px-20 translate-y-12">
          <div className="surface-card grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 p-8 md:p-10">
            {[
              { value: "500+", label: "Startups" },
              { value: "200+", label: "Investors" },
              { value: "1500+", label: "Connections" },
              { value: "50+", label: "Industries" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-content mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-content-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-alt pt-32 pb-20">
        <div className="container mx-auto px-6 md:px-10 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
            <div>
              <span className="text-primary text-sm font-semibold mb-3 block">
                About Us
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-content tracking-tight">
                Building Solutions, Expanding Horizons
              </h2>
            </div>
            <div className="space-y-4 text-content-secondary leading-relaxed">
              <p>
                StartHub Capital bridges the gap between ambitious founders and
                investors who share their vision.
              </p>
              <p>
                Whether you are a startup seeking funding or an investor looking
                for your next opportunity, our platform helps you find the right
                match faster.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-surface">
        <div className="container mx-auto px-6 md:px-10 lg:px-20">
          <div className="text-center mb-16">
            <span className="badge-class mb-4">How it works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-content mb-4">
              From Profile to Partnership
            </h2>
            <p className="text-content-secondary max-w-xl mx-auto">
              Three simple steps to connect founders with the right investors.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              ["01", "Create Your Profile", "Startups showcase vision and funding needs. Investors highlight thesis and focus."],
              ["02", "Discover & Connect", "Browse curated profiles and send connection requests to ideal partners."],
              ["03", "Collaborate & Grow", "Message directly, share pitch decks, and build funded ventures."],
            ].map(([step, title, desc]) => (
              <div key={step} className="surface-card p-8 text-center">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-content-inverse text-sm font-bold mx-auto mb-5 shadow-soft">
                  {step}
                </div>
                <h3 className="text-lg font-bold text-content mb-3">{title}</h3>
                <p className="text-content-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          {!isAuthenticated && (
            <div className="text-center mt-14">
              <Link to="/signup">
                <Button variant="primary" size="lg">
                  Get Started Free →
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
