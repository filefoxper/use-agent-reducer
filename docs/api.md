# API Reference

## useAgentReducer

This api function is a react hook function, it create a proxy object (`Agent`) by using a model (`Model`), and you can get latest state from `Agent` object, or use its method to change state.

```typescript
function useAgentReducer<T extends Model<S>, S>(
    entry: T | { new(): T }, 
    ...mdws: MiddleWare[]
): T
```

* entry - the model class or object.
* mdws - MiddleWares

Be careful, `LifecycleMiddleWare` can not work with this api directly, so, if you want to use `LifecycleMiddleWares.takeLatest`, you'd better set it with api [useMiddleWare](#useMiddleWare) or [middleWare](https://filefoxper.github.io/agent-reducer/#/api?id=middleware).

You can find how to config an env object [here](/guides?id=about-run-env) and what is `MiddleWare` [here](https://filefoxper.github.io/use-agent-reducer/#/guides?id=middleware).

You can see how to use it [here](/tutorial?id=search-page-model).

## useMiddleWare

This api function is a react hook function, it can copy an `Agent` object, and add some different `MiddleWares` on the copy object. So, if you want to use different `MiddleWares` in some special situation on `Agent` method which has its own `MiddleWare`, you can use this api to make a copy `Agent` with different `MiddleWares`. 

The state of copy one keeps equal with the state of `Agent` object you passed in. We suggest you using the state of `Agent` object you passed in.


```typescript
function useMiddleWare<T extends Model<S>, S>(
    agent: T, 
    ...mdws: (MiddleWare | LifecycleMiddleWare)[]
):T
```

* agent - `Agent` object which is in a `AgentReducer` function created by [useAgentReducer](/api?id=useagentreducer).
* mdws - `MiddleWares` you want to use in this copy `Agent` object.

You can see how to use it [here](/tutorial?id=use-middleware).

## useAgentSelector

This api function is a react hook, it can be used to extract data from a sharing model state. And only the extracted data change can cause its consumer (react component) rerender.

```typescript
export declare function useAgentSelector<T extends Model<S>, S, R>(
    entry: T,
    mapStateCallback: (state: T['state']) => R,
    equalityFn?: (prev: R, current: R) => boolean,
): R;
export declare function useAgentSelector<T extends Model<S>, S, R>(
    entry: T,
    mapStateCallback: (state: T['state']) => R,
    comparator?:(unknown[]),
    equalityFn?: (prev: R, current: R) => boolean,
): R;
```

* entry - the model instance object.
* mapStateCallback - a callback function for extracting data from model state. The callback param state is a current model state.
* comparator - optional param, a comparator array, when some element of this array changes, the selected state will be recomputed. If you don't need it, you can use a equalityFn replace it, or ignore it.
* equalityFn - optional param, a callback function to compare the previous extracted data with the current one. If this function returns `true`, `useAgentSelector` do not make its consumer (react component) rerender, no matter if the extracted data changes. Param `prev` is the previous extracted data, and param `current` is the current one.
  
This function returns data extracted from a model state directly.

## useAgentMethods

This api function is a react hook for calling a model methods. It never causes its consumer (react component) rerendering.

```typescript
export function useAgentMethods<T extends Model<S>, S>(
  entry: T,
  ...mdws: MiddleWare[],
): Omit<T, 'state'>
```

* entry - the model instance object.
* mdws - optional param, MiddleWares

This function returns a model like instance which has an empty state property. It only provides model methods.

## shallowEqual

This api function is a shortcut `equalityFn` callback for using api [useAgentSelector](/api?id=useagentselector). It compares `prev` extracted data and `current` extracted data with a shallow `key-value` equality comparator.

```typescript
export function shallowEqual<R>(prev:R, current:R):boolean
```

* prev - one data for comparing with another.
* current - one data for comparing with another.

It returns a `boolean` value. If the two params are equal, it returns `true`, otherwise it returns `false`. 
  
## useModelProvider

This api function is a react hook for providing a react `Context.Provider` component according to the value models. And then we can use API [useModel](/api?id=usemodel) to select a model instance out.

```typescript
export function useModelProvider(
    models: Model|Record<string, Model>|Array<Model>,
    isRootProvider?: boolean,
):NamedExoticComponent<{ children: JSX.Element }>;
```

* models - the model instance or model instances which are needed in the `Provider` children component. It can be an model instance object, a customized object with model instance values or a customized array with model instance elements.
* isRootProvider - optional param, mark if the `Provider` is a root `Provider`.

It returns a react `Context.Provider` component without any props.

## useModel

This api function is a react hook for selecting model instance from the nearest `Provider` to the fastest `Provider` which are created by API [useModelProvider](/api?id=usemodelprovider).

This API always starts selecting from the nearest `Provider`, if there is no matched model instance in this `Provider`, it goes to its parent `Provider`, util it find the model instance out, and returns it for you. If the final selecting result is undefined, it throws an `Error Exception`.

The `Provider` set with `isRootProvider` can stop the finding.

```typescript
export function useModel<T extends Model>(
    key: string| number| { new(): T },
    defaultModel?:T,
):T;
```

* key - the model name marked in customized object, the index value in customized array or the class of the finding model instance.
* defaultModel - optional, provide a default model, when the useModel can not fetch model instance from parent Context, it will use the default one.

It returns the first matched model instance.

## useWeakSharing

Creates a `weakSharing` refernce, so, you can pass this ref to component props, or `React.Context` for a component inside sharing.

```typescript
export declare function useWeakSharing<
    S,
    T extends Model<S> = Model<S>>(factory:Factory<S, T>):SharingRef<S, T>;
```

* factory - the callback factory for recreating model instance.

returns a sharingRef.

It is the hook way for using the `agent-reducer` API [weakSharing](https://filefoxper.github.io/agent-reducer/#/api?id=weaksharing) in component.

## useAgentEffect

creates a effect to listen the state changes of model or agent.

```typescript
export declare function useAgentEffect<S, T extends Model<S>=Model<S>>(
    callback:EffectCallback<S>,
    target:T,
    ...methods:(((...args:any[])=>any)|string)[]
):void;
```

* callback - a function which accepts params as `prevState`, `currentState`, `methodName`. It is triggered when the state of `target` changes.
* target - model or agent, which you want to listen the state change from.
* methods - optional, if you don't need it, the effect `callback` will triggerd immediately when using `useAgentEffect`, if you add them, only the state changes caused by these methods can trigger the effect `callback`.

returns void.

Go to [tutorial](/tutorial?id=use-agent-effect) to see, how to use it.
