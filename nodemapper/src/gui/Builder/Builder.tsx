import React from 'react'
import { BodyWidget } from './components/BodyWidget';
import { Application } from './Application';
import './Builder.css'

function Builder() {
	const app = new Application();
	return <BodyWidget app={app} />;
}

export default Builder;
