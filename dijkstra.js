var Queue = require('tinyqueue').default || require('tinyqueue');
var roundCoord = require('./round-coord');
var turfDistance = require('@turf/distance').default
var turfDestination = require('@turf/destination').default
var coordEach = require("@turf/meta").coordEach;
const d3 = require('d3-contour');

var tilebelt = require('@mapbox/tilebelt');



function findPath(graph, start, end, maxCost) {
    var costs = {};
    costs[start] = 0;
    var initialState = [0, [start], start];
    var queue = new Queue([initialState], function(a, b) { return a[0] - b[0]; });

    while (queue.length) {
        var state = queue.pop();
        var cost = state[0];
        var node = state[2];
        if (node === end) {
            // require('fs').writeFileSync('costs.json', JSON.stringify(costs))
            return state.slice(0, 2);
        }

        var neighbours = graph[node];
        Object.keys(neighbours).forEach(function(n) {
            var newCost = cost + neighbours[n];
            if (!(n in costs) || newCost < costs[n]) {
                costs[n] = newCost;
                var newState = [newCost, state[1].concat([n]), n];
                queue.push(newState);
            }
        });
    }

    return null;
}

function toCoords(p) {
    return roundCoord.coordToFloat(p.split(','), 1e5)
}

function toCellIndex(startCoords, point, gridExtent, gridRadius) {
    var gridCellSize = (gridRadius * 2) / gridExtent;

    var pointX = [point[0], startCoords[1]],
        pointY = [startCoords[0], point[1]];


    var xDist = turfDistance(startCoords, pointX, {units: 'miles'})
    var yDist = turfDistance(startCoords, pointY, {units: 'miles'})

    var x,y;
    if (startCoords[0] > point[0]) { // N
        x = Math.floor(xDist / gridCellSize) + Math.round(gridExtent / 2)
    } else { // S
        x = Math.round(gridExtent / 2) - Math.floor(xDist / gridCellSize)
    }

    if (startCoords[1] > point[1]) { // E
        y = Math.floor(yDist / gridCellSize) + Math.round(gridExtent / 2)
    } else { // W
        y = Math.round(gridExtent / 2) - Math.floor(yDist / gridCellSize)
    }


    // return [x,y]
    return x + (y * gridExtent)
}

function toLngLat(startCoord, coord, gridExtent, gridRadius) {
    var gridCellSize = (gridRadius * 2) / gridExtent;



//     var pointX = [point[0], startCoords[1]],
//         pointY = [startCoords[0], point[1]];
//
//     var xDist = turfDistance(startCoords, pointX, {units: 'miles'})
//     var yDist = turfDistance(startCoords, pointY, {units: 'miles'})
    var [x,y] = coord
    var point = startCoord;
    var xDist, yDist
    if (x > gridExtent / 2) { // N
        xDist = (x - (gridExtent / 2)) * gridCellSize
        point = turfDestination(point, xDist, 0).geometry.coordinates
    } else { // S
        xDist = ((gridExtent / 2) - x)  * gridCellSize
        point = turfDestination(point, xDist, 180).geometry.coordinates
    }

    if (y > gridExtent / 2) { // E
        yDist = (y - (gridExtent / 2)) * gridCellSize
        point = turfDestination(point, yDist, 90).geometry.coordinates
    } else { // W
        yDist = ((gridExtent / 2) - y) * gridCellSize
        point = turfDestination(point, yDist, 270).geometry.coordinates
    }
    coord[0] = point[0]
    coord[1] = point[1]
    // return [x,y]
    return point
}


function costAll(graph, start, gridExtent, gridRadius, zLevel) {
    var costs = {};
    costs[start] = 0;
    var initialState = [0, [start], start];
    var queue = new Queue([initialState], function(a, b) { return a[0] - b[0]; });
    // var grid = Array.from({length: gridExtent * gridExtent }, x => 40)
    var tiles = {}
    //

    var startCoords = toCoords(start)
    console.log( "start",  startCoords)




    while (queue.length) {
        var state = queue.pop();
        var cost = state[0];
        var node = state[2];
        // if (node === end) {
        //     // require('fs').writeFileSync('costs.json', JSON.stringify(costs))
        //     return state.slice(0, 2);
        // }

        var neighbours = graph[node];
        Object.keys(neighbours).forEach(function(n) {
            // console.log('n', n)
            // console.log(startCoords, nCoords)
            // console.log(ci)
            var newCost = cost + neighbours[n];
//             thresholds.forEach(t => {
//                 if ((cost < t) && (newCost > t)) {
//
//                 }
//             })
            if (!(n in costs) || newCost < costs[n]) {
                costs[n] = newCost;
                var nCoords = toCoords(n)
                console.log(nCoords, zLevel)
                console.log(tilebelt.pointToTile(nCoords[0], nCoords[1], zLevel))
                tiles[tilebelt.pointToTile(nCoords[0], nCoords[1], zLevel).toString()] = newCost
                // var ci = toCellIndex(startCoords, nCoords, gridExtent,gridRadius)
                // grid[ci] = newCost
                var newState = [newCost, state[1].concat([n]), n];
                queue.push(newState);
            }
        });
    }
//     var costFeats = []
//     for(c in costs) {
//         costFeats.push({type: "Feature", geometry:{type: "Point", coordinates:toCoords(c)}, properties: {cost: costs[c]}})
//     }
//
//     console.log(JSON.stringify({type:"FeatureCollection", features:costFeats}))

    var tileFeats = []
    for(t in tiles) {
        console.log(t)
        var tile = t.split(',').map(n => parseInt(n))
        console.log(tile)
        var c = tiles[t]
        tileFeats.push({type: "Feature", geometry:tilebelt.tileToGeoJSON(tile), properties: {cost: c}})
    }

    console.log(JSON.stringify({type:"FeatureCollection", features:tileFeats}))
    process.exit()
    grid = grid.map(v => 20 - v)
    var buckets = [-1,5,10,15].reverse()
    var contours = d3.contours()
      .size([gridExtent, gridExtent])
      .smooth(true)
      .thresholds(buckets)
      (grid)

    var feats = contours.map(geom => {
        coordEach(geom, (coord) => {
            toLngLat(startCoords, coord, gridExtent,gridRadius)
        });
    var value = geom.value
    delete geom.value;
    return {type: "Feature", geometry: geom, properties:{bucket:value}}
    })

//     var feats = {type:"FeatureCollection", features: contours.map((geom, i) => {
//         return {type: "Feature", geometry: geom, properties: {bucket:buckets[i].toString()}}
//     })}
//
    console.log(JSON.stringify({type: "FeatureCollection", features:feats}))
    // console.log(contours)
    var vals = []
    for (var i =0; i < gridExtent; i++) {
        vals = []
        for (var j =0; j < gridExtent; j++) {
            vals.push(Math.round(grid[i + j*i]))
        }
        console.log(JSON.stringify(vals))
    }
    console.log(grid)
    return null;
}

module.exports = {
    findPath: findPath,
    costAll: costAll
}