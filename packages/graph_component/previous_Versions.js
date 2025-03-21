// // import { 
// //   Cosmograph, 
// //   CosmographHistogram, 
// //   CosmographSearch, 
// //   CosmographTimeline 
// // } from '@cosmograph/cosmograph';
// // import { throttle } from '../core/src/util/throttle.js';
// // import * as vg from '@uwdata/vgplot';
// // import { Param, Selection } from '@uwdata/mosaic-core';
// // import { nodes as allNodes, links as allLinks } from '../graph_component/dummy_data.js';

// // export class CosmographClient {
// //   constructor(targetElement, histogramElement, searchElement, timelineElement) {
// //     // Create containers for all components
// //     this._element = targetElement || document.createElement('div');
// //     this._histogramElement = histogramElement || document.createElement('div');
// //     this._searchElement = searchElement || document.createElement('div');
// //     this._timelineElement = timelineElement || document.createElement('div');

// //     document.body.appendChild(this._element);
// //     document.body.appendChild(this._histogramElement);
// //     document.body.appendChild(this._searchElement);
// //     document.body.appendChild(this._timelineElement);

// //     // Initialize the main Cosmograph instance
// //     this._cosmograph = new Cosmograph(this._element, {
// //       nodeColor: (node) => node.color || '#b3b3b3',
// //       nodeSize: (node) => node.size || 4,
// //       linkWidth: (link) => link.width || 1,
// //       linkColor: (link) => link.color || '#b3b3b3',
// //       renderHoveredNodeRing: true,
// //       hoveredNodeRingColor: 'red',
// //       focusedNodeRingColor: 'yellow',
// //       showDynamicLabels: true,
// //       backgroundColor: '#222222',
// //     });

// //     this._allNodes = allNodes;
// //     this._allLinks = allLinks;
// //     this._searchHighlightSelection = new Selection();
// //     // const $brush = Selection.single();
// //     // Initialize the Histogram component
// //     this._histogram = this.createHistogram(this._allNodes);
// //     this._histogramElement.appendChild(this._histogram);

// //     // add listener to highlight selection
// //     this._searchHighlightSelection.addEventListener('value', (clause) => {
// //       console.log('Histogram selection:', clause);
// //       const clickedNames = clause[0];
// //       console.log('Clicked names:', clickedNames);
// //       const filteredNodes = this._allNodes.filter(n => clickedNames.includes(n.name));
// //       const filteredLinks = this._allLinks.filter(
// //         l => filteredNodes.some(fn => fn.id === l.source || fn.id === l.target)
// //       );
// //       this._cosmograph.setData(filteredNodes, filteredLinks);
// //     });

// //     // Initialize the Search component
// //     this._searchParam = new Param();
// //     this._search = vg.search({
// //       element: this._searchElement,
// //       label: 'Search Nodes',
// //       type: 'contains',
// //       as: this._searchParam
// //     });

// //     this._searchParam.addEventListener('value', (value) => {
// //       if (!this._exactSearchTriggered) {
// //         const filtered = this.filterData(value);
// //         this.updateHighlightSelection(filtered.allNodesWithMatchInfo);
// //         this.setData(
// //           filtered.nodes, 
// //           filtered.links, 
// //           filtered.allNodesWithMatchInfo, 
// //           filtered.allLinksWithMatchInfo
// //         );
// //       }
// //       this._exactSearchTriggered = false;
// //     });
    
// //     this._enterButton = document.createElement('button');
// //     this._enterButton.textContent = 'Exact Search';
// //     this._searchElement.appendChild(this._enterButton);
// //     this._enterButton.addEventListener('click', () => {
// //       const value = this._searchParam.value;
// //       const filtered = this.filterDataExact(value);
// //       this.updateHighlightSelection(filtered.allNodesWithMatchInfo);
// //       this.setData(
// //         filtered.nodes, 
// //         filtered.links, 
// //         filtered.allNodesWithMatchInfo, 
// //         filtered.allLinksWithMatchInfo
// //       );
// //     });

// //     // Initialize the Timeline component
// //     this._timeline = this.createTimeline(this._allLinks);
// //     this._timelineElement.appendChild(this._timeline);

// //     // Throttle updates for performance optimization
// //     this._requestUpdate = throttle(() => this.requestQuery(), true);

// //     // Attach event handlers
// //     this._cosmograph.onClick = this.onClick.bind(this);
// //     this._cosmograph.onZoom = this.onZoom.bind(this);
// //     this._cosmograph.onSimulationEnd = this.onSimulationEnd.bind(this);
// //     this.setData(this._allNodes, this._allLinks);

// //     this._histogramSelection = new Selection();

// //     // clause passed to extractValues: 
// //     // 0: ['Node 4']
// //     // length: 1
// //     this._histogramSelection.addEventListener('value', (clause) => {
// //       console.log('Histogram selection:', clause);
// //       const clickedNames = clause[0];
// //       console.log('Clicked names:', clickedNames);
// //       const filteredNodes = this._allNodes.filter(n => clickedNames.includes(n.name));
// //       const filteredLinks = this._allLinks.filter(
// //         l => filteredNodes.some(fn => fn.id === l.source || fn.id === l.target)
// //       );
// //       this._cosmograph.setData(filteredNodes, filteredLinks);
// //     });
    
// //     // Initialize timeline selection TODO
// //     this._timelineSelection = new Selection();

// //     this._timelineSelection.addEventListener('value', (clause) => {
// //       console.log('Timeline selection:', clause);
// //       const clickedDates = clause[0]; // Extract clicked dates
// //       console.log('Clicked dates:', clickedDates);

// //       // Filter links that match selected dates
// //       const filteredLinks = this._allLinks.filter(l => clickedDates.includes(l.date));

// //       // Extract all nodes that are part of the filtered links
// //       const filteredNodeIds = new Set(
// //         filteredLinks.flatMap(l => [l.source, l.target])
// //       );
// //       const filteredNodes = this._allNodes.filter(n => filteredNodeIds.has(n.id));

// //       // Update Cosmograph with filtered nodes and links
// //       this._cosmograph.setData(filteredNodes, filteredLinks);
// //     });

// //   }
  
// //   filterData(searchValue) {
// //     const lowerSearch = (searchValue || '').toLowerCase();
// //     const matchedIds = new Set(
// //       this._allNodes
// //         .filter(n => n.name.toLowerCase().includes(lowerSearch))
// //         .map(n => n.id)
// //     );
    
// //     const filteredNodes = this._allNodes.filter(n => matchedIds.has(n.id));
// //     const filteredLinks = this._allLinks.filter(
// //       l => matchedIds.has(l.source) && matchedIds.has(l.target)
// //     );

// //     const allNodesWithMatchInfo = this._allNodes.map(n => ({
// //       ...n,
// //       matched: matchedIds.has(n.id)
// //     }));

// //     const allLinksWithMatchInfo = this._allLinks.map(l => ({
// //       ...l,
// //       matched: matchedIds.has(l.source) || matchedIds.has(l.target)
// //     }));

// //     return { 
// //       nodes: filteredNodes, 
// //       links: filteredLinks, 
// //       allNodesWithMatchInfo,
// //       allLinksWithMatchInfo
// //     };
// //   }

// //   updateHighlightSelection(allNodesWithMatchInfo) {
// //     const matchedNames = allNodesWithMatchInfo
// //       .filter(n => n.matched)
// //       .map(n => n.name);
    
// //     const clause = {
// //       type: 'in',
// //       field: 'name',
// //       values: matchedNames
// //     };
// //     // const clause = matchedNames;
// //     console.log('Highlight clause:', clause);
// //     console.log('before update');
// //     console.log('Highlight selection:', this._searchHighlightSelection);
// //     this._searchHighlightSelection.update(clause);
// //     console.log('after update');
// //     // setTimeout(() => {
// //     //   console.log('Highlight selection after update:', this._searchHighlightSelection.value);
// //     //   this._histogramElement.innerHTML = '';
// //     //   this._histogram = this.createHistogram(allNodesWithMatchInfo);
// //     //   this._histogramElement.appendChild(this._histogram);
// //     // }, 50);
// //     // print current highlight selection
// //     console.log('Highlight selection:', this._searchHighlightSelection);
// //   }

// //   // Exact search: returns nodes whose names exactly match the search value
// //   filterDataExact(searchValue) {
// //     if (!searchValue) {
// //       return { nodes: this._allNodes, links: this._allLinks };
// //     }
  
// //     const filteredNodes = this._allNodes.filter(node =>
// //       node.name.toLowerCase() === searchValue.toLowerCase()
// //     );
  
// //     const nodeIds = new Set(filteredNodes.map(node => node.id));
// //     const filteredLinks = this._allLinks.filter(link =>
// //       nodeIds.has(link.source) || nodeIds.has(link.target)
// //     );

// //     const allNodesWithMatchInfo = this._allNodes.map(n => ({
// //       ...n,
// //       matched: nodeIds.has(n.id)
// //     }));

// //     const allLinksWithMatchInfo = this._allLinks.map(l => ({
// //       ...l,
// //       matched: nodeIds.has(l.source) || nodeIds.has(l.target)
// //     }));
  
// //     return { nodes: filteredNodes, links: filteredLinks, allNodesWithMatchInfo, allLinksWithMatchInfo };
// //   }

// //   setData(nodes, links, allNodesWithMatchInfo, allLinksWithMatchInfo) {
// //     this._cosmograph.setData(nodes, links);

// //     this._histogramElement.innerHTML = '';
// //     const nodesForHistogram = allNodesWithMatchInfo && allNodesWithMatchInfo.length
// //       ? allNodesWithMatchInfo
// //       : nodes;
// //     this._histogram = this.createHistogram(nodesForHistogram);
// //     this._histogramElement.appendChild(this._histogram);

// //     this._timelineElement.innerHTML = '';
// //     const linksForTimeline = allLinksWithMatchInfo && allLinksWithMatchInfo.length
// //       ? allLinksWithMatchInfo
// //       : links;
// //     this._timeline = this.createTimeline(linksForTimeline);
// //     this._timelineElement.appendChild(this._timeline);
// //     return this;
// //   }

// //   createHistogram(nodes) {
// //     const barData = nodes.map(node => ({
// //       name: node.name,
// //       size: node.size || 0,
// //     }));
// //     // const $brush = Selection.single();
// //     console.log("nodes passed to createHistogram:", nodes);
// //     console.log("barData passed to createHistogram:", barData);
// //     return vg.plot(
// //       vg.barY(barData, { x: 'name', y: 'size', fill: 'steelblue' }),
// //       vg.highlight({ by: this._searchHighlightSelection, opacity: 0.2 }),
// //       vg.toggle({ as: this._histogramSelection, channels: ['x'] }),
// //       vg.width(1000),
// //       vg.height(200),
// //       vg.xScale('band'),
// //       vg.yScale('linear'),
// //       vg.padding(0.1)
// //     );
// //   }


// //   createTimeline(links) {
// //     const barData = links.map(link => ({
// //       date: new Date(link.date),
// //       width: link.width || 1,
// //       matched: link.matched ?? true
// //     }));
    
// //     // Sort by date to display bars in chronological order
// //     barData.sort((a, b) => a.date - b.date);
  
// //     return vg.plot(
// //       vg.barY(barData, { x: 'date', y: 'width', fill: 'steelblue', opacity: barData.map(d => d.matched ? 1 : 0.2) }),
// //       vg.toggle({ as: this._timelineSelection, channels: ['x'] }),
// //       vg.width(1000),
// //       vg.height(200),
// //       vg.xScale('band'),
// //       vg.yScale('linear'),
// //       vg.padding(0.1)
// //     );
// //   }

// //   /** Configuration Methods */
// //   setConfig(config) {
// //     this._cosmograph.setConfig(config);
// //     return this;
// //   }

// //   setZoomLevel(value, duration = 0) {
// //     this._cosmograph.setZoomLevel(value, duration);
// //   }

// //   /** Node Methods */
// //   selectNode(node, selectAdjacentNodes = false) {
// //     if (selectAdjacentNodes) {
// //       const adjacentNodes = this.getAdjacentNodes(node.id);
// //       this._cosmograph.selectNodes([node, ...adjacentNodes]);
// //     } else {
// //       this._cosmograph.selectNode(node);
// //     }
// //   }

// //   unselectNodes() {
// //     this._cosmograph.unselectNodes();
// //   }

// //   focusNode(node) {
// //     this._cosmograph.focusNode(node);
// //   }

// //   getAdjacentNodes(id) {
// //     return this._cosmograph.getAdjacentNodes(id);
// //   }

// //   getSelectedNodes() {
// //     return this._cosmograph.getSelectedNodes();
// //   }

// //   getNodePositions() {
// //     return this._cosmograph.getNodePositions();
// //   }

// //   /** Zooming Methods */
// //   fitView(duration = 250) {
// //     this._cosmograph.fitView(duration);
// //   }

// //   fitViewByNodeIds(ids, duration = 250) {
// //     this._cosmograph.fitViewByNodeIds(ids, duration);
// //   }

// //   /** Simulation Methods */
// //   start(alpha = 1) {
// //     this._cosmograph.start(alpha);
// //   }

// //   pause() {
// //     this._cosmograph.pause();
// //   }

// //   restart() {
// //     this._cosmograph.restart();
// //   }

// //   isSimulationRunning() {
// //     return this._cosmograph.isSimulationRunning;
// //   }

// //   /** Event Handlers */
// //   onClick(clickedNode, index, position, event) {
// //     console.log(`Clicked on node ${clickedNode?.id || 'empty space'}`);
// //   }

// //   onZoom(event) {
// //     console.log('Zoom event:', event);
// //   }

// //   onSimulationEnd() {
// //     console.log('Simulation ended');
// //   }

// //   /** Query and Update Handling */
// //   requestQuery(query) {
// //     const q = query || this.query();
// //     return this._coordinator.requestQuery(this, q).then((data) => {
// //       this.setData(data.nodes, data.links);
// //     });
// //   }

// //   requestUpdate() {
// //     this._requestUpdate();
// //   }

// //   /** Destroy Graph */
// //   remove() {
// //     this._cosmograph.remove();
// //     console.log('Graph instance destroyed');
// //   }
// // }

// import { 
//   Cosmograph, 
//   CosmographHistogram, 
//   CosmographSearch, 
//   CosmographTimeline 
// } from '@cosmograph/cosmograph';
// import { throttle } from '../core/src/util/throttle.js';
// import * as vg from '@uwdata/vgplot';
// import { Param, Selection, clausePoints } from '@uwdata/mosaic-core'; // Added clausePoints
// import { nodes as allNodes, links as allLinks } from '../graph_component/dummy_data.js';

// export class CosmographClient {
//   constructor(targetElement, histogramElement, searchElement, timelineElement) {
//     this._element = targetElement || document.createElement('div');
//     this._histogramElement = histogramElement || document.createElement('div');
//     this._searchElement = searchElement || document.createElement('div');
//     this._timelineElement = timelineElement || document.createElement('div');

//     document.body.appendChild(this._element);
//     document.body.appendChild(this._histogramElement);
//     document.body.appendChild(this._searchElement);
//     document.body.appendChild(this._timelineElement);

//     this._cosmograph = new Cosmograph(this._element, {
//       nodeColor: (node) => node.color || '#b3b3b3',
//       nodeSize: (node) => node.size || 4,
//       linkWidth: (link) => link.width || 1,
//       linkColor: (link) => link.color || '#b3b3b3',
//       renderHoveredNodeRing: true,
//       hoveredNodeRingColor: 'red',
//       focusedNodeRingColor: 'yellow',
//       showDynamicLabels: true,
//       backgroundColor: '#222222',
//     });

//     this._allNodes = allNodes;
//     this._allLinks = allLinks;
//     this._searchHighlightSelection = new Selection();

//     // Initialize histogram once
//     this._histogramData = this._allNodes.map(node => ({
//       name: node.name,
//       size: node.size || 0,
//       matched: true // Initially all matched
//     }));
//     this._histogram = this.createHistogram(this._histogramData);
//     this._histogramElement.appendChild(this._histogram);

//     // Initialize search
//     this._searchParam = new Param();
//     this._search = vg.search({
//       element: this._searchElement,
//       label: 'Search Nodes',
//       type: 'contains',
//       as: this._searchParam
//     });

//     this._searchParam.addEventListener('value', (value) => {
//       if (!this._exactSearchTriggered) {
//         const filtered = this.filterData(value);
//         this.updateHighlightSelection(filtered.allNodesWithMatchInfo);
//         console.log('Filtered nodes:', filtered.nodes);
//         this.setData(
//           filtered.nodes, 
//           filtered.links, 
//           filtered.allNodesWithMatchInfo, 
//           filtered.allLinksWithMatchInfo
//         );
//         console.log('Filtered nodes finishednjn');
//       }
//       this._exactSearchTriggered = false;
//     });

//     this._enterButton = document.createElement('button');
//     this._enterButton.textContent = 'Exact Search';
//     this._searchElement.appendChild(this._enterButton);
//     this._enterButton.addEventListener('click', () => {
//       const value = this._searchParam.value;
//       const filtered = this.filterDataExact(value);
//       this.updateHighlightSelection(filtered.allNodesWithMatchInfo);
//       this.setData(
//         filtered.nodes, 
//         filtered.links, 
//         filtered.allNodesWithMatchInfo, 
//         filtered.allLinksWithMatchInfo
//       );
//     });

//     // Initialize timeline once
//     this._timelineData = this._allLinks.map(link => ({
//       date: new Date(link.date),
//       width: link.width || 1,
//       matched: true
//     }));
//     this._timeline = this.createTimeline(this._timelineData);
//     this._timelineElement.appendChild(this._timeline);

//     this._requestUpdate = throttle(() => this.requestQuery(), true);
//     this._cosmograph.onClick = this.onClick.bind(this);
//     this._cosmograph.onZoom = this.onZoom.bind(this);
//     this._cosmograph.onSimulationEnd = this.onSimulationEnd.bind(this);
//     this.setData(this._allNodes, this._allLinks);

//     this._histogramSelection = new Selection();
//     this._histogramSelection.addEventListener('value', (clause) => {
//       console.log('Histogram selection:', clause);
//       const clickedNames = clause[0];
//       console.log('Clicked names:', clickedNames);
//       const filteredNodes = this._allNodes.filter(n => clickedNames.includes(n.name));
//       const filteredLinks = this._allLinks.filter(
//         l => filteredNodes.some(fn => fn.id === l.source || fn.id === l.target)
//       );
//       this._cosmograph.setData(filteredNodes, filteredLinks);
//     });

//     this._timelineSelection = new Selection();
//     this._timelineSelection.addEventListener('value', (clause) => {
//       console.log('Timeline selection:', clause);
//       const clickedDates = clause[0];
//       console.log('Clicked dates:', clickedDates);
//       const filteredLinks = this._allLinks.filter(l => clickedDates.includes(l.date));
//       const filteredNodeIds = new Set(filteredLinks.flatMap(l => [l.source, l.target]));
//       const filteredNodes = this._allNodes.filter(n => filteredNodeIds.has(n.id));
//       this._cosmograph.setData(filteredNodes, filteredLinks);
//     });
//   }

//   filterData(searchValue) {
//     const lowerSearch = (searchValue || '').toLowerCase();
//     const matchedIds = new Set(
//       this._allNodes
//         .filter(n => n.name.toLowerCase().includes(lowerSearch))
//         .map(n => n.id)
//     );
    
//     const filteredNodes = this._allNodes.filter(n => matchedIds.has(n.id));
//     const filteredLinks = this._allLinks.filter(
//       l => matchedIds.has(l.source) && matchedIds.has(l.target)
//     );

//     const allNodesWithMatchInfo = this._allNodes.map(n => ({
//       ...n,
//       matched: matchedIds.has(n.id)
//     }));

//     const allLinksWithMatchInfo = this._allLinks.map(l => ({
//       ...l,
//       matched: matchedIds.has(l.source) || matchedIds.has(l.target)
//     }));

//     return { 
//       nodes: filteredNodes, 
//       links: filteredLinks, 
//       allNodesWithMatchInfo,
//       allLinksWithMatchInfo
//     };
//   }

//   updateHighlightSelection(allNodesWithMatchInfo) {
//     const matchedNames = allNodesWithMatchInfo
//       .filter(n => n.matched)
//       .map(n => n.name);

//     const fields = ['name'];
//     const value = matchedNames.map(name => [name]);
//     const clause = clausePoints(fields, value, { source: this });

//     console.log('Highlight clause:', clause);
//     console.log('Before update, Highlight selection:', this._searchHighlightSelection.value);

//     this._searchHighlightSelection.update(clause);

//     console.log('After update, Highlight selection:', this._searchHighlightSelection.value);

//     // Update histogram data
//     this._histogramElement.innerHTML = '';
//     this._histogram = this.createHistogram(allNodesWithMatchInfo);
//     this._histogramElement.appendChild(this._histogram);
//     // console.log('HigSNIJDBOHBEUFBUBIHIBHIOBFEBIBOBHUOBHOBOHO');
//   }

//   filterDataExact(searchValue) {
//     if (!searchValue) {
//       return { nodes: this._allNodes, links: this._allLinks };
//     }
  
//     const filteredNodes = this._allNodes.filter(node =>
//       node.name.toLowerCase() === searchValue.toLowerCase()
//     );
  
//     const nodeIds = new Set(filteredNodes.map(node => node.id));
//     const filteredLinks = this._allLinks.filter(link =>
//       nodeIds.has(link.source) || nodeIds.has(link.target)
//     );

//     const allNodesWithMatchInfo = this._allNodes.map(n => ({
//       ...n,
//       matched: nodeIds.has(n.id)
//     }));

//     const allLinksWithMatchInfo = this._allLinks.map(l => ({
//       ...l,
//       matched: nodeIds.has(l.source) || nodeIds.has(l.target)
//     }));
  
//     return { nodes: filteredNodes, links: filteredLinks, allNodesWithMatchInfo, allLinksWithMatchInfo };
//   }

//   setData(nodes, links, allNodesWithMatchInfo, allLinksWithMatchInfo) {
//     this._cosmograph.setData(nodes, links);

//     // Update histogram data
//     const nodesForHistogram = allNodesWithMatchInfo && allNodesWithMatchInfo.length
//       ? allNodesWithMatchInfo
//       : nodes;
//     this._histogramElement.innerHTML = '';
//     this._histogram = this.createHistogram(nodesForHistogram);
//     this._histogramElement.appendChild(this._histogram);

//     // Update timeline data
//     const linksForTimeline = allLinksWithMatchInfo && allLinksWithMatchInfo.length
//       ? allLinksWithMatchInfo
//       : links;
//     this._timelineElement.innerHTML = '';
//     const timelineData = linksForTimeline.map(link => ({
//       date: new Date(link.date),
//       width: link.width || 1,
//       matched: link.matched ?? true
//     }));
//     this._timeline = this.createTimeline(timelineData);
//     this._timelineElement.appendChild(this._timeline);

//     return this;
//   }

//   createHistogram(nodes) {
//     const barData = nodes.map(node => ({
//       name: node.name,
//       size: node.size || 0,
//     }));
//     return vg.plot(
//       vg.barY(barData, { 
//         x: 'name', 
//         y: 'size', 
//         fill: 'steelblue',
//         opacity: 1 // Set base opacity to 1
//       }),
//       // console.log('Highlight selection:', this._searchHighlightSelection),
//       vg.highlight({ by: this._searchHighlightSelection, opacity: 0.2 }),
//       // console.log('Highlight selection finished'),
//       vg.toggle({ as: this._histogramSelection, channels: ['x'] }),
//       vg.width(1000),
//       vg.height(200),
//       vg.xScale('band'),
//       vg.yScale('linear'),
//       vg.padding(0.1)
//     );
//   }

//   createTimeline(links) {
//     const barData = links.map(link => ({
//       date: new Date(link.date),
//       width: link.width || 1,
//       matched: link.matched ?? true
//     }));
    
//     // Sort by date to display bars in chronological order
//     barData.sort((a, b) => a.date - b.date);
  
//     return vg.plot(
//       vg.barY(barData, { x: 'date', y: 'width', fill: 'steelblue', opacity: barData.map(d => d.matched ? 1 : 0.2) }),
//       vg.toggle({ as: this._timelineSelection, channels: ['x'] }),
//       vg.width(1000),
//       vg.height(200),
//       vg.xScale('band'),
//       vg.yScale('linear'),
//       vg.padding(0.1)
//     );
//   }

//   // Rest of the methods remain unchanged...

//   setConfig(config) {
//     this._cosmograph.setConfig(config);
//     return this;
//   }

//   setZoomLevel(value, duration = 0) {
//     this._cosmograph.setZoomLevel(value, duration);
//   }

//   selectNode(node, selectAdjacentNodes = false) {
//     if (selectAdjacentNodes) {
//       const adjacentNodes = this.getAdjacentNodes(node.id);
//       this._cosmograph.selectNodes([node, ...adjacentNodes]);
//     } else {
//       this._cosmograph.selectNode(node);
//     }
//   }

//   unselectNodes() {
//     this._cosmograph.unselectNodes();
//   }

//   focusNode(node) {
//     this._cosmograph.focusNode(node);
//   }

//   getAdjacentNodes(id) {
//     return this._cosmograph.getAdjacentNodes(id);
//   }

//   getSelectedNodes() {
//     return this._cosmograph.getSelectedNodes();
//   }

//   getNodePositions() {
//     return this._cosmograph.getNodePositions();
//   }

//   fitView(duration = 250) {
//     this._cosmograph.fitView(duration);
//   }

//   fitViewByNodeIds(ids, duration = 250) {
//     this._cosmograph.fitViewByNodeIds(ids, duration);
//   }

//   start(alpha = 1) {
//     this._cosmograph.start(alpha);
//   }

//   pause() {
//     this._cosmograph.pause();
//   }

//   restart() {
//     this._cosmograph.restart();
//   }

//   isSimulationRunning() {
//     return this._cosmograph.isSimulationRunning;
//   }

//   onClick(clickedNode, index, position, event) {
//     console.log(`Clicked on node ${clickedNode?.id || 'empty space'}`);
//   }

//   onZoom(event) {
//     console.log('Zoom event:', event);
//   }

//   onSimulationEnd() {
//     console.log('Simulation ended');
//   }

//   requestQuery(query) {
//     const q = query || this.query();
//     return this._coordinator.requestQuery(this, q).then((data) => {
//       this.setData(data.nodes, data.links);
//     });
//   }

//   requestUpdate() {
//     this._requestUpdate();
//   }

//   remove() {
//     this._cosmograph.remove();
//     console.log('Graph instance destroyed');
//   }
// }