import { applyMiddleware } from 'redux';
import { builderMiddleware } from './builder.js';
import { displayMiddleware } from './display.js';
import { runnerMiddleware } from './runner.js';
import { newmoduleMiddleware } from './newmodule.js';

const middleware = applyMiddleware(
  runnerMiddleware,
  builderMiddleware,
  displayMiddleware,
  newmoduleMiddleware
);

export default middleware;
