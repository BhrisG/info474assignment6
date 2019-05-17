'use strict';

(function () {

  let data = "no data";
  let svgScatterPlot = ""; // keep SVG reference in global scope
  let allData = "no data";
  let svgLineGraph = "";
  let tooltip = "";

  // load data and make scatter plot after window loads
  window.onload = function () {
      svgLineGraph = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);

    tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    svgScatterPlot = tooltip
    .append('svg')
    .attr('width', 300)
    .attr('height', 300);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData;
        allData = csvData;
        makeDropDown();
        makeLineGraph();
      });
  }

  function makeLineGraph(location) {

    svgLineGraph.html("");
    filterbyLocation(location);
    
    let years = data.map((row) => parseInt(row["time"]));

    let pop_data = data.map((row) => parseFloat(row["pop_mlns"]));

    let axesLimits = findMinMax(years, pop_data);

    let mapFunctions = drawAxes(axesLimits, "time", "pop_mlns", svgLineGraph, 
    { min: 50, max: 450}, 
    { min: 50, max: 450});

    plotData(mapFunctions);

    makeLabels();
  }

  function filterbyLocation(location = 'AUS') {
    data = allData.filter((row) => row['location'] == location)
  }

  function filterByYear(year = '1960') {
    data = allData.filter((row) => row['time'] == year)
  }

  // make scatter plot with trend line
  function makeScatterPlot(year) {
    svgScatterPlot.html("");

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy", svgScatterPlot,
    { min: 50, max: 250}, 
    { min: 50, max: 250}
    );

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
    plotScatterPlot(mapFunctions);
  }

  function plotScatterPlot(functions) {
    svgScatterPlot.selectAll('.dot')
    .data(allData)
    .enter()
    .append('circle')
    .attr('class', 'circes')
    .attr('cx', functions.x)
    .attr('cy', functions.y)
    .attr('r', 1.5)
    .attr('fill', 'black');

    svgScatterPlot.append('text')
      .attr('x', 120)
      .attr('y', 280)
      .style('font-size', '10pt')
      .text("Fertility Rate ");

    svgScatterPlot.append('text')
      .attr('x', 50)
      .attr('y', 30)
      .text('Life Expectancy vs. Fertility Rate');

    svgScatterPlot.append('text')
      .attr('transform', 'translate(15, 200)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }

  // make title and axes labels
  function makeLabels() {
    svgLineGraph.append('text')
      .attr('x', 10)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Population size over time Per Country");

    svgLineGraph.append('text')
      .attr('x', 230)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Year');

    svgLineGraph.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population in millions');
  }

  function plotData(map) {

    // mapping functions
    let xScale = map.xScale;
    let yScale = map.yScale;

    const line = d3.line()
      .x(d => xScale(d.time))
      .y(d => yScale(d.pop_mlns))
      .curve(d3.curveMonotoneX);

      svgLineGraph.append('path')
        .datum(data)
        .attr('class', 'line')
        .attr('d', line)

        .on("mouseover", (d) => {
          tooltip
          .transition()
            .duration(200)
            .style("opacity", 1)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
  
          makeScatterPlot();
        })
        .on("mouseout", (d) => {
          tooltip
          .transition()
            .duration(500)
            .style("opacity", 0);
        });

  }

  function makeDropDown() {
    let locs = [...new Set(allData.map(location => location.location))].sort();

    var dropDown = d3.select('body')
      .append('select')
      .on('change', function () {
        makeLineGraph(this.value);
      });

    var options = dropDown.selectAll('option')
      .data(locs)
      .enter()
      .append('option')
      .text((d) => { return d; });
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY) {
    // return x value from a row of data
    let xValue = function (d) { 
      return +d[x]; 
    }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) {
      return xScale(xValue(d));
    };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) { return +d[y] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin]) // give domain buffer
      .range([rangeY.min, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
    .attr('transform', 'translate(' + rangeX.min + ')')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
