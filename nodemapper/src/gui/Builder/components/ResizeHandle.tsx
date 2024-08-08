import Divider from '@mui/material/Divider';
import React from 'react';
import { PanelResizeHandle } from 'react-resizable-panels';

import * as styles from './styles.module.css';

export default function ResizeHandle({
  orientation = 'horizontal',
  className = '',
  id,
}: {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  id?: string;
}) {
  return (
    <PanelResizeHandle className={[styles.ResizeHandleOuter, className].join(' ')} id={id}>
      <Divider orientation={orientation} />
    </PanelResizeHandle>
  );
}
