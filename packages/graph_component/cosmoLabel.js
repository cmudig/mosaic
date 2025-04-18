import { LabelRenderer } from '@interacta/css-labels'

export class CosmosLabels {
    constructor(containerDiv, pointIndexToLabel, pointPositions) {
        this.pointPositions = pointPositions
        this.labelRenderer = new LabelRenderer(containerDiv, { pointerEvents: 'none' })
        this.labels = []
        this.pointIndexToLabel = pointIndexToLabel
    }

    setLabels(pointIndexToLabel) {
        this.pointIndexToLabel = pointIndexToLabel
    }

    update(graph) {
        const tracked = graph.getTrackedPointPositionsMap()
        this.labels = []; 
        // let i = 0;
        console.log("tracked: ", tracked)
        console.log("pointIndexToLabel: ", this.pointIndexToLabel)
        console.log("11112121212121212121212121212121212121212121212")
        tracked.forEach((pos, idx) => {
            const [x, y] = graph.spaceToScreenPosition(pos);
            // const x = this.pointPositions[i * 2];
            // const y = this.pointPositions[i * 2 + 1];
            // i++;
            const rPx    = graph.spaceToScreenRadius(graph.getPointRadiusByIndex(idx));
            console.log("rPx: ", rPx)
            console.log("x: ", x)
            console.log("y: ", y)
            console.log("pos: ", pos)
            console.log("idx: ", idx)
            console.log("pointIndexToLabel.get(idx): ", this.pointIndexToLabel.get(idx))
            this.labels.push({
                id: String(idx),
                text: this.pointIndexToLabel.get(idx) || '',
                x,
                y: y - (rPx + 2),
                opacity: 1
            });
        });

        console.log("labels: ", this.labels)
        this.labelRenderer.setLabels(this.labels)
        this.labelRenderer.draw(true)
    }
}
