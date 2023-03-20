import { nodemapSelectNone } from '../actions'

export function displayMiddleware({ getState, dispatch }) {
  return function(next) {
	return function(action) {
	  
	  console.debug(action);
	  switch (action.type) {
		  case "display/close-settings": {
			dispatch(nodemapSelectNone());
			break;
		  }
		  default:
			break;
	  }
	  
	  return next(action)
	}
  }
}

