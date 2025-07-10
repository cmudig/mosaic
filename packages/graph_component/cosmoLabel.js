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
        //console.log("updating labels -- update(graph)");
        //console.log('Graph: ', graph);
        if (!graph) return;

        const tracked = graph.getTrackedPointPositionsMap();   
        //console.log('tracked points: ', tracked.size, tracked);
        if (!tracked || tracked.size === 0) return; // not necessary I don't think
        //console.log('pointIndexToLabel: ', this.pointIndexToLabel);
        const newLabels = [];

        tracked.forEach(([simX, simY], pointIndex) => {
            const [screenX, screenY] = graph.spaceToScreenPosition([simX, simY]);
            const labelText = this.pointIndexToLabel.get(pointIndex) || ''; // test
            //console.log(labelText);
            // if (pointIndex === 0) {
            //     //console.log('Node index, Node screenX, Node screenY: ', pointIndex, screenX, screenY);
            //     //console.log(`Node ${pointIndex} "${labelText}": sim=(${screenX.toFixed(2)}, ${screenY.toFixed(2)}), label=(${screenX.toFixed(2)}, ${(screenY - 1).toFixed(2)})`);
            // }
            //console.log('Node index: ', pointIndex);
            //console.log('Node screenX: ', screenX);
            //console.log('Node screenY: ', screenY);

            const radiusPx = graph.spaceToScreenRadius(
                graph.getPointRadiusByIndex(pointIndex) || 0
            );
            //console.log('Node radiusPx: ', radiusPx);

            newLabels.push({
                id:    String(pointIndex),
                text:  this.pointIndexToLabel.get(pointIndex) || '',
                x:     screenX,
                y:     screenY - (radiusPx + 1),
                opacity: 1,
            });
        });

        this.labels = newLabels;
        //console.log('Labels id: ', this.labels[0].id);
        //console.log('Label screenX: ', this.labels[0].x);
        //console.log('Label screenY: ', this.labels[0].y);
        //console.log('Label text: ', this.labels[0].text);
        //console.log('Label radiusPx: ', graph.spaceToScreenRadius(graph.getPointRadiusByIndex(0)));
        this.labelRenderer.setLabels(this.labels);
        //console.log(' set labels: ', this.labels);
        this.labelRenderer.draw(true);
        //console.log('Label ID, Label text, screenX, screenY ', this.labels[0].id, this.labels[0].text, this.labels[0].x, this.labels[0].y);
        //console.log('Rendered labels:', this.labels.length);
        //console.log('LabelRenderer:', this.labelRenderer._cssLabels);

    }
}
