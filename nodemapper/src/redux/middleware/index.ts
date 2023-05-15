import { applyMiddleware } from "redux";
import { runnerMiddleware } from "./runner.js";
import { builderMiddleware } from "./builder.js";
import { displayMiddleware } from "./display.js";

const middleware = applyMiddleware(
  runnerMiddleware,
  builderMiddleware,
  displayMiddleware
);

export default middleware;
