import * as React from "react";
import styled from "@emotion/styled";
import { ReactNode } from "react";

export const Tray = styled.div`
  flex-grow: 0;
  flex-shrink: 0;
  overflowy: auto;
  width: 100%;
`;

interface ItemProps {
  children: ReactNode;
}

export class TrayWidget extends React.Component<ItemProps> {
  render() {
    return <Tray>{this.props.children}</Tray>;
  }
}
