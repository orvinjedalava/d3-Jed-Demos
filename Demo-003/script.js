// Set dimensions for the scatter plot
const width = document.getElementById('scatter-plot').clientWidth;
const height = 600;

// Define dimensions and parameters
let activeCircle = null;
let isZoomed = false;

// Define data holder
let carData = [];

// Constants for card x and y coordinates
const circleCoords = [
    { cx: 15000, cy: 15000 },
    { cx: 5000, cy: 5000 },
    { cx: 25000, cy: 25000 },
    { cx: 5000, cy: 25000 },
    { cx: 25000, cy: 5000 },
    { cx: 5000, cy: 15000 },
    { cx: 25000, cy: 15000 },
    { cx: 15000, cy: 5000 },
    { cx: 15000, cy: 25000 }
]

// level value map
const levelValueFactos = new Map();
levelValueFactos.set(1, 1000);
levelValueFactos.set(2, 100);
levelValueFactos.set(3, 10);


// Create SVG for the scatter plot
const svg = d3.select('#scatter-plot')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

// Create a background rect to catch "click outside" events
const background = svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("pointer-events", "all");

// Create a group element for the scatter plot
const g = svg.append('g');

// Define zoom behavior
const zoom = d3.zoom()
    .scaleExtent([1, 40])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    })
    .filter(event => {
        // Disable mousewheel and touch zoom events
        // Only allow programmatic zooming
        return !event.type.includes("wheel") && 
              !event.type.includes("touch") && 
              !event.type.includes("mouse") &&
              !event.type.includes("dblclick");
    });

// Apply zoom behavior to SVG
svg.call(zoom).on("dblclick.zoom", null);

// Store the initial transform for resetting zoom back to original state
const initialTransform = d3.zoomIdentity;

// Create scales
const x = d3.scaleLinear()
    .range([0, width]);

const y = d3.scaleLinear()
    .range([0, height]);

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

    d3.json('data/circles.json').then(function(data) {
        // Sort data by weight (ascending order)
        data.sort((a, b) => b.weight - a.weight);

        // How can I only take the top 9 items?
        data = data.slice(0, circleCoords.length);

        // Then assign positions
        data.forEach((d, i) => {
            d.cx = circleCoords[i % circleCoords.length].cx;
            d.cy = circleCoords[i % circleCoords.length].cy;
            d.r = d.weight * levelValueFactos.get(d.level);
        });

        carData = data;
        
        updateVisualization(carData);
    });
});

function updateVisualization(data) {
    updateScatterPlot(data);
}

function updateScatterPlot(data) {
    const t = d3.transition().duration(750);

    // Create scales
    x.domain([0, 30000]);
    y.domain([0, 30000]);

    // Create cards for each car data point as SVG elements
    const cardGroup = g.selectAll('circle').data(data, d => d.name);

    // Handle elements that need to be removed
    cardGroup.exit().transition(t).style('opacity', 0).remove();

    // Update existing elements' positions
    cardGroup.transition(t)
        .attr("r", d => y(d.r))
        .attr("cx", d => x(d.cx))
        .attr("cy", d => y(d.cy))
        .style('opacity', 1);

    // Handle new elements - append both the group and the rect to new elements only
    const enterSelection = cardGroup.enter().append('circle')
        .join('circle')
          .attr("r", d => y(d.r))
          .attr("cx", d => x(d.cx))
          .attr("cy", d => y(d.cy))
          .attr("fill", (d, i) => "lightgreen")
          .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
          .on("mouseout", function() { d3.select(this).attr("stroke", null); });

    enterSelection.on('click', function(event, d) {
        // Prevent triggering background click
        event.stopPropagation();

        // Remove previous selection styling
        if (activeCircle) {
            d3.select(activeCircle).classed("selected", false);
        }

        // Add selection styling to clicked circle
        d3.select(this).classed("selected", true);
        activeCircle = this;

        // Calculate the transform needed to center and zoom on this circle
        // NOTE: set scale to max of 8.
        const scale = Math.min(width, height) / (y(d.r)) * (1 - (Math.min(width, height) / Math.max(width, height)));
        const translateX = width / 2 - scale * x(d.cx);
        const translateY = height / 2 - scale * y(d.cy);
        const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);

        // Animate the zoom using interpolateZoom
        svg.transition()
            .duration(750)
            .call(zoom.transform, transform);
        
        isZoomed = true;
            
    });

    // Handle background click - zoom out
    background.on("click", function() {
        if (isZoomed) {
            // Remove selection styling
            if (activeCircle) {
                d3.select(activeCircle).classed("selected", false);
                activeCircle = null;
            }
            
            // Animate back to the initial view
            svg.transition()
                .duration(750)
                .call(zoom.transform, initialTransform);
            
            isZoomed = false;
        }
    });
    
    // Now apply the transition
    enterSelection.transition(t)
        .style('opacity', 1);
}

// Function removed as car cards are now integrated into the scatter plot
