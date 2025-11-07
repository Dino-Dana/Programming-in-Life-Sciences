$(document).ready(function() {
    
    // Your SPARQL endpoint
    const sparqlEndpoint = "http://genage.bio2rdf.org/sparql";
    
    // Your SPARQL query
    const sparqlQuery = `
        PREFIX genage: <http://bio2rdf.org/genage:>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        
        SELECT ?gene ?symbol ?organism ?effect
        WHERE {
            ?gene rdf:type genage:Gene .
            ?gene rdfs:label ?symbol .
            OPTIONAL { ?gene genage:organism ?organism }
            OPTIONAL { ?gene genage:lifespan-effect ?effect }
        }
        LIMIT 100
    `;
    
    // Function to run the SPARQL query
    $('#runQuery').click(function() {
        // Show loading message
        $('#results').html('<p>Loading data...</p>');
        
        // Make AJAX request to SPARQL endpoint
        $.ajax({
            url: sparqlEndpoint,
            data: {
                query: sparqlQuery,
                format: 'json'
            },
            success: function(data) {
                displayResults(data);
            },
            error: function(xhr, status, error) {
                $('#results').html('<p>Error: ' + error + '</p>');
                console.error('SPARQL query failed:', error);
            }
        });
    });
    
    // Function to display results in DataTable
    function displayResults(data) {
        // Parse SPARQL JSON results
        const bindings = data.results.bindings;
        
        // Convert to array format for DataTables
        const tableData = bindings.map(row => {
            return [
                row.symbol?.value || 'N/A',
                row.organism?.value || 'N/A',
                row.effect?.value || 'N/A',
                row.gene?.value || 'N/A'
            ];
        });
        
        // Initialize DataTable
        $('#geneTable').DataTable({
            data: tableData,
            destroy: true, // Allow reinitialization
            pageLength: 25,
            order: [[0, 'asc']]
        });
    }
});
