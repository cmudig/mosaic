import { Query, dateMonth, x } from '@uwdata/mosaic-sql';
import { MosaicClient } from '@uwdata/mosaic-core';
import { Graph } from '@cosmos.gl/graph'
import { CosmosLabels } from './cosmoLabel.js';

export class CosmographClient extends MosaicClient {
    constructor({ graphContainer, labelsContainer }, opts) {
        const {
            table,
            dataset,
            filter,
            columns = {
                source: 'source',
                target: 'target',
                result: 'result'
            },
            nodeConfig = {},
            linkConfig = {}
        } = opts; 

        super(filter);

        this.graphContainer  = graphContainer;
        this.labelsContainer = labelsContainer;
        this.table = table;
        this.dataset = dataset;
        this.selection = filter;
        this.columns = columns;
        this.nodeConfig = nodeConfig;
        this.linkConfig = linkConfig;

        this._mouse = { x: 0, y: 0 };
        this.graphContainer.addEventListener('mousemove', (e) => {
            this._mouse.x = e.clientX;
            this._mouse.y = e.clientY;
        });



        // (1) Build the helpers once
        this.pointIndexToLabel = new Map();
        console.log('pointIndexToLabel: ', this.pointIndexToLabel);

        //////////////////////////////////////////////////////////////////////////////////////////////////////////
        this._labels = new CosmosLabels(this.labelsContainer, this.pointIndexToLabel);
        console.log('CosmosLabels instance created', this._labels);

        this._graph = new Graph(this.graphContainer, {
            spaceSize: 4096,
            backgroundColor: '#1a1a1a',
            linkWidth: 3,
            linkColor: (link_color) => this.getLinkColor(link_color),
            curvedLinks: true,
            linkArrows: true,
            pointSize: 10,
            simulationGravity: 0.1,
            simulationLinkDistance: 30, 
            simulationLinkSpring: 0.3,
            simulationRepulsion: 0.4,
            fitViewPadding: 0.2,
            enableDrag: true,
            fitViewOnInit: false,
            fitViewDelay: 1000,
            enableSimulationDuringZoom: true,
            onSimulationTick: () => {
                //console.log('Simulation tick');
                this._labels.update(this._graph);
            },
  
            onZoom: () => {
                //console.log('Zoom event triggered');
                if (this._graph && this._labels) {
                    //console.log('onZoom valid, updating labels');
                    this._labels.update(this._graph);
                }
                
            },
            onClick: (index) => {
                if (index !== undefined) {
                    // Zoom to the clicked point and select it
                    console.log('Point clicked, index: ', index);
                    console.log('Point label: ', this.pointIndexToLabel.get(index));
                    this._graph.zoomToPointByIndex(index);
                    this._graph.fitViewByPointIndices([index]);
                    this._graph.pause();
                } else {
                    // Optionally, unselect points if clicked on empty space
                    console.log('Clicked on empty space, unselecting points');
                    this._graph.unselectPoints();
                    this._graph.fitView();
                    this._graph.start();
                }
            },

            // onmouseover

            onPointMouseOver: (index, event) => {
                const label = this.pointIndexToLabel.get(index);
                const [posX, posY] = this._graph.getTrackedPointPositionsMap().get(index) || [0, 0];
                const [graphX, graphY] = this._graph.spaceToScreenPosition([posX, posY]);
                //console.log(posX, posY);
                //console.log(graphX, graphY);
                if (label) {
                    const tooltip = document.getElementById('cosmo-tooltip');
                    tooltip.textContent = label;
                    tooltip.style.display = 'block';
                    // Position tooltip near mouse
                    tooltip.style.left = (graphX || 0) + 10 + 'px';
                    tooltip.style.top = (graphY || 0) + 10 + 'px';

                }
            },
            onPointMouseOut: () => {
                const tooltip = document.getElementById('cosmo-tooltip');
                tooltip.style.display = 'none';
            },
        });

        
    }

    query() {
        const { source, target, result, filter } = this.columns;
        return Query.select({
            source,
            target,
            result
        })
            .from(this.table)
            .where(filter);
    }

    queryResult(data) {
        const sourceCol = data.getChild('source');
        const targetCol = data.getChild('target');
        const resultCol = data.getChild('result');
        const numRows = sourceCol.length;

        // Build nodes and links
        const namesSet = new Set();
        for (let i = 0; i < numRows; i++) {
            namesSet.add(sourceCol.at(i));
            namesSet.add(targetCol.at(i));
        }
        const nodes = Array.from(namesSet).map(id => ({ id }));

        // (2) Mutate the shared Map instead of creating new ones
        //console.log("clearing pointIndexToLabel");
        this.pointIndexToLabel.clear();
        nodes.forEach((n, i) => this.pointIndexToLabel.set(i, n.id));
        //console.log("pointIndexToLabel after clearing and setting: ", this.pointIndexToLabel);
        // Point positions
        const pointPositions = new Float32Array(nodes.length * 2);
        for (let i = 0; i < nodes.length; i++) {
            const x = Math.random() * (0.495 - 0.505) + 0.505;
            const y = Math.random() * (0.495 - 0.505) + 0.505;
            pointPositions[i * 2] = 4096 * x;
            pointPositions[i * 2 + 1] = 4096 * y;
        }

        // Name to index
        const nameToIndex = new Map(nodes.map((node, i) => [node.id, i]));
        //console.log("nameToIndex: ", nameToIndex);

        // Links
        const linkArray = new Float32Array(numRows * 2);
        for (let i = 0; i < numRows; i++) {
            const source = sourceCol.at(i);
            const target = targetCol.at(i);
            const sourceIndex = nameToIndex.get(source);
            const targetIndex = nameToIndex.get(target);
            linkArray[i * 2] = sourceIndex;
            linkArray[i * 2 + 1] = targetIndex;
        }

        // Link colors
        const linkColorArray = new Float32Array(numRows * 4);
        for (let i = 0; i < numRows; i++) {
            const result = resultCol.at(i);
            const color = this.getLinkColor({ result });
            if (color === '#00ff00') {           // Green
                linkColorArray[i * 4] = 0;       // R
                linkColorArray[i * 4 + 1] = 255; // G
                linkColorArray[i * 4 + 2] = 0;   // B
                linkColorArray[i * 4 + 3] = 0.5; // A
            }
            if (color === '#ff0000') {           // Red
                linkColorArray[i * 4] = 255;
                linkColorArray[i * 4 + 1] = 0;
                linkColorArray[i * 4 + 2] = 0;
                linkColorArray[i * 4 + 3] = 0.5;
            }
            if (color === '#ffff00') {           // Yellow
                linkColorArray[i * 4] = 255;
                linkColorArray[i * 4 + 1] = 255;
                linkColorArray[i * 4 + 2] = 0;
                linkColorArray[i * 4 + 3] = 0.5;
            }
            if (color === '#b3b3b3') {           // Gray
                linkColorArray[i * 4] = 179;
                linkColorArray[i * 4 + 1] = 179;
                linkColorArray[i * 4 + 2] = 179;
                linkColorArray[i * 4 + 3] = 0.5;
            }            
        }

        // Supply arrays to Cosmos
        this._graph.setPointPositions(pointPositions);
        console.log("set point positions: ", pointPositions);
        this._graph.setLinks(linkArray);
        console.log("set links: ", linkArray);
        this._graph.setLinkColors(linkColorArray);
        console.log("set link colors: ", linkColorArray);


        

        // First render
        console.log("Rendering graph")
        this._graph.render();

        // Tell Cosmos which points to track BEFORE updating labels
        console.log("Tracking point positions by indices");
        this._graph.trackPointPositionsByIndices([...this.pointIndexToLabel.keys()]);

        // Optional: zoom-to-fit
        console.log("Fitting view to graph");
        this._graph.fitView();

        // Update labels after first render and tracking
        console.log("Updating after first rendering and tracking")
        this._labels.update(this._graph);

        // // Optional: zoom-to-fit
        // console.log("Fitting view to graph");
        // this._graph.fitView();

        return this;
    }

    getLinkColor(link_color) {
        if (this.linkConfig.linkColor) {
            return this.linkConfig.linkColor(link_color.result);
        }
        switch (link_color.result) {
            case 'win': return '#00ff00';
            case 'loss': return '#ff0000';
            case 'draw': return '#ffff00';
            default: return '#b3b3b3';
        }
    }

    start(alpha = 1) {
        this._graph.start(alpha);
    }

    pause() {
        this._graph.pause();
    }

    restart() {
        this._graph.restart();
    }

    remove() {
        this._graph.remove();
        console.log('Graph instance destroyed');
    }
}
