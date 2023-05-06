import React from 'react';
import { DiagramEngine } from '@projectstorm/react-diagrams';
import { CanvasWidget } from '@projectstorm/react-diagrams';

export interface BodyWidgetProps {
    engine: DiagramEngine;
}

export class BodyWidget extends React.Component<BodyWidgetProps> {
    render() {
        return <CanvasWidget className="diagram-container" engine={this.props.engine} />;
    }
}
