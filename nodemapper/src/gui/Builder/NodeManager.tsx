import React from "react";
import BuilderEngine from "./BuilderEngine";
import { BodyWidget } from "./components/BodyWidget";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";
import { builderAddLink } from "redux/actions";
import { builderNodeSelected } from "redux/actions";
import { builderNodeDeselected } from "redux/actions";
import { builderGetRemoteModules } from "redux/actions";
import { builderUpdateStatusText } from "redux/actions";
import { builderUpdateModulesList } from "redux/actions";

function NodeManager() {
  // Link to singleton instance
  const app = BuilderEngine.Instance;
  const engine = app.engine;

  // Initialise (add selection listeners to nodes)
  const dispatch = useAppDispatch();
  app.AddSelectionListeners(
    (x) => {
      dispatch(builderNodeSelected(x));
    },
    (x) => {
      dispatch(builderNodeDeselected(x));
    },
    (x) => {
      dispatch(builderAddLink(x));
    }
  );

  return <BodyWidget engine={engine} />;
}

export default NodeManager;
