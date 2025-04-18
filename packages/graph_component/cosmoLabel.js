// import { LabelRenderer } from '@interacta/css-labels'
// import { Graph } from '@cosmograph/cosmos'

// export class CosmosLabels {
//     constructor(div, pointIndexToLabel) {
//         this.labelRenderer = new LabelRenderer(div, { pointerEvents: 'none' })
//         this.labels = []
//         this.pointIndexToLabel = pointIndexToLabel
//     }

//     update(graph) {
//         const trackedNodesPositions = graph.getTrackedPointPositionsMap()
//         let index = 0

//         trackedNodesPositions.forEach((positions, pointIndex) => {
//         const screenPosition = graph.spaceToScreenPosition([
//             positions?.[0] ?? 0,
//             positions?.[1] ?? 0,
//         ])

//         const radius = graph.spaceToScreenRadius(
//             graph.getPointRadiusByIndex(pointIndex)
//         )

//         this.labels[index] = {
//             id: String(pointIndex),
//             text: this.pointIndexToLabel.get(pointIndex) || '',
//             x: screenPosition[0],
//             y: screenPosition[1] - (radius + 2),
//             opacity: 1,
//         }

//         index += 1
//         })

//         this.labelRenderer.setLabels(this.labels)
//         this.labelRenderer.draw(true)
//     }
// }

import { LabelRenderer } from '@interacta/css-labels'

export class CosmosLabels {
    constructor(containerDiv, pointIndexToLabel) {
        this.labelRenderer = new LabelRenderer(containerDiv, { pointerEvents: 'none' })
        this.labels = []
        this.pointIndexToLabel = pointIndexToLabel
    }

    update(graph) {
        const trackedNodesPositions = graph.getTrackedPointPositionsMap()
        let index = 0

        trackedNodesPositions.forEach((position, pointIndex) => {
        const screenPosition = graph.spaceToScreenPosition([
            position?.[0] ?? 0,
            position?.[1] ?? 0
        ])

        const radius = graph.spaceToScreenRadius(
            graph.getPointRadiusByIndex(pointIndex)
        )

        this.labels[index] = {
            id: String(pointIndex),
            text: this.pointIndexToLabel.get(pointIndex) || '',
            x: screenPosition[0],
            y: screenPosition[1] - (radius + 2),
            opacity: 1
        }

        index += 1
        })

        this.labelRenderer.setLabels(this.labels)
        this.labelRenderer.draw(true)
    }
}
