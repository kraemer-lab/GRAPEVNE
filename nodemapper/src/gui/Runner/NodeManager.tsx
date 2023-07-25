import "isomorphic-fetch";

import React from "react";
import RunnerEngine from "./RunnerEngine";

import { BodyWidget } from "./BodyWidget";
import { DiagramModel } from "@projectstorm/react-diagrams";
import { useAppSelector } from "redux/store/hooks";
import { useAppDispatch } from "redux/store/hooks";

import { displayGetFolderInfo } from "redux/actions";
import { displayStoreFolderInfo } from "redux/actions";

import { runnerStoreMap } from "redux/actions";
import { runnerStoreLint } from "redux/actions";
import { runnerNodeSelected } from "redux/actions";
import { runnerLintSnakefile } from "redux/actions";
import { runnerNodeDeselected } from "redux/actions";
import { runnerStoreJobStatus } from "redux/actions";
import { runnerQueryJobStatus } from "redux/actions";
import { runnerUpdateStatusText } from "redux/actions";

import "./NodeManager.css";

const NodeManager = () => {
  // Link to singleton instance of runner graph engine
  const nodeMapEngine = RunnerEngine.Instance;
  const engine = nodeMapEngine.engine;

  // Add listeners, noting the following useful resource:
  // https://github.com/projectstorm/react-diagrams/issues/164
  const dispatch = useAppDispatch();
  const UpdateActionListeners = () => {
    nodeMapEngine.AddSelectionListeners(
      (x) => {
        dispatch(runnerNodeSelected(x));
      },
      (x) => {
        dispatch(runnerNodeDeselected(x));
      },
      (x) => {
        return;
      }
    );
  };
  UpdateActionListeners();

  // Job status changes
  const jobstatus = useAppSelector((state) => state.runner.jobstatus);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const JobStatusUpdate = async () => {
    if (jobstatus !== "" && nodeMapEngine.engine != null) {
      nodeMapEngine.MarkNodesWithoutConnectionsAsComplete(
        JSON.parse(jobstatus)
      );
    }
  };
  React.useEffect(() => {
    JobStatusUpdate();
  }, [jobstatus]);

  return (
    <div id="nodemanager" style={{ width: "100%", height: "100%" }}>
      <BodyWidget engine={engine} />
    </div>
  );
};

export default NodeManager;
