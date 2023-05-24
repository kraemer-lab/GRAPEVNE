import React from "react";
import MainPage from "./MainPage";

import { StrictMode } from "react";

// Layout for main window, including sliding-pane support
export default function App() {
  return (
    <StrictMode>
      <div style={{ height: "100vh" }}>
        <MainPage />
      </div>
    </StrictMode>
  );
}
