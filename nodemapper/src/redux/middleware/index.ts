import { applyMiddleware } from 'redux';
import { builderMiddleware } from './builder.js';
import { displayMiddleware } from './display.js';
import { newmoduleMiddleware } from './newmodule.js';
import { runnerMiddleware } from './runner.js';

const middleware = applyMiddleware(
  runnerMiddleware,
  builderMiddleware,
  displayMiddleware,
  newmoduleMiddleware,
);

export default middleware;
