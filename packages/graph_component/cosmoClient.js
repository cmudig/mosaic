import { Query, dateMonth, x } from '@uwdata/mosaic-sql';
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
        
        this.graphContainer  = graphContainer;
        this.labelsContainer = labelsContainer;
        // this._cosmosLabels = new CosmosLabels(container, pointIndexToLabel);
        // this._cosmosLabels = undefined;
        
        this.table = table;
        this.dataset = dataset;
        this.selection = filter;
        this.columns = columns;
        this.nodeConfig = nodeConfig;
        this.linkConfig = linkConfig;
        // const pointIndexToLabel = new Map();
        // for (let i = 0; i < 100; i++) {
        //     pointIndexToLabel.set(i, `Node ${i}`);
        // }
        // this._cosmosLabels = new CosmosLabels(labelsContainer, pointIndexToLabel);
        
        console.log('this._pointPositions', this._pointPositions);


        this._cosmograph = new Graph(this.graphContainer, {
            spaceSize: 4096,
            backgroundColor: '#2d313a',
            linkWidth: 3,
            linkColor: (link_color) => this.getLinkColor(link_color),
            curvedLinks: true,
            linkArrows: true,
            pointSize: 2,
            
            // simulationFriction: 0.1, 
            // simulationGravity: 0, 
            simulationGravity: 0.1,
            simulationLinkDistance: 1,
            simulationLinkSpring: 0.3,
            simulationRepulsion: 0.4,
            
            fitViewPadding: 0.2,
            enableDrag: true,
        

            fitViewDelay: 0,
            fitViewOnInit: false,
            enableSimulationDuringZoom: true,


            onSimulationTick: () => this._cosmosLabels?.update(this._cosmograph),
            onZoom: () => {
                console.log("zooming");
                this._cosmosLabels?.update(this._cosmograph)
            }
        });
        
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
        console.log("pointIndexToLabel: ", pointIndexToLabel);


        const pointPositions = new Float32Array(nodes.length * 2);
        // const radius = 100;
        // for (let i = 0; i < nodes.length; i++) {
        // const angle = (2 * Math.PI * i) / nodes.length;
        //     pointPositions[i * 2] = radius * Math.cos(angle);     
        //     pointPositions[i * 2 + 1] = radius * Math.sin(angle); 
        // }
        // console.log("pointPositions: ", pointPositions);
        for (let i = 0; i < nodes.length; i++) {
            const x = Math.random() * (0.495 - 0.505) + 0.505;
            const y = Math.random() * (0.495 - 0.505) + 0.505;
            pointPositions[i * 2] = 4096 * x // x
            pointPositions[i * 2 + 1] = 4096 * y // y
        }
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

        if (!this._cosmosLabels) {
            console.log("generating new labels");
            this._cosmosLabels = new CosmosLabels(this.labelsContainer, pointIndexToLabel);
        }
        else {
            console.log("updating labels");
            this._cosmosLabels.setLabels(pointIndexToLabel, this._cosmograph);
        }
       
    
        this._cosmograph.setPointPositions(pointPositions)
        this._cosmograph.setLinkColors(linkColorArray)
        this._cosmograph.setLinks(linkArray);
        this._cosmograph.render();
        this._cosmograph.setZoomLevel(0.6);
    
       
        this._cosmograph.fitView();
        this._cosmograph.trackPointPositionsByIndices(
            Array.from(pointIndexToLabel.keys())
        );
    
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
      

    // setData(nodes, links) {
    //     this._allNodes = nodes;
    //     this._allLinks = links;
    //     console.log("set data node: ", nodes);
    //     console.log("link: ", links);
    //     this._cosmograph.setLinks(links);
    //     this._cosmograph.render()
    //     // this._cosmograph.start();
    // }

    // onClick(clickedNode, index, position, event) {
    //     console.log(`Clicked on node: ${clickedNode?.id || 'empty space'}`);
    // }

    // onZoom(event) {
    //     console.log('Zoom event:', event);
    // }

    // onSimulationEnd() {
    //     console.log('Simulation ended');
    // }

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