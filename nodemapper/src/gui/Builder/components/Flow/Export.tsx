import { Node } from 'NodeMap/scene/Flow'; // Custom Node definition
import { toPng, toSvg } from 'html-to-image';
import { getNodesBounds } from 'reactflow';

const ExportCanvas = (nodes: Node[], exporterToImageFormat, fileExt) => {
  console.log('Exporting canvas as ' + fileExt);

  const downloadImage = (dataUrl) => {
    const a = document.createElement('a');
    a.setAttribute('download', 'workflow.' + fileExt);
    a.setAttribute('href', dataUrl);
    a.click();
  };

  const nodesBounds = getNodesBounds(nodes);
  exporterToImageFormat(document.querySelector('.react-flow__viewport') as HTMLElement, {
    backgroundColor: '#ffffff',
    width: nodesBounds.width + 100,
    height: nodesBounds.height + 100,
  }).then(downloadImage);
};

export const ExportAsPNG = (nodes: Node[]) => {
  ExportCanvas(nodes, toPng, 'png');
};

export const ExportAsSVG = (nodes: Node[]) => {
  ExportCanvas(nodes, toSvg, 'svg');
};
