import React from "react";
import Header from "./Header";
import NodeManager from "./NodeManager";

const Builder = () => {
  return (
    <>
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexFlow: "column",
        }}
      >
        <div style={{ flex: "0 1 auto" }}>
          <Header />
        </div>
        <div style={{ flex: "1 1 auto", overflowY: "auto" }}>
          <NodeManager />
        </div>
      </div>
    </>
  );
};

export default Builder;
