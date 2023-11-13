import NodeMapEngine from "NodeMap/scene/NodeMapEngine";

export default class BuilderEngine extends NodeMapEngine {
  // Set up a singleton instance of the (builder) class
  private static _Instance: BuilderEngine;

  public static get Instance(): BuilderEngine {
    return BuilderEngine._Instance || (this._Instance = new this());
  }
}
