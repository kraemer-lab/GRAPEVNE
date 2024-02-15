import React from 'react';
import BuilderSettings from './Builder/components/BuilderSettings';
import MainPage from './MainPage';

import { Route, Routes } from 'react-router-dom';
import { builderReadStoreConfig } from 'redux/actions';
import { useAppDispatch } from 'redux/store/hooks';

import Sidenav from './Sidenav';

const Builder = () => <MainPage />;
const Monitor = () => <h1>Monitor</h1>;
const Explore = () => <h1>Explore</h1>;
const Statistics = () => <h1>Statistics</h1>;

// Startup
let started = false;
const startup = () => {
  // Mark startup as (at least) attempted
  started = true;
  const dispatch = useAppDispatch();
  // Load persistent state
  dispatch(builderReadStoreConfig());
};

function App() {
  if (!started) startup();

  return (
    <div
      className="App"
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Sidenav />
      <main
        style={{
          width: '100vw',
          height: '100vh',
        }}
      >
        <Routes>
          <Route path="/" element={<Builder />} />
          <Route path="/monitor" element={<h1>Monitor</h1>} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<BuilderSettings />} />
        </Routes>
      </main>
    </div>
  );
}
export default App;
