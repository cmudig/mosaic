const randomIntFromInterval = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const getRandDate = () => {
    return new Date(randomIntFromInterval(0, 10000000));
};

export const nodes = [
    { id: '1', name: 'Node 1', size: 1, color: '#ff0000', value: 1 },
    { id: '2', name: 'Node 2', size: 2, color: '#00ff00', value: 2 },
    { id: '3', name: 'Node 3', size: 1.5, color: '#0000ff', value: 1.5 },
    { id: '4', name: 'Node 4', size: 2.5, color: '#ffff00', value: 2.5 },
    { id: '5', name: 'Node 5', size: 1.8, color: '#ff00ff', value: 1.8 },
    { id: '6', name: 'Node 6', size: 1.2, color: '#00ffff', value: 1.2 },
    { id: '7', name: 'Node 7', size: 2.2, color: '#ff8800', value: 2.2 },
    { id: '8', name: 'Node 8', size: 3.0, color: '#8800ff', value: 3.0 },
    { id: '9', name: 'Node 9', size: 1.7, color: '#008800', value: 1.7 },
    { id: '10', name: 'Node 10', size: 2.4, color: '#000088', value: 2.4 },
    { id: '11', name: 'Node 11', size: 1.4, color: '#888888', value: 1.4 },
    { id: '12', name: 'Node 12', size: 2.1, color: '#ff4488', value: 2.1 },
    { id: '13', name: 'Node 13', size: 2.8, color: '#4488ff', value: 2.8 },
    { id: '14', name: 'Node 14', size: 1.9, color: '#88ff44', value: 1.9 },
    { id: '15', name: 'Node 15', size: 2.3, color: '#4444ff', value: 2.3 },
    { id: '16', name: 'Node 16', size: 2.6, color: '#ff4444', value: 2.6},
    { id: '17', name: 'Node 17', size: 1.3, color: '#44ff88', value: 1.3 },
    { id: '18', name: 'Node 18', size: 1.6, color: '#8888ff', value: 1.6 },
    { id: '19', name: 'Node 19', size: 2.9, color: '#ff8888', value: 2.9 },
    { id: '20', name: 'Node 20', size: 1.1, color: '#88ff88', value: 1.1 },
];

export const links = [
    { source: '1', target: '2', width: 1, color: '#ff0000', date: new Date("2025-02-13T06:00:00Z") },  
    { source: '2', target: '3', width: 2, color: '#00ff00', date: new Date("2025-02-13T10:00:00Z") },  
    { source: '3', target: '4', width: 3, color: '#0000ff', date: new Date("2025-02-13T15:00:00Z") },  
    { source: '4', target: '5', width: 4, color: '#ffff00', date: new Date("2025-02-13T20:00:00Z") },
    { source: '5', target: '6', width: 2, color: '#ff00ff', date: new Date("2025-02-14T02:00:00Z") },
    { source: '6', target: '7', width: 3, color: '#00ffff', date: new Date("2025-02-14T06:00:00Z") },
    { source: '7', target: '8', width: 4, color: '#ff8800', date: new Date("2025-02-14T10:00:00Z") },
    { source: '8', target: '9', width: 1, color: '#8800ff', date: new Date("2025-02-14T14:00:00Z") },
    { source: '9', target: '10', width: 2, color: '#008800', date: new Date("2025-02-14T18:00:00Z") },
    { source: '10', target: '11', width: 3, color: '#000088', date: new Date("2025-02-14T22:00:00Z") },
    { source: '11', target: '12', width: 4, color: '#888888', date: new Date("2025-02-15T02:00:00Z") },
    { source: '12', target: '13', width: 1, color: '#ff4488', date: new Date("2025-02-15T06:00:00Z") },
    { source: '13', target: '14', width: 2, color: '#4488ff', date: new Date("2025-02-15T10:00:00Z") },
    { source: '14', target: '15', width: 3, color: '#88ff44', date: new Date("2025-02-15T14:00:00Z") },
    { source: '15', target: '16', width: 4, color: '#4444ff', date: new Date("2025-02-15T18:00:00Z") },
    { source: '16', target: '17', width: 2, color: '#ff4444', date: new Date("2025-02-15T22:00:00Z") },
    { source: '17', target: '18', width: 3, color: '#44ff88', date: new Date("2025-02-16T02:00:00Z") },
    { source: '18', target: '19', width: 4, color: '#8888ff', date: new Date("2025-02-16T06:00:00Z") },
    { source: '19', target: '20', width: 1, color: '#ff8888', date: new Date("2025-02-16T10:00:00Z") },
    { source: '20', target: '1', width: 2, color: '#88ff88', date: new Date("2025-02-16T14:00:00Z") },
];
