let dataset, svg;
let reductionSizeScale, reductionXScale, secteurColorScale;
let simulation, nodes;
let secteurLegend, reductionLegend;

const secteurs = [
  "Énergie",
  "Transport",
  "Bioalimentaire",
  "Sol",
  "Femmes",
  "Urbanisme",
  "Matériau",
];

// [x, y, moyenneReduction, %sweetspot]
const secteursXY = {
  Bioalimentaire: [100, 200, 20.12, 0.875],
  Énergie: [100, 400, 17.58, 0.571],
  Urbanisme: [100, 600, 5.54, 0.917],
  Transport: [100, 800, 4.16, 0.636],
  Sol: [500, 200, 16.52, 1.0],
  Matériau: [500, 400, 15.97, 0.857],
  Femmes: [500, 600, 40.42, 0.666],
};

const margin = { left: 170, top: 50, bottom: 50, right: 20 };
const width = 1000 - margin.left - margin.right;
const height = 950 - margin.top - margin.bottom;

//Read Data, convert numerical secteurs into floats
//Create the initial visualisation

d3.csv("data_p10.csv", function (d) {
  return {
    Solutions: d.Solutions_climatiques,
    Secteurs: d.Secteurs,
    Reduction: +d.Reduction_CO2,
    HistCol: +d.HistCol,
  };
}).then((data) => {
  dataset = data;
  console.log(dataset);
  createScales();
  setTimeout(drawInitial(), 100);
});

const colors = [
  "#66c2a5",
  "#fc8d62",
  "#8da0cb",
  "#e78ac3",
  "#a6d854",
  "#ffd92f",
  "#e5c494",
];

//Create all the scales and save to global variables

function createScales() {
  reductionSizeScale = d3.scaleLinear(
    d3.extent(dataset, (d) => d.Reduction),
    [5, 35]
  );
  reductionXScale = d3.scaleLinear(
    d3.extent(dataset, (d) => d.Reduction),
    [margin.left, margin.left + width + 250]
  );
  secteurColorScale = d3.scaleOrdinal(secteurs, colors);

  histXScale = d3.scaleLinear(
    d3.extent(dataset, (d) => d.HistCol),
    [margin.left, margin.left + width]
  );
  histYScale = d3.scaleLinear(
    d3.extent(dataset, (d) => d.Reduction),
    [margin.top + height, margin.top]
  );
}

function createLegend(x, y) {
  let svg = d3.select("#legend2");

  svg
    .append("g")
    .attr("class", "secteurLegend")
    .attr("transform", `translate(${x + 100},${y})`);

  secteurLegend = d3
    .legendColor()
    .shape("path", d3.symbol().type(d3.symbolCircle).size(300)())
    .shapePadding(10)
    .scale(secteurColorScale);

  d3.select(".secteurLegend").call(secteurLegend);
}

function createSizeLegend() {
  let svg = d3.select("#legend");
  svg
    .append("g")
    .attr("class", "sizeLegend")
    .attr("transform", `translate(100,50)`);

  sizeLegend = d3
    .legendSize()
    .scale(reductionSizeScale)
    .shape("circle")
    .shapePadding(15)
    /*.title("Réduction prévue pour 2050 (%, Gtonnes") */
    .cells(7);

  d3.select(".sizeLegend").call(sizeLegend);
}

// All the initial elements should be create in the drawInitial function
// As they are required, their attributes can be modified
// They can be shown or hidden using their 'opacity' attribute
// Each element should also have an associated class name for easy reference

function drawInitial() {
  createSizeLegend();

  let svg = d3
    .select("#vis")
    .append("svg")
    .attr("width", 1000)
    .attr("height", 950)
    .attr("opacity", 1);

  let xAxis = d3
    .axisBottom(reductionXScale)
    .ticks(4)
    .tickSize(height + 80);

  let xAxisGroup = svg
    .append("g")
    .attr("class", "first-axis")
    .attr("transform", "translate(0, 0)")
    .call(xAxis)
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line"))
    .attr("stroke-opacity", 0.2)
    .attr("stroke-dasharray", 2.5);

  // Instantiates the force simulation
  // Has no forces. Actual forces are added and removed as required

  simulation = d3.forceSimulation(dataset);

  // Define each tick of simulation
  simulation.on("tick", () => {
    nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });

  // Stop the simulation until later
  simulation.stop();

  // Selection of all the circles
  nodes = svg
    .selectAll("circle")
    .data(dataset)
    .enter()
    .append("circle")
    .attr("fill", "black")
    .attr("r", 3)
    .attr("cx", (d, i) => reductionXScale(d.Reduction) + 5)
    .attr("cy", (d, i) => i * 5.2 + 30)
    .attr("opacity", 0.8);

  // Add mouseover and mouseout events for all circles
  // Changes opacity and adds border
  svg.selectAll("circle").on("mouseover", mouseOver).on("mouseout", mouseOut);

  function mouseOver(d, i) {
    console.log("hi");
    d3.select(this)
      .transition("mouseover")
      .duration(100)
      .attr("opacity", 1)
      .attr("stroke-width", 5)
      .attr("stroke", "black");

    d3
      .select("#tooltip")
      .style("left", d3.event.pageX + 10 + "px")
      .style("top", d3.event.pageY - 25 + "px")
      .style("display", "inline-block").html(`<strong>Solutions:</strong> ${
      d.Solutions[0] + d.Solutions.slice(1).toLowerCase()
    } 
                <br> <strong>Reduction CO2 (%Gtonnes):</strong>${d3.format(
                  ",.2r"
                )(d.Reduction)} 
                <br> <strong>Secteurs:</strong> ${d.Secteurs}`);
  }

  function mouseOut(d, i) {
    d3.select("#tooltip").style("display", "none");

    d3.select(this)
      .transition("mouseout")
      .duration(100)
      .attr("opacity", 0.8)
      .attr("stroke-width", 0);
  }

  //Small text label for first graph

  svg
    .selectAll(".small-text")
    .data(dataset)
    .enter()
    .append("text")
    .text((d, i) => d.Solutions.toLowerCase())
    .attr("class", "small-text")
    .attr("x", margin.left)
    .attr("y", (d, i) => i * 12 + 30)
    .attr("font-size", 10)
    .attr("text-anchor", "end");

  //All the required components for the small multiples charts
  //Initialises the text and rectangles, and sets opacity to 0
  svg
    .selectAll(".cat-rect")
    .data(secteurs)
    .enter()
    .append("rect")
    .attr("class", "cat-rect")
    .attr("x", (d) => secteursXY[d][0] + 120 + 1000)
    .attr("y", (d) => secteursXY[d][1] + 30)
    .attr("width", 160)
    .attr("height", 30)
    .attr("opacity", 0)
    .attr("fill", "grey");

  svg
    .selectAll(".lab-text")
    .data(secteurs)
    .enter()
    .append("text")
    .attr("class", "lab-text")
    .attr("opacity", 0)
    .raise();

  svg
    .selectAll(".lab-text")
    .text((d) => `Average: $${d3.format(",.2r")(secteursXY[d][2])}`)
    .attr("x", (d) => secteursXY[d][0] + 200 + 1000)
    .attr("y", (d) => secteursXY[d][1] - 500)
    .attr("font-family", "Domine")
    .attr("font-size", "12px")
    .attr("font-weight", 700)
    .attr("fill", "black")
    .attr("text-anchor", "middle");

  svg
    .selectAll(".lab-text")
    .on("mouseover", function (d, i) {
      d3.select(this).text(d);
    })
    .on("mouseout", function (d, i) {
      d3.select(this).text(
        (d) => `Moyenne de réduction: $${d3.format(",.2r")(secteursXY[d][2])}`
      );
    });

  // Best fit line for gender scatter plot
  /*----------------------------------------------------------------
  const bestFitLine = [
    { x: 0, y: 56093 },
    { x: 1, y: 25423 },
  ];
  const lineFunction = d3
    .line()
    .x((d) => shareWomenXScale(d.x))
    .y((d) => salaryYScale(d.y));

  // Axes for Scatter Plot
  svg
    .append("path")
    .transition("best-fit-line")
    .duration(430)
    .attr("class", "best-fit")
    .attr("d", lineFunction(bestFitLine))
    .attr("stroke", "grey")
    .attr("stroke-dasharray", 6.2)
    .attr("opacity", 0)
    .attr("stroke-width", 3);

  let scatterxAxis = d3.axisBottom(shareWomenXScale);
  let scatteryAxis = d3.axisLeft(salaryYScale).tickSize([width]);

  svg
    .append("g")
    .call(scatterxAxis)
    .attr("class", "scatter-x")
    .attr("opacity", 0)
    .attr("transform", `translate(0, ${height + margin.top})`)
    .call((g) => g.select(".domain").remove());

  svg
    .append("g")
    .call(scatteryAxis)
    .attr("class", "scatter-y")
    .attr("opacity", 0)
    .attr("transform", `translate(${margin.left - 20 + width}, 0)`)
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line"))
    .attr("stroke-opacity", 0.2)
    .attr("stroke-dasharray", 2.5);

  // Axes for Histogram

  let histxAxis = d3.axisBottom(enrollmentScale);

  svg
    .append("g")
    .attr("class", "enrolment-axis")
    .attr("transform", "translate(0, 700)")
    .attr("opacity", 0)
    .call(histxAxis);
    ------------------------------------------------------------------*/
}

//Cleaning Function
//Will hide all the elements which are not necessary for a given chart type

function clean(chartType) {
  let svg = d3.select("#vis").select("svg");
  if (chartType !== "isScatter") {
    svg.select(".scatter-x").transition().attr("opacity", 0);
    svg.select(".scatter-y").transition().attr("opacity", 0);
    svg.select(".best-fit").transition().duration(200).attr("opacity", 0);
  }
  if (chartType !== "isMultiples") {
    svg.selectAll(".lab-text").transition().attr("opacity", 0).attr("x", 1800);
    svg.selectAll(".cat-rect").transition().attr("opacity", 0).attr("x", 1800);
  }
  if (chartType !== "isFirst") {
    svg.select(".first-axis").transition().attr("opacity", 0);
    svg
      .selectAll(".small-text")
      .transition()
      .attr("opacity", 0)
      .attr("x", -200);
  }
  if (chartType !== "isHist") {
    svg.selectAll(".hist-axis").transition().attr("opacity", 0);
  }
  if (chartType !== "isBubble") {
    svg.select(".enrolment-axis").transition().attr("opacity", 0);
  }
}

//First draw function

function draw1() {
  //Stop simulation
  simulation.stop();

  let svg = d3
    .select("#vis")
    .select("svg")
    .attr("width", 1000)
    .attr("height", 950);

  clean("isFirst");

  d3.select(".secteurLegend").transition().remove();

  svg.select(".first-axis").attr("opacity", 1);

  svg
    .selectAll("circle")
    .transition()
    .duration(500)
    .delay(100)
    .attr("fill", "black")
    .attr("r", 3)
    .attr("cx", (d, i) => reductionXScale(d.Reduction) + 50)
    .attr("cy", (d, i) => i * 12 + 30);

  svg
    .selectAll(".small-text")
    .transition()
    .attr("opacity", 1)
    .attr("x", margin.left + 50)
    .attr("y", (d, i) => i * 12 + 30);
}

function draw2() {
  let svg = d3.select("#vis").select("svg");

  clean("none");

  svg
    .selectAll("circle")
    .transition()
    .duration(300)
    .delay((d, i) => i * 5)
    .attr("r", (d) => reductionSizeScale(d.Reduction) * 1.2)
    .attr("fill", (d) => secteurColorScale(d.Secteurs));

  simulation
    .force("charge", d3.forceManyBody().strength([2]))
    .force(
      "forceX",
      d3.forceX((d) => secteursXY[d.Secteurs][0] + 200)
    )
    .force(
      "forceY",
      d3.forceY((d) => secteursXY[d.Secteurs][1] - 50)
    )
    .force(
      "collide",
      d3.forceCollide((d) => reductionSizeScale(d.Reduction) + 4)
    )
    .alphaDecay([0.02]);

  //Reheat simulation and restart
  simulation.alpha(0.9).restart();

  createLegend(20, 50);
}

function draw3() {
  let svg = d3.select("#vis").select("svg");
  clean("isMultiples");

  svg
    .selectAll("circle")
    .transition()
    .duration(400)
    .delay((d, i) => i * 5)
    .attr("r", (d) => reductionSizeScale(d.Reduction) * 1.6)
    .attr("fill", (d) => secteurColorScale(d.Secteurs));

  svg
    .selectAll(".cat-rect")
    .transition()
    .duration(300)
    .delay((d, i) => i * 30)
    .attr("opacity", 0.2)
    .attr("x", (d) => secteursXY[d][0] + 120);

  svg
    .selectAll(".lab-text")
    .transition()
    .duration(300)
    .delay((d, i) => i * 30)
    .text((d) => `Réduction moyenne: ${d3.format(",.2r")(secteursXY[d][2])}`)
    .attr("x", (d) => secteursXY[d][0] + 200)
    .attr("y", (d) => secteursXY[d][1] + 50)
    .attr("opacity", 1);

  svg
    .selectAll(".lab-text")
    .on("mouseover", function (d, i) {
      d3.select(this).text(d);
    })
    .on("mouseout", function (d, i) {
      d3.select(this).text(
        (d) => `Réduction moyenne: ${d3.format(",.2r")(secteursXY[d][2])}`
      );
    });

  simulation
    .force("charge", d3.forceManyBody().strength([2]))
    .force(
      "forceX",
      d3.forceX((d) => secteursXY[d.Secteurs][0] + 200)
    )
    .force(
      "forceY",
      d3.forceY((d) => secteursXY[d.Secteurs][1] - 50)
    )
    .force(
      "collide",
      d3.forceCollide((d) => reductionSizeScale(d.Reduction) * 1.6 + 2)
    )
    .alpha(0.7)
    .alphaDecay(0.02)
    .restart();
}

function draw5() {
  let svg = d3.select("#vis").select("svg");
  clean("isMultiples");

  simulation
    .force(
      "forceX",
      d3.forceX((d) => secteursXY[d.Secteurs][0] + 200)
    )
    .force(
      "forceY",
      d3.forceY((d) => secteursXY[d.Secteurs][1] - 50)
    )
    .force(
      "collide",
      d3.forceCollide((d) => reductionSizeScale(d.Reduction) + 4)
    );

  simulation.alpha(1).restart();

  svg
    .selectAll(".lab-text")
    .transition()
    .duration(300)
    .delay((d, i) => i * 30)
    .text((d) => `% Female: ${secteursXY[d][3]}%`)
    .attr("x", (d) => secteursXY[d][0] + 200)
    .attr("y", (d) => secteursXY[d][1] + 50)
    .attr("opacity", 1);

  svg
    .selectAll(".lab-text")
    .on("mouseover", function (d, i) {
      d3.select(this).text(d);
    })
    .on("mouseout", function (d, i) {
      d3.select(this).text((d) => `% Female: ${secteursXY[d][3]}%`);
    });

  svg
    .selectAll(".cat-rect")
    .transition()
    .duration(300)
    .delay((d, i) => i * 30)
    .attr("opacity", 0.2)
    .attr("x", (d) => secteursXY[d][0] + 120);

  svg
    .selectAll("circle")
    .transition()
    .duration(400)
    .delay((d, i) => i * 4)
    .attr("fill", colorByGender)
    .attr("r", (d) => reductionSizeScale(d.Reduction));
}

function colorByGender(d, i) {
  if (d.ShareWomen < 0.4) {
    return "blue";
  } else if (d.ShareWomen > 0.6) {
    return "red";
  } else {
    return "grey";
  }
}

function draw6() {
  simulation.stop();

  let svg = d3.select("#vis").select("svg");
  clean("isScatter");

  svg
    .selectAll(".scatter-x")
    .transition()
    .attr("opacity", 0.7)
    .selectAll(".domain")
    .attr("opacity", 1);
  svg
    .selectAll(".scatter-y")
    .transition()
    .attr("opacity", 0.7)
    .selectAll(".domain")
    .attr("opacity", 1);

  svg
    .selectAll("circle")
    .transition()
    .duration(800)
    .ease(d3.easeBack)
    .attr("cx", (d) => shareWomenXScale(d.ShareWomen))
    .attr("cy", (d) => salaryYScale(d.Reduction));

  svg
    .selectAll("circle")
    .transition(1600)
    .attr("fill", colorByGender)
    .attr("r", 10);

  svg.select(".best-fit").transition().duration(300).attr("opacity", 0.5);
}

function draw7() {
  let svg = d3.select("#vis").select("svg");

  clean("isBubble");

  simulation
    .force(
      "forceX",
      d3.forceX((d) => enrollmentScale(d.Total))
    )
    .force("forceY", d3.forceY(500))
    .force(
      "collide",
      d3.forceCollide((d) => enrollmentSizeScale(d.Total) + 2)
    )
    .alpha(0.8)
    .alphaDecay(0.05)
    .restart();

  svg
    .selectAll("circle")
    .transition()
    .duration(300)
    .delay((d, i) => i * 4)
    .attr("r", (d) => enrollmentSizeScale(d.Total))
    .attr("fill", (d) => secteurColorScale(d.Secteurs));

  //Show enrolment axis (remember to include domain)
  svg
    .select(".enrolment-axis")
    .attr("opacity", 0.5)
    .selectAll(".domain")
    .attr("opacity", 1);
}

function draw4() {
  let svg = d3.select("#vis").select("svg");

  clean("isHist");

  simulation.stop();

  svg
    .selectAll("circle")
    .transition()
    .duration(600)
    .delay((d, i) => i * 2)
    .ease(d3.easeBack)
    .attr("r", 20)
    .attr("cx", (d) => histXScale(d.HistCol))
    .attr("cy", (d) => histYScale(d.Reduction))
    .attr("fill", (d) => secteurColorScale(d.Secteurs));

  let xAxis = d3.axisBottom(histXScale);
  svg
    .append("g")
    .attr("class", "hist-axis")
    .attr("transform", `translate(0, ${height + margin.top + 10})`)
    .call(xAxis);

  svg.selectAll(".lab-text").on("mouseout");
}

function draw8() {
  clean("none");

  let svg = d3.select("#vis").select("svg");
  svg
    .selectAll("circle")
    .transition()
    .attr("r", (d) => reductionSizeScale(d.Reduction) * 3)
    .attr("fill", (d) => secteurColorScale(d.Secteurs));

  simulation
    .force("forceX", d3.forceX(500))
    .force("forceY", d3.forceY(500))
    .force(
      "collide",
      d3.forceCollide((d) => reductionSizeScale(d.Reduction) * 3 + 4)
    )
    .alpha(0.6)
    .alphaDecay(0.05)
    .restart();

  createLegend(20, 50);
}

//Array of all the graph functions
//Will be called from the scroller functionality

let activationFunctions = [
  draw1,
  draw8,
  /* draw2,*/
  draw3,
  draw4,
  /* draw5,
  draw6,
  draw7,*/
  draw8,
];

//All the scrolling function
//Will draw a new graph based on the index provided by the scroll

let scroll = scroller().container(d3.select("#graphic"));
scroll();

let lastIndex,
  activeIndex = 0;

scroll.on("active", function (index) {
  d3.selectAll(".step")
    .transition()
    .duration(500)
    .style("opacity", function (d, i) {
      return i === index ? 1 : 0.1;
    });

  activeIndex = index;
  let sign = activeIndex - lastIndex < 0 ? -1 : 1;
  let scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
  scrolledSections.forEach((i) => {
    activationFunctions[i]();
  });
  lastIndex = activeIndex;
});

scroll.on("progress", function (index, progress) {
  if ((index == 2) & (progress > 0.7)) {
  }
});
