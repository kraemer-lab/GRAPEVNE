import React from "react";
import MainPage from "./MainPage";
import { BrowserRouter } from "react-router-dom";
import { Routes } from "react-router-dom";
import { Route } from "react-router-dom";
 
import Sidenav from './Sidenav';

const Home = () => <MainPage />;
const Explore = () => <h1>Explore</h1>;
const Statistics = () => <h1>Statistics</h1>;
const Settings = () => <h1>Settings</h1>;
 
function App() {
  return (
    <div
      className="App"
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh"
      }}
    >
      <Sidenav/>
      <main
        style={{
          width: "100vw",
          height: "100vh"
        }}
      >
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/explore" element={<Explore />} />
          <Route path="/statistics" element={<Statistics />}/>
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
export default App;
