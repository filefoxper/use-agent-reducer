if (process.env.NODE_ENV === "production") {
    module.exports = require("./dist/use-agent.min.js");
} else {
    module.exports = require("./dist/use-agent.js");
}