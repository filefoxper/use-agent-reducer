[![npm][npm-image]][npm-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/use-agent-reducer.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/use-agent-reducer
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

# use-agent-reducer

这是一款非常有趣的 react hook 状态管理工具，它的设计初衷是为了代替 reducer 管理工具繁杂的事件分发机制，如今已然取得了一些不错的成效。其设计思想是以一个带有 state 属性的 class 或 object 为模型，通过调用方法的形式来代替事件分发，并将方法返回值更新为当前 state 状态。这看起来就像是 reducer 和 react class component 写法的结合体。

其核心依赖库为[agent-reducer](https://www.npmjs.com/package/agent-reducer)，您可以通过阅读该库的[文档](https://github.com/filefoxper/agent-reducer/blob/master/documents/zh/index.md)来预先了解`use-agent-reducer`支持的特性和用法，但我们依然推荐您以当前[文档](/zh/introduction)为引导，逐步了解关于这个库的特性及其用法。