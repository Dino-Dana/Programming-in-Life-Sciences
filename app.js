const endpoint = "https://query.wikidata.org/sparql";
const query = `
# Find the APOE gene and related identifiers
SELECT ?gene ?geneLabel ?entrez ?ensembl ?genecard ?taxonLabel WHERE {
  ?gene wdt:P31 wd:Q7187;          # instance of 'gene'
        wdt:P351 ?entrez;          # Entrez Gene ID
        wdt:P703 wd:Q15978631.     # human
        rdfs:label ?geneLabel.

  FILTER(LANG(?geneLabel) = "en")
  FILTER(CONTAINS(LCASE(?geneLabel), "apoe"))

  OPTIONAL { ?gene wdt:P594 ?ensembl. }   # Ensembl Gene ID
  OPTIONAL { ?gene wdt:P671 ?genecard. }  # GeneCards ID
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 10

`;

async function runQuery() {
  const url = endpoint + "?query=" + encodeURIComponent(query);
  const response = await fetch(url, {
    headers: { "Accept": "application/sparql-results+json" }
  });
  const data = await response.json();

  const results = data.results.bindings;
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = "<h3>Query Results:</h3>";

  results.forEach(row => {
    outputDiv.innerHTML += `<p>${row.itemLabel.value}</p>`;
  });
}

document.getElementById("loadData").addEventListener("click", runQuery);



