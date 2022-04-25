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
* mdws - 可选项，想要设置的 MiddleWare 。

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
* mdws - 可选项，想要设置的 MiddleWare 。

该方法返回值为忽略了 state 数据的模型实例。

## shallowEqual

该方法可对两个数据进行浅对比，并判断两个数据是否等价。可用作[useAgentSelector](/zh/api?id=useagentselector)的`equalityFn`回调参数。

```typescript
export function shallowEqual<R>(prev:R, current:R):boolean
```

* prev - 对比数据之一.
* current - 对比数据之一.

如果浅对比等价则返回 `true` ，否则返回 `false` 。

## useModelProvider

这是一个 react hook 方法，可用于生成一个 `Context.Provider` 组件，方法入参即该 `Provider` 需要的模型实例或模型实例集合。该 `Provider` 的子组件可通过 [useModel](/zh/api?id=usemodel) API 访问当前或父级 `Provider` 设置的模型实例。

```typescript
export function useModelProvider(
    models: Model|Record<string, Model>|Array<Model>,
    isRootProvider?: boolean,
):NamedExoticComponent<{ children: JSX.Element }>;
```

* models - 模型实例，模型实例对象集合 或 模型实例数组集合。提供给子组件访问的共享模型实例。
* isRootProvider - 可选项，用于标记当前产生的 `Provider` 是否为根级 `Provider`。

返回 `Provider` 组件。注意：每一个由 useModelProvider 产生的 Provider 会累积最近一层父 Provider 提供的模型实例。如果想要切断子组件中 useModel 对当前 Provider 父级模型的访问，需要将参数 isRootProvider 标记为 true。

## useModel

这是一个 react hook 方法，用于连接并查取 [useModelProvider](/zh/api?id=usemodelprovider) API 生成的 `Provider` 提供的模型实例。如果在最近层 `Provider` 中没有查找到相关模型，则会继续沿着其父级模型集合一层一层的往上查，知道顶级或遇到一个 `isRootProvider` 为 `true` 的 Provider 为止。

```typescript
export function useModel<T extends Model>(
    key: string| number| { new(): T },
    defaultModel?:T
):T;
```

* key - 查询索引，如果当前作用域 Provider 或其父 Provider 中又包含当前 key 的对象模型实例集合，则获取最近一层相关的 key 对应的实例。key 可以是字符串，可以是数字，也可以是模型的 class 。
* defaultModel - 可选，当 useModel 无法从父级 Context 获取模型实例时，会采用默认模型实例。

如果查询失败，该方法会爆错，否则返回查询到的最近一个符合条件的模型实例。


## useWeakSharing

创建一个 `weakSharing` 引用，可通过 props 或 React.Context 传递给子组件进行渲染同步。

```typescript
export declare function useWeakSharing<
    S,
    T extends Model<S> = Model<S>>(factory:Factory<S, T>):SharingRef<S, T>;
```

* factory - 创建模型实例的回调函数

返回一个 sharing 引用.

当前 API 是 `agent-reducer` API [weakSharing](https://filefoxper.github.io/agent-reducer/#/api?id=weaksharing) 的一个 hook 应用。

## useAgentEffect

要求 agent-reducer >=4.2.3 ，创建一个模型副作用监听目标模型或代理 state 变化。

```typescript
export declare function useAgentEffect<S, T extends Model<S>=Model<S>>(
    callback:EffectCallback<S>,
    target:T,
    ...methods:(((...args:any[])=>any)|string)[]
):void;
```

* callback - 副作用回调函数，可接收 `prevState`, `state`, `methodName` 三个参数：改变前 state，改变后 state，引起改变的方法。
* target - 被监听的模型或代理对象。
* methods - 可选，指定需要监听的方法，不加方法过滤，在第一次使用 useAgentEffect 时，副作用回调函数会被立即触发一次。如添加该参数，当且仅当由指定方法引起 state 变更时才会触发副作用回调函数

该 API 无返回值。

移步至[教程](/zh/tutorial?id=使用副作用)，看看如何使用该 API。
