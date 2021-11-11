var topology = require('../topology'),
    geojson = require('./network.json'),
    util = require('./util'),
    test = require('tape');

test('can create topology', function(t) {
    var topo = topology(geojson);
    t.ok(topo);
    t.ok(topo.edges);

    t.equal(topo.edges.length, 888);

    t.end();
});
