if (process.env.NODE_ENV === "production") {
    module.exports = require("./dist/use-agent-reducer.min.js");
} else {
    module.exports = require("./dist/use-agent-reducer.js");
}