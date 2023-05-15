import React from "react";
import { StrictMode } from "react";
import MainPage from "./MainPage";

//import './App.css'

// Layout for main window, including sliding-pane support
export default function App() {
  return (
    <StrictMode>
      <div className="mainpage">
        <MainPage />
      </div>
    </StrictMode>
  );
}
