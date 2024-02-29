class SankeyChart {
    /**
     * Class constructor with initial configuration
     * @param {Object}
     */

    constructor(_config, data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 750,
            containerHeight: 600,
            tooltipPadding: 15,
            margin: {
                top: 50,
                right: 100,
                bottom: 50,
                left: 50,
            },
        };
        this.data = data;

        //set up graph, nodes and links for sankey
        this.graph = { "nodes": [], "links": [] };
        this.nodes = [];
        this.links = [];
        this.sankey = null;

        this.initVis()
    }

    initVis() {

        let vis = this;

        // LAYOUT AND DESIGN:
        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.config.width =
            vis.config.containerWidth -
            vis.config.margin.left -
            vis.config.margin.right;
        vis.config.height =
            vis.config.containerHeight -
            vis.config.margin.top -
            vis.config.margin.bottom;
        // Define size of SVG drawing area
        vis.svg = d3
            .select(vis.config.parentElement)
            .append("svg")
            .attr("id", "sankey")
            .attr("width", vis.config.width)
            .attr("height", vis.config.height)
            .attr('transform', `translate(${vis.config.margin.left},0)`);;

        // Constructs and configure Sankey generator
        vis.sankey = d3.sankey()
            .nodeId(d => d.index)
            .nodeSort(vis.costOfLearningSort)
            .nodeAlign(d3.sankeyRight)
            .nodeWidth(15)
            .nodePadding(15)
            .extent([[1, 5], [vis.config.width - 1, vis.config.height - 5]]);

        let colourLegend = { ...LOCATION_COLOURS, ...COST_OF_LEARNING_COLOURS }
        vis.colourScale = d3.scaleOrdinal()
            .domain(Object.keys(colourLegend))
            .range(Object.values(colourLegend));

        vis.updateVis();

    }

    updateVis() {
        let vis = this;

        // DATA WRANGLING:
        var groupedData = d3.group(vis.data, d => d.Location, d => d.CostOfLearningBins)
        var frequencyArray = [];

        // Iterate over the grouped data and populate the object
        groupedData.forEach((subGroup, key1) => {
            subGroup.forEach((value, key2) => {
                var frequency = value.length;

                // Create an entry in the object
                frequencyArray.push({
                    source: key1,
                    target: key2,
                    value: frequency
                });
            });
        });

        vis.graph = { "nodes": [], "links": [] };

        frequencyArray.forEach(function (d) {
            vis.graph.nodes.push({ "name": d.source });
            vis.graph.nodes.push({ "name": d.target });
            vis.graph.links.push({
                "source": d.source,
                "target": d.target,
                "value": +d.value
            });
        });

        vis.graph.nodes = Array.from(d3.group(vis.graph.nodes, (d) => d.name).keys()).filter(v => v)

        // loop through each link replacing the text with its index from node
        vis.graph.links.forEach(function (d, i) {
            vis.graph.links[i].source = vis.graph.nodes.indexOf(vis.graph.links[i].source);
            vis.graph.links[i].target = vis.graph.nodes.indexOf(vis.graph.links[i].target);
        });

        //loop through each nodes to make nodes an array of objects rather than an array of strings 
        vis.graph.nodes.forEach(function (d, i) {
            vis.graph.nodes[i] = { "name": d };
        });

        // Applies it to the data. We make a copy of the nodes and links objects to avoid deleting original
        const { nodes, links } = vis.sankey({
            nodes: vis.graph.nodes.map(d => Object.assign({}, d)),
            links: vis.graph.links.map(d => Object.assign({}, d))
        });

        vis.nodes = nodes;
        vis.links = links;

        vis.renderVis();

    }

    renderVis() {
        let vis = this;

        // Creates the rects that represent the nodes.
        const rect = vis.svg.selectAll(".nodes")
            .data(vis.nodes)
            .join("rect")
            .attr("stroke", "#000")
            .attr("class", "nodes")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", "#0000FF")
            .attr("fill", d => vis.colourScale(d.name))
            .on("mouseover", function (sourceNode) {
                // Highlight all paths from the source node
                vis.svg.selectAll(".links")
                    .filter(function (path) {
                        return path.source.name === sourceNode.target.__data__.name || path.target.name === sourceNode.target.__data__.name;
                    })
                    .transition()
                    .style("stroke-opacity", 0.8)

                // Dim the other paths
                vis.svg.selectAll(".links")
                    .filter(function (otherPath) {
                        return otherPath.source.name !== sourceNode.target.__data__.name && otherPath.target.name !== sourceNode.target.__data__.name;
                    })
                    .transition()
                    .style("stroke-opacity", 0.1)
            })
            .on("mouseleave", function () {
                // Restore the original styles on mouseleave
                vis.svg.selectAll(".links")
                    .transition()
                    .style("stroke-opacity", 0.5)
            });



        // Creates the paths that represent the links.
        const link = vis.svg.selectAll(".links")
            .data(vis.links)
            .join("path")
            .transition().delay(50).duration(500)
            .attr("class", "links")
            .attr("fill", "none") // TODO: colour must match treeMap
            .attr("stroke-opacity", 0.5)
            .style("mix-blend-mode", "multiply")
            .attr('fill', 'none')
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke", d => vis.colourScale(d.source.name))
            .attr("stroke-width", d => Math.max(1, d.width));

        vis.svg.selectAll(".links")
            .join("title")
            .text(d => `${d.source.name} → ${d.target.name}\n${d.value}`);

        // Adds labels on the nodes.
        vis.svg.selectAll(".node-labels")
            .data(vis.nodes)
            .join("text")
            .attr("class", "node-labels")
            .attr("x", d => d.x0 < vis.config.width / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr("y", d => (d.y1 + d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => d.x0 < vis.config.width / 2 ? "start" : "end")
            .text(d => d.name + ": " + d.value)

    }

    costOfLearningSort(a, b) {
        var categoryA = a.name;
        var categoryB = b.name;
        let costOfLearningOrder = ["$0-100", "$101-500", "$501-1000", "$1001-10000", "$>10000"];

        var indexA = costOfLearningOrder.indexOf(categoryA);
        var indexB = costOfLearningOrder.indexOf(categoryB);

        return indexA - indexB;
    }

}