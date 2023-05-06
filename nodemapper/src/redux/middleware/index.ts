import { applyMiddleware } from 'redux';
import { nodemapMiddleware } from './nodemap.js'
import { builderMiddleware } from './builder.js'
import { displayMiddleware } from './display.js'

const middleware = applyMiddleware(
  nodemapMiddleware,
  builderMiddleware,
  displayMiddleware,
)

export default middleware
