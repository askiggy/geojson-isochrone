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

        var neighbours = graph.get(node);
        neighbours.forEach((value, key) => {
            var newCost = cost + value;
            if (newCost < maxCost && (!(key in costs) || newCost < costs[key])) {
                costs[key] = newCost;
                var newState = [newCost, key];
                queue.push(newState);
            }
        });
    }

    return costs
}


function eachNode(graph, start) {
    var initialState = [0, start];
    var queue = new Queue([initialState], function(a, b) { return a[0] - b[0]; });
    var visited = new Set()

    while (queue.length) {
        var state = queue.pop();
        var cost = state[0];
        var node = state[1];

        var neighbours = graph.get(node);
        neighbours.forEach(function(value, key) {
            if (key === 'gp') return;
            var newCost = cost + value;
            if (!(visited.has(key))) {
                var newState = [newCost, key];
                queue.push(newState);
                visited.add(key)
            }
        });
    }
    return visited
}


function connectivity(graph) {
    var connectedGraphsItr = 0;
    var iter = graph.keys()

    var iterValue = iter.next().value
    var connectedGraphs = [[iterValue, 0]];
    var initialState = [0, iterValue];
    var queue = new Queue([initialState], function(a, b) { return a[0] - b[0]; });
    var toExplore = graph.size

    while (queue.length) {
        var state = queue.pop();
        var cost = state[0];
        var node = state[1];

        connectedGraphs[connectedGraphsItr][1] +=1
        var neighbours = graph.get(node);
        neighbours.forEach(function(value, key) {
            if (key === 'gp') return;
            var newCost = cost + value;
            if (!graph.get(key).has('gp')) {
                var newState = [newCost, key];
                queue.push(newState);
                toExplore -=1
                graph.get(key).set('gp', connectedGraphsItr)
            }
        });
        if (queue.length === 0 && toExplore > 0) {
            connectedGraphsItr +=1
            do {
                iterValue = iter.next().value
            } while (iterValue && graph.get(iterValue).has('gp'))

            if (iterValue) {
                connectedGraphs[connectedGraphsItr] = [iterValue, 0]
                queue.push([0, iterValue]);
            }
        }
    }

    // find the biggest connected graph
    var maxItr =0
    for(var i =0; i < connectedGraphs.length; i++) {
        if (connectedGraphs[i][1] > connectedGraphs[maxItr][1]) {
            maxItr = i
        }
    }
    // re-traverse the small disconnected graphs and delete those
    // nodes from the graph
    for(var i =0; i < connectedGraphs.length; i++) {
        if (i === maxItr) continue;
        var allNodes = eachNode(graph, connectedGraphs[i][0])
        allNodes.forEach(node => {
            graph.delete(node);
        })
        graph.delete(connectedGraphs[i][0])
    }

    // clean up graph partition marker
    graph.forEach((value, key) => {
        value.delete('gp')
    })

    return graph
}


module.exports = {
    findPath: findPath,
    costAll: costAll,
    connectivity: connectivity
}