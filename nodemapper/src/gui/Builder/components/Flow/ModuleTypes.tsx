import { ButtonEdgeBezier, ButtonEdgeSmoothStep, ButtonEdgeStraight } from './ButtonEdges';
import ModuleNode from './ModuleNode';

// Remember to useMemo if this is moved inside a component
export const nodeTypes = {
  standard: ModuleNode,
};

export const edgeTypes = {
  bezier: ButtonEdgeBezier,
  smoothstep: ButtonEdgeSmoothStep,
  straight: ButtonEdgeStraight,
};
