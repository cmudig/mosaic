import { 
  Cosmograph, 
} from '@cosmograph/cosmograph';
import { throttle } from '../core/src/util/throttle.js';
import * as vg from '@uwdata/vgplot';
import { Param, Selection, clausePoints } from '@uwdata/mosaic-core';
import { MosaicClient } from '../core/src/MosaicClient.js';
import { Query } from '@uwdata/mosaic-sql';

export class CosmographClient extends MosaicClient {
  constructor(targetElement, histogramElement, searchElement, timelineElement) {
    super();
    this._element = targetElement || document.createElement('div');
    this._histogramElement = histogramElement || document.createElement('div');
    this._searchElement = searchElement || document.createElement('div');
    this._timelineElement = timelineElement || document.createElement('div');

    document.body.appendChild(this._element);
    document.body.appendChild(this._histogramElement);
    document.body.appendChild(this._searchElement);
    document.body.appendChild(this._timelineElement);

    this._cosmograph = new Cosmograph(this._element, {
      nodeColor: (node) => node.color || '#b3b3b3',
      nodeSize: (node) => node.size || 4,
      linkWidth: (link) => link.width || 1,
      linkColor: (link) => link.color || '#b3b3b3',
      renderHoveredNodeRing: true,
      hoveredNodeRingColor: 'red',
      focusedNodeRingColor: 'yellow',
      showDynamicLabels: true,
      backgroundColor: '#222222',
    });

    this._searchSelection = new Selection();
    this._histogramSelection = new Selection();
    this._timelineSelection = new Selection();

    // Initialize histogram and timeline placeholders
    this._histogramData = [];
    this._histogram = null;
    this._timelineData = [];
    this._timeline = null;

    // Throttle updates for performance optimization
    this._requestUpdate = throttle(() => this.requestQuery(), true);

    // Attach event handlers
    this._cosmograph.onClick = this.onClick.bind(this);
    this._cosmograph.onZoom = this.onZoom.bind(this);
    this._cosmograph.onSimulationEnd = this.onSimulationEnd.bind(this);
  }

  fields() {
    // Return an array of field descriptors for the coordinator to gather stats
    return [
      { table: 'links', column: 'source', stats: [] },
      { table: 'links', column: 'target', stats: [] }
      // add more if you want
    ];
  }
  
  fieldInfo(info) {
    // The coordinator will call this with stats about each field listed in fields().
    // For example, you could store them if needed:
    this._fieldInfo = info;
    console.log('Got field info from coordinator:', info);
    return this;
  }

  // query(filter) {
  //   // Return the SQL or Mosaic query object to run
  //   return {
  //     sql: 'SELECT source, target, color, width FROM links'
  //   };
  // }
  query(filter = []) {
    return Query.from('links').select('source', 'target', 'color', 'width').where(filter);
  }

  // queryResult(data) {
  //   // Called when the query completes
  //   // e.g. store the data or render your UI
  //   console.log('Data from DB:', data);
  //   return this;
  // }

  queryResult(data) {
    const rows = data.toArray();
    const links = rows.map(row => ({
      source: row.source,
      target: row.target,
      color: row.color,
      width: row.width
    }));
    const nodeIds = new Set();
    links.forEach(link => {
      nodeIds.add(link.source);
      nodeIds.add(link.target);
    });
    const nodes = Array.from(nodeIds).map(id => ({ id }));
    this.setData(nodes, links, nodes, links);
    return this;
  }

  async applySelection(clause) {
    const predicate = await this._searchSelection.predicate();
    const matchedNodes = this._allNodes.filter(node => predicate(node));
    const matchedIds = new Set(matchedNodes.map(n => n.id));

    const filteredNodes = this._allNodes.filter(n => matchedIds.has(n.id));
    const filteredLinks = this._allLinks.filter(
      l => matchedIds.has(l.source) && matchedIds.has(l.target)
    );

    const allNodesWithMatchInfo = this._allNodes.map(n => ({
      ...n,
      matched: matchedIds.has(n.id)
    }));

    const allLinksWithMatchInfo = this._allLinks.map(l => ({
      ...l,
      matched: matchedIds.has(l.source) || matchedIds.has(l.target)
    }));

    return { 
      nodes: filteredNodes, 
      links: filteredLinks, 
      allNodesWithMatchInfo,
      allLinksWithMatchInfo
    };
  }

  updateHighlightSelection(allNodesWithMatchInfo) {
    const matchedNames = allNodesWithMatchInfo
      .filter(n => n.matched)
      .map(n => n.name);

    const fields = ['name'];
    const value = matchedNames.map(name => [name]);
    const clause = clausePoints(fields, value, { source: this });

    console.log('Highlight clause:', clause);
    console.log('Before update, Highlight selection:', this._searchSelection.value);

    this._searchSelection.update(clause);

    console.log('After update, Highlight selection:', this._searchSelection.value);

    // Update histogram data
    this._histogramElement.innerHTML = '';
    this._histogram = this.createHistogram(allNodesWithMatchInfo);
    this._histogramElement.appendChild(this._histogram);
  }

  filterDataExact(searchValue) {
    if (!searchValue) {
      return { nodes: this._allNodes, links: this._allLinks };
    }
  
    const filteredNodes = this._allNodes.filter(node =>
      node.name.toLowerCase() === searchValue.toLowerCase()
    );
  
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredLinks = this._allLinks.filter(link =>
      nodeIds.has(link.source) || nodeIds.has(link.target)
    );

    const allNodesWithMatchInfo = this._allNodes.map(n => ({
      ...n,
      matched: nodeIds.has(n.id)
    }));

    const allLinksWithMatchInfo = this._allLinks.map(l => ({
      ...l,
      matched: nodeIds.has(l.source) || nodeIds.has(l.target)
    }));
  
    return { nodes: filteredNodes, links: filteredLinks, allNodesWithMatchInfo, allLinksWithMatchInfo };
  }

  setData(nodes, links, allNodesWithMatchInfo, allLinksWithMatchInfo) {
    this._allNodes = nodes;
    this._allLinks = links;
    console.log('Data set:', nodes, links);
    this._cosmograph.setData(nodes, links);

    // Update histogram data
    const nodesForHistogram = allNodesWithMatchInfo && allNodesWithMatchInfo.length
      ? allNodesWithMatchInfo
      : nodes;
    this._histogramElement.innerHTML = '';
    this._histogram = this.createHistogram(nodesForHistogram);
    this._histogramElement.appendChild(this._histogram);

    // Update timeline data
    const linksForTimeline = allLinksWithMatchInfo && allLinksWithMatchInfo.length
      ? allLinksWithMatchInfo
      : links;
    this._timelineElement.innerHTML = '';
    const timelineData = linksForTimeline.map(link => ({
      date: new Date(link.date),
      width: link.width || 1,
      matched: link.matched ?? true
    }));
    this._timeline = this.createTimeline(timelineData);
    this._timelineElement.appendChild(this._timeline);

    return this;
  }

  createHistogram(nodes) {
    const barData = nodes.map(node => ({
      name: node.name,
      size: node.size || 0,
    }));
    return vg.plot(
      vg.barY(barData, { 
        x: 'name', 
        y: 'size', 
        fill: 'steelblue',
        opacity: 1 // Set base opacity to 1
      }),
      vg.highlight({ by: this._searchSelection, opacity: 0.2 }),
      vg.toggle({ as: this._histogramSelection, channels: ['x'] }),
      vg.width(1000),
      vg.height(200),
      vg.xScale('band'),
      vg.yScale('linear'),
      vg.padding(0.1)
    );
  }

  createTimeline(links) {
    const barData = links.map(link => ({
      date: new Date(link.date),
      width: link.width || 1,
      matched: link.matched ?? true
    }));
    
    // Sort by date to display bars in chronological order
    barData.sort((a, b) => a.date - b.date);
  
    return vg.plot(
      vg.barY(barData, { x: 'date', y: 'width', fill: 'steelblue', opacity: barData.map(d => d.matched ? 1 : 0.2) }),
      vg.toggle({ as: this._timelineSelection, channels: ['x'] }),
      vg.width(1000),
      vg.height(200),
      vg.xScale('band'),
      vg.yScale('linear'),
      vg.padding(0.1)
    );
  }

  // Configuration and other methods remain similar
  setConfig(config) {
    this._cosmograph.setConfig(config);
    return this;
  }

  setZoomLevel(value, duration = 0) {
    this._cosmograph.setZoomLevel(value, duration);
  }

  selectNode(node, selectAdjacentNodes = false) {
    if (selectAdjacentNodes) {
      const adjacentNodes = this.getAdjacentNodes(node.id);
      this._cosmograph.selectNodes([node, ...adjacentNodes]);
    } else {
      this._cosmograph.selectNode(node);
    }
  }

  unselectNodes() {
    this._cosmograph.unselectNodes();
  }

  focusNode(node) {
    this._cosmograph.focusNode(node);
  }

  getAdjacentNodes(id) {
    return this._cosmograph.getAdjacentNodes(id);
  }

  getSelectedNodes() {
    return this._cosmograph.getSelectedNodes();
  }

  getNodePositions() {
    return this._cosmograph.getNodePositions();
  }

  fitView(duration = 250) {
    this._cosmograph.fitView(duration);
  }

  fitViewByNodeIds(ids, duration = 250) {
    this._cosmograph.fitViewByNodeIds(ids, duration);
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

  isSimulationRunning() {
    return this._cosmograph.isSimulationRunning;
  }

  onClick(clickedNode, index, position, event) {
    console.log(`Clicked on node ${clickedNode?.id || 'empty space'}`);
  }

  onZoom(event) {
    console.log('Zoom event:', event);
  }

  onSimulationEnd() {
    console.log('Simulation ended');
  }

  // requestQuery(query) {
  //   const q = query || this.query();
  //   return this._coordinator.requestQuery(this, q).then((data) => {
  //     this.setData(data.nodes, data.links);
  //   });
  // }

  requestUpdate() {
    this._requestUpdate();
  }

  remove() {
    this._cosmograph.remove();
    console.log('Graph instance destroyed');
  }
}
