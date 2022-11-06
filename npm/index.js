'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./use-agent-reducer.min.js');
} else {
    module.exports = require('./use-agent-reducer.js');
}
