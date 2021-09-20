module.exports = {
    coordToInt: function coordToInt(c, precision) {
        return [
            Math.round(c[0] * precision),
            Math.round(c[1] * precision)
        ];
    },
    coordToFloat: function coordToFloat(c, precision) {
        return [
            c[0] / precision,
            c[1] / precision
        ];
    }
}
