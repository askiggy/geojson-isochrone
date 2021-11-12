var Queue = require("tinyqueue").default || require("tinyqueue");

// percentage of overall nodes a disconnected graph must contain to avoid deletion
const GRAPH_SIZE_THRESHOLD = 0.2;

function costAll(graph, start, maxCost) {
  var costs = {};
  costs[start] = 0;
  var initialState = [0, start];
  var queue = new Queue([initialState], function (a, b) {
    return a[0] - b[0];
  });

  while (queue.length) {
    var state = queue.pop();
    var cost = state[0];
    var node = state[1];

    var neighbours = graph.get(node);
    neighbours.forEach((value, key) => {
      if (value <= 0) return;
      var newCost = cost + value;
      if (newCost < maxCost && (!(key in costs) || newCost < costs[key])) {
        costs[key] = newCost;
        var newState = [newCost, key];
        queue.push(newState);
      }
    });
  }
  return costs;
}

function eachNode(graph, start) {
  var initialState = [0, start];
  var queue = new Queue([initialState], function (a, b) {
    return a[0] - b[0];
  });
  var visited = new Set();

  while (queue.length) {
    var state = queue.pop();
    var cost = state[0];
    var node = state[1];
    var neighbours = graph.get(node);
    neighbours.forEach(function (value, key) {
      if (key === "gp") return;
      var newCost = cost + value;
      if (!visited.has(key)) {
        var newState = [newCost, key];
        queue.push(newState);
        visited.add(key);
      }
    });
  }
  return visited;
}

function connectivity(graph) {
  var connectedGraphsItr = 0;
  var iter = graph.keys();

  var iterValue = iter.next().value;
  var connectedGraphs = [[iterValue, 0]];
  var initialState = [0, iterValue];
  var queue = new Queue([initialState], function (a, b) {
    return a[0] - b[0];
  });
  var toExplore = graph.size;

  while (queue.length) {
    var state = queue.pop();
    var cost = state[0];
    var node = state[1];

    connectedGraphs[connectedGraphsItr][1] += 1;
    var neighbours = graph.get(node);
    neighbours.forEach(function (value, key) {
      if (key === "gp") return;
      var newCost = cost + value;
      if (!graph.get(key).has("gp")) {
        var newState = [newCost, key];
        queue.push(newState);
        toExplore -= 1;
        graph.get(key).set("gp", connectedGraphsItr);
      }
    });
    if (queue.length === 0 && toExplore > 0) {
      connectedGraphsItr += 1;
      do {
        iterValue = iter.next().value;
      } while (iterValue && graph.get(iterValue).has("gp"));

      if (iterValue) {
        connectedGraphs[connectedGraphsItr] = [iterValue, 0];
        queue.push([0, iterValue]);
      }
    }
  }

  // re-traverse disconnected graphs and delete those
  // nodes from the graph if they arent at least 20% of total nodes.
  var totalGraphNodes = graph.size;
  for (var i = 0; i < connectedGraphs.length; i++) {
    if (connectedGraphs[i][1] / totalGraphNodes > GRAPH_SIZE_THRESHOLD) continue;
    var allNodes = eachNode(graph, connectedGraphs[i][0]);
    allNodes.forEach((node) => {
      graph.delete(node);
    });
    graph.delete(connectedGraphs[i][0]);
  }

  // clean up graph partition marker
  graph.forEach((value, _) => {
    value.delete("gp");
  });

  return graph;
}

module.exports = {
  costAll: costAll,
  connectivity: connectivity,
};
