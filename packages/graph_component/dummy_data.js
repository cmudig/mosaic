const randomIntFromInterval = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const getRandDate = () => {
    return new Date(randomIntFromInterval(0, 10000000));
};

export const nodes = [
    { id: '1', name: 'Node 1', size: 10, color: '#ff0000', time: 1 },
    { id: '2', name: 'Node 2', size: 20, color: '#00ff00', time: 2 },
    { id: '3', name: 'Node 3', size: 15, color: '#0000ff', time: 3 },
    { id: '4', name: 'Node 4', size: 25, color: '#ffff00', time: 4 },
];

export const links = [
    { source: '1', target: '2', width: 1, color: '#ff0000', date: new Date("2025-02-13T06:00:00Z") },  
    { source: '2', target: '3', width: 2, color: '#00ff00', date: new Date("2025-02-13T10:00:00Z") },  
    { source: '3', target: '4', width: 3, color: '#0000ff', date: new Date("2025-02-13T15:00:00Z") },  
    { source: '4', target: '1', width: 4, color: '#ffff00', date: new Date("2025-02-13T20:00:00Z") },
];
