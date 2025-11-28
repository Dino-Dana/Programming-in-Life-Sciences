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


// ================================
// FETCH NETWORK
// ================================
async function fetchNetwork(diseaseID, containerID) {
   const endpoint = "https://query.wikidata.org/sparql";


   const query = `
   SELECT ?g1Label ?g2Label (COUNT(?otherDisease) AS ?weight)
   WHERE {
     ?g1 wdt:P2293 wd:${diseaseID} .
     ?g2 wdt:P2293 wd:${diseaseID} .
     FILTER(?g1 != ?g2)


     ?g1 wdt:P2293 ?otherDisease .
     ?g2 wdt:P2293 ?otherDisease .


     FILTER(?otherDisease != wd:${diseaseID})


     SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
   }
   GROUP BY ?g1Label ?g2Label
   HAVING (COUNT(?otherDisease) > 0)
   ORDER BY DESC(?weight)
   `;


   const res = await fetch(endpoint + "?query=" + encodeURIComponent(query) + "&format=json",
       { headers: { "Accept": "application/sparql-results+json" } }
   );
   const raw = await res.json();


   const nodes = new Map();
   const edges = new Map();


   raw.results.bindings.forEach(r => {
       const g1 = r.g1Label.value;
       const g2 = r.g2Label.value;
       const w = parseInt(r.weight.value);


       nodes.set(g1, { id: g1, label: g1 });
       nodes.set(g2, { id: g2, label: g2 });


       const key = [g1, g2].sort().join("__");
       edges.set(key, { from: g1, to: g2, value: w, title: `${w} shared diseases` });
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
           color: "#ff4fa3",
           borderWidth: 2
       },
       edges: {
           color: "#b1005a",
           scaling: { min: 1, max: 10 },
           smooth: true
       }
   };


   new vis.Network(container, data, options);
}


// ================================
// RUN EVERYTHING
// ================================
(async () => {
   // Bar charts
   const alzData = await fetchGeneData("Q11081");     // Alzheimer's
   const alsData = await fetchGeneData("Q131755");    // ALS


   plotChart("alzChart", "Alzheimer’s Gene Statement Counts", alzData);
   plotChart("alsChart", "Amyotrophic Lateral Sclerosis (ALS) Gene Statement Counts", alsData);


   // Networks
   fetchNetwork("Q11081", "alzNetwork");
   fetchNetwork("Q131755", "alsNetwork");
})();
