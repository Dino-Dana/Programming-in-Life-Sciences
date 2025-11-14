// app.js

// Asynchronous function to fetch gene-trait data from Wikidata
async function fetchGeneTraitData() {
    const endpointUrl = "https://query.wikidata.org/sparql";

    // SPARQL query: genes associated with trait Q11081 (example trait)
    const query = `
        SELECT ?gene ?geneLabel ?trait ?traitLabel
        WHERE {
          ?gene wdt:P31 wd:Q7187 .       # Items that are genes
          ?gene wdt:P2293 ?trait .       # Genes linked to a trait
          VALUES ?trait { wd:Q11081 }    # Filter only trait Q11081
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
    `;

    const url = endpointUrl + "?query=" + encodeURIComponent(query) + "&format=json";

    try {
        const response = await fetch(url, {
            headers: { "Accept": "application/sparql-results+json" }
        });

        const data = await response.json();

        // Simplify results: keep only gene and trait labels
        return data.results.bindings.map(item => ({
            gene: item.geneLabel.value,
            trait: item.traitLabel.value
        }));

    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}

// Attach event listener to the button
document.getElementById("loadData").addEventListener("click", async () => {
    const outputDiv = document.getElementById("output");

    // Show loading message
    outputDiv.innerHTML = "<p>Loading data...</p>";

    // Fetch data
    const results = await fetchGeneTraitData();

    // Clear output and display results
    outputDiv.innerHTML = "";
    if (results.length === 0) {
        outputDiv.innerHTML = "<p>No results found.</p>";
    } else {
        results.forEach(item => {
            outputDiv.innerHTML += `<p>${item.gene} → ${item.trait}</p>`;
        });
    }
});

