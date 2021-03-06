d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
  this.parentNode.appendChild(this);
  });
};

var margin = {
  top: 10,
  bottom: 80,
  right: 50,
  left: 60
};

var divWidth = window.innerWidth,
  //define inner width for main graphic
  //when we define svg we will use main width
  chartWidth = divWidth - margin.left - margin.right,
  divHeight = 0.45 * divWidth,
  chartHeight = divHeight - margin.top - margin.bottom;

//x scale
//offset by 6 to clear axis
var x = d3.scale.linear()
  .range([6, chartWidth]);

//height range is inverted b/c svg
var y = d3.scale.linear()
  .range([chartHeight-6, 0]);

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

d3.csv("data/cereals.csv", function(error, data){
  if(error) throw error;

  //populate that dropdown with the data
  var options = $("#nameChooser");

  $.each(data,function(){
    options.append($("<option />").val(this.id).text(this.name));
  });

  makeChart(data);
});




function makeChart(data){
//get values from selects
  var ySelected = $('#yAxisSelector').val(),
      xSelected = $('#xAxisSelector').val();

//fix data
  data.forEach(function(d){
    d["sugars (g)"] = +d["sugars (g)"];
    d["calories"] = +d["calories"];
    d["calcium (g)"] = +d["calcium (g)"];
  });

console.log(data);

  //define accessors as a shortcut
  var xValue = function(d) {
    return d[xSelected];
  }

  var yValue = function(d) {
    return d[ySelected];
  }

  //input range
  y.domain( [0, d3.max(data, yValue)] ).nice();
  x.domain( [0, d3.max(data, xValue)] ).nice();

  //make color scale using domain of calories
  var color = d3.scale.linear().domain( d3.extent( data, function(d){
    return d["calories"];
    })).range(["lightblue", "darkblue"]);

  //set up empty html div for tooltip
  var tooltip = d3.select("#graphic").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  //add a group for the x axis
  svg.append("g")
    .attr("class", "x axis")
    //translate the axis to the bottom
    .attr("transform", "translate(0," + chartHeight + ")")
    .call(xAxis)
  //append single text element for label
  .append("text")
    .attr("class", "xlabel")
    .attr("x", chartWidth/2)
    .attr("y", 35)
    //this modifies an svg inline style
    .style("text-anchor", "end")
    .text(xSelected);

  svg.append("g")
    .attr("class", "y axis")
    //do not call transform because we want y axis to start at 0,0
    .call(yAxis)
  //this is just the axis label
  .append("text")
    .attr("class", "ylabel")
    .attr("transform", "rotate(-90)")
    //move it 55 px behind the axis
    .attr("y", -55)
    .attr("dy", "0.71em")
    .style("text-anchor", "end")
    .text("Calcium (g)");

  //select-enter-append
  svg.selectAll(".dot")
      .data(data)
    //append a circle for EACH data
    .enter().append("circle")
      .attr("class", "dot")
      //give each circle a unique id for mouse events
      .attr("id", function(d) { return "id-" + d["id"] })
      .attr("r", function(d){ return 6; })
      //apply scale to the x position of the circle
      .attr("cx", function(d) { return x( d[xSelected] ); })
      //apply scale to y position
      .attr("cy", function(d) { return y( d[ySelected] ); })
      .style("fill", function(d) { return color( d["calories"]); });

//helper function to keep tooltip in page
function stayInPage(num){
  if(num < 0){
    return 0;
  } return num;
}

  d3.selectAll(".dot")
    .on("mouseover", function(d){
      var circle = d3.select(this);
      //movetofront
      circle.moveToFront();

      //make tooltip visible
      tooltip.transition()
        .style("opacity", 0.8);

      //convenience helpers
      var xposition = circle.attr("cx") - 20,
          yposition = circle.attr("cy") - 10;

      tooltip.html(d["name"])
        //use scale positioning of data to position tooltip
        .style("left", stayInPage(xposition) + "px")
        .style("top", yposition + "px");
  });

  d3.selectAll(".dot")
    .on("mouseout", function(d){
      tooltip.transition()
        .style("opacity", 0);
  });

    //y axis select
    d3.select('#yAxisSelector').on("change", function() {
      //reset selectors
      var xSelection = $('#xAxisSelector').val(),
        ySelection = this.value;

      //coerce that shit
      data.forEach(function(d){
        d[ySelection] = +d[ySelection];
      });

      //reset the domain
      y.domain(d3.extent(data, function(d){
        return d[ySelection]; }));

      x.domain(d3.extent(data, function(d){
        return d[xSelection]; }));

      //reset the axis scale
      yAxis.scale(y);

      //call the axis again
      svg.transition().select(".y.axis")
        .call(yAxis);

      //change the label
      svg.transition().select(".y.axis")
          .select(".ylabel")
          .text(function(d){ return ySelection; });

      //move the dots
      svg.selectAll(".dot")
        .data(data)
        .transition()
        .attr("cy", function(d){ return y( d[ySelection] ); });

    });//end of event

//x axis selector
  //y axis select
  d3.select('#xAxisSelector').on("change", function() {
    //reset selectors
    var ySelection = $('#yAxisSelector').val(),
      xSelection = this.value;

    //coerce that shit
    data.forEach(function(d){
      d[xSelection] = +d[xSelection];
    });

    //reset the domain
    y.domain(d3.extent(data, function(d){
      return d[ySelection]; }));

    x.domain(d3.extent(data, function(d){
      return d[xSelection]; }));

    //reset the axis scale
    xAxis.scale(x);

    //call the axis again
    svg.transition().select(".x.axis")
      .call(xAxis);

    //change the label
    svg.transition().select(".x.axis")
        .select(".xlabel")
        .text(function(d){ return xSelection; });

    //move the dots
    svg.selectAll(".dot")
      .data(data)
      .transition()
      .attr("cx", function(d){ return x( d[xSelection] ); }); //call function after transition

  });//end of event

  d3.select("#nameChooser").on("change", function(){
    var name = this.value;
    var dots = svg.selectAll(".dot");
    //set all the dots style to what they should be

    dots
      .classed("highlighted", false)
      .attr("r", 6)
      .style("fill", function(d, i){
      console.log(d);
      return color ( d["calories"] );
    });


    //highlight this sucker and make it larger
    d3.select("#id-" + name)
      .classed("highlighted", true)
      .style("fill", "yellow")
      .attr("r", 10)
      .moveToFront();
  });


};
