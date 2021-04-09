# API 文档

## useAgentReducer

这是一个 react hook 方法，可用于创建一个模型（`OriginAgent`）的 [Agent](/zh/introduction?id=模型代理-agent) 代理对象。通过使用该代理对象的方法，可以修改 state 数据。

```typescript
function useAgentReducer<T extends OriginAgent<S>, S>(
    entry: T | { new(): T }, 
    middleWareOrEnv?: MiddleWare | RunEnv, 
    env?: Omit<RunEnv, 'legacy'>
): T
```

* entry - 模型，可以是 class 也可以是 object 。
* middleWareOrEnv - 可选参数，如果想要设置 MiddleWare ，就传入 MiddleWare ，如果不想使用 MiddleWare ，想要配置运行环境参数，则传入环境配置。
* env - 可选参数，如果想同时使用 MiddleWare 和 环境配置，请通过该参数传入环境配置。

注意，`LifecycleMiddleWare`，比如 `LifecycleMiddleWares.takeLatest` 或 `MiddleWarePresets.takeLatest` 不能直接使用该接口，请使用接口 [useMiddleWare](#useMiddleWare) 或 `agent-reducer` API [middleWare](https://github.com/filefoxper/agent-reducer/blob/master/documents/zh/api/middle_ware.md)。

关于运行环境配置，可参考[此处](/zh/guides?id=关于运行环境配置-runenv)，关于 `MiddleWare` 的定义可参考 `agent-reducer` 文档[关于MiddleWare](https://github.com/filefoxper/agent-reducer/blob/master/documents/zh/guides/about_middle_ware.md)

[使用案例](/zh/tutorial?id=search-page-model)

## useMiddleWare

这是一个 react hook 方法，可用于复制一个 `Agent` 代理，并为复制代理添加不同于原代理 `Agent` 的 MiddleWare 。

虽然复制版 `Agent` 的 state 与原 `Agent` 代理的 state 保持一致，但我们推荐使用原 `Agent` 代理的 state 数据。 


```typescript
function useMiddleWare<T extends OriginAgent<S>, S>(
    agent: T, 
    ...middleWare: (MiddleWare | LifecycleMiddleWare)[]
):T
```

* agent - 通过 API [useAgentReducer](/zh/api?id=useagentreducer) 创建的 `Agent` 代理对象.
* mdws - `MiddleWares` you want to use in this copy `Agent` object.

[使用案例](/zh/tutorial?id=use-middleware).

## useAgentSelector

这是一个 react hook 方法，可用于提取被共享模型 state 中的部分数据，若被提取数据保持不变，则不会触发组件渲染。

```typescript
export function useAgentSelector<T extends OriginAgent<S>, S, R>(
  entry: T,
  mapStateCallback: (state: T['state']) => R,
): R
```

* entry - 模型实例 object 。
* mapStateCallback - state 提取方法，用于提取当前模型实例 state 的部分数据，如果被提取数据保持不变则不会触发组件渲染。
  
该方法返回值即为被提取数据。

## useAgentMethods

这是一个 react hook 方法，可用于提取被共享模型中的方法，该 hook 本身不会触发当前使用组件渲染。

```typescript
export function useAgentMethods<T extends OriginAgent<S>, S>(
  entry: T,
  middleWareOrEnv?: MiddleWare | RunEnv,
  env?: Omit<RunEnv, 'legacy'>,
): Omit<T, 'state'>
```

* entry - 模型实例 object 。
* middleWareOrEnv - 可选参数，如果想要设置 MiddleWare ，就传入 MiddleWare ，如果不想使用 MiddleWare ，想要配置运行环境参数，则传入环境配置。
* env - 可选参数，如果想同时使用 MiddleWare 和 环境配置，请通过该参数传入环境配置。

该方法返回值为忽略了 state 数据的模型实例。

## ~~useAgent~~

(不推荐)

当前 API 接口为老版本的 [useAgentReducer](/zh/api?id=useagentreducer)。

## ~~useBranch~~

(不推荐)

当前 API 接口为老版本的 [useMiddleWare](/zh/api?id=usemiddleware)。

## ~~useMiddleActions~~

(不推荐)

当前方法是一个 react hook ，用于扩展 MiddleWare 的使用范围，您可以在 `agent-reducer` [文档](https://github.com/filefoxper/agent-reducer/blob/master/documents/en/guides/not_recommend.md)中查看其不被推荐的原因及其相关用法。 

```typescript
function useMiddleActions<T extends OriginAgent<S>, P extends MiddleActions<T, S>, S = any>(
    middleActions: { new(agent: T): P; } | P,
    ...middleWare: (MiddleWare | LifecycleMiddleWare)[]
): P
```

* middleActions - 继承 MiddleActions 的 class
* middleWare - MiddleWares

## ~~AgentProvider~~

(不推荐)

这是一个 React `Context.Provider` 组件，用于跨组件共享一个 `Agent` 代理。

`agent-reducer@3.2.0` 添加的[模型共享](/zh/guides?id=什么是模型共享)可以完美代替它及相关衍生工具。

```typescript
interface Props{
  value: T extends OriginAgent,
  children: ReactNodeLike
}
```
* value - `Agent` 代理对象，用于 children 共享。
* children - react 组件

## ~~useAgentContext~~

(不推荐)

这是个 react hook ，类似于 `useContext` ，可用来获取最近父组件中通过 `AgentProvider` 传入的 `Agent` 代理，并同步 state 更新。

`agent-reducer@3.2.0` 添加的[模型共享](/zh/guides?id=什么是模型共享)可以完美代替它及相关衍生工具。

```typescript
function useAgentContext<T extends OriginAgent>(): T
```

## ~~useParent~~

(不推荐)

早期版的[useAgentContext](/api?id=useagentcontext)。

  