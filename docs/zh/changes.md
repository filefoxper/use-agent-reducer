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

## ~~v4.5.0 to v4.5.3~~

* [deprecated] 这些版本考虑了 effect 的运行时机，这是非常不合理的，react effect 并非生命周期。每个 effect 都是对一次全量更新做出的反应，是单个组件对一次全量更新副作用的汇总项，而非针对单个组件。为此，我们决定维持 4.3.1 以及之前版本的正确理解方案，做出回滚操作。

## v4.5.4 2022-05-25

* [revert] 回滚至 4.3.1

## v4.6.0 2022-07-05

* [bug] 解决 react-refresh 插件热更新时，代码不能及时更新的问题。 

## v4.6.1 2022-07-06

* [update] 解决 react-refresh 插件热更新时，代码不能及时更新的问题。可参考文档  [react-refresh](/zh/introduction?id=react-refresh) 。

## v4.6.2 2022-07-20

* [bug] 解决 `useAgentSelector` 更新不及时的问题，引发自 v4.6.1

## v4.6.3 2022-07-21

* [refactor] 将 `index.d.ts` 加入 eslint 检查. 

## v4.6.4 2022-10-29

* [optmize] 优化 `useAgentSelector`，加入 `comparators` 参数，当 comparators 数组更新时，也会触发筛选出的 state 数据更新。

## v4.6.6 2022-11-06

* [optmize] 优化编译过程，全面支持 ReactRefresh 以及 React 18 React.Strict 严格模式，使用者不再需要使用 webpack resolver alias 配置让 ReactRefresh 生效。

## v4.7.0 2022-11-11

* [design] 在保留原 useAgentReducer\useAgentMethods\useAgentSelector 的基础上增加了功能相同（或相似）的 useAgent\useMethods\useSelector hook 接口，以做调用简化，另外舍弃了原 esm 编译包。