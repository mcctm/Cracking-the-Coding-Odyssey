class TreeMap {
  /**
   * Class constructor with initial configuration
   * @param {Object}
   */

  constructor(_config, data, filterDispatch) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 584,
      containerHeight: 500,
      tooltipPadding: 15,
      margin: {
        top: 0,
        right: 0,
        bottom: 30,
        left: 50,
      },
    };
    this.data = data;
    // Event dispatcher for handling interactions and updates
    this.dispatch = filterDispatch;
    this.initVis();
  }

  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.config.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.config.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Set the width of each tile in the treemap
    vis.tileWidth = vis.config.width / 2.514;
    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("id", "treemap")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.treeArea = vis.svg.append("g");

    // Calculate the x and y coordinates to center treeArea
    const xCenter =
      (vis.config.containerWidth -
        vis.config.margin.left -
        vis.config.margin.right -
        vis.config.width) /
      2;
    const yCenter =
      (vis.config.containerHeight -
        vis.config.margin.top -
        vis.config.margin.bottom -
        vis.config.height) /
      2;

    vis.treeArea
      .append("rect")
      .attr("width", vis.config.width)
      .attr("height", vis.config.height)
      .attr("class", "tree-area")
      .attr("x", vis.config.margin.left + xCenter)
      .attr("y", vis.config.margin.top + yCenter)
      .style("fill", "#f7f6ed");

    // Define the dimensions, count, and colors for the treemap tiles
    // Used D3 rollups to find count of each
    vis.treeDims = [
      ["To succeed in current career", 187, "#bebada"],
      ["To start your first career", 500, "#8dd3c7"],
      ["To change careers", 766, "#fccde5"],
      ["To start a business or to freelance", 238, "#b3cde3"],
      ["As a hobby", 280, "#ccebc5"],
      ["To create art or entertainment", 29, "#fed9a6"],
      ["To meet school requirements", 24, "#f3e5ab"],
    ];

    // Sort the treeDims array by the size (the second element of each sub-array) in descending order
    vis.treeDims.sort((a, b) => b[1] - a[1]);

    // Create an SVG group element for the treemap
    vis.treemapGroup = vis.treeArea.append("g").attr("class", "tree-map-group");

    // Define the desired x and y coordinates for the treeGroup within the treeArea
    const treeGroupX = 50; // Adjust as needed
    const treeGroupY = 0; // Adjust as needed

    // Translate the treeGroup to the desired position
    vis.treemapGroup.attr(
      "transform",
      `translate(${treeGroupX}, ${treeGroupY})`
    );

    // Initialize the treemap layout
    const treemap = d3.treemap().size([vis.config.width, vis.config.height]);

    // Convert the treeDims array into hierarchical data
    vis.hierarchy = d3.hierarchy({
      children: vis.treeDims.map((d, i) => ({ ...d, id: i })),
    });

    // Compute the treemap layout
    vis.hierarchy.sum((d) => d[1] + 50);
    treemap(vis.hierarchy);

    vis.updateVis();
  }

  updateVis() {
    let vis = this;
    // Roll up data using D3 rollups to find the count of each reason
    const rolledUpData = d3.rollups(
      vis.data,
      (v) => v.length,
      (d) => d.Top_Reason
    );
    vis.data.rolledUpData = rolledUpData;
    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Select all rectangle groups representing treemap nodes
    const rectangleGroups = vis.treemapGroup
      .selectAll(".tree-node-group")
      .data(vis.hierarchy.leaves(), (d) => d.data[0]);
    const newRectangleGroups = rectangleGroups
      .enter()
      .append("g")
      .attr("class", "tree-node-group");
    rectangleGroups.exit().remove();

    // Merge new and existing rectangle groups, and handle click events
    newRectangleGroups.merge(rectangleGroups).on("click", function (e, d) {
      // Toggle selectedReason on click
      if (vis.selectedReason !== d.data[0]) {
        vis.selectedReason = d.data[0];
      } else {
        vis.selectedReason = undefined;
      }
      // Trigger ReasonChanged event with selectedReason
      vis.dispatch.call("ReasonChanged", e, vis.selectedReason);
      vis.renderVis();
    });

    const rectangles = newRectangleGroups
      .merge(rectangleGroups)
      .selectAll(".tree-node")
      .data(
        (d) => d,
        (d) => d.data[0]
      );

    const newRectangles = rectangles
      .enter()
      .append("rect")
      .attr("class", "tree-node")
      .attr("width", (d) => d.x1 - d.x0 - 5)
      .attr("height", (d) => d.y1 - d.y0 - 5)
      .attr("fill", (d) => d.data[2])
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0);

    // Add black outline when hovering over the tree rectangles
    rectangles
      .merge(newRectangles)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "black").attr("stroke-width", 2);
        // Show count of each motivation
        d3.select("#tooltip")
          .style("display", "block")
          .html(
            `
        <div class="bold">${d.data[0]}: ${d.data[1]}</div>
        `
          )
          .style("left", event.pageX + vis.config.tooltipPadding + "px")
          .style("top", event.pageY + vis.config.tooltipPadding + "px");
      })
      .on("mouseout", function () {
        // Remove the outline on mouseout
        d3.select(this).attr("stroke", "none");
        d3.select("#tooltip").style("display", "none");
      })
      .style("stroke", (d) =>
        d.data[0] === vis.selectedReason ? "black" : "transparent"
      )
      .style("opacity", (d) =>
        d.data[0] === vis.selectedReason || !vis.selectedReason ? 1 : 0.5
      )
      .style("cursor", "pointer");

    // Add labels to the rectangles
    newRectangleGroups
      .merge(rectangleGroups)
      .selectAll(".tree-label")
      .data(
        (d) => d,
        (d) => d.data[0]
      )
      .enter()
      .append("text")
      .attr("class", "tree-label")
      // Set the text content based on the data
      .text((d) => d.data[0])
      // Set the x and y coordinates for the text elements
      .attr("x", (d) => (d.x0 + d.x1 - 5) / 2)
      .attr("y", (d) => (d.y0 + d.y1 - 5) / 2)
      // Style the text elements
      .style("font-size", "11.5px")
      .style("fill", "black")
      .style("cursor", "pointer")
      .style("text-anchor", "middle")
      .style("dominant-baseline", "middle")
      // Call the wrap function to wrap text within the specified width
      .call(vis.wrap, 80);
  }

  // Text wrapping function with ChatGPT's assistance
  wrap(text, width) {
    text.each(function () {
      var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1,
        x = text.attr("x"),
        y = text.attr("y"),
        dy = 0,
        tspan = text
          .text(null)
          .append("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", dy + "em");

      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text
            .append("tspan")
            .attr("x", x)
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "em")
            .text(word);
        }
      }
    });
  }
}
