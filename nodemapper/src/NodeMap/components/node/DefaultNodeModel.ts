import * as _ from "lodash";
import {
  NodeModel,
  NodeModelGenerics,
  PortModelAlignment,
} from "@projectstorm/react-diagrams-core";
import { DefaultPortModel } from "../port/DefaultPortModel";
import {
  BasePositionModelOptions,
  DeserializeEvent,
} from "@projectstorm/react-canvas-core";

export interface DefaultNodeModelOptions extends BasePositionModelOptions {
  name?: string;
  color?: string;
}

export interface DefaultNodeModelGenerics extends NodeModelGenerics {
  OPTIONS: DefaultNodeModelOptions;
  setOptions: (options: DefaultNodeModelOptions) => void;
}

export class DefaultNodeModel extends NodeModel<DefaultNodeModelGenerics> {
  protected portsIn: DefaultPortModel[];
  protected portsOut: DefaultPortModel[];

  constructor(name: string, color: string, userconfig: string);
  constructor(options?: DefaultNodeModelOptions);
  constructor(options: unknown = {}, color?: string, userconfig?: string) {
    if (typeof options === "string") {
      options = {
        name: options,
        color: color,
        extras: userconfig,
      };
    }
    super({
      type: "default",
      name: "Untitled",
      color: "rgb(0,192,255)",
      ...(options as object),
    });
    this.portsOut = [];
    this.portsIn = [];
  }

  doClone(lookupTable: object, clone: DefaultNodeModel): void {
    clone.portsIn = [];
    clone.portsOut = [];
    super.doClone(lookupTable, clone);
  }

  removePort(port: DefaultPortModel): void {
    super.removePort(port);
    if (port.getOptions().in) {
      this.portsIn.splice(this.portsIn.indexOf(port), 1);
    } else {
      this.portsOut.splice(this.portsOut.indexOf(port), 1);
    }
  }

  addPort<T extends DefaultPortModel>(port: T): T {
    super.addPort(port);
    if (port.getOptions().in) {
      if (this.portsIn.indexOf(port) === -1) {
        this.portsIn.push(port);
      }
    } else {
      if (this.portsOut.indexOf(port) === -1) {
        this.portsOut.push(port);
      }
    }
    return port;
  }

  addInPort(label: string, after = true): DefaultPortModel {
    const p = new DefaultPortModel({
      in: true,
      name: label,
      label: label,
      alignment: PortModelAlignment.TOP,
    });
    if (!after) {
      this.portsIn.splice(0, 0, p);
    }
    return this.addPort(p);
  }

  addOutPort(label: string, after = true): DefaultPortModel {
    const p = new DefaultPortModel({
      in: false,
      name: label,
      label: label,
      alignment: PortModelAlignment.BOTTOM,
    });
    if (!after) {
      this.portsOut.splice(0, 0, p);
    }
    return this.addPort(p);
  }

  deserialize(event: DeserializeEvent<this>) {
    super.deserialize(event);
    this.options.name = event.data.name;
    this.options.color = event.data.color;
    this.portsIn = _.map(event.data.portsInOrder, (id) => {
      return this.getPortFromID(id);
    }) as DefaultPortModel[];
    this.portsOut = _.map(event.data.portsOutOrder, (id) => {
      return this.getPortFromID(id);
    }) as DefaultPortModel[];
  }

  serialize(): any {
    return {
      ...super.serialize(),
      name: this.options.name,
      color: this.options.color,
      portsInOrder: _.map(this.portsIn, (port) => {
        return port.getID();
      }),
      portsOutOrder: _.map(this.portsOut, (port) => {
        return port.getID();
      }),
    };
  }

  getInPorts(): DefaultPortModel[] {
    return this.portsIn;
  }

  getOutPorts(): DefaultPortModel[] {
    return this.portsOut;
  }

  setColor(color: string) {
    this.options.color = color;
  }

  getNodeID(): string {
    return this.options.id;
  }

  getOptions() {
    return this.options;
  }

  setOptions(options: DefaultNodeModelOptions) {
    this.options = options;
  }

  setName(name: string) {
    this.options.name = name;
  }
}
