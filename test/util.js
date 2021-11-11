const fs = require('fs');

module.exports.testJsonFixture = function (t, testname, data) {
    var stringified = JSON.stringify(data, null, 2);
    const filename = __dirname + `/fixtures/${testname}.json`;
    if (process.env.UPDATE_FIXTURES) {
      fs.writeFileSync(filename, stringified);
    }
    var fixture = fs.readFileSync(filename, "utf8");
    t.equals(stringified, fixture, `should match fixture ${testname}`);
  };
