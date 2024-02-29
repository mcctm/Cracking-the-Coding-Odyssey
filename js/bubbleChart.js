class BubbleChart {
    /**
     * Class constructor with initial configuration
     * @param {Object}
     */
  
    constructor(_config, data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: 750,
        containerHeight: 580,
        tooltipPadding: 15,
        margin: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        },
      };
      this.data = data;
      this.initVis();
    }
  
    initVis() {
        
      let vis = this;

      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement)
        .append('svg')
        .attr('id', 'bubble-chart')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

      // SVG group that contains the chart (adjusted to margins)
      vis.chartArea = vis.svg.append('g')
        .attr('class', "bubble-area")
        .attr('transform', `translate(${vis.config.margin.left + 10},${vis.config.margin.top})`);

      // Initialize radius scale of circles
      vis.radiusScale = d3.scaleSqrt()
        .range([5, 90]);
      
      // Initialize categorical color scale
      let colourLegend = { ... LEARNING_RESOURCES_COLOURS}
      vis.colorScale = d3.scaleOrdinal()
        .range(Object.values(colourLegend))
        .domain(Object.keys(colourLegend));

      // Initialize legend
      vis.legendArea = vis.svg
        .append('g')
        .attr('class', 'legendArea')
        .attr('transform', `translate(16,0)`);
      
      vis.legend = vis.legendArea
        .selectAll(".legend")
        .data(Object.keys(colourLegend))
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

      vis.legend
        .append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => vis.colorScale(d));
      
      vis.legend
        .append("text")
        .attr("x", 40)
        .attr("y", 9)
        .style("text-anchor", "start")
        .text(d => d.replace(/_/g, ' '));

      vis.updateVis();
    }
  
    updateVis() {
      let vis = this;

      // Data processing: split each str, check if in keyword list, record its counts
      
      vis.transformedData = [];

      vis.keywords = [
        {"Helpful_Online_Resources": [
        'freeCodeCamp', 'Mozilla Developer Network (MDN)', 'EdX', 'Codecademy', 'Udemy',
        'Code Wars', 'Front End Masters', 'Lynda.com', 'CSS Tricks', 'Coursera', 'Khan Academy',
        'Pluralsight', 'HackerRank', 'Stack Overflow', 'W3Schools']
        }, 
        {"Helpful_Podcasts": [
          'Code Newbie Podcast', 'Darknet Diaries', 'Syntax.fm', 'Learn To Code With Me', 
          'Talk Python to Me', 'Cyberwire Daily', 'The Changelog', 'Indie Hackers', 'Developer Tea',
          'JS PARTY', 'Ladybug Podcast', 'Software Engineering Daily', 'Practical AI']
        }, 
        {"Helpful_YouTube_Channels": [
        'Ben Awad', 'Code with Ania Kubów', 'CodeStacker', 'Coding Train',
        'Dev Ed', 'freeCodeCamp', 'Google Developers', 'James Q Quick',
        'Kevin Powell', 'The Net Ninja', 'Traversy Media', 'CS Dojo',
        'Programming With Mosh', 'Fireship', 'Coding Addict', 'DesignCourse']
        },
        {"Helpful_In_Person_Events": [
          'workshops', 'hackathons', 'freeCodeCamp study groups', 
          'conferences', 'weekend bootcamps', 'Women Who Code', 'Meetup.com events', 'school']
        }
      ];
      
      // If item in keyword list, group it and increase count
      vis.keywords.forEach((keywordDict) => {
        let keyRes = {};
        const key = Object.keys(keywordDict)[0]
        let keywordList = keywordDict[key]
        vis.data.forEach((d) => {
          const increaseCnt =  function(item) {
            if (keywordList.includes(item)){
              if (keyRes[item]){
                keyRes[item] += 1;
              } else {
                keyRes[item] = 1;
              }
            }
          }
          // Cater Helpful_In_Person_Events' difference in format
          if (key !== "Helpful_In_Person_Events"){
            d[key].forEach((item) => {
              increaseCnt(item);
            })
          } else {
            increaseCnt(d[key]);
          }
        });
        // Create a count of total number of items with that category
        const totalCount = Object.values(keyRes).reduce((total, count) => total + count, 0);
        // Convert result so each item is its own object
        const keyResObj = Object.entries(keyRes).map(([name, count]) => ({
          category: key,
          name: name,
          count: count,
          percentage: ((count / totalCount) * 100).toFixed(2)
        }));
        // Concat all item objects to the result array
        vis.transformedData = [...vis.transformedData, ...keyResObj];
      })

      // Sort objects by descending order (highest count -> lowest count)
      vis.transformedData = vis.transformedData.sort((a,b) => b.count - a.count);

      // Assign radius to each data point based on its count
      vis.radiusScale.domain([0, vis.transformedData[0].count]);

      vis.transformedData.forEach(function (d) {
        d.radius = vis.radiusScale(d.count);
      });

      vis.renderVis();
    }
  
    renderVis() {
      let vis = this;

      // Force simulations to make circle data points repel but close to each other
      let simulation = d3.forceSimulation(vis.transformedData)
        .force("charge", d3.forceManyBody().strength([-50]))
        .force("x", d3.forceX(vis.config.width / 2).strength(0.05))
        .force("y", d3.forceY(vis.config.height / 2).strength(0.05))
        .force("collide", d3.forceCollide().radius(function (d) { return d.radius + 2; }));

      // Rendering the circle data points
      const circle = vis.chartArea
        .selectAll(".circle")
        .data(vis.transformedData)
        .join('circle')
        .attr('class', 'circle')
        .attr('r', d => d.radius)
        .attr('fill', d => vis.colorScale(d.category))
        .on('mouseover', function(event,d) {
          d3.select(this)
            .attr("stroke", "#000000")
            .attr("stroke-width", "2");
          d3.select('#tooltip')
            .style('display', 'block')
            .html(`
            <div class="bold">${d.name}</div>
            <div class="italic">${d.category.replace(/_/g, ' ')}</div>
            <div>${d.count} people found it useful</div>
            `)
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px');
          
        })      
        .on('mouseleave', function() {
          d3.select(this)
            .attr("stroke", null)
            .attr("stroke-width", null);
          d3.select('#tooltip').style('display', 'none');
        });


      // Render text on the circle
      const circleLabel = vis.chartArea
        .selectAll(".circle-label")
        .data(vis.transformedData)
        .join('text')
        .attr('class', 'circle-label')
        .attr('text-anchor', 'middle')
        .attr('fill', "#7f7a7a")
        .attr('font-size', 10)
        .text(d => d.name);

      // Remove labels that exceed size of circle
      circleLabel.style("visibility", function (d) {
        let labelLen = d3.select(this).node().getComputedTextLength();
        let diameter = d.radius * 2;
        if (labelLen <= diameter){
          return "visible";
        } else {
          d3.select(this).remove();
        }
      });

      // Append tspan elements for category and percentage
      const categorySpan = circleLabel.append('tspan')
        .text(d => d.category.substring(8).replace(/_/g, ' '));

      const percentSpan = circleLabel
        .append('tspan')
        .text(d => d.percentage + " %");

      // Using simulation, generate each circle data point's x and y pos
      simulation.on("tick", function () {
        circle
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);

        circleLabel
          .attr("x", d => d.x)
          .attr("y", d => d.y);
        
        categorySpan
          .attr('x', d => d.x)
          .attr('y', d => d.y - 10);
        
        percentSpan
          .attr('x', d => d.x)
          .attr('y', d => d.y + 15);


      });
    
    }

}
  