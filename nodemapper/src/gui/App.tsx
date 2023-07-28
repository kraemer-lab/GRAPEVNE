import React from "react";
import MainPage from "./MainPage";

import { StrictMode } from "react";

// Layout for main window, including sliding-pane support
const App = () => {
  return (
    <div style={{ height: "100vh" }}>
      <MainPage />
    </div>
  );
};

export default App;
