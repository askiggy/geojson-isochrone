var Isochrone = require("../"),
  geojson = require("./network.json"),
  test = require("tape"),
  point = require("turf-point"),
  util = require("./util");

test("can create Isochrone", function (t) {
  var iso = new Isochrone(geojson);
  t.ok(iso);
  t.end();
});

test("can generate isochrone", function (t) {
  var iso = new Isochrone(geojson),
    isochrone = iso.isochrone(point([8.44460166, 59.48947469]), [10]);

  util.testJsonFixture(t, "simple-isochrone", isochrone);
  t.end();
});
