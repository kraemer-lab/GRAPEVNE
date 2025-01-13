import { NodeData } from 'NodeMap/scene/Flow'; // Custom Node definition
import { NodeProps } from 'reactflow';
import { useAppSelector } from 'redux/store/hooks';

import ModuleNodeLR from './ModuleNodeLR';
import ModuleNodeTB from './ModuleNodeTB';

const ModuleNode = (props: NodeProps<NodeData>) => {
  // Select the appropriate layout based on the current layout setting
  const layout = useAppSelector((state) => state.settings.layout_direction);
  if (layout === 'LR') return ModuleNodeLR(props);
  else return ModuleNodeTB(props);
};

export default ModuleNode;
