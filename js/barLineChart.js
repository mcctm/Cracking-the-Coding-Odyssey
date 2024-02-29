const SALARY_RANGES = [
  "$0 to $4,999",
  "$5,000 to $9,999",
  "$10,000 to $20,999",
  "$20,000 to $29,999",
  "$30,000 to $49,999",
  "$50,000 to $74,999",
  "$75,000 to $99,999",
  "$100,000 to $124,999",
  "$125,000 to $159,999",
  "$160,000 to $199,999",
  "$200,000 to $249,999",
  "$250,000 or over",
];

const HEIGHT_ADJUSTMENT = 10.5;

class BarLineChart {
  constructor(_config, _data, _dispatcher) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 750,
      containerHeight: 500,
      tooltipPadding: 15,
      margin: {
        top: 50,
        right: 150,
        bottom: 210,
        left: 50,
      },
    };
    this.data = _data;
    this.dispatcher = _dispatcher;
    this.initVis();
  }

  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;

    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Initialize scales
    vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.15);
    vis.yScaleLeft = d3.scaleLinear().range([vis.height, HEIGHT_ADJUSTMENT]);
    vis.yScaleRight = d3
      .scaleBand()
      .range([vis.height + HEIGHT_ADJUSTMENT, HEIGHT_ADJUSTMENT]);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale).tickSizeOuter(0);
    vis.yAxisLeft = d3.axisLeft(vis.yScaleLeft).tickSizeOuter(0);
    vis.yAxisRight = d3.axisRight(vis.yScaleRight).tickSizeOuter(0);

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // SVG Group containing the actual chart; D3 margin convention
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left}, ${vis.config.margin.top})`
      );

    vis.marks = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left}, ${vis.config.margin.top})`
      );

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0, ${vis.height})`);

    // Append y-axis left group
    vis.yAxisLeftG = vis.chart
      .append("g")
      .attr("class", "axis y-axis-left")
      .attr("transform", "translate(0.5, 0)");

    // Append y-axis right group
    vis.yAxisRightG = vis.chart
      .append("g")
      .attr("class", "axis y-axis-right")
      .attr("transform", `translate(${vis.width}, 0)`);

    // Append titles
    vis.chart
      .append("text")
      .attr("class", "axis-title axis-title-left")
      .attr("y", -20)
      .attr("x", 90)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Number of People");

    vis.chart
      .append("text")
      .attr("class", "axis-title axis-title-right")
      .attr("y", -20)
      .attr("x", vis.width + 120)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Expected Salary ⓘ")
      .on("mouseover", function (event, d) {
        d3
          .select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + vis.config.tooltipPadding + "px")
          .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
            <p style="font-size:xx-small; max-width:200px">Expected amount of money earned per year from first developer job (in US Dollars)</p>
          `);
      })
      .on("mouseout", function () {
        d3.select("#tooltip").style("display", "none");
      });

    vis.dispatcher.on("CareerChanged.Bar", (career) => {
      vis.selectedCareer = career;
      vis.renderVis();
    });

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    const aggregatedData = d3.rollups(
      vis.data,
      (v) => v,
      (d) => d.Interested_Careers
    );

    const careerSalaryMap = [];

    // Pre-process data
    for (const [career, data] of aggregatedData) {
      const salaryMap = d3.rollup(
        data,
        (v) => v.length,
        (d) => d.Expected_Salary
      );
      const salaryObject = Object.fromEntries(salaryMap);
      const salaryKey = Object.keys(salaryObject).reduce(
        (maxSalaryKey, currSalaryKey) => {
          return salaryObject[currSalaryKey] > salaryObject[maxSalaryKey]
            ? currSalaryKey
            : maxSalaryKey;
        },
        Object.keys(salaryObject)[0]
      );
      careerSalaryMap.push([career, salaryKey]);
    }

    // Prepare career count data
    vis.aggregatedData = Array.from(aggregatedData, ([key, value]) => ({
      key,
      value,
    }));

    // Prepare career salary data
    vis.careerSalaryMap = Array.from(careerSalaryMap, ([key, value]) => ({
      key,
      value,
    }));

    // Line generator
    vis.line = d3
      .line()
      .x((d) => vis.xScale(vis.xValue(d)) + vis.xScale.bandwidth() / 2)
      .y((d) => vis.yScaleRight(vis.yValueRight(d)) + HEIGHT_ADJUSTMENT);

    // Specify accessor functions
    vis.xValue = (d) => d.key;
    vis.yValueLeft = (d) => d.value.length;
    vis.yValueRight = (d) => d.value;

    // Set the scale input domains
    vis.xScale.domain(vis.aggregatedData.map(vis.xValue));
    vis.yScaleLeft.domain([0, d3.max(vis.aggregatedData, vis.yValueLeft)]);
    vis.yScaleRight.domain(SALARY_RANGES);

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Add rectangles
    const bars = vis.chart
      .selectAll(".bar")
      .data(vis.aggregatedData)
      .join("rect")
      .attr("class", "bar")
      .on("click", (event, d) => {
        const career = d.key === vis.selectedCareer ? undefined : d.key;
        vis.dispatcher.call("CareerChanged", event, career);
      })
      .attr("stroke", (d) => (d.key === vis.selectedCareer ? "black" : "unset"))
      .attr("stroke-width", 1.5)
      .style("fill", "#669ac7")
      .style("opacity", (d) => d.key === vis.selectedCareer || !vis.selectedCareer ? 1 : 0.5)
      .transition()
      .duration(500)
      .attr("x", (d) => vis.xScale(vis.xValue(d)))
      .attr("width", vis.xScale.bandwidth())
      .attr("height", (d) => vis.height - vis.yScaleLeft(vis.yValueLeft(d)))
      .attr("y", (d) => vis.yScaleLeft(vis.yValueLeft(d)));

    // Add lines
    const lines = vis.marks
      .selectAll(".chart-line")
      .data([vis.careerSalaryMap])
      .join("path")
      .attr("class", "chart-line")
      .attr("fill", "none")
      .attr("stroke", "#008080")
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 2)
      .attr("d", vis.line(vis.careerSalaryMap));

    // Update axes
    vis.xAxisG
      .call(vis.xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-60) translate(-10, 0)")
      .style("text-anchor", "end");
    vis.yAxisLeftG
      .call(vis.yAxisLeft)
      .call((g) => g.select(".domain").remove());
    vis.yAxisRightG
      .call(vis.yAxisRight)
      .call((g) => g.select(".domain").remove());
  }
}
