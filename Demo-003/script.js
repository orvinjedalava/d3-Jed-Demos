// Set dimensions for the scatter plot
const width = document.getElementById('scatter-plot').clientWidth;
const height = 600;
const animationDuration = 750;

// Set scales
const widthScale = 90000;
const heightScale = 90000;

// Fill Colors
const fillColors = ["lightgreen", "blue", "red", "lightgoldenrodyellow", "lightpink", "lightgray"];

// Define dimensions and parameters
let activeCircle = null;

// Define active circles stack
const activeCircleStack = [];

// Define data holder
let carData = [];

// level value map
const levelValueFactos = new Map();
levelValueFactos.set(1, 1000);
levelValueFactos.set(2, 100);
levelValueFactos.set(3, 10);

// At the top of your file with other globals
let idCounter = 1;

// When you need a new ID
function generateId() {
  return idCounter++;
}

// circles map. Will contain id: number as key, and circle element as value
const circlesMap = new Map();

// parent child id map
const parentChildMap = new Map();

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
        const circlesData = setCarData(carData);
        
        updateVisualization(circlesData);
    });
});

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

function setCarData(data) {
  let transformedData = [];

  transformData(data, transformedData);

  return transformedData;
}

function transformData(rootArray, containerData, rootId = 0, fillColorIndex = 0, x1 = 0, y1 = 0, x2 = widthScale, y2 = heightScale) {
    // Get circle coordinates for level - 1 cars
    const circleCoords = getCircleCoords(x1, y1, x2, y2);

    // sort data by level first (descending order)
    rootArray.sort((a, b) => b.weight - a.weight);

    // How can I only take the top 9 items?s
    rootArray = rootArray.slice(0, circleCoords.length);

    rootArray.map((parent, i) => {
        parent.id = generateId();
        
        // if rootId exists as key in parentChildMap, add this parent id to its array
        if (parentChildMap.has(rootId)) {
          parentChildMap.get(rootId).push(parent.id);
        }

        parent.cx = circleCoords[i % circleCoords.length].cx;
        parent.cy = circleCoords[i % circleCoords.length].cy;
        parent.r = parent.weight * levelValueFactos.get(parent.level);
        parent.fill = fillColors[fillColorIndex % fillColors.length];
        parent.boundingBox = circleCoords[i % circleCoords.length].boundingBox;
        
        containerData.push(parent);

        if (parent.children) {
            parentChildMap.set(parent.id, []);
            transformData(
                parent.children,
                containerData,
                parent.id,
                fillColorIndex + 1,
                parent.boundingBox.x1,
                parent.boundingBox.y1,
                parent.boundingBox.x2,
                parent.boundingBox.y2
            );
        }
    });

  return containerData;
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
        const circlesData = setCarData(carData);
        updateVisualization(circlesData);
    }
}

function removeCar() {
    const carIndexInput = document.getElementById('car-index');
    const carIndex = parseInt(carIndexInput.value);

    if (isNaN(carIndex) || !carData[carIndex]) {
       return;
    }

    // remove a car by index
    carData.splice(carIndex, 1);
    const circlesData = setCarData(carData);
    updateVisualization(circlesData);
}


function updateVisualization(data) {
    updateScatterPlot(data);
}

function removeActiveCircleStyling() {
    if (activeCircle) {
        d3.select(activeCircle).classed("selected", false);
        activeCircle = null;
    }
}

function zoomTo(circle) {
    // Remove previous selection styling
    removeActiveCircleStyling();

    // Calculate the transform needed to center and zoom on this circle
    let transform = initialTransform;

    if (circle) {
      const currentData = d3.select(circle).datum();
      // Add selection styling to clicked circle
      d3.select(circle).classed("selected", true);
      activeCircle = circle;

      // Calculate the bounding box in screen space
      const x1 = x(currentData.boundingBox.x1);
      const y1 = y(currentData.boundingBox.y1);
      const x2 = x(currentData.boundingBox.x2);
      const y2 = y(currentData.boundingBox.y2);

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
      transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
    }

    // Animate the zoom using the calculated transform
    svg.transition()
        .duration(animationDuration)
        .call(zoom.transform, transform);
}

function zoomToSibling(circle) {
    // remove latest from stack
    activeCircleStack.pop();

    zoomTo(circle);
}

function zoomToRoot() {
    zoomTo(null);
}

function zoomToParent() {
    if (activeCircleStack.length > 0) {
        // remove latest circle from stack
        activeCircleStack.pop();
    }

    zoomToLatest();
}

function zoomToLatest() {
  if (activeCircleStack.length === 0) {
      zoomToRoot();
  }
  else {
      const newActiveCircle = activeCircleStack[activeCircleStack.length - 1];
      zoomTo(newActiveCircle);
  }
}

function zoomToChild(circle) {
  activeCircleStack.push(circle);
  zoomTo(circle);
}

function isLatest(circle) {
    return activeCircleStack.length > 0 && activeCircleStack[activeCircleStack.length - 1] === circle;
}

const circleMap = new WeakMap();

function updateScatterPlot(data) {
    const t = d3.transition().duration(animationDuration);

    // Create scales
    x.domain([0, widthScale]);
    y.domain([0, heightScale]);

    // Create cards for each car data point as SVG elements
    const cardGroup = g.selectAll('circle').data(data, d => d.id);

    // Handle elements that need to be removed
    cardGroup.exit()
    .each(function(d) {
        // Remove the reference from the map when a circle is removed
        circlesMap.delete(d.id);
    })
    .transition(t)
      .style('opacity', 0).remove();

    // Update existing elements' positions
    cardGroup
    .transition(t)
        .attr("r", d => y(d.r))
        .attr("cx", d => x(d.cx))
        .attr("cy", d => y(d.cy))
        .style('opacity', 1);

    // Handle new elements - append both the group and the rect to new elements only
    const enterSelection = cardGroup.enter().append('circle')
        .style('opacity', 0)
        .attr("r", d => y(d.r))
        .attr("cx", d => x(d.cx))
        .attr("cy", d => y(d.cy))
        .attr("fill", (d, i) => d.fill)
        .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
        .on("mouseout", function() { d3.select(this).attr("stroke", null); })
        .each(function(d) {
            // Store reference to this circle element in the circlesMap
            // using the data item's id as the key
            circlesMap.set(d.id, this);
        })
        .on('click', function(event, d) {
            // Prevent triggering background click
            event.stopPropagation();

            const latestStackCircle = activeCircleStack.length > 0 ? activeCircleStack[activeCircleStack.length - 1] : null;

            // Clicked the already active circle, do nothing
            if (latestStackCircle === this) {
                return;
            }

            // Zoom to clicked circle if stack is empty.
            if (!latestStackCircle) {
                zoomToChild(this);
                return;
            }

            const lastDataCircle = d3.select(latestStackCircle).datum();

            if (d.level <= lastDataCircle.level) {
              zoomToParent();
            }
            else if (d.level === lastDataCircle.level) {
              zoomToSibling(this);
            }
            else {
              zoomToChild(this);
            }

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
    
        })
        .transition(t)
        .style('opacity', 1);

    

    // Handle background click - zoom out
    background.on("click", function() {
        zoomToParent();
    });
    
    // Now apply the transition
    enterSelection.transition(t)
        .style('opacity', 1);
}

// Function removed as car cards are now integrated into the scatter plot
