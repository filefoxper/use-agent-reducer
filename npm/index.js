'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./use-agent-reducer.mini.js');
} else {
    module.exports = require('./use-agent-reducer.js');
}
