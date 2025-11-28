// ================================
// FETCH GENE–STATEMENT DATA
// ================================
async function fetchGeneData(diseaseID) {
   const endpoint = "https://query.wikidata.org/sparql";
   const query = `
   SELECT ?gene ?geneLabel (COUNT(?p) AS ?statementCount)
   WHERE {
     ?gene wdt:P2293 wd:${diseaseID} .
     ?gene ?p ?o .
     FILTER(STRSTARTS(STR(?p), "http://www.wikidata.org/prop/direct/"))
     SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
   }
   GROUP BY ?gene ?geneLabel
   ORDER BY DESC(?statementCount)
   `;


   const url = endpoint + "?query=" + encodeURIComponent(query) + "&format=json";
   const res = await fetch(url, { headers: { "Accept": "application/sparql-results+json" } });
   const json = await res.json();


   return json.results.bindings.map(x => ({
       gene: x.geneLabel.value,
       count: parseInt(x.statementCount.value)
   }));
}


// ================================
// PLOT BAR CHART
// ================================
function plotChart(canvasId, datasetLabel, data) {
   const ctx = document.getElementById(canvasId).getContext("2d");


   new Chart(ctx, {
       type: "bar",
       data: {
           labels: data.map(x => x.gene),
           datasets: [{
               label: datasetLabel,
               data: data.map(x => x.count),
               backgroundColor: "#ff4fa3",
               borderColor: "#b1005a",
               borderWidth: 1
           }]
       },
       options: {
           responsive: true,
           plugins: {
               legend: { display: false }
           },
           scales: {
               y: { beginAtZero: true }
           }
       }
   });
}

async function fetchNetwork(diseaseID, containerID) {
    const endpoint = "https://query.wikidata.org/sparql";

    const query = `
    SELECT DISTINCT ?p1Label ?p2Label
    WHERE {
      # Alzheimer- or ALS-associated genes
      ?gene wdt:P2293 wd:${diseaseID} .

      # Genes encode proteins
      ?gene wdt:P688 ?p1 .

      # Physical protein–protein interactions
      ?p1 wdt:P129 ?p2 .

      # Remove self-loops
      FILTER(?p1 != ?p2)

      # Remove mirrored duplicates (A–B vs B–A)
      FILTER(STR(?p1) < STR(?p2))

      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    ORDER BY ?p1Label ?p2Label
    `;

    const res = await fetch(endpoint + "?query=" + encodeURIComponent(query) + "&format=json",
        { headers: { "Accept": "application/sparql-results+json" } }
    );
    const raw = await res.json();

    const nodes = new Map();
    const edges = new Map();

    raw.results.bindings.forEach(r => {
        const p1 = r.p1Label.value;
        const p2 = r.p2Label.value;

        nodes.set(p1, { id: p1, label: p1 });
        nodes.set(p2, { id: p2, label: p2 });

        const key = [p1, p2].sort().join("__");
        edges.set(key, { from: p1, to: p2 });
    });

    drawNetwork(containerID, [...nodes.values()], [...edges.values()]);
}


function drawNetwork(containerID, nodes, edges) {
    const container = document.getElementById(containerID);
    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    const options = {
        nodes: {
            shape: "dot",
            size: 15,
            color: "#4f8cff",
            borderWidth: 2
        },
        edges: {
            color: "#0033aa",
            smooth: true
        }
    };

    new vis.Network(container, data, options);
}


// ================================
// RUN EVERYTHING
// =====================
