# GeoJSON Isochrone

Generate a isochrone from network of GeoJSON.

Given a network of GeoJSON `LineString`s, GeoJSON Isochrone will explore the network, finding the farthest points that can be reached in the cost specified. This is useful for

This code base forked from [GeoJSON Path Finder](https://github.com/perliedman/geojson-path-finder) by [@perliedman](https://github.com/perliedman). We have put it into a separate package to have this focus on just generating isochrones and being able to make optimizations for output that wouldn't necessarily fit with path finding.

## Installing

```
npm install --save @askiggy/geojson-isochrone
```

## API

Create a path finding object:

```javascript
var Isochrone = require("@askiggy/geojson-isochrone"),
  geojson = require("./network.json");

var ic = new Isochrone(geojson);
```

The GeoJSON object should be a `FeatureCollection` of `LineString` features. The network will be built
into a topology, so that lines that start and end, or cross, at the same coordinate are joined such that
you can find a path from one feature to the other.

To generate the isochrones from starting point with 1 or more cost contour:

```javascript
var isochrones = ic.isochrone(start, costs);
```

Where `start` is a GeoJSON `point` feature. If the starting point isnt on the routing network the nearest point that is part of the network will be picked.

`cost` is an array of costs at which to generate concave polygons. By default the weight is distnace, so those costs
would be the max distance that can be reached. If you provide a different `weightFn` function to calcuate the edge weight, cost will be in the same units.

### `Isochrone` options

The `Isochone` constructor takes an optional seconds parameter containing `options` that you can
use to control the behaviour of the graph that is generated. Available options:

- `weightFn` controls how the weight (or cost) of travelling between two vertices is calculated;
  by default, the geographic distance between the coordinates is calculated and used as weight;
  see [Weight functions](#weight-functions) below for details
- `concavity` This is a value passed in that impact how detailed the returned polygon is. This value is passed directly into concaveman

## Weight functions

By default, the _cost_ of going from one node in the network to another is determined simply by
the geographic distance between the two nodes. This means that, by default, shortest paths will be found.
You can however override this by providing a cost calculation function through the `weightFn` option:

```javascript
var ic = new Isochrone(geojson, {
  weightFn: function (a, b, props) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  },
});
```

The weight function is passed two coordinate arrays (in GeoJSON axis order), as well as the feature properties
that are associated with this feature, and should return either:

- a numeric value for the cost of travelling between the two coordinates; in this case, the cost is assumed
  to be the same going from `a` to `b` as going from `b` to `a`
- an object with two properties: `forward` and `backward`; in this case,
  `forward` denotes the cost of going from `a` to `b`, and
  `backward` the cost of going from `b` to `a`; setting to a number less than or equal to
  `0`,  will prevent taking that direction, the segment will be a oneway.
