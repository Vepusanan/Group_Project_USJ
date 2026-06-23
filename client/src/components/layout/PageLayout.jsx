import React from "react";
import { pageContainerClass, pageContentClass } from "../../styles/theme";

const PageLayout = ({ children }) => (
  <div className={pageContainerClass}>
    <div className={pageContentClass}>{children}</div>
  </div>
);

export default PageLayout;
