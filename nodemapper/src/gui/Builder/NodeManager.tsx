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

// TODO: Replace with webpack proxy (problems getting this to work)
const API_ENDPOINT = "http://127.0.0.1:5000/api";

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

  // POST request handler [refactor out of this function later]
  const query = useAppSelector((state) => state.builder.query);
  const [responseData, setResponseData] = React.useState(null);
  async function postRequest() {
    const postRequestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8" },
      body: JSON.stringify(query),
    };
    console.info("Sending query: ", query);
    fetch(API_ENDPOINT + "/post", postRequestOptions)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        dispatch(builderUpdateStatusText("Error: " + response.statusText));
        throw response;
      })
      .then((data) => {
        setResponseData(data);
        console.info("Got response: ", data);
      })
      .catch((error) => {
        console.error("Error during query: ", error);
      });
  }
  function processResponse(content: JSON) {
    console.log("Process response: ", content);
    dispatch(builderUpdateStatusText(""));
    switch (content["query"]) {
      case "builder/get-remote-modules": {
        dispatch(builderUpdateModulesList(content["body"]));
        break;
      }
      default:
        console.error(
          "Error interpreting server response (query: ",
          content["query"],
          ")"
        );
    }
  }

  // Received query request (POST to backend server)...
  React.useEffect(() => {
    if (JSON.stringify(query) !== JSON.stringify({})) postRequest();
  }, [query]);
  // ...POST request returned data successfully
  React.useEffect(() => {
    if (responseData !== null) processResponse(responseData);
  }, [responseData]);

  return <BodyWidget engine={engine} />;
}

export default NodeManager;
