function coordToInt(c, precision) {
  return [Math.round(c[0] * precision), Math.round(c[1] * precision)];
}

function coordToFloat(c, precision) {
  return [c[0] / precision, c[1] / precision];
}

function toCoords(p) {
  return coordToFloat(
    p.split(",").map((n) => parseInt(n, 36)),
    1e5
  );
}

function toKey(c) {
  return coordToInt(c, 1e5)
    .map((n) => n.toString(36))
    .join(",");
}

module.exports = {
  coordToInt: coordToInt,
  coordToFloat: coordToFloat,
  toCoords: toCoords,
  toKey: toKey,
};
