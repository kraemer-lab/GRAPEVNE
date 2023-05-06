import React from 'react'
import 'isomorphic-fetch'
import NodeMapEngine from './NodeMapEngine'
import { BodyWidget } from './BodyWidget'
import { runnerNodeSelected } from 'redux/actions'
import { runnerNodeDeselected } from 'redux/actions'
import { runnerLintSnakefile } from 'redux/actions'
import { runnerStoreJobStatus } from 'redux/actions'
import { runnerQueryJobStatus } from 'redux/actions'
import { displayGetFolderInfo } from 'redux/actions'
import { displayStoreFolderInfo } from 'redux/actions'
import { runnerStoreLint } from 'redux/actions'
import { runnerStoreMap } from 'redux/actions'
import { useAppSelector } from 'redux/store/hooks'
import { useAppDispatch } from 'redux/store/hooks'
import { DiagramModel } from "@projectstorm/react-diagrams"

import './NodeManager.css'

// TODO: Replace with webpack proxy (problems getting this to work)
const API_ENDPOINT = "http://127.0.0.1:5000/api"


function NodeManager() {
  // Link to singleton instance of runner graph engine
  const nodeMapEngine = NodeMapEngine.Instance;
  const engine = nodeMapEngine.engine;

  // Add listeners, noting the following useful resource:
  // https://github.com/projectstorm/react-diagrams/issues/164
  const dispatch = useAppDispatch();
  function setupNodeSelectionListeners() {
    const model = engine.getModel();
    model.getNodes().forEach(node =>
      node.registerListener({
        selectionChanged: (e) => {
          const payload = {
            id: node.options.id,
          }
          if (e.isSelected) {
            dispatch(runnerNodeSelected(payload))
          }
          else {
            dispatch(runnerNodeDeselected(payload))
          }
        }
      })
    );
  }
  setupNodeSelectionListeners();



  // Job status changes
  const jobstatus = useAppSelector(state => state.runner.jobstatus);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function JobStatusUpdate() {
    if ((jobstatus !== "") && (nodeMapEngine.engine != null)) {
      nodeMapEngine.MarkNodesWithoutConnectionsAsComplete(JSON.parse(jobstatus))
    }
  }
  React.useEffect(() => {
    JobStatusUpdate();
  }, [jobstatus]);




  // POST request handler [refactor out of this function later]
  const query = useAppSelector(state => state.runner.query);
  const [responseData, setResponseData] = React.useState(null);
  async function postRequest() {
    const postRequestOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json;charset=UTF-8'},
      body: JSON.stringify(query)
    };
    console.info("Sending query: ", query)
    fetch(API_ENDPOINT + '/post', postRequestOptions)
      .then(response => {
        if (response.ok) {
          return response.json()
        }
        throw response
      })
      .then(data => {
        setResponseData(data);
        console.info("Got response: ", data);
      })
      .catch(error => {
        console.error("Error during query: ", error);
      })
  }
  function processResponse(content: JSON) {
    console.log("Process response: ", content)
    switch (content['query']) {
      case 'runner/build': {
        // Download returned content as file
        const filename = 'Snakefile'
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' +
          encodeURIComponent(content['body']));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        break;
      }
      case 'runner/launch': {
        console.info("Launch response: ", content['body']);
        break;
      }
      case 'runner/lint': {
        // Update the held linter message
        dispatch(runnerStoreLint(content['body']))
        break;
      }
      case 'runner/jobstatus': {
        dispatch(runnerStoreJobStatus(content["body"]))
        break;
      }
      case 'runner/loadworkflow':
      case 'runner/tokenize':
      case 'runner/tokenize_load': {
        // Rebuild map from returned (segmented) representation
        nodeMapEngine.ConstructMapFromBlocks(JSON.parse(content['body']))
        dispatch(runnerStoreMap(content['body']))
        setupNodeSelectionListeners()
        // Submit query to automatically lint file
        dispatch(runnerLintSnakefile())
        break;
      }
      case 'display/folderinfo': {
        // Read folder contents into state
        dispatch(displayStoreFolderInfo(content['body']))
        break;
      }
      case 'runner/deleteresults': {
        // Refresh folder list
        dispatch(displayGetFolderInfo())
        break;
      }
      default:
        console.error("Error interpreting server response (query: ",
                      content['query'], ")");
    }
  }

  // Received query request (POST to backend server)...
  React.useEffect(() => {
    if (JSON.stringify(query) !== JSON.stringify({}))
      postRequest()
  }, [query]);
  // ...POST request returned data successfully
  React.useEffect(() => {
    if (responseData !== null)
      processResponse(responseData);
  }, [responseData]);

  return (
    <div id="nodemanager" style={{width: '100%', height: '100%'}}>
    <BodyWidget engine={engine} />
    </div>
  )
}

export default NodeManager
