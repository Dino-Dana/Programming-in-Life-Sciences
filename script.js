// ================================
// FETCH GENE–STATEMENT DATA
// ================================

// Asynchronous function that loads all genes associated with a disease
// diseaseID = the Wikidata ID for a disease (example: Alzheimer’s = Q11081)
async function fetchGeneData(diseaseID) {

    // Wikidata SPARQL API endpoint
    const endpoint = "https://query.wikidata.org/sparql";

    // SPARQL query:
    // - ?gene wdt:P2293 wd:disease → genes genetically associated with the disease
    // - ?gene ?p ?o → retrieve all direct statements about each gene
    // - FILTER(...) ensures we only count direct Wikidata properties
    // - COUNT(?p) counts how many statements each gene has
    // - SERVICE wikibase:label fetches readable English labels
    const query = `
    SELECT ?gene ?geneLabel (COUNT(?p) AS ?statementCount)
    WHERE {
      ?gene wdt:P2293 wd:${diseaseID}.
      ?gene ?p ?o .
      FILTER(STRSTARTS(STR(?p), "http://www.wikidata.org/prop/direct/"))
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    GROUP BY ?gene ?geneLabel
    ORDER BY DESC(?statementCount)
    `;

    // Build the final request URL (encoded query + format = JSON)
    const url = endpoint + "?query=" + encodeURIComponent(query) + "&format=json";

    // Ask Wikidata for the data, requesting JSON output
    const res = await fetch(url, { headers: { "Accept": "application/sparql-results+json" } });

    // Convert the raw HTTP response into a usable JS object
    const json = await res.json();

    // Convert each SPARQL row into { gene: "NAME", count: 123 }
    return json.results.bindings.map(x => ({
        gene: x.geneLabel.value,
        count: parseInt(x.statementCount.value)
    }));
}



// ================================
// PLOT BAR CHART
// ================================

// Draws a bar chart using Chart.js
// canvasId      → the <canvas> element ID
// datasetLabel  → title that appears in the chart
// data          → array of objects like { gene: "...", count: 123 }
function plotChart(canvasId, datasetLabel, data) {

    // Get the drawing context from the canvas
    const ctx = document.getElementById(canvasId).getContext("2d");

    new Chart(ctx, {
        type: "bar", // bar chart
        data: {
            labels: data.map(x => x.gene),  // gene names along the X-axis
            datasets: [{
                label: datasetLabel,
                data: data.map(x => x.count), // number of statements per gene
                backgroundColor: "#ff4fa3",
                borderColor: "#b1005a",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false } // only one dataset → hide legend
            },
            scales: {
                y: { beginAtZero: true }
            },

            // Clicking a bar opens that gene on GeneCards (SNP section)
            onClick: (evt, elements) => {
                if (elements.length > 0) {
                    const chart = elements[0].element.$context.chart;
                    const index = elements[0].index;
                    const geneName = chart.data.labels[index];

                    const url = `https://www.genecards.org/cgi-bin/carddisp.pl?gene=${geneName}#snp`;
                    window.open(url, "_blank");
                }
            }
        }
    });
}



// ================================
// FETCH NETWORK DATA
// ================================

// Fetches protein–protein interaction data for all genes associated with a disease
// diseaseID  → Wikidata disease ID
// containerID → ID of the <div> where the graph will appear
async function fetchNetwork(diseaseID, containerID) {

    const endpoint = "https://query.wikidata.org/sparql";

    // SPARQL query:
    // - Genes associated with disease (P2293)
    // - Genes encode proteins (P688)
    // - Proteins that physically interact (P129)
    // - Filter prevents self-loops and duplicate A–B/B–A edges
    const query = `
    SELECT DISTINCT ?p1Label ?p2Label
    WHERE {
      ?gene wdt:P2293 wd:${diseaseID} .
      ?gene wdt:P688 ?p1 .
      ?p1 wdt:P129 ?p2 .
      FILTER(?p1 != ?p2)
      FILTER(STR(?p1) < STR(?p2))
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    ORDER BY ?p1Label ?p2Label
    `;

    // Send the query and parse the JSON response
    const res = await fetch(
        endpoint + "?query=" + encodeURIComponent(query) + "&format=json",
        { headers: { "Accept": "application/sparql-results+json" } }
    );
    const raw = await res.json();

    // Maps make it easy to store unique proteins (nodes) and unique edges
    const nodes = new Map();
    const edges = new Map();

    // Convert each row into node and edge definitions
    raw.results.bindings.forEach(r => {
        const p1 = r.p1Label.value;
        const p2 = r.p2Label.value;

        // Add both proteins as nodes (if not already added)
        nodes.set(p1, { id: p1, label: p1 });
        nodes.set(p2, { id: p2, label: p2 });

        // Unique edge key ensures undirected duplicates are removed
        const key = [p1, p2].sort().join("__");
        edges.set(key, { from: p1, to: p2 });
    });

    // Draw the network with Vis.js
    drawNetwork(containerID, [...nodes.values()], [...edges.values()]);
}



// ================================
// DRAW NETWORK
// ================================

// Draws an interactive network graph with vis-network
// containerID → the <div> container
// nodes       → array of protein nodes
// edges       → array of protein–protein edges
function drawNetwork(containerID, nodes, edges) {

    // The HTML element that will contain the graph
    const container = document.getElementById(containerID);

    // Wrap nodes/edges into vis-network DataSets
    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    // Visual styling options for the graph
    const options = {
        nodes: {
            shape: "dot",
            size: 15,
            color: "#ff4fa3",
            borderWidth: 2
        },
        edges: {
            color: "#b1005a",
            smooth: true
        }
    };

    // Create the actual network visualization
    new vis.Network(container, data, options);
}



// ================================
// RUN EVERYTHING AUTOMATICALLY
// ================================

// Self-invoking async function:
// Runs immediately when the script loads.
// Steps:
// 1. Fetch gene data for Alzheimer’s & ALS
// 2. Draw two bar charts
// 3. Fetch and draw both protein–protein interaction networks
(async () => {

    // Download gene/statement data
    const alzData = await fetchGeneData("Q11081");   // Alzheimer’s
    const alsData = await fetchGeneData("Q131755");  // ALS

    // Draw bar charts
    plotChart("alzChart", "Alzheimer’s Gene Statement Counts", alzData);
    plotChart("alsChart", "ALS Gene Statement Counts", alsData);

    // Draw PPI networks
    fetchNetwork("Q11081", "alzNetwork");
    fetchNetwork("Q131755", "alsNetwork");

})();
