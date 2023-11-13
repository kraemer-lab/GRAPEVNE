import * as React from "react";
import { DiagramEngine, PortWidget } from "@projectstorm/react-diagrams-core";
import { DefaultPortModel } from "./DefaultPortModel";
import styled from "@emotion/styled";

export interface DefaultPortLabelProps {
  port: DefaultPortModel;
  engine: DiagramEngine;
}

export const PortLabel = styled.div`
  display: flex;
  margin-top: 1px;
  align-items: center;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

export const Port = styled.div`
  padding: 0 5px;
  flex-grow: 1;
  text-align: center;
  height: 15px;
  min-width: 30px;
  background: rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgb(192, 255, 0);
  }
`;

export const PortA = styled.div`
  width: 50px;
  height: 15px;
  background: rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgb(192, 255, 0);
  }
`;

export class DefaultPortLabel extends React.Component<DefaultPortLabelProps> {
  render() {
    const port = (
      <PortWidget engine={this.props.engine} port={this.props.port}>
        {this.props.port.getOptions().label}
        <Port />
      </PortWidget>
    );

    return (
      <PortLabel>
        <PortWidget engine={this.props.engine} port={this.props.port}>
          <Port>{this.props.port.getOptions().label}</Port>
        </PortWidget>
      </PortLabel>
    );
  }
}
