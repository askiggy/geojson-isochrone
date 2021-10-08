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
    var initialState = [0, start];
    var queue = new Queue([initialState], function(a, b) { return a[0] - b[0]; });

    while (queue.length) {
        var state = queue.pop();
        var cost = state[0];
        var node = state[1];

        var neighbours = graph[node];
        Object.keys(neighbours).forEach(function(n) {
            var newCost = cost + neighbours[n];
            if (newCost < maxCost && (!(n in costs) || newCost < costs[n])) {
                costs[n] = newCost;
                var newState = [newCost, n];
                queue.push(newState);
            }
        });
    }

    return costs
}

function connectivity(graph) {
    var verticesLeft = Object.assign({}, graph)
    var connectedGraphsItr = 0;
    var connectedGraphs = [[]];
    var initialState = [0, Object.keys(verticesLeft)[0]];
    var queue = new Queue([initialState], function(a, b) { return a[0] - b[0]; });

    while (queue.length) {
        var state = queue.pop();
        var cost = state[0];
        var node = state[1];
        delete verticesLeft[node];
        connectedGraphs[connectedGraphsItr].push(node)

        var neighbours = graph[node];
        Object.keys(neighbours).forEach(function(n) {
            var newCost = cost + neighbours[n];
            if ( (n in verticesLeft)) {
                var newState = [newCost, n];
                queue.push(newState);
            }
        });
        if (queue.length === 0 && Object.keys(verticesLeft).length > 0) {
            connectedGraphsItr +=1
            connectedGraphs[connectedGraphsItr] = []
            queue.push([0, Object.keys(verticesLeft)[0]]);

        }
    }

    // find the biggest connected graph
    var maxItr =0
    for(var i =0; i < connectedGraphs.length; i++) {
        if (connectedGraphs[i].length > connectedGraphs[maxItr].length) {
            maxItr = i
        }
    }
    // delete vertices that arent part of the biggest connected graph
    for(var i =0; i < connectedGraphs.length; i++) {
        if (i === maxItr) continue;
        for(var j =0; j < connectedGraphs[i].length; j++) {
            delete graph[connectedGraphs[i][j]]
        }
    }
    return graph
}


module.exports = {
    findPath: findPath,
    costAll: costAll,
    connectivity: connectivity
}