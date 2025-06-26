import { Selection, coordinator, wasmConnector } from '@uwdata/mosaic-core';
import { loadCSV } from '@uwdata/mosaic-sql';
import { CosmographClient } from '../../../packages/graph_component/cosmoClient.js';

async function init() {
    const wasm = await wasmConnector({ log: false });
    coordinator().databaseConnector(wasm);

    await coordinator().exec(
        loadCSV("football_matches", `${window.location}football_matches.csv`)
    );
    // const matches = await coordinator().query(`SELECT * FROM matches`).then(res => res.toArray());


    const selection = Selection.intersect();
    // const container = document.getElementById('cosmograph-container');
    const graphDiv  = document.getElementById('graph');
    const labelsDiv = document.getElementById('labels');
    const cosmographClient = new CosmographClient(
        { 
            graphContainer: graphDiv, 
            labelsContainer: labelsDiv
        },
        {
            // view: result.view,
            table: "football_matches",
            dataset: "table",
            filter: selection,
            nodeConfig: {
                color: '#ffffff', 
                size: 5  
            },
            linkConfig: {
                width: 3,
                linkColor: (link_color) => {
                    switch (link_color) {
                        case 'win': return '#00ff00';
                        case 'lose': return '#ff0000';
                        case 'draw': return '#ffff00';
                        default: return '#b3b3b3';
                    }
                }
            }
        }
    );

    coordinator().connect(cosmographClient);
    //setTimeout(() => cosmographClient.start(), 1000)
    //cosmographClient.start();
}

init();
