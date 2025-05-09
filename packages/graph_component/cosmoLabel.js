import { LabelRenderer } from '@interacta/css-labels';

export class CosmosLabels {
    constructor(containerDiv, pointIndexToLabel) {
        this.labelRenderer = new LabelRenderer(containerDiv, { pointerEvents: 'none' });
        this.pointIndexToLabel = pointIndexToLabel;
        this.labels = [];
    }

    setLabels(new_pointIndexToLabel, graph) {
        this.pointIndexToLabel = new_pointIndexToLabel;
        this.update(graph);
    }

    update(graph) {
        const tracked = graph.getTrackedPointPositionsMap();
        // console.log("updating labels");
        // console.log('tracked: ', tracked);
        // console.log('pointIndexToLabel: ', this.pointIndexToLabel);
        const newLabels = [];

        tracked.forEach(([simX, simY], pointIndex) => {
            const [screenX, screenY] = graph.spaceToScreenPosition([simX, simY]);
            // console.log('Node index: ', pointIndex);
            // console.log('Node screenX: ', screenX);
            // console.log('Node screenY: ', screenY);

            const radiusPx = graph.spaceToScreenRadius(
                graph.getPointRadiusByIndex(pointIndex) || 0
            );
            // console.log('Node radiusPx: ', radiusPx);

            newLabels.push({
                id:    String(pointIndex),
                text:  this.pointIndexToLabel.get(pointIndex) || '',
                x:     screenX,
                y:     screenY - (radiusPx + 2),
                opacity: 1,
            });
        });

        this.labels = newLabels;
        // console.log('Labels id: ', this.labels[0].id);
        // console.log('Label screenX: ', this.labels[0].x);
        // console.log('Label screenY: ', this.labels[0].y);
        // console.log('Label text: ', this.labels[0].text);
        // console.log('Label radiusPx: ', graph.spaceToScreenRadius(graph.getPointRadiusByIndex(0)));
        this.labelRenderer.setLabels(this.labels);
        // console.log('labels: ', this.labels);
        this.labelRenderer.draw(true);
    }
}
