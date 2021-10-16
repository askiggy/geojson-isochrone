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


function eachNode(graph, start, func) {
    var initialState = [0, start];
    var queue = new Queue([initialState], function(a, b) { return a[0] - b[0]; });
    var visited = new Set()
    while (queue.length) {
        var state = queue.pop();
        var cost = state[0];
        var node = state[1];
        visited.add(node)
        var neighbours = graph[node];
        if (func) func(graph, node);
        Object.keys(neighbours).forEach(function(n) {
            var newCost = cost + neighbours[n];
            if (!(visited.has(n))) {
                var newState = [newCost, n];
                queue.push(newState);

            }
        });
    }
    return visited
}


function connectivity(graph) {
    var verticesLeft = new Map(Object.keys(graph).map(k => [k,true]));
    var connectedGraphsItr = 0;
    var iter = verticesLeft.keys()
    var initValue = iter.next().value
    var connectedGraphs = [[initValue, 0]];
    var initialState = [0, initValue];
    var queue = new Queue([initialState], function(a, b) { return a[0] - b[0]; });

    while (queue.length) {
        var state = queue.pop();
        var cost = state[0];
        var node = state[1];

        connectedGraphs[connectedGraphsItr][1] +=1

        var neighbours = graph[node];
        Object.keys(neighbours).forEach(function(n) {
            var newCost = cost + neighbours[n];
            if (verticesLeft.has(n)) {
                var newState = [newCost, n];
                queue.push(newState);
                verticesLeft.delete(n);
            }
        });
        if (queue.length === 0 && verticesLeft.size > 0) {
            connectedGraphsItr +=1
            initValue = iter.next().value
            connectedGraphs[connectedGraphsItr] = [initValue, 0]
            queue.push([0, initValue]);
        }
    }

    // find the biggest connected graph
    var maxItr =0
    for(var i =0; i < connectedGraphs.length; i++) {
        if (connectedGraphs[i][1] > connectedGraphs[maxItr][1]) {
            maxItr = i
        }
    }
    for(var i =0; i < connectedGraphs.length; i++) {
        if (i === maxItr) continue;
        var allNodes = eachNode(graph, connectedGraphs[i][0])
        allNodes.forEach(node => {
            delete graph[node];
        })
    }
    return graph
}


module.exports = {
    findPath: findPath,
    costAll: costAll,
    connectivity: connectivity
}