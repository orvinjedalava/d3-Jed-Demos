function _1(md){return(
md`# d3.interpolateZoom

[d3.interpolateZoom](https://d3js.org/d3-interpolate/zoom#interpolateZoom) implements Jarke van Wijk and Wim Nuij’s “Smooth and efficient zooming and panning” ([PDF](http://www.win.tue.nl/~vanwijk/zoompan.pdf)) to preserve context while zooming. It is used internally by d3-zoom when calling [*zoom*.transform](https://d3js.org/d3-zoom#zoom_transform). (A different interpolator can be specified with [*zoom*.interpolate](https://d3js.org/d3-zoom#zoom_interpolate)).

_This notebook focuses on details of how d3.interpolateZoom works — if you are looking for examples of how to implement a panning and zooming behavior in D3, check out the d3-zoom [homepage](https://d3js.org/d3-zoom) and [collection](https://observablehq.com/collection/@d3/d3-zoom)._`
)}

function _2(md){return(
md`d3.interpolateZoom is an interpolation method that applies between two views (start and end), each represented by an array of three coordinates: [cx, cy, width]. The two first coordinates represent the center of the viewport, and the last one is its size — usually the height or width of the objects that fill the viewport at that moment.`
)}

function _start(){return(
[30, 30, 40]
)}

function _end(){return(
[135, 85, 60]
)}

function _5(md){return(
md`Let’s figure two objects on a grid, their respective bounding boxes being fully contained in these two views (with a small margin to make it more comfortable). The details that draw the scene are not very interesting — it’s just static SVG contents (see [#scene](#scene) in the Annex).`
)}

function _6(md){return(
md`We begin by drawing the scene in a view that shows it whole — applying the identity transform: translate(0,0) scale(1).`
)}

function _7(svg,scene){return(
svg`<svg viewBox="-2 -2 264 194" style="max-width: 600px">
  <g id=view transform="translate(0, 0) scale(1)">
    ${scene}
  </g>
</svg>`
)}

function _8(md){return(
md`To focus on the first view, we need to figure out a transform such that the red bounding-box neatly fits in the viewport. Discounting a small margin, the viewport’s dimensions (in SVG units) are:`
)}

function _w(){return(
260
)}

function _h(){return(
190
)}

function _11(start,w,h,md){return(
md`The scale that will make the square of ${start[2]}&times;${start[2]}
fit the ${w}&times;${h} viewport is:`
)}

function _k(w,h,start){return(
Math.min(w, h) / start[2]
)}

function _13(md){return(
md`Now that the scale is set, we need to figure out how to move the bounding box’s center to the center of the viewport. The formula is:`
)}

function _translate(w,start,k,h){return(
[w / 2 - start[0] * k, h / 2 - start[1] * k]
)}

function _15(md){return(
md`And finally we have:`
)}

function _transformStart(translate,k){return(
`translate(${translate}) scale(${k})`
)}

function _17(svg,transformStart,scene){return(
svg`<svg viewBox="-2 -2 264 194" style="max-width: 600px">
<g id=view transform="${transformStart}">
  ${scene}
</g>
</svg>`
)}

function _18(md){return(
md`We now generalize the formula for any view. Combining it with the zoom interpolator, we can define the transform as a function of a parameter *t*, going from the start view for *t*=0, to the end view for *t*=1:`
)}

function _interpolator(d3,start,end){return(
d3.interpolateZoom(start, end)
)}

function _transform(interpolator,w,h){return(
function transform(t) {
  const view = interpolator(t);

  const k = Math.min(w, h) / view[2]; // scale
  const translate = [w / 2 - view[0] * k, h / 2 - view[1] * k]; // translate

  return `translate(${translate}) scale(${k})`;
}
)}

function _t(Inputs){return(
Inputs.range([0, 1], { label: "parameter t", step: 0.01 })
)}

function _22(interpolator,t){return(
interpolator(t)
)}

function _23(transform,t){return(
transform(t)
)}

function _24(svg,transform,t,scene){return(
svg`<svg viewBox="-2 -2 264 194" style="max-width: 600px">
<g id=view transform="${transform(t)}">
  ${scene}
</g>
</svg>`
)}

function _25(md){return(
md`The zoom interpolator returned by this method also exposes a *duration* property, which encodes the recommended transition duration in milliseconds. This duration is based on the path length of the curved trajectory through x,y space. If you want to a slower or faster transition, multiply this by an arbitrary scale factor.`
)}

function _duration(interpolator){return(
interpolator.duration * 1.5
)}

function _replay(html){return(
html`<button>Replay</button>`
)}

async function* _28(visibility,replay,svg,transform,scene,d3,duration)
{
  await visibility(replay);
  const s = svg`<svg viewBox="-2 -2 264 194" style="max-width: 600px">
<g id=view transform="${transform(0)}">
  ${scene}
</g>
</svg>`;
  yield s;

  const view = d3.select(s).select("#view");

  view
    .transition()
    .delay(1000)
    .duration(duration)
    .attrTween("transform", () => transform);
}


function _29(md){return(
md`The final animation just loops back and forth between the two views, using the zoom interpolator going forward from 0 to 1, then backward from 1 to 0, ad libitum. This animation uses the [d3-transition](https://d3js.org/d3-transition) module.`
)}

function _30(svg,transform,scene,d3,duration)
{
  const s = svg`<svg viewBox="-2 -2 264 194" style="max-width: 600px">
<g id=view transform="${transform(0)}">
  ${scene}
</g>
</svg>`;

  const transform_backward = t => transform(1 - t);
  let forward = false;

  d3.select(s)
    .select("#view")
    .call(transition);

  return s;

  function transition(view) {
    forward = !forward;
    view
      .transition()
      .delay(2000)
      .duration(duration)
      .attrTween("transform", () => (forward ? transform : transform_backward))
      .on("end", () => transition(view));
  }
}


function _interpolateZoomRho(md){return(
md`[d3.interpolateZoom.rho](https://d3js.org/d3-interpolate/zoom#interpolateZoom_rho)(*rho*) allows to specify the curvature of the zoom interpolator. With a curvature of 0, the interpolation is linear—if the start and end have the same scale, the interpolator is simply a translation. The higher the value of *rho* (which defaults to 1.414), the more important the “dolly out” (or zoom out) movement is before zooming in again on the final destination. Configure it below and see how this changes the interpolation in the chart above.`
)}

function _rho(Inputs){return(
Inputs.range([0, 2], {
  value: Math.sqrt(2),
  precision: 6,
  label: "curvature (rho)",
  step: 0.01
})
)}

function _transformRho(d3,rho,start,end,w,h)
{
  const interpolator = d3.interpolateZoom.rho(Math.max(rho, 0))(start, end);
  return t => {
    const view = interpolator(t);
    const k = Math.min(w, h) / view[2]; // scale
    const translate = [w / 2 - view[0] * k, h / 2 - view[1] * k]; // translate
    return `translate(${translate}) scale(${k})`;
  }
}


async function* _34(visibility,replay,svg,transformRho,scene,d3,duration)
{
  await visibility(replay);
  const s = svg`<svg viewBox="-2 -2 264 194" style="max-width: 600px">
<g id=view transform="${transformRho(0)}">
  ${scene}
</g>
</svg>`;
  yield s;

  const view = d3.select(s).select("#view");

  view
    .transition()
    .delay(1000)
    .duration(duration)
    .attrTween("transform", () => transformRho);
}


function _35(md){return(
md`---

## Appendix`
)}

function _scene(d3,start,end){return(
`
  <g id=grid>
  ${d3
    .ticks(0, 260, 30)
    .map(x => `<line x1=${x} x2=${x} y1=0 y2=190 />`)
    .join("\n")}
  ${d3
    .ticks(0, 190, 20)
    .map(y => `<line x1=0 x2=260 y1=${y} y2=${y} />`)
    .join("\n")}
  </g>

  <g id=start>
    <rect class=bbox1 x=${start[0] - start[2] / 2}
      y=${start[1] - start[2] / 2}
      width=${start[2]}
      height=${start[2]}
    ></rect>
    <circle cx=30 cy=30 r=13></circle>
  </g>

  <g id=end>
    <rect class=bbox2 x=${end[0] - end[2] / 2}
      y=${end[1] - end[2] / 2}
      width=${end[2]} height=${end[2]}></rect>
    <g transform="translate(135, 85)">
      <path d="${d3
        .symbol()
        .type(d3.symbolStar)
        .size(900)()}"></path>
    </g>
  </g>

  <style>
    svg #grid line { stroke: #aaa; stroke-width: 0.5 }
    svg .bbox1 { stroke: red; stroke-width: 1; fill: none }
    svg .bbox2 { stroke: blue; stroke-width: 1; fill: none }
    svg * { vector-effect: non-scaling-stroke }
  </style>
`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer("start")).define("start", _start);
  main.variable(observer("end")).define("end", _end);
  main.variable(observer()).define(["md"], _5);
  main.variable(observer()).define(["md"], _6);
  main.variable(observer()).define(["svg","scene"], _7);
  main.variable(observer()).define(["md"], _8);
  main.variable(observer("w")).define("w", _w);
  main.variable(observer("h")).define("h", _h);
  main.variable(observer()).define(["start","w","h","md"], _11);
  main.variable(observer("k")).define("k", ["w","h","start"], _k);
  main.variable(observer()).define(["md"], _13);
  main.variable(observer("translate")).define("translate", ["w","start","k","h"], _translate);
  main.variable(observer()).define(["md"], _15);
  main.variable(observer("transformStart")).define("transformStart", ["translate","k"], _transformStart);
  main.variable(observer()).define(["svg","transformStart","scene"], _17);
  main.variable(observer()).define(["md"], _18);
  main.variable(observer("interpolator")).define("interpolator", ["d3","start","end"], _interpolator);
  main.variable(observer("transform")).define("transform", ["interpolator","w","h"], _transform);
  main.variable(observer("viewof t")).define("viewof t", ["Inputs"], _t);
  main.variable(observer("t")).define("t", ["Generators", "viewof t"], (G, _) => G.input(_));
  main.variable(observer()).define(["interpolator","t"], _22);
  main.variable(observer()).define(["transform","t"], _23);
  main.variable(observer()).define(["svg","transform","t","scene"], _24);
  main.variable(observer()).define(["md"], _25);
  main.variable(observer("duration")).define("duration", ["interpolator"], _duration);
  main.variable(observer("viewof replay")).define("viewof replay", ["html"], _replay);
  main.variable(observer("replay")).define("replay", ["Generators", "viewof replay"], (G, _) => G.input(_));
  main.variable(observer()).define(["visibility","replay","svg","transform","scene","d3","duration"], _28);
  main.variable(observer()).define(["md"], _29);
  main.variable(observer()).define(["svg","transform","scene","d3","duration"], _30);
  main.variable(observer("interpolateZoomRho")).define("interpolateZoomRho", ["md"], _interpolateZoomRho);
  main.variable(observer("viewof rho")).define("viewof rho", ["Inputs"], _rho);
  main.variable(observer("rho")).define("rho", ["Generators", "viewof rho"], (G, _) => G.input(_));
  main.variable(observer("transformRho")).define("transformRho", ["d3","rho","start","end","w","h"], _transformRho);
  main.variable(observer()).define(["visibility","replay","svg","transformRho","scene","d3","duration"], _34);
  main.variable(observer()).define(["md"], _35);
  main.variable(observer("scene")).define("scene", ["d3","start","end"], _scene);
  return main;
}
