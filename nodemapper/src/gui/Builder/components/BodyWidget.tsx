import React from 'react';
import styled from '@emotion/styled';
import NodeInfo from './NodeInfo';
import { keys } from 'lodash';
import { DiagramEngine } from '@projectstorm/react-diagrams'
import { CanvasWidget } from '@projectstorm/react-diagrams';
import { useAppSelector } from 'redux/store/hooks'
import { TrayWidget } from './TrayWidget';
import { TrayItemWidget } from './TrayItemWidget';
import { DefaultNodeModel } from  'NodeMap'
import { GridCanvasWidget } from './GridCanvasWidget';
import BuilderEngine from '../BuilderEngine';

export interface BodyWidgetProps {
  engine: DiagramEngine
}

export const Body = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  height: 1000px;
`;

export const Content = styled.div`
  display: flex;
  flex-grow: 1;
`;

export const Layer = styled.div`
  position: relative;
  flex-grow: 1;
`;

export const BodyWidget = (props: BodyWidgetProps) => {
  const app = BuilderEngine.Instance;
  const modules = useAppSelector(state => state.builder.modules_list);
  const trayitems = JSON.parse(modules).map(m =>
    <TrayItemWidget
      key={m['name']}
      model={m}
      name={m['name']}
      color={app.GetModuleTypeColor(m['type'])}
    />
  );

  return (
    <>
    <Body>
      <Content>
        <TrayWidget>
          {trayitems}
        </TrayWidget>
        <Layer
          onDrop={(event) => {
            const engine = props.engine;
            const data = JSON.parse(event.dataTransfer.getData('storm-diagram-node'));
            const nodesCount = keys(engine.getModel().getNodes()).length;

            let node: DefaultNodeModel = null;
            let node_name = "";
            switch(data.type) {
              case 'terminal':
                node_name = 'Terminal' + (nodesCount+1);
                node = new DefaultNodeModel(
                  node_name,
                  'rgb(192,0,255)',
                  JSON.stringify({
                    'id': 'idcode',
                    'name': node_name,
                    'type': 'Module',
                    'config' : {
                        'url': ''
                    }
                  })
                );
                node.addInPort('In');
                break;
              case 'source':
                node_name = 'Source' + (nodesCount+1);
                node = new DefaultNodeModel(
                  node_name,
                  'rgb(192,255,0)',
                  JSON.stringify({
                    'id': 'idcode',
                    'name': node_name,
                    'type': 'Module',
                    'config' : {
                        'url': '../../../../../snakeshack/workflows/OxfordPhyloGenetics/init/workflow/Snakefile'
                    }
                  })
                );
                node.addOutPort('Out');
                break;
              case 'module':
                node_name = 'Sleep' + (nodesCount+1);
                node = new DefaultNodeModel(
                  node_name,
                  'rgb(0,192,255)',
                  JSON.stringify({
                    'id': 'idcode',
                    'name': node_name,
                    'type': 'Module',
                    'config' : {
                        'url': '../../../../../snakeshack/workflows/OxfordPhyloGenetics/sleep/workflow/Snakefile',
                        'params': {
                            'sleeptime': 3
                        }
                    }
                  })
                );
                node.addInPort('In');
                node.addOutPort('Out');
                break;
              case 'connector':
                node_name = 'Connector' + (nodesCount+1);
                node = new DefaultNodeModel(
                  node_name,
                  'rgb(0,255,192)',
                  JSON.stringify({
                    'id': 'idcode',
                    'name': node_name,
                    'type': 'Connector',
                    'config' : {
                        'url': '../../../../../snakeshack/workflows/OxfordPhyloGenetics/connector_copy/workflow/Snakefile',
                        'map': [
                            'Init',
                            'Sleep 1'
                        ]
                    }
                  })
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
            engine.repaintCanvas();
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
        >
        <GridCanvasWidget>
          <CanvasWidget engine={props.engine} />
        </GridCanvasWidget>
        </Layer>
      </Content>
    </Body>
    <NodeInfo />
    </>
  );
}
