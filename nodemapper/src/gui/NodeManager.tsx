import React from 'react'
import 'isomorphic-fetch'
import NodeMapEngine from './NodeMapEngine'
import { BodyWidget } from './BodyWidget'
import { nodemapNodeSelected } from '../redux/actions'
import { nodemapNodeDeselected } from '../redux/actions'
import { nodemapLintSnakefile } from '../redux/actions'
import { displayStoreFolderInfo } from '../redux/actions'
import { nodemapStoreLint } from '../redux/actions'
import { nodemapStoreMap } from '../redux/actions'
import { useAppSelector } from '../redux/store/hooks'
import { useAppDispatch } from '../redux/store/hooks'
import { DiagramModel } from "@projectstorm/react-diagrams"

import './NodeManager.css'

// TODO: Replace with webpack proxy (problems getting this to work)
const API_ENDPOINT = "http://127.0.0.1:5000/api"


function NodeManager() {
  // Link to singleton instance of nodemap graph engine
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
            dispatch(nodemapNodeSelected(payload))
          }
          else {
            dispatch(nodemapNodeDeselected(payload))
          }
        }
      })
    );
  }
  setupNodeSelectionListeners();

  // POST request handler [refactor out of this function later]
  const query = useAppSelector(state => state.nodemap.query);
  const [responseData, setResponseData] = React.useState(null)
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
      case 'build': {
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
      case 'lint': {
        // Update the held linter message
        dispatch(nodemapStoreLint(content['body']))
        break;
      }
      case 'tokenize':
      case 'tokenize_load': {
        // Rebuild map from returned (segmented) representation
        nodeMapEngine.ConstructMapFromBlocks(JSON.parse(content['body']))
        dispatch(nodemapStoreMap(content['body']))
        setupNodeSelectionListeners();
        // Submit query to automatically lint file
        dispatch(nodemapLintSnakefile())
        break;
      }
      case 'folderinfo': {
        // Read folder contents into state
        dispatch(displayStoreFolderInfo(content['body']))
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
