import React from "react";
import Sidenav from "./Sidenav";
import MainPage from "./MainPage";

import { Route } from "react-router-dom";
import { Routes } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { StrictMode } from "react";

import "./App.css";

const Containers = () => {
  return (
    <div>Containers</div>
  );
}

const Settings = () => {
  return (
    <div>Settings</div>
  );
}

const App = () => {
  return (
    <div className="App" style={{ height: "100vh" }}>
      <BrowserRouter>
        <Sidenav />
        <main>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/containers" element={<Containers />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
