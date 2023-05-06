import * as React from 'react';
import * as _ from 'lodash';
import { TrayWidget } from './TrayWidget';
import { Application } from 'gui/Builder/Application';
import { TrayItemWidget } from './TrayItemWidget';
import { DefaultNodeModel } from  'NodeMapComponents'
import { CanvasWidget } from '@projectstorm/react-diagrams';
import { GridCanvasWidget } from './GridCanvasWidget';
import styled from '@emotion/styled';

export interface BodyWidgetProps {
	app: Application;
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
							const data = JSON.parse(event.dataTransfer.getData('storm-diagram-node'));
							const nodesCount = _.keys(this.props.app.getDiagramEngine().getModel().getNodes()).length;

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
							const point = this.props.app.getDiagramEngine().getRelativeMousePoint(event);
							node.setPosition(point);
							this.props.app.getDiagramEngine().getModel().addNode(node);
							this.forceUpdate();
						}}
						onDragOver={(event) => {
							event.preventDefault();
						}}
					>
          <GridCanvasWidget>
            <CanvasWidget engine={this.props.app.getDiagramEngine()} />
          </GridCanvasWidget>
					</Layer>
				</Content>
			</Body>
		);
	}
}
