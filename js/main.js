/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv("data/2021CoderFiltered.csv").then((data) => {
  // Define bins and labels
  let bins = [0, 100, 500, 1000, 10000, 100000];
  let labels = ["$0-100", "$101-500", "$501-1000", "$1001-10000", "$>10000"];

  // preprocess data
  data.forEach((d) => {
    // Bubble chart preprocessing
    d.Learning_Methods = d.Learning_Methods.split(", ");
    d.Helpful_Online_Resources = d.Helpful_Online_Resources.split(", ");
    d.Helpful_Podcasts = d.Helpful_Podcasts.split(", ");
    d.Helpful_YouTube_Channels = d.Helpful_YouTube_Channels.split(", ");

    // Bar line chart preprocessing
    if (
      d.Interested_Careers ===
      "I am not interested in a software development career"
    ) {
      d.Interested_Careers = "Not interested in software development";
    }

    // Sankey chart preprocessing: create a new property 'CostOfLearningBins'
    d.CostOfLearningBins = labels.find((label, index) => {
      return (
        index < bins.length - 1 &&
        d["Money_Spent_on_Learning"] >= bins[index] &&
        d["Money_Spent_on_Learning"] < bins[index + 1]
      );
    });
  });

  // Dispatch for treemap and other views
  const filterDispatch = d3.dispatch("ReasonChanged");
  // Dispatch for bidirectional relationship between dot matrix and bar-line chart
  const careerDispatch = d3.dispatch("CareerChanged");
  const filteredData = data;
  const dotMatrix = new DotMatrix(
    {
      parentElement: "#matrix",
    },
    filteredData,
    careerDispatch
  );

  // render treemap
  const treeMap = new TreeMap(
    {
      parentElement: "#treemap-vis",
    },
    data,
    filterDispatch
  );

  filterDispatch.on("ReasonChanged", function (f, e) {
    const newFilteredData = f ? data.filter((d) => d.Top_Reason === f) : data;
    dotMatrix.data = newFilteredData;
    dotMatrix.updateVis();
    barLineChart.data = newFilteredData;
    barLineChart.updateVis();
    sankeyChart.data = newFilteredData;
    sankeyChart.updateVis();
    bubbleChart.data = newFilteredData;
    bubbleChart.updateVis();
  });

  const bubbleChart = new BubbleChart(
    {
      parentElement: "#bubble-chart",
    },
    filteredData
  );

  const barLineChart = new BarLineChart(
    {
      parentElement: "#bar-line-chart",
    },
    filteredData,
    careerDispatch
  );

  const sankeyChart = new SankeyChart(
    {
      parentElement: "#sankey-chart",
    },
    filteredData
  );

  // radio button group to set type of sort for dot matrix
  d3.select("#dot-matrix-sorting").on("change", function (event) {
    // Get selected demographic
    dotMatrix.activeSort = event.target.value;
    dotMatrix.updateVis();
  });
});
