// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Car data (embedded to avoid CORS issues when loading from file)
    const carData = [
        { "make": "Toyota", "cost": 22000 },
        { "make": "Honda", "cost": 21000 },
        { "make": "Ford", "cost": 25000 },
        { "make": "Chevrolet", "cost": 24000 },
        { "make": "BMW", "cost": 35000 },
        { "make": "Mercedes-Benz", "cost": 40000 },
        { "make": "Volkswagen", "cost": 23000 },
        { "make": "Hyundai", "cost": 20000 },
        { "make": "Kia", "cost": 19500 },
        { "make": "Nissan", "cost": 20500 }
    ];
    
    // Initialize the visualization
    initVisualization(carData);
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
    
    // Update the scatter plot
    updateScatterPlot(filteredData);
    
    // Update the car cards
    updateCarCards(filteredData);
}

function updateScatterPlot(data) {
    // Clear previous plot
    d3.select('#scatter-plot').html('');
    
    // Set dimensions for the scatter plot
    const margin = {top: 20, right: 20, bottom: 40, left: 50};
    const width = document.getElementById('scatter-plot').clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Create SVG for the scatter plot
    const svg = d3.select('#scatter-plot')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.make))
        .range([0, width])
        .padding(0.1);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.cost) * 1.1])
        .range([height, 0]);
    
    // Create axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');
    
    svg.append('g')
        .call(d3.axisLeft(y).tickFormat(d => `$${d.toLocaleString()}`));
    
    // Add axis labels
    svg.append('text')
        .attr('transform', `translate(${width/2}, ${height + margin.bottom - 5})`)
        .style('text-anchor', 'middle')
        .text('Car Make');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Cost ($)');
    
    // Create dots for the scatter plot
    svg.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(d.make) + x.bandwidth() / 2)
        .attr('cy', d => y(d.cost))
        .attr('r', 8)
        .style('fill', (d, i) => d3.schemeCategory10[i % 10])
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 12);
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 8);
        });
}

function updateCarCards(data) {
    // Clear previous cards
    const carCardsContainer = document.getElementById('car-cards');
    carCardsContainer.innerHTML = '';
    
    // Create a card for each car
    data.forEach(car => {
        const card = document.createElement('div');
        card.className = 'car-card';
        
        // Use the BMW image for all cars as specified
        card.innerHTML = `
            <img src="images/BMW.jpg" alt="${car.make}">
            <div class="car-info">
                <h3>${car.make}</h3>
                <p class="cost">$${car.cost.toLocaleString()}</p>
            </div>
        `;
        
        carCardsContainer.appendChild(card);
    });
}
