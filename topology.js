"use strict";

var roundCoord = require("./round-coord");

module.exports = topology;

function geoJsonReduce(geojson, fn, seed) {
  if (geojson.type === "FeatureCollection") {
    return geojson.features.reduce(function reduceFeatures(a, f) {
      return geoJsonReduce(f, fn, a);
    }, seed);
  } else {
    return fn(seed, geojson);
  }
}

function geoJsonFilterFeatures(geojson, fn) {
  var features = [];
  if (geojson.type === "FeatureCollection") {
    features = features.concat(geojson.features.filter(fn));
  }

  return {
    type: "FeatureCollection",
    features: features,
  };
}

function isLineString(f) {
  return f.geometry.type === "LineString";
}

function topology(geojson, options) {
  options = options || {};
  var keyFn = options.keyFn || roundCoord.toKey;

  var lineStrings = geoJsonFilterFeatures(geojson, isLineString);
  var edges = geoJsonReduce(
    lineStrings,
    function buildTopologyEdges(es, f, i, fs) {
      f.geometry.coordinates.forEach(function buildLineStringEdges(c, i, cs) {
        if (i > 0) {
          var k1 = keyFn(cs[i - 1]),
            k2 = keyFn(c);
          es.push([k1, k2, f.properties]);
        }
      });

      if (i % 1000 === 0 && options.progress) {
        options.progress("topo:edges", i, fs.length);
      }

      return es;
    },
    []
  );

  return {
    edges: edges,
  };
}
