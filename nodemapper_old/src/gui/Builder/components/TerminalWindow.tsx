import React from "react";
import { Terminal } from "xterm";
import TerminalController from "Terminal/TerminalController";

class TerminalWindow extends React.Component {
  terminal: TerminalController;
  xtermRef: React.RefObject<HTMLDivElement>;

  constructor(props) {
    super(props);
    this.terminal = TerminalController.Instance; // singleton instance
    this.xtermRef = React.createRef();
    this.terminal.setReference(this.xtermRef);
  }

  componentDidMount() {
    this.terminal.init();
  }

  render() {
    return (
      <div
        ref={this.xtermRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    );
  }
}

export default TerminalWindow;
