# Neurodegenerative Diseases: Alzheimer’s and Amyotrophic Lateral Sclerosis (ALS) — Gene Analysis & Protein Network Visualizer
This project collects genes involved in Alzheimer's disease and amyotrophic lateral sclerosis and allows visualization of the physical interactions of the proteins encoded by these genes.
All of this is displayed via a web page whose structure consists of an HTML file, a JavaScript file, and a CSS file.

The tool pulls live data from **Wikidata’s SPARQL endpoint** and generates:

1. **Gene statement bar charts**  
   - For each disease, the associated genes are retrieved.
   - The number of direct Wikidata statements for each gene is counted.
   - Data is visualized using *Chart.js*.

2. **Protein–protein interaction (PPI) networks**  
   - Genes → encoded proteins → interacting proteins.
   - Data is visualized using *vis.js* (vis-network).

This application is intended for educational, scientific, or research purposes, helping users better understand gene involvement and PPI networks in AD and ALS.

# Technologies used
- HTML5
- CSS3
- JavaScript
- Chart.js for bar charts
- vis-network for protein networks
- Wikidata SPARQL API

# Web page content
The web page contains two clickable bar graphs that redirect users to a website about the gene in question, two protein networks and their physical interactions, and other explanations in text form.

# How to run the file ?
Once the file has been downloaded, simply open the HTML file to view the web page.
It is important to keep the HTML, JavaScript, and CSS files in the same folder so that they remain connected.
