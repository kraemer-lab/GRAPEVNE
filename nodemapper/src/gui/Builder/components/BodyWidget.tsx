import React from 'react';
import * as _ from 'lodash';
import { DiagramEngine } from '@projectstorm/react-diagrams'
import { CanvasWidget } from '@projectstorm/react-diagrams';
import styled from '@emotion/styled';

import { TrayWidget } from './TrayWidget';
import { TrayItemWidget } from './TrayItemWidget';
import { DefaultNodeModel } from  'NodeMapComponents'
import { GridCanvasWidget } from './GridCanvasWidget';

export interface BodyWidgetProps {
  engine: DiagramEngine
}

export const Body = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  height: 800px;
`;

export const Content = styled.div`
  display: flex;
  flex-grow: 1;
`;

export const Layer = styled.div`
  position: relative;
  flex-grow: 1;
`;

export class BodyWidget extends React.Component<BodyWidgetProps> {
	render() {
		return (
			<Body>
				<Content>
					<TrayWidget>
						<TrayItemWidget model={{ type: 'out' }} name="Source" color="rgb(192,255,0)" />
						<TrayItemWidget model={{ type: 'inout' }} name="Module" color="rgb(0,192,255)" />
						<TrayItemWidget model={{ type: 'in' }} name="Terminal" color="rgb(192,0,255)" />
					</TrayWidget>
					<Layer
						onDrop={(event) => {
              const engine = this.props.engine;
							const data = JSON.parse(event.dataTransfer.getData('storm-diagram-node'));
							const nodesCount = _.keys(engine.getModel().getNodes()).length;

							let node: DefaultNodeModel = null;
              switch(data.type) {
                case 'in':
                  node = new DefaultNodeModel(
                    'Node ' + (nodesCount + 1),
                    'rgb(192,0,255)',
                    JSON.stringify({'id': 'idcode', 'type': 'in'})
                  );
                  node.addInPort('In');
                  break;
                case 'out':
                  node = new DefaultNodeModel(
                    'Node ' + (nodesCount + 1),
                    'rgb(192,255,0)',
                    JSON.stringify({'id': 'idcode', 'type': 'in'})
                  );
                  node.addOutPort('Out');
                  break;
                case 'inout':
                  node = new DefaultNodeModel(
                    'Node ' + (nodesCount + 1),
                    'rgb(0,192,255)',
                    JSON.stringify({'id': 'idcode', 'type': 'in'})
                  );
                  node.addInPort('In');
                  node.addOutPort('Out');
                  break;
                default:
                  throw Error('Invalid node type requested: ' + data.type);
							}
							const point = engine.getRelativeMousePoint(event);
							node.setPosition(point);
							engine.getModel().addNode(node);
							this.forceUpdate();
						}}
						onDragOver={(event) => {
							event.preventDefault();
						}}
					>
          <GridCanvasWidget>
            <CanvasWidget engine={this.props.engine} />
          </GridCanvasWidget>
					</Layer>
				</Content>
			</Body>
		);
	}
}
