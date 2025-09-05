// Set dimensions for the scatter plot
const width = document.getElementById('scatter-plot').clientWidth;
const height = 600;

// Set scales
const widthScale = 90000;
const heightScale = 90000;

// Define dimensions and parameters
let activeCircle = null;
let isZoomed = false;

// Define data holder
let carData = [];

function getCircleCoords(paramX1, paramY1, paramX2, paramY2) {
    const boundingWidth = paramX2 - paramX1;
    const boundingHeight = paramY2 - paramY1;
    const leftX = boundingWidth / 6 + paramX1;
    const topY = boundingHeight / 6 + paramY1;
    const rightX = boundingWidth / 6 * 5 + paramX1;
    const bottomY = boundingHeight / 6 * 5 + paramY1;
    const midX = boundingWidth / 6 * 3 + paramX1;
    const midY = boundingHeight / 6 * 3 + paramY1;

    return [
        { cx: midX, cy: midY, boundingBox: { x1: boundingWidth / 6 * 2 + paramX1, y1: boundingHeight / 6 * 2 + paramY1, x2: boundingWidth / 6 * 4 + paramX1, y2: boundingHeight / 6 * 4 + paramY1 } },
        { cx: leftX, cy: topY, boundingBox: { x1: paramX1, y1: paramY1, x2: boundingWidth / 6 * 2 + paramX1, y2: boundingHeight / 6 * 2 + paramY1 } },
        { cx: rightX, cy: bottomY, boundingBox: { x1: boundingWidth / 6 * 4 + paramX1, y1: boundingHeight / 6 * 4 + paramY1, x2: paramX2, y2: paramY2 } },
        { cx: leftX, cy: bottomY, boundingBox: { x1: paramX1, y1: boundingHeight / 6 * 4 + paramY1, x2: boundingWidth / 6 * 2 + paramX1, y2: paramY2 } },
        { cx: rightX, cy: topY, boundingBox: { x1: boundingWidth / 6 * 4 + paramX1, y1: paramY1, x2: paramX2, y2: boundingHeight / 6 * 2 + paramY1 } },
        { cx: leftX, cy: midY, boundingBox: { x1: paramX1, y1: boundingHeight / 6 * 2 + paramY1, x2: boundingWidth / 6 * 2 + paramX1, y2: boundingHeight / 6 * 4 + paramY1 } },
        { cx: rightX, cy: midY, boundingBox: { x1: boundingWidth / 6 * 4 + paramX1, y1: boundingHeight / 6 * 2 + paramY1, x2: paramX2, y2: boundingHeight / 6 * 4 + paramY1 } },
        { cx: midX, cy: topY, boundingBox: { x1: boundingWidth / 6 * 2 + paramX1, y1: paramY1, x2: boundingWidth / 6 * 4 + paramX1, y2: boundingHeight / 6 * 2 + paramY1 } },
        { cx: midX, cy: bottomY, boundingBox: { x1: boundingWidth / 6 * 2 + paramX1, y1: boundingHeight / 6 * 4 + paramY1, x2: boundingWidth / 6 * 4 + paramX1, y2: paramY2 } }
    ]
}

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

    // Add event listener to the "Add Car" button
    document.getElementById('add-car').addEventListener('click', addCar);

    // Add event listener to the "Remove Car" button
    document.getElementById('remove-car').addEventListener('click', removeCar);

    // Load initial data and render visualization
    d3.json('data/circles.json').then(function(data) {
      // carData = data;
        // carData = setCarData(data);
        carData = data;
        const circlesData = transformData(carData);
        
        updateVisualization(circlesData);
    });
});

function setCarData(data) {
  // Get circle coordinates for level - 1 cars
  const circleCoords = getCircleCoords(0, 0, widthScale, heightScale);

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

  return data;
}

function transformData(data) {
  console.log(data);
  let transformedData = [];

  // Get circle coordinates for level - 1 cars
  const circleCoordsLevel1 = getCircleCoords(0, 0, widthScale, heightScale);

  // sort data by level first (descending order)
  data.sort((a, b) => b.weight - a.weight);

  // How can I only take the top 9 items?
  data = data.slice(0, circleCoordsLevel1.length);

  data.map((level1Data, i) => {
    level1Data.cx = circleCoordsLevel1[i % circleCoordsLevel1.length].cx;
    level1Data.cy = circleCoordsLevel1[i % circleCoordsLevel1.length].cy;
    level1Data.r = level1Data.weight * levelValueFactos.get(level1Data.level);
    level1Data.fill = "lightgreen";
    level1Data.boundingBox = circleCoordsLevel1[i % circleCoordsLevel1.length].boundingBox;
    // level1Data.children = data.filter(d => d.parent === level1Data.name);

    transformedData.push(level1Data);

    if (level1Data.children) {
      const circleCoordsLevel2 = getCircleCoords(
          level1Data.boundingBox.x1, 
          level1Data.boundingBox.y1, 
          level1Data.boundingBox.x2, 
          level1Data.boundingBox.y2
        );

      level1Data.children.sort((a, b) => b.weight - a.weight);

      // How can I only take the top 9 items?
      level1Data.children = level1Data.children.slice(0, circleCoordsLevel2.length);

      level1Data.children.map((level2Data, j) => {
        level2Data.cx = circleCoordsLevel2[j % circleCoordsLevel2.length].cx;
        level2Data.cy = circleCoordsLevel2[j % circleCoordsLevel2.length].cy;
        level2Data.r = level2Data.weight * levelValueFactos.get(level2Data.level);
        level2Data.fill = "blue";
        level2Data.boundingBox = circleCoordsLevel2[j % circleCoordsLevel2.length].boundingBox;

        transformedData.push(level2Data);
      });
    }
  });

  return transformedData;
}

function addCar() {
    // Get the car weight from the input field
    const carWeightInput = document.getElementById('car-weight');
    const carWeight = parseInt(carWeightInput.value);

    // Get the car name from the input field
    const carNameInput = document.getElementById('car-name');
    const carName = carNameInput.value;

    if (!isNaN(carWeight)) {
        const newCar = {
            weight: carWeight,
            name: carName + carWeight,
            level: 1
        };
        carData.push(newCar);
        const circlesData = transformData(carData);
        updateVisualization(circlesData);
    }
}

function removeCar() {
    const carIndexInput = document.getElementById('car-index');
    const carIndex = parseInt(carIndexInput.value);

    console.log(carIndex);

    if (isNaN(carIndex) || !carData[carIndex]) {
       return;
    }

    // remove a car by index
    carData.splice(carIndex, 1);
    const circlesData = transformData(carData);
    updateVisualization(circlesData);
}


function updateVisualization(data) {
    console.log(data);
    updateScatterPlot(data);
}

function updateScatterPlot(data) {
    const t = d3.transition().duration(750);

    // Create scales
    x.domain([0, widthScale]);
    y.domain([0, heightScale]);

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
        .style('opacity', 0)
        // .join('circle')
        .attr("r", d => y(d.r))
        .attr("cx", d => x(d.cx))
        .attr("cy", d => y(d.cy))
        .attr("fill", (d, i) => d.fill)
        .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
        .on("mouseout", function() { d3.select(this).attr("stroke", null); })
        .on('click', function(event, d) {
            // Prevent triggering background click
            event.stopPropagation();

            // Remove previous selection styling
            if (activeCircle) {
                d3.select(activeCircle).classed("selected", false);
            }

            // Add selection styling to clicked circle
            d3.select(this).classed("selected", true);
            activeCircle = this;

            // // Calculate the transform needed to center and zoom on this circle
            // // NOTE: set scale to max of 8.
            // const scale = Math.min(width, height) / (y(d.r)) * (1 - (Math.min(width, height) / Math.max(width, height)));
            // const translateX = width / 2 - scale * x(d.cx);
            // const translateY = height / 2 - scale * y(d.cy);
            // const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);

            // // Animate the zoom using interpolateZoom
            // svg.transition()
            //     .duration(750)
            //     .call(zoom.transform, transform);

            // Calculate the bounding box in screen space
            const x1 = x(d.boundingBox.x1);
            const y1 = y(d.boundingBox.y1);
            const x2 = x(d.boundingBox.x2);
            const y2 = y(d.boundingBox.y2);

            // Calculate the width and height of the bounding box in screen space
            const boxWidth = x2 - x1;
            const boxHeight = y2 - y1;

            // Calculate the scale needed to fit the bounding box in the viewport
            // Adding some padding (0.9) to avoid zooming right to the edges
            const scaleX = (width / boxWidth) * 0.9;
            const scaleY = (height / boxHeight) * 0.9;
            const scale = Math.min(scaleX, scaleY); // Use the smaller scale to ensure the entire box is visible

            // Calculate the center of the bounding box
            const boxCenterX = x1 + boxWidth / 2;
            const boxCenterY = y1 + boxHeight / 2;

            // Calculate the transform needed to center and zoom on the bounding box
            const translateX = width / 2 - scale * boxCenterX;
            const translateY = height / 2 - scale * boxCenterY;
            const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);

            // Animate the zoom using the calculated transform
            svg.transition()
                .duration(750)
                .call(zoom.transform, transform);
            
            isZoomed = true;
                
        })
        .transition(t)
        .style('opacity', 1);

    

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
