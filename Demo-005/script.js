// Set dimensions for the scatter plot
const width = document.getElementById('scatter-plot').clientWidth;
const height = 600;
const animationDuration = 750;

// Set scales
const widthScale = 90000;
const heightScale = 90000;

// Define card dimensions
const cardWidth = 80;
const cardHeight = 100;
const imageHeight = 60;

// Fill Colors
const fillColors = ["lightgreen", "blue", "red", "lightgoldenrodyellow", "lightpink", "lightgray"];

// Define dimensions and parameters
let activeCircle = null;

// Define active circles stack
const activeCircleStack = [];

// Define data holder
let jsonData = [];

// level value map
const levelValueFactors = new Map();
levelValueFactors.set(1, 1000);
levelValueFactors.set(2, 100);
levelValueFactors.set(3, 10);

// At the top of your file with other globals
let idCounter = 1;

// When you need a new ID
function generateId() {
  return idCounter++;
}

// circles map. Will contain id: number as key, and circle element as value
const circlesMap = new Map();

// root to leafs
const rootToLeavesMap = new Map();
rootToLeavesMap.set(0, []); // root id 0

// leaf to root
const leafToRootMap = new Map();

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
        
        jsonData = data;
        assignIds(jsonData);

        updateVisualization(setCircleData(jsonData));
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

function setCircleData(data) {
  let transformedData = [];

  transformData(data, transformedData);

  console.log(rootToLeavesMap);
  console.log(leafToRootMap);
  
  return transformedData;
}

function assignIds(data) {
    data.forEach(item => {
        if (!item.id) {
            item.id = generateId();
        }

        if (item.children) {
            assignIds(item.children);
        }
    });
}

function transformData(leaves, containerData, rootId = 0, fillColorIndex = 0, x1 = 0, y1 = 0, x2 = widthScale, y2 = heightScale) {
    // Get circle coordinates for level - 1 cars
    const circleCoords = getCircleCoords(x1, y1, x2, y2);

    // sort data by level first (descending order)
    leaves.sort((a, b) => b.weight - a.weight);

    // How can I only take the top 9 items?
    leaves = leaves.slice(0, circleCoords.length);

    // Create root id map entry.
    rootToLeavesMap.set(rootId, []);

    leaves.map((leaf, i) => {
        // leaf.id = generateId();
        
        // if rootId exists as key in rootToLeavesMap, add this parent id to its array
        // if (rootToLeavesMap.has(rootId)) {
        //   rootToLeavesMap.get(rootId).push(leaf.id);
        // }
        rootToLeavesMap.get(rootId).push(leaf.id);
        leafToRootMap.set(leaf.id, rootId);

        leaf.cx = circleCoords[i % circleCoords.length].cx;
        leaf.cy = circleCoords[i % circleCoords.length].cy;
        leaf.r = leaf.weight * levelValueFactors.get(leaf.level);
        leaf.fill = fillColors[fillColorIndex % fillColors.length];
        leaf.boundingBox = circleCoords[i % circleCoords.length].boundingBox;
        
        containerData.push(leaf);

        if (leaf.children) {
            // rootToLeavesMap.set(leaf.id, []);
            transformData(
                leaf.children,
                containerData,
                leaf.id,
                fillColorIndex + 1,
                leaf.boundingBox.x1,
                leaf.boundingBox.y1,
                leaf.boundingBox.x2,
                leaf.boundingBox.y2
            );
        }
    });

  return containerData;
}

// With this recursive function:
function findNodeByName(nodes, name) {
    // Check in the current level
    const found = nodes.find(node => node.name === name);
    if (found) return found;
    
    // If not found, check in children
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            const foundInChildren = findNodeByName(node.children, name);
            if (foundInChildren) return foundInChildren;
        }
    }
    
    return null;
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
        const currentName = getLatestLeafName();

        // get the node from jsonData that matches currentName
        if (currentName) {
            // make sure to search even the children nodes
            const parentNode = findNodeByName(jsonData, currentName);
            if (parentNode) {
                if (!parentNode.children) {
                    parentNode.children = [];
                }
                newCar.name = currentName + '-' + newCar.name;
                newCar.level = parentNode.level + 1;
                parentNode.children.push(newCar);
            }
            else {
                // If parent node not found, add to root
                jsonData.push(newCar);
            }
        }
        else {
            // If no current leaf or parent node not found, add to root
            jsonData.push(newCar);
        }
        
        assignIds(jsonData);
        updateVisualization(setCircleData(jsonData));
    }
}

function removeCar() {
    const carIndexInput = document.getElementById('car-index');
    const carIndex = parseInt(carIndexInput.value);

    if (isNaN(carIndex) || !jsonData[carIndex]) {
       return;
    }

    const currentName = getLatestLeafName();
    const parentNode = findNodeByName(jsonData, currentName);
    if (parentNode && parentNode.children) {
        parentNode.children.splice(carIndex, 1);
    }
    else {
        // remove a car by index
        jsonData.splice(carIndex, 1);
    }

    
    assignIds(jsonData);
    updateVisualization(setCircleData(jsonData));
}


function updateVisualization(data) {
    updateScatterPlot(data);

    console.log(circlesMap);
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
    let activeId = 0; // default to root

    if (circle) {
      const circleData = d3.select(circle).datum();
      // Add selection styling to clicked circle
      d3.select(circle).classed("selected", true);
      activeCircle = circle;

      // Calculate the bounding box in screen space
      const x1 = x(circleData.boundingBox.x1);
      const y1 = y(circleData.boundingBox.y1);
      const x2 = x(circleData.boundingBox.x2);
      const y2 = y(circleData.boundingBox.y2);

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
      activeId = circleData.id;
    }

    // Animate the zoom using the calculated transform
    svg.transition()
        .duration(animationDuration)
        .call(zoom.transform, transform);

    refreshCirclesVisibility(activeId);
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

function getLatestLeaf() {
    return activeCircleStack.length > 0 ? activeCircleStack[activeCircleStack.length - 1] : null;
}

function getLatestLeafId() {
    
    const circle = getLatestLeaf();

    if (circle) {
      const circleData = d3.select(circle).datum();
      return circleData.id;
    }

    return 0;
}

function getLatestLeafName() {
    const circle = getLatestLeaf();

    if (circle) {
      const circleData = d3.select(circle).datum();
      return circleData.name;
    }

    return null;
}

function isVisible(leafId) {
    return leafToRootMap.has(leafId) && leafToRootMap.get(leafId) === getLatestLeafId();
}

function refreshCirclesVisibility(rootId) {
  // set default transition
  const t = d3.transition().duration(animationDuration);

  circlesMap.forEach((circleElement, id) => {
      if (leafToRootMap.has(id) && leafToRootMap.get(id) === rootId) {
          d3.select(circleElement)
          .style('display', 'block')
          .style('pointer-events', 'all')
          .transition(t)
            .style('opacity', 1);
      } else {
          d3.select(circleElement)
          .style('display', 'none')
          .style('pointer-events', 'none')
          .transition(t)
            .style('opacity', 0);
      }
  });
}

function updateScatterPlot(data) {
    // set default transition
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
        // Remove from rootToLeavesMap and leafToRootMap
        if (leafToRootMap.has(d.id)) {
            const parentId = leafToRootMap.get(d.id);
            const leaves = rootToLeavesMap.get(parentId);
            const index = leaves.indexOf(d.id);
            if (index > -1) {
                leaves.splice(index, 1);
            }
        }
        leafToRootMap.delete(d.id);
    })
    .transition(t)
      .style('opacity', 0).remove();

    // Update existing elements' positions
    cardGroup
    .transition(t)
        .attr('transform', (d) => {
            const xPos = x(d.cx) - cardWidth / 2;
            const yPos = y(d.cy) - cardHeight / 2;
            return `translate(${xPos}, ${yPos})`;
        })

        .style('opacity', d => isVisible(d.id) ? 1 : 0);

    // Handle new elements - append both the group and the rect to new elements only
    const enterSelection = cardGroup.enter().append('g')
        .attr('class', 'card-group')
        .attr('transform', (d) => {
            const xPos = x(d.cx) - cardWidth / 2;
            const yPos = y(d.cy) - cardHeight / 2;
            return `translate(${xPos}, ${yPos})`;
        })

        .attr("fill", (d, i) => d.fill)
        .style('opacity', 0)
        .style('cursor', 'pointer')
        .style('display', d => isVisible(d.id) ? 'block' : 'none')
        .style('pointer-events', d => isVisible(d.id) ? 'all' : 'none') // Disable pointer events for non-visible circles
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

            if (!rootToLeavesMap.has(d.id) || rootToLeavesMap.get(d.id).length === 0) {
                // No children, do nothing
                return;
            } else {
                const latestStackCircle = activeCircleStack.length > 0 ? activeCircleStack[activeCircleStack.length - 1] : null;

                // Clicked the already active circle, do nothing
                if (latestStackCircle === this) {
                    return;
                }

                // Zoom to clicked circle if stack is empty.
                if (!latestStackCircle) {
                    zoomToChild(this);
                } else {
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
                }
            }

        });
        

    // Create card background
    enterSelection.append('rect')
        .attr('class', 'card-rect')
        .attr('width', cardWidth)
        .attr('height', cardHeight)
        .attr('fill', (d, i) => d3.schemeCategory10[i % 10] + '20') // Light version of the color
        .attr('stroke', (d, i) => d3.schemeCategory10[i % 10]);

    // Add the image using SVG image element
    enterSelection.append('image')
        .attr('href', 'images/BMW.jpg')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', cardWidth)
        .attr('height', imageHeight)
        .attr('preserveAspectRatio', 'xMidYMid slice');

    // Add car make text
    enterSelection.append('text')
        .attr('class', 'card-text')
        .attr('x', cardWidth / 2)
        .attr('y', imageHeight + 15)
        .text((d) => d.name);

    enterSelection.transition(t)
          .style('opacity', d => isVisible(d.id) ? 1 : 0);

    // Handle background click - zoom out
    background.on("click", function() {
        zoomToParent();
    });
}

// Function removed as car cards are now integrated into the scatter plot
