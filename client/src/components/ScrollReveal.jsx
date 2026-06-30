import React, { useEffect, useRef, useState } from "react";

const ScrollReveal = ({
  children,
  className = "",
  direction = "up", // 'up' | 'down' | 'left' | 'right' | 'none'
  duration = 800, // in ms
  delay = 0, // in ms
  threshold = 0.1,
  once = true,
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsIntersecting(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, once]);

  // Determine transition styles based on state
  const getDirectionClass = () => {
    if (isIntersecting) return "opacity-100 translate-x-0 translate-y-0 scale-100";
    
    switch (direction) {
      case "up":
        return "opacity-0 translate-y-12 scale-[0.98]";
      case "down":
        return "opacity-0 -translate-y-12 scale-[0.98]";
      case "left":
        return "opacity-0 translate-x-12";
      case "right":
        return "opacity-0 -translate-x-12";
      case "none":
      default:
        return "opacity-0";
    }
  };

  const style = {
    transitionDuration: `${duration}ms`,
    transitionDelay: `${delay}ms`,
  };

  return (
    <div
      ref={ref}
      style={style}
      className={`transition-all ease-[cubic-bezier(0.16,1,0.3,1)] transform will-change-transform will-change-opacity ${getDirectionClass()} ${className}`}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
