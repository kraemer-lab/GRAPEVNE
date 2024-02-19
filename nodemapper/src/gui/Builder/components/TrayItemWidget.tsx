import styled from '@emotion/styled';
import * as React from 'react';
import { wranglename } from './Flow';

type Query = Record<string, unknown>;

export interface TrayItemWidgetProps {
  model: Query;
  color?: string;
  name: string;
}

export const faint = (color: string, amount: number) => {
  const parseColor = (c: string) => parseInt(c, 16);
  const r = parseColor(color.substring(1, 3));
  const g = parseColor(color.substring(3, 5));
  const b = parseColor(color.substring(5, 7));
  return `rgba(${r},${g},${b},${amount})`;
}

export const Tray = styled.div<{ color: string }>`
  color: ${(p) => faint(p.color, 0.8)};
  font-family: Helvetica, Arial;
  font-weight: bold;
  padding: 5px;
  border: solid 2px ${(p) => faint(p.color, 0.5)};
  border-radius: 5px;
  margin-bottom: 2px;
  margin-top: 2px;
  cursor: pointer;
  overflow: hidden;
`;

export class TrayItemWidget extends React.Component<TrayItemWidgetProps> {
  render() {
    return (
      <Tray
        id={'modulelist-' + wranglename(this.props.name)}
        className="tray-item"
        color={this.props.color}
        draggable={true}
        onDragStart={(event) => {
          event.dataTransfer.setData('flow-diagram-node', JSON.stringify(this.props.model));
        }}
      >
        {this.props.name}
      </Tray>
    );
  }
}
