// Set dimensions for the scatter plot
const margin = {top: 20, right: 20, bottom: 70, left: 50};
const width = document.getElementById('scatter-plot').clientWidth - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;


// const width = document.getElementById('scatter-plot').clientWidth;
// const height = 600;

// Define card dimensions
const cardWidth = 80;
const cardHeight = 100;
const imageHeight = 60;

// Create SVG for the scatter plot
// const svg = d3.select('#scatter-plot')
//     .append('svg')
//     .attr('width', width + margin.left + margin.right)
//     .attr('height', height + margin.top + margin.bottom);

const svg = d3.select('#scatter-plot')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

// const g = svg.append('g')
//     .attr('transform', `translate(${margin.left},${margin.top})`);

// Create a group element for the scatter plot
const g = svg.append('g');
// const g = svg.append('g')
//     .attr('transform', `translate(10,0)`);

// Create scales
// const x = d3.scaleBand()
//     .range([0, width])
//     .padding(0.1);
  
const x = d3.scaleBand()
    .range([0, width]);

// const y = d3.scaleLinear()
//     .range([height, 0]);

// Place y-axis on the upper-left corner
const y = d3.scaleLinear()
    .range([0, height]);

// Situate x-axis on the lower-left corner.
const xAxisGroup = g.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0, ${height})`);

const yAxisGroup = g.append("g")
  .attr("class", "y axis");


// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // // Car data (embedded to avoid CORS issues when loading from file)
    // const carData = [
    //     { "make": "Toyota", "cost": 22000 },
    //     { "make": "Honda", "cost": 21000 },
    //     { "make": "Ford", "cost": 25000 },
    //     { "make": "Chevrolet", "cost": 24000 },
    //     { "make": "BMW", "cost": 35000 },
    //     { "make": "Mercedes-Benz", "cost": 40000 },
    //     { "make": "Volkswagen", "cost": 23000 },
    //     { "make": "Hyundai", "cost": 20000 },
    //     { "make": "Kia", "cost": 19500 },
    //     { "make": "Nissan", "cost": 20500 }
    // ];
    
    // // Initialize the visualization
    // initVisualization(carData);

    d3.json('data/data.json').then(function(carData) {
    // Initialize the visualization
    initVisualization(carData);
});
});

function initVisualization(data) {
    // Find min and max cost values for the range slider
    const minCost = d3.min(data, d => d.cost);
    const maxCost = d3.max(data, d => d.cost);
    
    // Set initial range values
    let currentMinCost = minCost;
    let currentMaxCost = maxCost;
    
    // Update the min-max labels
    document.getElementById('min-value-label').textContent = minCost.toLocaleString();
    document.getElementById('max-value-label').textContent = maxCost.toLocaleString();
    
    // Create the range slider
    createRangeSlider(minCost, maxCost, (min, max) => {
        currentMinCost = min;
        currentMaxCost = max;
        
        // Update the labels
        document.getElementById('min-value-label').textContent = min.toLocaleString();
        document.getElementById('max-value-label').textContent = max.toLocaleString();
        
        // Filter and update visualization
        updateVisualization(data, min, max);
    });
    
    // Initial visualization with all data
    updateVisualization(data, minCost, maxCost);
}

function createRangeSlider(min, max, callback) {
    // Set dimensions for the slider
    const margin = {top: 10, right: 25, bottom: 10, left: 25};
    const width = document.getElementById('cost-range').clientWidth - margin.left - margin.right;
    const height = 50 - margin.top - margin.bottom;
    
    // Create SVG for the range slider
    const svg = d3.select('#cost-range')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create the x scale
    const x = d3.scaleLinear()
        .domain([min, max])
        .range([0, width])
        .clamp(true);
    
    // Create the slider track
    svg.append('line')
        .attr('class', 'track')
        .attr('x1', x.range()[0])
        .attr('x2', x.range()[1])
        .attr('y1', height / 2)
        .attr('y2', height / 2);
    
    svg.append('line')
        .attr('class', 'track-inset')
        .attr('x1', x.range()[0])
        .attr('x2', x.range()[1])
        .attr('y1', height / 2)
        .attr('y2', height / 2);
    
    // Create the selected area between handles
    const selectedArea = svg.append('rect')
        .attr('class', 'selected-area')
        .attr('y', (height / 2) - 5)
        .attr('height', 10);
    
    // Create the track overlay for better interaction
    const trackOverlay = svg.append('line')
        .attr('class', 'track-overlay')
        .attr('x1', x.range()[0])
        .attr('x2', x.range()[1])
        .attr('y1', height / 2)
        .attr('y2', height / 2);
    
    // Create the handles
    const handle1 = svg.append('circle')
        .attr('class', 'handle')
        .attr('r', 9)
        .attr('cx', x(min))
        .attr('cy', height / 2);
    
    const handle2 = svg.append('circle')
        .attr('class', 'handle')
        .attr('r', 9)
        .attr('cx', x(max))
        .attr('cy', height / 2);
    
    // Update the selected area
    function updateSelectedArea() {
        const x1 = parseFloat(handle1.attr('cx'));
        const x2 = parseFloat(handle2.attr('cx'));
        selectedArea
            .attr('x', Math.min(x1, x2))
            .attr('width', Math.abs(x2 - x1));
    }
    
    // Initialize the selected area
    updateSelectedArea();
    
    // Create drag behavior for handles
    const drag = d3.drag()
        .on('drag', function(event) {
            const handle = d3.select(this);
            const newX = Math.max(0, Math.min(width, event.x));
            handle.attr('cx', newX);
            
            updateSelectedArea();
            
            // Get current values
            const value1 = x.invert(parseFloat(handle1.attr('cx')));
            const value2 = x.invert(parseFloat(handle2.attr('cx')));
            
            // Determine min and max values
            const minValue = Math.min(value1, value2);
            const maxValue = Math.max(value1, value2);
            
            // Call the callback with new values
            callback(Math.round(minValue), Math.round(maxValue));
        });
    
    // Apply drag behavior to handles
    handle1.call(drag);
    handle2.call(drag);
}

function updateVisualization(data, minCost, maxCost) {
    // Filter data based on the cost range
    const filteredData = data.filter(d => d.cost >= minCost && d.cost <= maxCost);
    
    // Update the scatter plot with cards
    updateScatterPlot(filteredData);
}

function updateScatterPlot(data) {
    console.log(data);

    const t = d3.transition().duration(750);

    // Create scales
    x.domain(data.map(d => d.make));
    y.domain([0, d3.max(data, d => d.cost) * 1.1]);

    const xAxisCall = d3.axisBottom(x)
    xAxisGroup.transition(t).call(xAxisCall)
        .selectAll("text")
            .attr("y", "10")
            .attr("x", "-5")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-40)");

    const yAxisCall = d3.axisLeft(y)
        .tickFormat(d => `$${d.toLocaleString()}`);
    yAxisGroup.transition(t).call(yAxisCall)

    // Create cards for each car data point as SVG elements
    // const cardGroup = g.selectAll('.card-group').data(data, d => d.make);
    const cardGroup = g.selectAll('circle').data(data, d => d.make);

    // Handle elements that need to be removed
    cardGroup.exit().transition(t).style('opacity', 0).remove();

    // Update existing elements' positions
    cardGroup.transition(t)
        .attr('transform', (d) => {
            const xPos = x(d.make) + x.bandwidth() / 2 - cardWidth / 2;
            const yPos = y(d.cost) - cardHeight / 2;
            return `translate(${xPos}, ${yPos})`;
        })
        .style('opacity', 1);

    // Handle new elements - append both the group and the rect to new elements only
    // const enterSelection = cardGroup.enter().append('g')
    //     .attr('class', 'card-group')
    //     .attr('transform', (d) => {
    //         const xPos = x(d.make) + x.bandwidth() / 2 - cardWidth / 2;
    //         const yPos = y(d.cost) - cardHeight / 2;
    //         return `translate(${xPos}, ${yPos})`;
    //     })
    //     .style('opacity', 0)
    //     .on('mouseover', function() {
    //             d3.select(this)
    //                 .raise() // Bring to front
    //                 .transition()
    //                 .duration(300)
    //                 .attr('transform', (d) => {
    //                     const xPos = x(d.make) + x.bandwidth() / 2 - cardWidth / 2;
    //                     const yPos = y(d.cost) - cardHeight / 2;
    //                     return `translate(${xPos}, ${yPos}) scale(1.15)`;
    //                 });
    //         })
    //         .on('mouseout', function() {
    //             d3.select(this)
    //                 .transition()
    //                 .duration(300)
    //                 .attr('transform', (d) => {
    //                     const xPos = x(d.make) + x.bandwidth() / 2 - cardWidth / 2;
    //                     const yPos = y(d.cost) - cardHeight / 2;
    //                     return `translate(${xPos}, ${yPos})`;
    //                 });
    //         });

    const enterSelection = cardGroup.enter().append('circle')
        .attr("r", 30)
        .attr("cx", d => x(d.make) + x.bandwidth() / 2)
        .attr("cy", d => y(d.cost))
        .attr("fill", (d, i) => "green");
    // Create card background
    // enterSelection.append('rect')
    //     .attr('class', 'card-rect')
    //     .attr('width', cardWidth)
    //     .attr('height', cardHeight)
    //     .attr('fill', (d, i) => d3.schemeCategory10[i % 10] + '20') // Light version of the color
    //     .attr('stroke', (d, i) => d3.schemeCategory10[i % 10]);

    // // Add the image using SVG image element
    // enterSelection.append('image')
    //     .attr('href', 'images/BMW.jpg')
    //     .attr('x', 0)
    //     .attr('y', 0)
    //     .attr('width', cardWidth)
    //     .attr('height', imageHeight)
    //     .attr('preserveAspectRatio', 'xMidYMid slice');

    // // Add car make text
    // enterSelection.append('text')
    //     .attr('class', 'card-text')
    //     .attr('x', cardWidth / 2)
    //     .attr('y', imageHeight + 15)
    //     .text((d) => d.make);
    
    // // Add car price text
    // enterSelection.append('text')
    //     .attr('class', 'card-price')
    //     .attr('x', cardWidth / 2)
    //     .attr('y', imageHeight + 30)
    //     .text((d) => `$${d.cost.toLocaleString()}`);

    // Now apply the transition
    enterSelection.transition(t)
        .style('opacity', 1);
}

// Function removed as car cards are now integrated into the scatter plot
