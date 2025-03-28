import { Selection, coordinator, wasmConnector } from '@uwdata/mosaic-core';
import { loadCSV } from '@uwdata/mosaic-sql';
import { CosmographClient } from './cosmo.js';

async function init() {
    const wasm = await wasmConnector({ log: false });
    coordinator().databaseConnector(wasm);

    await coordinator().exec(
        loadCSV("matches", `${window.location}match.csv`)
    );
    const matches = await coordinator().query(`SELECT * FROM matches`).then(res => res.toArray());


    const selection = Selection.intersect();
    
    const container = document.getElementById('cosmograph-container');
    const cosmographClient = new CosmographClient(
        { 
            container
        },
        {
            // view: result.view,
            table: "matches",
            dataset: "table",
            selection: selection,
        }
    );

    function extractGraphData(matches) {
        const nodeSet = new Set();
        const links = matches.map(match => {
            nodeSet.add(match.source);
            nodeSet.add(match.target);
            
            return {
                source: match.source,
                target: match.target,
                result: match.result,
                date: match.date
            };
        });
        // const nodes = Array.from(nodeSet).map(player => ({ id: player }));  
        const nodeList = Array.from(nodeSet);
        
        // Helper to generate random color (you can make this more consistent if needed)
        function getColor(index) {
            const hue = (index * 137.508) % 360; // Golden angle for distribution
            return `hsl(${hue}, 70%, 50%)`;
        }

        const nodes = nodeList.map((player, index) => ({
            id: player,
            color: getColor(index)
        }));
        return { nodes, links };
    }
    
    const { nodes, links } = extractGraphData(matches);

    // coordinator().connect(cosmographClient);
    cosmographClient.setData(nodes, links);
}

init();
