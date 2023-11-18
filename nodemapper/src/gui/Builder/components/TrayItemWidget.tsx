import * as React from "react";
import styled from "@emotion/styled";

type Query = Record<string, unknown>;

export interface TrayItemWidgetProps {
  model: Query;
  color?: string;
  name: string;
}

export const Tray = styled.div<{ color: string }>`
  color: white;
  font-family: Helvetica, Arial;
  padding: 5px;
  margin: 0px 10px;
  border: solid 1px ${(p) => p.color};
  border-radius: 5px;
  margin-bottom: 2px;
  margin-top: 2px;
  cursor: pointer;
`;

const wranglename = (name: string) => {
  return name
    .replace(/ /g, "_")
    .replace(/\(/g, "_")
    .replace(/\)/g, "_")
    .toLowerCase();
};

export class TrayItemWidget extends React.Component<TrayItemWidgetProps> {
  render() {
    return (
      <Tray
        id={"modulelist-" + wranglename(this.props.name)}
        color={this.props.color}
        draggable={true}
        onDragStart={(event) => {
          event.dataTransfer.setData(
            "flow-diagram-node",
            JSON.stringify(this.props.model)
          );
        }}
        className="tray-item"
      >
        {this.props.name}
      </Tray>
    );
  }
}
