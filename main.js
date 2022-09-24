/**
 * The project is based on Kevin Taufer's solution on https://bl.ocks.org/atanumallick/8d18989cd538c72ae1ead1c3b18d7b54
 * 
 * 
 * Country select box which navigates to the selected country on a globe
 */


// base Settings
const width = 960;
const height = 500;

let locations = [];

// setup globe
const svg = d3.select('svg')
    .attr('width', width).attr('height', height);
const markerGroup = svg.append('g');
const projection = d3.geoOrthographic();
const initialScale = projection.scale();
const path = d3.geoPath().projection(projection);
const center = [width / 2, height / 2];

// get country select box and set on change event
const _countrySelect = document.getElementById('country');
_countrySelect.addEventListener('change', handleOnChange)

/**
 * gCurrentLat and gCurrentLng are used to 
 * save the coordinates of the last selected country
 * -> will be the inital viewpoint for the d3.interpolate in the showCountry() function
 */
let [gCurrentLat, gCurrentLng] = projection.invert(center);


drawGlobe();
drawGraticule();
loadCountries();

/**
 * draws the globe with polygon from https://gist.githubusercontent.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-110m.json
 */
function drawGlobe() {
    d3.queue()
        .defer(d3.json, 'https://gist.githubusercontent.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-110m.json')
        .await((error, worldData, locationData) => {
            svg.selectAll(".segment")
                .data(topojson.feature(worldData, worldData.objects.countries).features)
                .enter().append("path")
                .attr("class", "segment")
                .attr("d", path)
                .style("stroke", "#101010")
                .style("stroke-width", "1px")
                .style("fill", (d, i) => '#eee')
                .style("opacity", ".6");
            locations = locationData;
        });
}

/**
 * drows the graticule with the d3.geoGraticule() helper function
 */
function drawGraticule() {
    const graticule = d3.geoGraticule()
        .step([10, 10]);

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path)
        .style("fill", "#fff")
        .style("stroke", "#e3e3e3");
}

/**
 * rotates to the selected country and draw a marker
 * @param {latitude of the selected country} lat 
 * @param {longitude of the selected country} lng 
 */
function showCountry(lat, lng) {

    // use transition with tween for the animation
    d3.transition()
        .duration(1000)
        .tween("rotate", function () {
            // get an interpolator from the current coordinates (view) to the selected country -> needed for the animation
            const r = d3.interpolate([-gCurrentLng, -gCurrentLat], [-lng, -lat]);
            // use the interpolator to rotate step by step with the animation
            return function (t) {
                projection.rotate(r(t));
                svg.selectAll("path").attr("d", path);
            };
        })
        .on("end", () => {
            // draw the marker
            drawMarker(lat, lng), // save current coordinates to gCurrentLat and gCurrentLng to use them as starting point for the next interpolation
                // override the globals gCurrentLat and gCurrentLng to use them for the next rotation
                gCurrentLat = lat
            gCurrentLng = lng
        })


}

/**
 * draws a marker (red circle) at the coordinates from the params
 * @param {latitude of the selected country} lat 
 * @param {longitude of the selected country} lng 
 */
function drawMarker(lat, lng) {
    svg.append("circle")
        .attr('cx', projection([lng, lat])[0])
        .attr('cy', projection([lng, lat])[1])
        .attr('fill', 'red')
        .attr('r', 3);
}


/**
 * load all countries as option in the select box
 */
function loadCountries() {
    countries.map(country =>
        _countrySelect.innerHTML += `<option value="${country.name}">${country.name}</option>`
    )
}

/**
 * on change handler for the select box
 * @param {latitude of the selected country} e 
 */
function handleOnChange(e) {
    if (!e || !e.target || !e.target.value) {
        return;
    }

    const selectedCountry = countries.find((country) => country.name === e.target.value);

    if (!selectedCountry) {
        alert('Country not found!')
    }

    showCountry(selectedCountry.latitude, selectedCountry.longitude)
}