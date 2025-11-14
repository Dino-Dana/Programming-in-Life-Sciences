// sparql.js

// Define an asynchronous function to fetch gene-trait data
async function fetchGeneTraitData() {
    // Wikidata SPARQL endpoint URL
    const endpointUrl = "https://query.wikidata.org/sparql";

    // SPARQL query to get genes associated with a specific trait (Q11081)
    const query = `
        SELECT ?gene ?geneLabel ?trait ?traitLabel
        WHERE {
          ?gene wdt:P31 wd:Q7187 .       # Select items that are genes (instance of gene)
          ?gene wdt:P2293 ?trait .       # Genes linked to a trait
          VALUES ?trait { wd:Q11081 }    # Filter only the trait Q11081
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }  # Get English labels
        }
    `;

    // Construct the full URL for the GET request
    // encodeURIComponent makes sure the query is URL-safe
    const url = endpointUrl + "?query=" + encodeURIComponent(query) + "&format=json";

    try {
        // Fetch data from the endpoint
        // 'Accept' header ensures the endpoint returns JSON
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/sparql-results+json'
            }
        });

        // Parse the JSON response
        const data = await response.json();

        // Map the results to a simpler format: {gene, trait}
        const results = data.results.bindings.map(item => ({
            gene: item.geneLabel.value,   // Get gene name
            trait: item.traitLabel.value  // Get trait name
        }));

        // Return the processed results
        return results;

    } catch (error) {
        // Log errors if the fetch fails
        console.error("Error fetching data:", error);
        return [];  // Return empty array on error
    }
}
