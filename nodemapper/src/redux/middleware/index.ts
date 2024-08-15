import { applyMiddleware } from 'redux';
import { builderMiddleware } from './builder.js';
import { displayMiddleware } from './display.js';
import { newmoduleMiddleware } from './newmodule.js';
import { runnerMiddleware } from './runner.js';
import { settingsMiddleware } from './settings.js';

const middleware = applyMiddleware(
  runnerMiddleware,
  builderMiddleware,
  displayMiddleware,
  newmoduleMiddleware,
  settingsMiddleware,
);

export default middleware;
