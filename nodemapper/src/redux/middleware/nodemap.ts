import { nodemapSubmitQuery } from '../actions'
import { displayOpenSettings } from '../actions'
import { displayCloseSettings } from '../actions'
import { displayUpdateNodeInfo } from '../actions'
import NodeMapEngine from '../../gui/NodeMapEngine' 

export function nodemapMiddleware({ getState, dispatch }) {
  return function(next) {
	return function(action) {
	  // action.type
	  //       .payload
	  console.log("Middleware: ", action );
	  switch (action.type) {

		  case "nodemap/node-selected": {
			const graph_is_moveable = getState().display.graph_is_moveable
			if (!graph_is_moveable) {
			  const nodemap = NodeMapEngine.Instance;
			  const node = nodemap.getNodeById(action.payload.id);
			  let payload = {}
			  if (node === null) {
				console.debug("Selected node not found in engine: ", action.payload.id)
			    payload = {
					id: action.payload.id,
					name: "ERROR: Failed to find node (" + action.payload.id + ")",
					type: "ERROR: Failed to find node (" + action.payload.id + ")",
					code: "ERROR: Failed to find node (" + action.payload.id + ")",
				}
			  } else {
			    const json = JSON.parse(node.options.extras);
			    payload = {
			      id: action.payload.id,
			  	  name: node.options.name,
			  	  type: json.type,
				  code: json.content,
			    }
			  }
			  dispatch(displayUpdateNodeInfo(JSON.stringify(payload)));
			  dispatch(displayOpenSettings());
			}
			break;
		  }

		  case "nodemap/node-deselected": {
			dispatch(displayCloseSettings());
			break;
		  }

		  case "nodemap/select-none": {
			// Link to singleton instance of nodemap graph engine
			const nodemap = NodeMapEngine.Instance;
			nodemap.NodesSelectNone();
            break;
		  }

		  case "nodemap/import-snakefile": {
			  QueryAndLoadTextFile((content) => {
				  const query: Record<string, any> = {
					  'query': 'tokenize',
					  'data': {
						  'format': 'Snakefile',
						  'content': content
					  }
				  }
				  dispatch(nodemapSubmitQuery(query))
			  });
			  break;
		  }

		  case "nodemap/build-snakefile": {
			  const query: Record<string, any> = {
				  'query': 'build',
				  'data': {
					  'format': 'Snakefile',
					  'content': getState().nodemap.serialize
				  }
			  }
			  dispatch(nodemapSubmitQuery(query))
			  break;
		  }

		  default:
			break;
	  }
	  
	  return next(action)
	}
  }
}

function QueryAndLoadTextFile(onLoad: Function) {
// Opens a file dialog, then executes readerEvent
  var input = document.createElement('input');
  input.type = 'file';
  input.onchange = e => {
    console.log(e);
    var file = (e.target as HTMLInputElement).files[0];
    var reader = new FileReader();
    reader.readAsText(file,'UTF-8');
    reader.onload = (readerEvent) => onLoad(readerEvent.target.result)
  }
  input.click();
}
