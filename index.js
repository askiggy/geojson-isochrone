'use strict';

var traverse = require('./dijkstra'),
    preprocess = require('./preprocessor'),
    compactor = require('./compactor'),
    roundCoord = require('./round-coord'),
    concaveman = require('concaveman');

module.exports = PathFinder;

function toCoords(p) {
    return roundCoord.coordToFloat(p.split(','), 1e5)
}

function PathFinder(graph, options) {
    options = options || {};

    if (!graph.compactedVertices) {
        graph = preprocess(graph, options);
    }

    this._graph = graph;
    this._keyFn = options.keyFn || function(c) {
        // return c.map(n => n.toString(36)).join(',');
        return c.join(',');
    };
    this._precision = options.precision || 1e5;
    this._options = options;
    this._concavity = options.concavity || 2

    if (Object.keys(this._graph.compactedVertices).filter(function(k) { return k !== 'edgeData'; }).length === 0) {
        throw new Error('Compacted graph contains no forks (topology has no intersections).');
    }
}

PathFinder.prototype = {
    findPath: function(a, b) {
        var start = this._keyFn(roundCoord.coordToInt(a.geometry.coordinates, this._precision)),
            finish = this._keyFn(roundCoord.coordToInt(b.geometry.coordinates, this._precision));

        // We can't find a path if start or finish isn't in the
        // set of non-compacted vertices
        if (!this._graph.vertices[start] || !this._graph.vertices[finish]) {
            return null;
        }

        var phantomStart = this._createPhantom(start);
        var phantomEnd = this._createPhantom(finish);

        var path = traverse.findPath(this._graph.compactedVertices, start, finish);

        if (path) {
            var weight = path[0];
            path = path[1];
            return {
                path: path.reduce(function buildPath(cs, v, i, vs) {
                    if (i > 0) {
                        cs = cs.concat(this._graph.compactedCoordinates[vs[i - 1]][v]);
                    }
                    return cs
                }.bind(this), []).concat([this._graph.sourceVertices[finish]]),
                weight: weight,
                edgeDatas: this._graph.compactedEdges
                    ? path.reduce(function buildEdgeData(eds, v, i, vs) {
                        if (i > 0) {
                            eds.push({
                                reducedEdge: this._graph.compactedEdges[vs[i - 1]][v]
                            });
                        }

                        return eds;
                    }.bind(this), [])
                    : undefined
            };
        } else {
            return null;
        }

        this._removePhantom(phantomStart);
        this._removePhantom(phantomEnd);
    },

    isochrone: function(a, costContours) {
        var start = this._keyFn(roundCoord.coordToInt(a.geometry.coordinates, this._precision));

        // We can't find a path if start or finish isn't in the
        // set of non-compacted vertices
        if (!this._graph.vertices[start]) {
            return null;
        }
        var phantomStart = this._createPhantom(start);
        var maxCost = costContours[costContours.length -1]
        var costs = traverse.costAll(this._graph.compactedVertices, start, maxCost)
        var thresholdPoints =  Array.from({length: costContours.length }, _ => [a.geometry.coordinates])
        Object.keys(costs).forEach(cost => {
            costContours.forEach((t, i) =>{
                if (costs[cost] < t) {
                    thresholdPoints[i].push(toCoords(cost))
                }
            })
        })

        var fc = {type: "FeatureCollection", features: []}
        var concavity = this._concavity;
        fc.features = costContours.map((t,i) => {
            var poly = concaveman(thresholdPoints[i], concavity)
            return {type: "Feature", geometry:{type: "Polygon", coordinates:[poly]}, properties:{value: t}}
        })

        this._removePhantom(phantomStart);
        return fc
    },

    serialize: function() {
        return this._graph;
    },

    _createPhantom: function(n) {
        if (this._graph.compactedVertices[n]) return null;

        var phantom = compactor.compactNode(n, this._graph.vertices, this._graph.compactedVertices, this._graph.sourceVertices, this._graph.edgeData, true, this._options);
        this._graph.compactedVertices[n] = phantom.edges;
        this._graph.compactedCoordinates[n] = phantom.coordinates;

        if (this._graph.compactedEdges) {
            this._graph.compactedEdges[n] = phantom.reducedEdges;
        }

        Object.keys(phantom.incomingEdges).forEach(function(neighbor) {
            this._graph.compactedVertices[neighbor][n] = phantom.incomingEdges[neighbor];
            this._graph.compactedCoordinates[neighbor][n] = phantom.incomingCoordinates[neighbor];
            if (this._graph.compactedEdges) {
                this._graph.compactedEdges[neighbor][n] = phantom.reducedEdges[neighbor];
            }
        }.bind(this));

        return n;
    },

    _removePhantom: function(n) {
        if (!n) return;

        Object.keys(this._graph.compactedVertices[n]).forEach(function(neighbor) {
            delete this._graph.compactedVertices[neighbor][n];
        }.bind(this));
        Object.keys(this._graph.compactedCoordinates[n]).forEach(function(neighbor) {
            delete this._graph.compactedCoordinates[neighbor][n];
        }.bind(this));
        if (this._graph.compactedEdges) {
            Object.keys(this._graph.compactedEdges[n]).forEach(function(neighbor) {
                delete this._graph.compactedEdges[neighbor][n];
            }.bind(this));
        }

        delete this._graph.compactedVertices[n];
        delete this._graph.compactedCoordinates[n];

        if (this._graph.compactedEdges) {
            delete this._graph.compactedEdges[n];
        }
    }
};
