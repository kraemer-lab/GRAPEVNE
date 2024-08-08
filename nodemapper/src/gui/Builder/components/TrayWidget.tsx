import styled from '@emotion/styled';
import * as React from 'react';
import { ReactNode } from 'react';

export const Tray = styled.div`
  flex-grow: 0;
  flex-shrink: 0;
  overflowy: auto;
  width: 100%;
`;

interface ItemProps {
  children: ReactNode;
}

export const TrayWidget = (props: ItemProps) => {
  return <Tray>{props.children}</Tray>;
};
