import NodeMapEngine from "NodeMap/scene/NodeMapEngine";

export default class BuilderEngine extends NodeMapEngine {
  // Set up a singleton instance of the (builder) class
  private static _Instance: BuilderEngine;

  public static get Instance(): BuilderEngine {
    return BuilderEngine._Instance || (this._Instance = new this());
  }

  // BUILDER specific methods

  public static GetModuleTypeColor(type: string): string {
    let color = "";
    switch (type) {
      case "source": {
        color = "rgb(192,255,0)";
        break;
      }
      case "module": {
        color = "rgb(0,192,255)";
        break;
      }
      case "connector": {
        color = "rgb(0,255,192)";
        break;
      }
      case "terminal": {
        color = "rgb(192,0,255)";
        break;
      }
      default: {
        color = "rgb(128,128,128)";
        break;
      }
    }
    return color;
  }
}
