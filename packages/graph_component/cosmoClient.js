import { Query, dateMonth } from '@uwdata/mosaic-sql';
import { MosaicClient } from '@uwdata/mosaic-core';
// import { Cosmograph } from '@cosmograph/cosmograph';
import { Graph } from '@cosmograph/cosmos'
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
                // date: 'date',
                // matchId: 'matchId'
            },
            nodeConfig = {},
            linkConfig = {}
        } = opts; 

        super(filter);
        // this.container = container;
        this.graphContainer  = graphContainer;
        this.labelsContainer = labelsContainer;
        // this._cosmosLabels = new CosmosLabels(container, pointIndexToLabel);
        this._cosmosLabels = undefined;
        // console.log('container element:', this.container);
        // console.log('offsetWidth:', this.container.offsetWidth);
        // console.log('offsetHeight:', this.container.offsetHeight);
        
        this.table = table;
        this.dataset = dataset;
        this.selection = filter;
        this.columns = columns;
        this.nodeConfig = nodeConfig;
        this.linkConfig = linkConfig;


        this._cosmograph = new Graph(this.graphContainer, {
            spaceSize: 1000,
            backgroundColor: '#2d313a',
            linkWidth: 3,
            linkColor: (link_color) => this.getLinkColor(link_color),
            curvedLinks: true,
            linkArrows: true,
            renderHoveredNodeRing: true,
            hoveredNodeRingColor: 'red',
            focusedNodeRingColor: 'yellow',
            showNodeLabels: true,
            
            simulationFriction: 0.1, // keeps the graph inert
            simulationGravity: 0, // disables gravity
            // simulationRepulsion: 0.5, // increases repulsion between points
            fitViewDelay: 1000, // wait 1 second before fitting the view
            fitViewPadding: 10, // centers the graph width padding of ~30% of screen
            disableRescalePositions: false, // rescale positions
            enableDrag: true,
            
            fitViewOnInit: true,
        
            showDynamicLabels: true,
            // simulationLinkDistance: 1
            // simulationLinkSpring: 0.3
            onSimulationTick: () => this._cosmosLabels?.update(this._cosmograph),
            onZoom: () => this._cosmosLabels?.update(this._cosmograph)

            
            
        });
        

        this._allNodes = [];
        this._allLinks = [];

        // this._cosmograph.onClick = this.onClick.bind(this);
        // this._cosmograph.zoom = this.onZoom.bind(this);
        // this._cosmograph.onSimulationEnd = this.onSimulationEnd.bind(this);
    }   

    query() {
        const { source, target, result, filter } = this.columns;
        return Query.select({
            source,
            target,
            result
            // date: dateMonth(date),
            // matchId
        })
            .from(this.table)
            .where(filter);
    }
  

    queryResult(data) {
        const sourceCol = data.getChild('source');
        const targetCol = data.getChild('target');
        const resultCol = data.getChild('result');

        const numRows = sourceCol.length;
    
        const namesSet = new Set();
    
        for (let i = 0; i < numRows; i++) {
            namesSet.add(sourceCol.at(i));
            namesSet.add(targetCol.at(i));
        }
    
        // const nodes = Array.from(namesSet).map(name => ({
        //     id: name
        // }));
        const nodes = Array.from(namesSet).map(id => ({ id }));

        const pointIndexToLabel = new Map(nodes.map((n,i) => [i, n.id]));
        console.log("pointIndexToLabel: ", Array.from(pointIndexToLabel.keys()));


        const pointPositions = new Float32Array(nodes.length * 2);
        const radius = 100;
        for (let i = 0; i < nodes.length; i++) {
        const angle = (2 * Math.PI * i) / nodes.length;
            pointPositions[i * 2] = radius * Math.cos(angle);     
            pointPositions[i * 2 + 1] = radius * Math.sin(angle); 
        }
        console.log("pointPositions: ", pointPositions);
        this._pointPositions = pointPositions;

        const nameToIndex = new Map(nodes.map((node, i) => [node.id, i]));
        console.log("nameToIndex: ", nameToIndex);

        const linkArray = new Float32Array(numRows * 2);
        for (let i = 0; i < numRows; i++) {
            const source = sourceCol.at(i);
            const target = targetCol.at(i);
            const sourceIndex = nameToIndex.get(source);
            const targetIndex = nameToIndex.get(target);
            linkArray[i * 2] = sourceIndex;
            linkArray[i * 2 + 1] = targetIndex;
        }

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


        this._cosmograph.setPointPositions(pointPositions);
        this._cosmograph.setLinks(linkArray);
        // this._cosmograph.render();
        this._cosmograph.setLinkColors(linkColorArray);
        this._cosmograph.render();
        
        this._cosmograph.trackPointPositionsByIndices(
            Array.from(pointIndexToLabel.keys()) 
        );
        this._cosmosLabels?.update(this._cosmograph);
        console.log('tracked size:', this._cosmograph.getTrackedPointPositionsMap().size);

        if (!this._cosmosLabels) {
            this._cosmosLabels = new CosmosLabels(this.labelsContainer, pointIndexToLabel, this._pointPositions);
        } else {
            this._cosmosLabels.setLabels(pointIndexToLabel);
        }

        this._cosmosLabels.update(this._cosmograph);
        this._cosmograph.fitView();
        // this._cosmograph.setZoomLevel(0.8);
        // console.log('tracked', this._cosmograph.getTrackedPointPositionsMap().size, 'labels', this._cosmosLabels.labels.length);
    
        this._allNodes = nodes;
        this._allLinks = linkArray;
        // this.setData(nodes, linkArray);
        return this;
    }
    

    getLinkColor(link_color) {
        // console.log("aaahahhhahhahah ", link_color);
        if (this.linkConfig.linkColor) {
            // console.log("result: ", link_color);
            return this.linkConfig.linkColor(link_color.result);
        }
        
        console.log("linkhere: ", link);
        switch (link_color.result) {
            case 'win': return '#00ff00';
            case 'loss': return '#ff0000';
            case 'draw': return '#ffff00';
            default: return '#b3b3b3';
        }

    } 
      

    setData(nodes, links) {
        this._allNodes = nodes;
        this._allLinks = links;
        console.log("set data node: ", nodes);
        console.log("link: ", links);
        this._cosmograph.setLinks(links);
        this._cosmograph.render()
        // this._cosmograph.start();
    }

    onClick(clickedNode, index, position, event) {
        console.log(`Clicked on node: ${clickedNode?.id || 'empty space'}`);
    }

    onZoom(event) {
        console.log('Zoom event:', event);
    }

    onSimulationEnd() {
        console.log('Simulation ended');
    }

    start(alpha = 1) {
        this._cosmograph.start(alpha);
    }

    pause() {
        this._cosmograph.pause();
    }

    restart() {
        this._cosmograph.restart();
    }

    remove() {
        this._cosmograph.remove();
        console.log('Graph instance destroyed');
    }
}