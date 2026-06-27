import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  // useLayoutEffect runs synchronously before paint, so the reset happens on the
  // same frame as the route change. A passive useEffect runs after paint, which
  // left a brief window where the user could start scrolling before the reset
  // fired — yanking them back to the top once.
  useLayoutEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
