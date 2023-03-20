import { applyMiddleware } from 'redux';
import { nodemapMiddleware } from './nodemap.js'
import { displayMiddleware } from './display.js'

const middleware = applyMiddleware(
  nodemapMiddleware,
  displayMiddleware,
)

export default middleware
