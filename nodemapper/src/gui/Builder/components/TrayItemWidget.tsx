import styled from '@emotion/styled';
import * as React from 'react';
import { IModulesListEntry } from 'redux/reducers/builder';

export const wranglename = (name: string) => {
  return name.replace(/ /g, '_').replace(/\(/g, '_').replace(/\)/g, '_').toLowerCase();
};

export const faint = (color: string, amount: number) => {
  const parseColor = (c: string) => parseInt(c, 16);
  const r = parseColor(color.substring(1, 3));
  const g = parseColor(color.substring(3, 5));
  const b = parseColor(color.substring(5, 7));
  return `rgba(${r},${g},${b},${amount})`;
};

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

export interface TrayItemWidgetProps {
  model: IModulesListEntry;
  color?: string;
  name: string;
}

export const TrayItemWidget = (props: TrayItemWidgetProps) => {
  return (
    <Tray
      id={'modulelist-' + wranglename(props.name)}
      className="tray-item"
      color={props.color}
      draggable={true}
      onDragStart={(event) => {
        event.dataTransfer.setData('flow-diagram-node', JSON.stringify(props.model));
      }}
    >
      {props.name}
    </Tray>
  );
};
