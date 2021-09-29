var Queue = require('tinyqueue').default || require('tinyqueue');
var roundCoord = require('./round-coord');




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


function costAll(graph, start, maxCost) {
    var costs = {};
    costs[start] = 0;
    var initialState = [0, [start], start];
    var queue = new Queue([initialState], function(a, b) { return a[0] - b[0]; });

    while (queue.length) {
        var state = queue.pop();
        var cost = state[0];
        var node = state[2];

        var neighbours = graph[node];
        Object.keys(neighbours).forEach(function(n) {
            var newCost = cost + neighbours[n];
            if (newCost < maxCost && (!(n in costs) || newCost < costs[n])) {
                costs[n] = newCost;
                var newState = [newCost, state[1].concat([n]), n];
                queue.push(newState);
            }
        });
    }

    return costs
}

module.exports = {
    findPath: findPath,
    costAll: costAll
}