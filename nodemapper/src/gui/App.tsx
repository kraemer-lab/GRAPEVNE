import React from "react";
import MainPage from "./MainPage";
import { BrowserRouter } from "react-router-dom";
import { Routes } from "react-router-dom";
import { Route } from "react-router-dom";
import BuilderSettings from "./Builder/components/BuilderSettings";
 
import Sidenav from './Sidenav';

const Builder = () => <MainPage />;
const Monitor = () => <h1>Monitor</h1>;
const Explore = () => <h1>Explore</h1>;
const Statistics = () => <h1>Statistics</h1>;
 
function App() {
  return (
    <div
      className="App"
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
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
          <Route path="/" element={<Builder />}/>
          <Route path="/monitor" element={<h1>Monitor</h1>} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/statistics" element={<Statistics />}/>
          <Route path="/settings" element={<BuilderSettings />} />
        </Routes>
      </main>
    </div>
  );
}
export default App;
