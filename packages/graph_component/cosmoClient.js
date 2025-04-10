import { Query, dateMonth } from '@uwdata/mosaic-sql';
import { MosaicClient } from '@uwdata/mosaic-core';
import { Cosmograph } from '@cosmograph/cosmograph';

export class CosmographClient extends MosaicClient {
    constructor({ container }, opts) {
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
        this.container = container;
        this.table = table;
        this.dataset = dataset;
        this.selection = filter;
        this.columns = columns;
        this.nodeConfig = nodeConfig;
        this.linkConfig = linkConfig;

        this._cosmograph = new Cosmograph(this.container, {
            nodeColor: (node) => node.color || '#b3b3b3',
            nodeSize: (node) => node.size ?? 1,
            linkWidth: link => link.width ?? 2,
            linkColor: link => this.getLinkColor(link),
            curvedLinks: true,
            curvedLinkSegments: 20,
            renderHoveredNodeRing: true,
            hoveredNodeRingColor: 'red',
            focusedNodeRingColor: 'yellow',
            showDynamicLabels: true,
            backgroundColor: '#222222'
        });
        

        this._allNodes = [];
        this._allLinks = [];

        this._cosmograph.onClick = this.onClick.bind(this);
        this._cosmograph.onZoom = this.onZoom.bind(this);
        this._cosmograph.onSimulationEnd = this.onSimulationEnd.bind(this);
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
    
        const nodes = Array.from(namesSet).map(name => ({
            id: name
        }));
    
        const links = [];
        for (let i = 0; i < numRows; i++) {
            links.push({
                source: sourceCol.at(i),
                target: targetCol.at(i),
                result: resultCol.at(i),
                // date: dateCol.at(i),
                // matchId: matchIdCol.at(i),
                // width: 2 // default
            });
        }
    
        console.log("nodes: ", nodes);
        console.log("links: ", links);
    
        this._allNodes = nodes;
        this._allLinks = links;
        this.setData(nodes, links);
        return this;
    }
    

    getLinkColor(link) {
        if (this.linkConfig.linkColor) {
            return this.linkConfig.linkColor(link);
        }
        // console.log("result: ", link.result);
        console.log("linkhere: ", link);
        switch (link.result) {
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
        this._cosmograph.setData(nodes, links);
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