import { 
  Cosmograph, 
  CosmographHistogram, 
  CosmographSearch, 
  CosmographTimeline 
} from '@cosmograph/cosmograph';
import { throttle } from '../core/src/util/throttle.js';
import { search, plot, width, height, xScale, yScale, rect, barY, padding } from '@uwdata/vgplot';
import { Param } from '@uwdata/mosaic-core';
import { nodes as allNodes, links as allLinks } from '../graph_component/dummy_data.js';

export class CosmographClient {
  constructor(targetElement, histogramElement, searchElement, timelineElement) {
    // Create containers for all components
    this._element = targetElement || document.createElement('div');
    this._histogramElement = histogramElement || document.createElement('div');
    this._searchElement = searchElement || document.createElement('div');
    this._timelineElement = timelineElement || document.createElement('div');

    document.body.appendChild(this._element);
    document.body.appendChild(this._histogramElement);
    document.body.appendChild(this._searchElement);
    document.body.appendChild(this._timelineElement);

    // Initialize the main Cosmograph instance
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

    this._allNodes = allNodes;
    this._allLinks = allLinks;
    // Initialize the Histogram component
    this._histogram = this.createHistogram(this._allNodes);
    this._histogramElement.appendChild(this._histogram);


    // Initialize the Search component
    this._searchParam = new Param();
    this._search = search({
      element: this._searchElement,
      label: 'Search Nodes',
      type: 'contains',
      as: this._searchParam
    });

    this._searchParam.addEventListener('value', (value) => {
      if (!this._exactSearchTriggered) {
        const filtered = this.filterData(value);
        this.setData(
          filtered.nodes, 
          filtered.links, 
          filtered.allNodesWithMatchInfo, 
          filtered.allLinksWithMatchInfo
        );
      }
      this._exactSearchTriggered = false;
    });

    this._enterButton = document.createElement('button');
    this._enterButton.textContent = 'Exact Search';
    this._searchElement.appendChild(this._enterButton);
    this._enterButton.addEventListener('click', () => {
      const value = this._searchParam.value;
      const filtered = this.filterDataExact(value);
      this.setData(
        filtered.nodes, 
        filtered.links, 
        filtered.allNodesWithMatchInfo, 
        filtered.allLinksWithMatchInfo
      );
    });

    // Initialize the Timeline component
    this._timeline = this.createTimeline(this._allLinks);
    this._timelineElement.appendChild(this._timeline);

    // Throttle updates for performance optimization
    this._requestUpdate = throttle(() => this.requestQuery(), true);

    // Attach event handlers
    this._cosmograph.onClick = this.onClick.bind(this);
    this._cosmograph.onZoom = this.onZoom.bind(this);
    this._cosmograph.onSimulationEnd = this.onSimulationEnd.bind(this);
    this.setData(this._allNodes, this._allLinks);
  }
  
  filterData(searchValue) {
    const lowerSearch = (searchValue || '').toLowerCase();
    const matchedIds = new Set(
      this._allNodes
        .filter(n => n.name.toLowerCase().includes(lowerSearch))
        .map(n => n.id)
    );
    
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

  // Exact search: returns nodes whose names exactly match the search value
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
    this._cosmograph.setData(nodes, links);

    this._histogramElement.innerHTML = '';
    const nodesForHistogram = allNodesWithMatchInfo && allNodesWithMatchInfo.length
      ? allNodesWithMatchInfo
      : nodes;
    this._histogram = this.createHistogram(nodesForHistogram);
    this._histogramElement.appendChild(this._histogram);

    // similarly for timeline, etc.
    this._timelineElement.innerHTML = '';
    const linksForTimeline = allLinksWithMatchInfo && allLinksWithMatchInfo.length
      ? allLinksWithMatchInfo
      : links;
    this._timeline = this.createTimeline(linksForTimeline);
    this._timelineElement.appendChild(this._timeline);
    return this;
  }

  createHistogram(nodes) {
    const barData = nodes.map(node => ({
      name: node.name,
      size: node.size || 0,
      matched: node.matched ?? true
    }));
    console.log("nodes passed to createHistogram:", nodes);
    console.log("barData passed to createHistogram:", barData);
    return plot(
      barY(barData, {
        x: "name",
        y: "size",
        fill: "steelblue",
        // only highlight matched ones if you want them dimmer
        opacity: barData.map(d => d.matched ? 1 : 0.2)
      }),
      width(1000),
      height(200),
      xScale("band"),
      yScale("linear"),
      padding(0.1)
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
  
    return plot(
      barY(barData, { x: "date", y: "width", fill: "steelblue", opacity: barData.map(d => d.matched ? 1 : 0.2) }),
      width(1000),
      height(200),
      xScale("band"),
      yScale("linear"),
      padding(0.1)
    );
  }

  /** Configuration Methods */
  setConfig(config) {
    this._cosmograph.setConfig(config);
    return this;
  }

  setZoomLevel(value, duration = 0) {
    this._cosmograph.setZoomLevel(value, duration);
  }

  /** Node Methods */
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

  /** Zooming Methods */
  fitView(duration = 250) {
    this._cosmograph.fitView(duration);
  }

  fitViewByNodeIds(ids, duration = 250) {
    this._cosmograph.fitViewByNodeIds(ids, duration);
  }

  zoomToNode(node) {
    this._cosmograph.zoomToNode(node);
  }

  getZoomLevel() {
    return this._cosmograph.getZoomLevel();
  }

  /** Timeline Control */
  playTimelineAnimation() {
    this._timeline.playAnimation();
  }

  pauseTimelineAnimation() {
    this._timeline.pauseAnimation();
  }

  stopTimelineAnimation() {
    this._timeline.stopAnimation();
  }

  setTimelineSelection(range) {
    this._timeline.setSelection(range);
  }

  /** Simulation Methods */
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

  /** Event Handlers */
  onClick(clickedNode, index, position, event) {
    console.log(`Clicked on node ${clickedNode?.id || 'empty space'}`);
  }

  onZoom(event) {
    console.log('Zoom event:', event);
  }

  onSimulationEnd() {
    console.log('Simulation ended');
  }

  /** Query and Update Handling */
  requestQuery(query) {
    const q = query || this.query();
    return this._coordinator.requestQuery(this, q).then((data) => {
      this.setData(data.nodes, data.links);
    });
  }

  requestUpdate() {
    this._requestUpdate();
  }

  /** Destroy Graph */
  remove() {
    this._cosmograph.remove();
    console.log('Graph instance destroyed');
  }
}