# Zoomable Circle Packing Visualization with D3.js

This project demonstrates a zoomable circle packing visualization using D3.js. Circle packing is an effective way to visualize hierarchical data, where each node in the hierarchy is represented by a circle, and child nodes are drawn as circles inside their parent node.

## Overview

The visualization displays hierarchical data as nested circles, with the ability to zoom in and out by clicking on different circles. This creates an interactive way to explore hierarchical relationships in your data.

Key features:

- Hierarchical data visualization using nested circles
- Interactive zooming by clicking on circles
- Color coding based on hierarchy depth
- Smooth transitions between zoom levels
- Hover effects for better user experience

## How the D3.js Code Works

The main visualization is created in the `_chart` function. Let's break down the key components:

### 1. Setting Up Dimensions and Color Scale

```javascript
// Specify the chart's dimensions.
const width = 928;
const height = width;

// Create the color scale.
const color = d3
  .scaleLinear()
  .domain([0, 5])
  .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
  .interpolate(d3.interpolateHcl);
```

This sets up a fixed-size square canvas and creates a color scale that transitions from a light teal to a dark blue. The color is based on the depth of each node in the hierarchy (0-5 levels deep).

### 2. Computing the Layout

```javascript
// Compute the layout.
const pack = (data) =>
  d3.pack().size([width, height]).padding(3)(
    d3
      .hierarchy(data)
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value)
  );
const root = pack(data);
```

This code:

- Uses D3's `pack()` layout to compute the positions and sizes of circles
- Sets the overall size and adds padding between circles
- Creates a hierarchy from the data using `d3.hierarchy()`
- Sums up the values of child nodes to determine parent node sizes
- Sorts nodes by value (larger values first)

### 3. Creating the SVG Container

```javascript
// Create the SVG container.
const svg = d3
  .create("svg")
  .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
  .attr("width", width)
  .attr("height", height)
  .attr(
    "style",
    `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: ${color(
      0
    )}; cursor: pointer;`
  );
```

This creates an SVG element with a centered viewBox, which makes it easier to zoom into the center of the visualization.

### 4. Appending Circles (Nodes)

```javascript
// Append the nodes.
const node = svg
  .append("g")
  .selectAll("circle")
  .data(root.descendants().slice(1))
  .join("circle")
  .attr("fill", (d) => (d.children ? color(d.depth) : "white"))
  .attr("pointer-events", (d) => (!d.children ? "none" : null))
  .on("mouseover", function () {
    d3.select(this).attr("stroke", "#000");
  })
  .on("mouseout", function () {
    d3.select(this).attr("stroke", null);
  })
  .on(
    "click",
    (event, d) => focus !== d && (zoom(event, d), event.stopPropagation())
  );
```

This code:

- Creates circles for each node in the hierarchy (except the root)
- Colors the circles based on their depth (leaf nodes are white)
- Adds hover effects (black stroke on mouseover)
- Sets up click events to zoom in when a circle is clicked

### 5. Adding Text Labels

```javascript
// Append the text labels.
const label = svg
  .append("g")
  .style("font", "10px sans-serif")
  .attr("pointer-events", "none")
  .attr("text-anchor", "middle")
  .selectAll("text")
  .data(root.descendants())
  .join("text")
  .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
  .style("display", (d) => (d.parent === root ? "inline" : "none"))
  .text((d) => d.data.name);
```

This adds text labels to each node, but initially only shows labels for the top-level categories.

### 6. Implementing Zoom Functionality

```javascript
// Create the zoom behavior and zoom immediately in to the initial focus node.
svg.on("click", (event) => zoom(event, root));
let focus = root;
let view;
zoomTo([focus.x, focus.y, focus.r * 2]);

function zoomTo(v) {
  const k = width / v[2];

  view = v;

  label.attr(
    "transform",
    (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
  );
  node.attr(
    "transform",
    (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
  );
  node.attr("r", (d) => d.r * k);
}

function zoom(event, d) {
  const focus0 = focus;

  focus = d;

  const transition = svg
    .transition()
    .duration(event.altKey ? 7500 : 750)
    .tween("zoom", (d) => {
      const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
      return (t) => zoomTo(i(t));
    });

  label
    .filter(function (d) {
      return d.parent === focus || this.style.display === "inline";
    })
    .transition(transition)
    .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
    .on("start", function (d) {
      if (d.parent === focus) this.style.display = "inline";
    })
    .on("end", function (d) {
      if (d.parent !== focus) this.style.display = "none";
    });
}
```

This code:

- Sets up the initial zoom state focused on the root node
- Defines a `zoomTo` function that transforms the view to focus on a specific point
- Implements a `zoom` function that:
  - Updates the current focus
  - Creates a smooth transition between views
  - Shows/hides labels based on the current focus

## Data Structure

The visualization uses hierarchical JSON data with the following structure:

```json
{
  "name": "root",
  "children": [
    {
      "name": "category1",
      "children": [
        { "name": "item1", "value": 100 },
        { "name": "item2", "value": 200 }
      ]
    },
    {
      "name": "category2",
      "children": [
        { "name": "item3", "value": 300 },
        { "name": "item4", "value": 400 }
      ]
    }
  ]
}
```

Key points about the data structure:

- Each node has a `name` property
- Non-leaf nodes have a `children` array containing child nodes
- Leaf nodes have a `value` property that determines their size
- The size of parent nodes is calculated by summing the values of all their descendants

## Creating Your Own Circle Packing Visualization

To adapt this visualization for your own data:

1. **Prepare your data** in the hierarchical format shown above
2. **Adjust the color scale** if needed:
   ```javascript
   const color = d3
     .scaleLinear()
     .domain([0, YOUR_MAX_DEPTH])
     .range(["YOUR_START_COLOR", "YOUR_END_COLOR"])
     .interpolate(d3.interpolateHcl);
   ```
3. **Modify the dimensions** if you want a different size:
   ```javascript
   const width = YOUR_WIDTH;
   const height = YOUR_HEIGHT;
   ```
4. **Customize the appearance** by adjusting circle padding, text styling, etc.

## Interactivity Features

- **Click on a circle** to zoom in and focus on that part of the hierarchy
- **Click on the background** to zoom out to the parent level
- **Hover over circles** to highlight them with a black border
- **Hold Alt while clicking** for a slower, more dramatic zoom animation (7.5 seconds instead of 0.75 seconds)

## Advanced Customizations

You could extend this visualization with:

1. **Custom tooltips** to show additional information on hover
2. **Different color schemes** based on categories or values instead of depth
3. **Size adjustments** to make the visualization responsive
4. **Additional interactions** like right-click for different actions
5. **Animations** when data changes

This visualization demonstrates the power of D3.js for creating interactive, hierarchical data visualizations that allow users to explore complex datasets intuitively.
