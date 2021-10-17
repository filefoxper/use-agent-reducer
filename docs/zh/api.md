# API 文档

## useAgentReducer

这是一个 react hook 方法，可用于创建一个模型（`Model`）的 [Agent](/zh/introduction?id=模型代理-agent) 代理对象。通过使用该代理对象的方法，可以修改 state 数据。

```typescript
function useAgentReducer<T extends Model<S>, S>(
    entry: T | { new(): T }, 
    ...mdws: MiddleWare[]
): T
```

* entry - 模型，可以是 class 也可以是 object 。
* mdws - 想要设置的 MiddleWare 。

注意，`LifecycleMiddleWare`，比如 `LifecycleMiddleWares.takeLatest` 或 `MiddleWarePresets.takeLatest` 不能直接使用该接口，请使用接口 [useMiddleWare](#useMiddleWare) 或 `agent-reducer` API [middleWare](https://filefoxper.github.io/agent-reducer/#/zh/api?id=middleware)。

关于运行环境配置，可参考[此处](/zh/guides?id=关于运行环境配置-runenv)，关于 `MiddleWare` 的定义可参考 `agent-reducer` 文档[关于MiddleWare](https://filefoxper.github.io/agent-reducer/#/zh/guides?id=中间件-middleware)

[使用案例](/zh/tutorial?id=search-page-model)

## useMiddleWare

这是一个 react hook 方法，可用于复制一个 `Agent` 代理，并为复制代理添加不同于原代理 `Agent` 的 MiddleWare 。

虽然复制版 `Agent` 的 state 与原 `Agent` 代理的 state 保持一致，但我们推荐使用原 `Agent` 代理的 state 数据。 


```typescript
function useMiddleWare<T extends Model<S>, S>(
    agent: T, 
    ...mdws: (MiddleWare | LifecycleMiddleWare)[]
):T
```

* agent - 通过 API [useAgentReducer](/zh/api?id=useagentreducer) 创建的 `Agent` 代理对象.
* mdws - 希望使用的 MiddleWare

[使用案例](/zh/tutorial?id=use-middleware).

## useAgentSelector

这是一个 react hook 方法，可用于提取被共享模型 state 中的部分数据，若被提取数据保持不变，则不会触发组件渲染。

```typescript
export function useAgentSelector<T extends Model<S>, S, R>(
  entry: T,
  mapStateCallback: (state: T['state']) => R,
  equalityFn?:(prev: R, current: R) => boolean,
): R
```

* entry - 模型实例 object 。
* mapStateCallback - state 提取方法，用于提取当前模型实例 state 的部分数据，如果被提取数据保持不变则不会触发组件渲染。
* equalityFn - 可选，用于对比 mapStateCallback 在模型 state 改变前后产生的数据，如果该函数返回 `true`，则 `useAgentSelector` 忽略 mapStateCallback 提取值的变化状况，不触发组件渲染。
  
该方法返回值即为被提取数据。

## useAgentMethods

这是一个 react hook 方法，可用于提取被共享模型中的方法，该 hook 本身不会触发当前使用组件渲染。

```typescript
export function useAgentMethods<T extends Model<S>, S>(
  entry: T,
  ...mdws: MiddleWare[]
): Omit<T, 'state'>
```

* entry - 模型实例 object 。
* mdws - 想要设置的 MiddleWare 。

该方法返回值为忽略了 state 数据的模型实例。

## shallowEqual

该方法可对两个数据进行浅对比，并判断两个数据是否等价。可用作[useAgentSelector](/zh/api?id=useagentselector)的`equalityFn`回调参数。

```typescript
function shallowEqual<R>(prev:R, current:R):boolean
```

* prev - 对比数据之一.
* current - 对比数据之一.

如果浅对比等价则返回 `true` ，否则返回 `false` 。

  