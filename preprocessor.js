"use strict";

var topology = require("./topology"),
  distance = require("@turf/distance").default,
  roundCoord = require("./round-coord"),
  point = require("turf-point"),
  traverse = require("./dijkstra");

module.exports = function preprocess(input, options) {
  options = options || {};
  var weightFn =
      options.weightFn ||
      function defaultWeightFn(a, b) {
        return distance(point(a), point(b));
      },
    topo;

  if (input.type === "FeatureCollection") {
    // Graph is GeoJSON data, create a topology from it
    topo = topology(input, options);
  } else if (input.edges) {
    // Graph is a preprocessed topology
    topo = input;
  }

  var graph = topo.edges.reduce(
    function buildGraph(g, edge, i, es) {
      var a = edge[0],
        b = edge[1],
        props = edge[2],
        w = weightFn(roundCoord.toCoords(a), roundCoord.toCoords(b), props),
        makeEdgeList = function makeEdgeList(node) {
          if (!g.vertices.has(node)) {
            g.vertices.set(node, new Map());
          }
        },
        concatEdge = function concatEdge(startNode, endNode, weight) {
          var v = g.vertices.get(startNode);
          v.set(endNode, weight);
        };

      if (w) {
        makeEdgeList(a);
        makeEdgeList(b);
        if (w instanceof Object) {
          if (w.forward  !== undefined) {
            concatEdge(a, b, w.forward);
          }
          if (w.backward !== undefined) {
            concatEdge(b, a, w.backward);
          }
        } else {
          concatEdge(a, b, w);
          concatEdge(b, a, w);
        }
      }

      if (i % 1000 === 0 && options.progress) {
        options.progress("edgeweights", i, es.length);
      }

      return g;
    },
    { edgeData: new Map(), vertices: new Map() }
  );
  // drop vertices from unconnected graphs
  if (graph.vertices.size > 0) {
    traverse.connectivity(graph.vertices);
  }

  return {
    vertices: graph.vertices,
  };
};
