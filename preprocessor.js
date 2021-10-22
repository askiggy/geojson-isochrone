'use strict';

var topology = require('./topology'),
    compactor = require('./compactor'),
    distance = require('@turf/distance').default,
    roundCoord = require('./round-coord'),
    point = require('turf-point'),
    traverse = require('./dijkstra');

module.exports = function preprocess(graph, options) {
    options = options || {};
    var weightFn = options.weightFn || function defaultWeightFn(a, b) {
            return distance(point(a), point(b));
        },
        topo;

    if (graph.type === 'FeatureCollection') {
        // Graph is GeoJSON data, create a topology from it
        topo = topology(graph, options);
    } else if (graph.edges) {
        // Graph is a preprocessed topology
        topo = graph;
    }
    // console.log(topo)

    var graph = topo.edges.reduce(function buildGraph(g, edge, i, es) {
        var a = edge[0],
            b = edge[1],
            props = edge[2],
            w = weightFn(roundCoord.toCoords(a), roundCoord.toCoords(b), props),
            makeEdgeList = function makeEdgeList(node) {
                if (!g.vertices.has(node)) {
                    g.vertices.set(node, new Map());
                    // if (options.edgeDataReduceFn) {
                    //     g.edgeData[node] = {};
                    // }
                }
            },
            concatEdge = function concatEdge(startNode, endNode, weight) {
                var v = g.vertices.get(startNode);
                v.set(endNode, weight);
                // if (options.edgeDataReduceFn) {
                //     g.edgeData[startNode][endNode] = options.edgeDataReduceFn(options.edgeDataSeed, props);
                // }
            };

        if (w) {
            makeEdgeList(a);
            makeEdgeList(b);
            if (w instanceof Object) {
                if (w.forward) {
                    concatEdge(a, b, w.forward);
                }
                if (w.backward) {
                    concatEdge(b, a, w.backward);
                }
            } else {
                concatEdge(a, b, w);
                concatEdge(b, a, w);
            }
        }

        if (i % 1000 === 0 && options.progress) {
            options.progress('edgeweights', i,es.length);
        }

        return g;
    }, {edgeData: new Map(), vertices: new Map()});
    // console.log(`preprocess before connectivity - mem heap used: ${process.memoryUsage().heapUsed}`)
    // drop vertices from unconnected graphs
    // console.log(graph.vertices)
    traverse.connectivity(graph.vertices)
    // console.log(`preprocess after connectivity - mem heap used: ${process.memoryUsage().heapUsed}`)
    var compact = {}
    if (options.compact === undefined || options.compact) {
        compact = compactor.compactGraph(graph.vertices, topo.vertices, graph.edgeData, options);
    }

    return {
        vertices: graph.vertices,
        // edgeData: graph.edgeData,
        // sourceVertices: topo.vertices,
        compactedVertices: compact.graph || graph.vertices,
        // compactedCoordinates: compact.coordinates,
        // compactedEdges: options.edgeDataReduceFn ? compact.reducedEdges : null
    };
};
