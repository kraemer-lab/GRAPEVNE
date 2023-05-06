import { builderCompileToJson } from 'redux/actions'
import Application from 'gui/Builder/Application'

export function builderMiddleware({ getState, dispatch }) {
  return function(next) {
    return function(action) {
      // action.type
      //       .payload
      console.log("Middleware: ", action );
      switch (action.type) {

          case "builder/compile-to-json": {
            const app = Application.Instance;
            app.TestCreateDiagram();
            break;
          }

          default:
            break;
      }

      return next(action)
    }
  }
}

function QueryAndLoadTextFile(onLoad: Function) {  // eslint-disable-line @typescript-eslint/ban-types
// Opens a file dialog, then executes readerEvent
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = e => {
    console.log(e);
    const file = (e.target as HTMLInputElement).files[0];
    const reader = new FileReader();
    reader.readAsText(file,'UTF-8');
    reader.onload = (readerEvent) => onLoad(readerEvent.target.result, file.name)
  }
  input.click();
}
