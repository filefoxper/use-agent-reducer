## v3.2.5 2021-04-10

* [新增] 添加 API [useAgentSelector](/zh/api?id=useagentselector)， 用于优化模型共享的组件性能。
* [新增] 添加 API [useAgentMethods](/zh/api?id=useagentmethods)， 用于优化模型共享的组件性能。

## v3.2.7 2021-04-11

* [更新] API [useAgentSelector](/zh/api?id=useagentselector) 增加提取数据等价对比功能，进一步优化性能。
* [新增] 添加 API [shallowEqual](/zh/api?id=shallowequal)，用于快速浅对比两个数据是否等价。

## v3.2.8 2021-04-11

* [编译] 减小编译后包的大小。

## v3.3.0 2021-05-07

* [编译] 提供了 `es` 包，以便减小编译后的包体积。[参考详情](/zh/introduction?id=安装)

## v3.3.2 2021-05-24

* [bug] 修复 `useAgentMethods` 不能更新 state 的问题。

## v3.4.0 2021-06-01

* [优化] 针对 `agent-reducer@3.4.1` 作出代码调整 

## v3.6.0 2021-06-22

* [优化] 针对 `agent-reducer@3.6.0` 作出代码调整 

## v3.7.0 2021-08-25

* [bug] 修复关于使用 `react-dev-tool` 时，state 无法改变的问题。

## v3.7.1 2021-08-26

* [bug] 修复关于使用 `react-refresh` 热更新时，state 无法链接的问题。

## v3.7.2 2021-08-27

* [bug] 修复 use-agent-reducer 内部 ts 错误.

## v3.8.0 2021-10-15

* [bug] 修复 use-agent-reducer 内嵌 agent-reducer@3.7.2 的问题。
* [优化] 更改了 use-agent-reducer 对 agent-reducer 的依赖模式。

## v4.0.0 2021-10-25

* [优化] 使用 `agent-reducer@4.0.0` 依赖
* [优化] 删除 bad design 与对老版本 `agent-reducer` 的支持

## v4.1.0 2021-11-16

* [新增] 接口 [useModelProvider](/zh/api?id=usemodelprovider) 和 [useModel](/zh/api?id=usemodel)

## v4.1.1 2021-11-16

* [bug] 修复 useModelProvider 接口的 typescript 问题。

## v4.1.2 2021-11-16

* [bug] 修复并行 useModelProvider 产生的嵌套 Provider 无法找到模型实例的问题。

## v4.1.3 2021-11-23

* [新增] 新增 API [useWeakSharing](/zh/api?id=useweaksharing)。

## v4.1.4 2021-11-23

* [bug] 修复由 4.1.3 useWeakSharing 引起的 API [useModelProvider](/api?id=usemodelprovider) "can not find model" 错误问题。

## v4.1.5 2021-12-12

* [update] 跟随 `agent-reducer@4.0.4` 更新。

## v4.1.6 2022-02-14

* [bug] 修复子组件的 useEffect 中使用父组件 agent 未链接问题。

## v4.1.7 2022-02-14

* [bug] 修复关于 `useModel` API 中使用 Model class 时，class 传参错误问题。

## v4.2.0 2022-03-19

* [update] 新增 API [useAgentEffect](/zh/api?id=useagenteffect)

## v4.3.0 2022-04-06

* [update] 跟随 `agent-reducer@4.3.0` 更新。

## v4.3.1 2022-04-25

* [新增] 为 API [useModel](/zh/api?id=usemodel) 添加第二个参数 defaultModel。

## v4.5.0 2022-05-23

* [update] 使用 agent-reducer@4.5.0 auto connect 特性。并修复使用同一 `weakSharing` 弱共享组件，互切时，无法清理模型状态的问题
