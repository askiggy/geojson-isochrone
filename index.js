'use strict';

var traverse = require('./dijkstra'),
    preprocess = require('./preprocessor'),
    roundCoord = require('./round-coord'),
    concaveman = require('concaveman'),
    KDBush = require("kdbush").default || require("kdbush"),
    geokdbush = require("geokdbush");

module.exports = Isochrone;

function Isochrone(graph, options) {
    options = options || {};

    if (!graph.vertices) {
        graph = preprocess(graph, options);
    }

    this._graph = graph;
    var coords = []
    this._graph.vertices.forEach((value, key) => {
        coords.push(roundCoord.toCoords(key))
    })

    this._nodeIndex = new KDBush(coords);
    this._keyFn = options.keyFn || roundCoord.toKey;
    this._options = options;
    this._concavity = options.concavity || 2

}

Isochrone.prototype = {
    isochrone: function(a, costContours) {
        var nearestStart = geokdbush.around(
            this._nodeIndex,
            a.geometry.coordinates[0],
            a.geometry.coordinates[1],
            1
        );
        var start = this._keyFn(nearestStart[0]);
        var maxCost = costContours[costContours.length -1]
        var costs = traverse.costAll(this._graph.vertices, start, maxCost)
        var thresholdPoints =  Array.from({length: costContours.length }, _ => [a.geometry.coordinates])
        Object.keys(costs).forEach(cost => {
            costContours.forEach((t, i) =>{
                if (costs[cost] < t) {
                    thresholdPoints[i].push(roundCoord.toCoords(cost))
                }
            })
        })

        var fc = {type: "FeatureCollection", features: []}
        var concavity = this._concavity;
        fc.features = costContours.map((t,i) => {
            var poly = concaveman(thresholdPoints[i], concavity)
            return {type: "Feature", geometry:{type: "Polygon", coordinates:[poly]}, properties:{value: t}}
        })
        return fc
    },

    serialize: function() {
        return this._graph;
    },
};
