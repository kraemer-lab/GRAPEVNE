import { builderCompileToJson } from 'redux/actions'
import { builderSubmitQuery } from 'redux/actions'
import BuilderEngine from 'gui/Builder/BuilderEngine'

export function builderMiddleware({ getState, dispatch }) {
  return function(next) {
    return function(action) {
      // action.type
      //       .payload
      console.log("Middleware: ", action );
      switch (action.type) {

          case "builder/compile-to-json": {
            const app = BuilderEngine.Instance;
            console.log(app.GetModuleListJSON());
            const query: Record<string, any> = {  // eslint-disable-line @typescript-eslint/no-explicit-any
              'query': 'builder/compile-to-json',
              'data': {
                'format': 'Snakefile',
                'content': JSON.stringify(app.GetModuleListJSON())
              }
            }
            dispatch(builderSubmitQuery(query))
            break;
          }

          default:
            break;
      }

      return next(action)
    }
  }
}
