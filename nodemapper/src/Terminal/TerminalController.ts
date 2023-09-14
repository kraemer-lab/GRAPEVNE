import React from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";

import "./../../node_modules/xterm/css/xterm.css";

// TODO
// This line permits any function declarations from the window.builderAPI
// as a workaround. Remove this in favour of a proper typescript-compatible
// interface. This may require modification to the electron code.
declare const window: any;

// Single instance of a terminal
class TerminalController {
  private static _instance: TerminalController;

  term: Terminal;
  fitAddon: FitAddon;
  xtermRef: React.RefObject<HTMLDivElement>;
  terminalAPI;

  constructor() {
    this.term = new Terminal();
    this.fitAddon = new FitAddon();
    //this.term.loadAddon(this.fitAddon);
    if (window !== undefined) this.terminalAPI = window.terminalAPI;
  }

  // Singleton pattern
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  // Set the reference to the div element that will contain the terminal
  setReference(ref: React.RefObject<HTMLDivElement>) {
    this.xtermRef = ref;
  }

  // Initialise the terminal - must setReference() before calling
  init() {
    if (this.terminalAPI !== undefined) {
      // Connect terminal to the (electron) API (but only if it exists)
      this.term.open(this.xtermRef.current);
      this.term.resize(80, 5);
      //this.fitAddon.fit();  // TODO: Not resizing terminal as intended
                              // Infact, this breaks the terminal
      this.term.onData((data) => this.terminalAPI.sendData(data));
      this.terminalAPI.receiveData((event, data) => this.sendData(data));
    }
  }

  // General purpose function to send data to the backend pty
  sendData(data) {
    this.term.write(data);
  }
}

export default TerminalController;
