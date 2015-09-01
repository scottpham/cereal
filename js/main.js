var margin = {
  top: 30,
  bottom: 50,
  right: 40,
  left: 40
};

var divWidth = window.innerWidth,
  //define inner width for main graphic
  //when we define svg we will use main width
  chartWidth = divWidth - margin.left - margin.right,
  divHeight = 0.65 * divWidth,
  chartHeight = divHeight - margin.top - margin.bottom;

//x scale
//ordinal is for categories
var x = d3.scale.linear()
  .range([0, chartWidth]);

//height range is inverted b/c svg
var y = d3.scale.linear()
  .range([chartHeight, 0]);

//define x axis
var xAxis= d3.svg.axis()
  .scale(x)
  .orient("bottom");

var yAxis = d3.svg.axis()
  .scale(y)
  .orient("left");

var svg = d3.select("#graphic").append("svg")
  .attr("width", divWidth)
  .attr("height", divHeight)
  //offset g with margins
  //this g holds all the chart groups including axes
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.right + ")");

d3.csv("data/cereal.csv", function(error, data){
  if(error) throw error;

  makeChart(data);

});

function makeChart(data){

//fix data
  data.forEach(function(d){
    d["sugars (g)"] = +d["sugars (g)"];
    d["calories"] = +d["calories"];
    d["calcium (g)"] = +d["calcium (g)"];
  });

console.log(data);

  //define accessors as a shortcut
  var xValue = function(d) {
    return d["sugars (g)"];
  }

  var yValue = function(d) {
    return d["calcium (g)"];
  }

  y.domain( [0, d3.max(data, yValue)] ).nice();
  x.domain( [0, d3.max(data, xValue)] ).nice();

  console.log( d3.max(data, xValue) );

  //make color scale using domain of calories
  var color = d3.scale.linear().domain( d3.extent( data, function(d){
    return d["calories"];
    })).range(["lightblue", "darkblue"]);

  //scale to change size with third data point
  var sizeScale = d3.scale.linear()
    .domain( d3.extent( data, function(d) {
      return d["calories"];
    })).range([6, 15]);

  //set up empty html div for tooltip
  var tooltip = d3.select("#graphic").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  //add a go for the x axis

  svg.append("g")
    .attr("class", "x axis")
    //translate the axis to the bottom
    .attr("transform", "translate(0," + chartHeight + ")")
    .call(xAxis)
  //append single text elemnt for label
  .append("text")
    .attr("class", "label")
    .attr("x", chartWidth/2)
    .attr("y", 25)
    //this modifies an svg inline style
    .style("text-anchor", "end")
    .text("Sugars (g)");

  svg.append("g")
    .attr("class", "y axis")
    //do not call transform because we want y axis to start at 0,0
    .call(yAxis)
  //this is just the axis label
  .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "0.71em")
    .style("text-anchor", "end")
    .text("Calcium (g)");

  //select-enter-append pattern
  svg.selectAll(".dot")
      .data(data)
    //append a circle for EACH data
    .enter().append("circle")
      .attr("class", "dot")
      .attr("id", function(d) { return "id-" + d["id"] })
      .attr("r", function(d){ return sizeScale(d["calories"]); })
      //apply scale to the x position of the circle
      .attr("cx", function(d) { return x( d["sugars (g)"] ); })
      //apply scale to y position
      .attr("cy", function(d) { return y( d["calcium (g)"] ); })
      .style("fill", function(d) { return color( d["calories"]); });

  d3.selectAll(".dot")
    .on("mouseover", function(d){
      tooltip.transition()
        .duration(400)
        .style("opacity", 0.9);
      tooltip.html(d["name"])
        .style("left", (x(xValue(d))) + "px")
        .style("top", (y(yValue(d))) + "px");
  });

  d3.selectAll(".dot")
    .on("mouseout", function(d){
      tooltip.transition()
        .style("left", 0)
        .style("top", 0)
        .duration(500)
        .style("opacity", 0);
  });

  //annotation divs
  var annotation = d3.select('#graphic')
      .selectAll(".annotateMe")
      .data(data)
      .enter()
      .append("div")
        .filter( function(d) { return d["calcium (g)"] > 2; })
          .attr("class", "annotateMe")
          .style("top", function(d) {
            //select the target dot from the dom
            var dotID = "id-" + d["id"],
              dot = document.getElementById(dotID),
              //distance between dot and document
              dotOffset = $(dot).offset(),
              //distance between parent and document
              graphicOffset = $('#graphic').offset();
              //the dot offset will be bigger because it is farther away from the top
              //subtract the parent offset from the dot to get the
                 //position of the dot WITHIN the graphic
                 //if you don't subtract you get position of graphic
                 //within the document, which will work with
                 //fixed position but not absolute
              return (dotOffset.top - graphicOffset.top - 50) + "px";
          })
          .style("left", function(d){
            var dotID = "id-" + d["id"],
              dot = document.getElementById(dotID),
                dotOffset = $(dot).offset(),
                graphicOffset = $('#graphic').offset();

              return dotOffset.left - graphicOffset.left - 100 + "px";
          })
          .html(function(d){ return d["name"]; });

};
