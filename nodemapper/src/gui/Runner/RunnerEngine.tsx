import NodeMapEngine from "NodeMap/scene/NodeMapEngine";

export default class RunnerEngine extends NodeMapEngine {
  // Set up a singleton instance of a class
  private static _Instance: RunnerEngine;

  public static get Instance(): RunnerEngine {
    return RunnerEngine._Instance || (this._Instance = new this());
  }
}
