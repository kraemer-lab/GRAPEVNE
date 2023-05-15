import React from "react";
import Header from "./Header";
import NodeManager from "./NodeManager";
import "./Builder.css";

function Builder() {
  return (
    <>
      <div className="header">
        <Header />
      </div>

      <div className="main">
        <NodeManager />
      </div>
    </>
  );
}

export default Builder;
