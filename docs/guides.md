# Guides

## what is model sharing

Model sharing is a new feature from `agent-reducer@3.2.0`. It declares every `Agent` bases on a same model object shares state updating with each other. 

That means we can create `Agents` base on a same model object in different react components, and they can update state synchronously. It is similar with the subscribe system in redux.

This feature is similar with redux, and you should know if you are using a normal object model, or using one generated from `agent-reducer` API `sharing` , the model is persistent。If you need a weak persistent model, try another `agent-reducer` API `weakSharing`. A weak persistent model is often reset when its `Agents` are all destroyed.

#### sharing
```typescript
function sharing<
    S,
    T extends Model<S> = Model<S>
    >(
  factory:(...args:any[])=>T|{new ():T},
):{current:T,initial:(...args:[])=>T}
```

* factory - a factory function for generating a model（class or object）
  
It returns a wrap object which contains a persistent model at property `current`and a initialize method `initial`.

#### weakSharing

```typescript
function weakSharing<
    S,
    T extends Model<S> = Model<S>
    >(
  factory:(...args:any[])=>T|{new ():T},
):{current:T,initial:(...args:any[])=>T}
```

* factory - a factory function for generating a model（class or object）
  
It returns a wrap object which contains a weak persistent model at property `current`. When `Agents` from this model are all destroyed, the factory callback generates a new one. The property `initial` provides a function for initializing your `Agent`.

You can go to our [tutorial](/tutorial?id=use-model-sharing) for a check about how to use this feature or learn it directly from the [official document](https://filefoxper.github.io/agent-reducer/#/feature?id=model-sharing).

## about keyword this

Keyword `this` is instable in class method, when we are calling a method directly from class instance, `this` is equivalent to the instance, but if we reassign this method to another object, `this` will point to the object where you are calling from.

But, if you are using a method function from `Agent` object, you can pay less attention to keyword `this`, it has been bind to the model instance of `Agent`, when you get the method from `Agent` object. You can assign your method from `Agent` object to any other object, even pick it out, and call it just like calling a simple function, keyword `this` is still represent the model instance. (Before `agent-reducer@3.0.0`, keyword this in `Agent` method always represent itself.) 

## about MiddleWare override

There are three api functions for you to set MiddleWares.

1. `useAgentReducer`, it is a basic api in `use-agent-reducer`, you can set MiddleWares like: `useAgentReducer( Model, MiddleWare )`.
2. `middleWare` is from [agent-reducer](https://filefoxper.github.io/agent-reducer/#/api?id=middleware), it can add MiddleWare directly on a model method, and wake them up when the model's `Agent` method is called. These MiddleWares will override MiddleWares which are added by `useAgentReducer`.
3. `useMiddleWare`, this api will copy an `Agent` object, and override MiddleWares of `Agent` object on the copy one. It is used like: `useMiddleWare( Agent, MiddleWare )`. The MiddleWares added by this api have a highest running prior level in the copied `Agent` object.

You can check unit test in [middleWare.override.spec.ts](https://github.com/filefoxper/use-agent-reducer/blob/master/test/en/middleWare.override.spec.tsx). 

```typescript
import {middleWare, MiddleWarePresets, Model} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer, useMiddleWare} from "use-agent-reducer";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe('MiddleWare override', () => {

    // model for managing user data
    class UserModel implements Model<User> {

        // default state
        state: User = {id: null, name: null, role: 'GUEST'};

        // call method to change state by taking what it returns
        changeUserName(name: string): User {
            return {...this.state, name};
        }

        changeUserRole(role: Role): User {
            return {...this.state, role};
        }

        // if we do nothing about the return promise,
        // next state will be a promise object.
        // we can add MiddleWare by using api `middleWare` decorator,
        // and use `MiddleWarePresets.takePromiseResolveAssignable()`
        // to merge promise resolved data with current state.
        @middleWare(MiddleWarePresets.takePromiseResolveAssignable())
        async fetchUser(): Promise<Partial<User>> {
            return {id: 1, name: 'Jimmy'};
        }
    }

    it('use decorator api middleWare from `agent-reducer` can override api `useAgentReducer`', async () => {
        // MiddleWarePresets.takePromiseResolve will be override by
        // `MiddleWarePresets.takePromiseResolveAssignable` which is added by decorator middleWare
        const {result} = renderHook(() => useAgentReducer(UserModel,MiddleWarePresets.takePromiseResolve()));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'GUEST'});
    });

    it('api `useMiddleWare` can override api middleWare from `agent-reducer`', async () => {
        // MiddleWarePresets.takePromiseResolve will be override by
        // `MiddleWarePresets.takePromiseResolveAssignable` which is added by decorator middleWare,
        // MiddleWarePresets.takePromiseResolveAssignable will be override by
        // MiddleWarePresets.takePromiseResolve which is added by api useMiddleWare
        const {result} = renderHook(() => useAgentReducer(UserModel,MiddleWarePresets.takePromiseResolve(),{nextExperience:true}));
        const agent = result.current;
        const {result:copyResult} = renderHook(() => useMiddleWare(agent,MiddleWarePresets.takePromiseResolve()));
        const copy=copyResult.current;
        await act(async () => {
            await copy.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy'});
    });

});
```

## model sharing optimization

By using `model sharing`, we can share state updating between different components. But this feature brings problem too, that causes model sharing consumers( react components ) always render together, no matter if the state change is necessary for urrent consumer. From `use-agent-reducer@3.2.5`, we provide some new API functions for resolving this problem. You can use API function `useAgentSelector` to extract data from a model state which is truly used in component. And also, you can extract methods from a sharing model by using another API `useAgentMethods`.

API [useAgentSelector](/api?id=useagentselector) extracts data from a state, and only the extracted data change may cause its consumer (react component) rerender. You can also use `equalityFn` to show if the consumer should rerender with a new extracted data.
The `shallowEqual` is a simple `equalityFn`, you can use it directly.

```typescript
import {weakSharing} from 'agent-reducer';
import {useAgentSelector,shallowEqual} from 'use-agent-reducer';

// model sharing reference
const sharingRef = weakSharing(()=> Model);

......

// use a sharing model, 
// and extract data from state by a state mapping function.
// Only the extracted data change can cause its consumer rerender.
const renderNeeds = useAgentSelector(sharingRef.current, (state)=> state.renderNeeds);

// tell `useAgentSelector` to rerender consumer (component),
// while equalityFn returns false.
// The param `prev` is the previous extracted data, 
// and `current` is the current extracted data
function equalityFn<R>(prev:R, current:R):boolean{
    // `shallowEqual` compares the `key-values` 
    // between `prev` and `current`, 
    // if all of them are equal, it returns true.
    // This function only compares data own properties.
    // You can also use `shallowEqual` directly to `useAgentSelector`.
    return shallowEqual(prev, current);
}

const renderNeeds = useAgentSelector(sharingRef.current, ({renderNeeds})=> renderNeeds,equalityFn);
```

API [useAgentMethods](/api?id=useagentmethods) only provides methods from a model like instance, it never causes a rerender.

```typescript
import {weakSharing, MiddleWarePresets} from 'agent-reducer';
import {useAgentMethods} from 'use-agent-reducer';

// model sharing reference
const sharingRef = weakSharing(()=> Model);

......

// use a sharing model,
// get a model like instance, which omits the state property.
// It is used for providing methods from sharing model,
// and it never causes a rerender.
const {fetchState} = useAgentMethods(sharingRef.current, MiddleWarePresets.takePromiseResolve());
```

## model sharing & context

Usually, `model sharing` is powerful enough for a global or page scope sharing usage. But, if we want to use it in a reusable Component or customized hook function, it can not help us so much, and now, we need `React.Context` for help. From `use-agent-reducer@4.1.0`, we provide two API `useModelProvider` and `useModel` for building a `React.Context` model sharing tree, and you can use them for a reusable `model sharing`.

```typescript
import React from 'react';
import {Model} from 'agent-reducer';
import {
    useModelProvider, 
    useModel, 
    useAgentReducer,
    useAgentMethods,
    useAgentSelector
} from 'use-agent-reducer';

class IncreaseModel implements Model<number>{

    state = 0;

    increase(){
        return this.state + 1;
    }

}

class DecreaseModel implements Model<number>{

    state = 0;

    decrease(){
        return this.state - 1;
    }

}

const DeepComp = ()=>{
    // we can fetch the model instance of IncreaseModel 
    // from IncreaseScope by using API useModel,
    // and pass the class into it as a query condition.
    const increaseModel = useModel(IncreaseModel);
    const {increase} = useAgentMethods(increaseModel);
    return (
        <button onClick={increase}>increase</button>
    );
};

const MyComp = ()=>{

    const increaseModel = new IncreaseModel();

    const increaseCount = useAgentSelector(increaseModel, s=>s);
    // use Context to pass model into the child components.
    // useModelProvider creates a Context.Provider with value props inside.
    const IncreaseScope = useModelProvider(increaseModel);

    return (
        <IncreaseScope>
            <span>{increaseCount}</span>
            <DeepComp/>
        </IncreaseScope>
    );
};

const DeepComp1 = ()=>{
    const increaseModel = useModel(IncreaseModel);
    // select model instance by the index of array
    const decreaseModel = useModel(1);
    const decreaseCount = useAgentSelector(decreaseModel, s=>s);
    const {increase} = useAgentMethods(increaseModel);
    return (
        <>
            <span>{decreaseCount}</span>
            <button onClick={increase}>increase</button>
        </>
    );
};

const MyComp1 = ()=>{

    const increaseModel = new IncreaseModel();

    const increaseCount = useAgentSelector(increaseModel, s=>s);
    // we can use a array to organize the model instances,
    // which are able to be selected from the child component.
    const Scope = useModelProvider([increaseModel, new DecreaseModel()]);

    return (
        <Scope>
            <span>{increaseCount}</span>
            <DeepComp1/>
        </Scope>
    );
};

const DeepComp2 = ()=>{
    const increaseModel = useModel(IncreaseModel);
    // select model instance by the property name of object
    const decreaseModel = useModel('decreaseModel');
    const decreaseCount = useAgentSelector(decreaseModel, s=>s);
    const {increase} = useAgentMethods(increaseModel);
    return (
        <>
            <span>{decreaseCount}</span>
            <button onClick={increase}>increase</button>
        </>
    );
};

const MyComp2 = ()=>{

    const increaseModel = new IncreaseModel();

    const increaseCount = useAgentSelector(increaseModel, s=>s);
    // we can use a object to organize the model instances too
    const Scope = useModelProvider({
        increaseModel, 
        decreaseModel: new DecreaseModel()
    });

    return (
        <Scope>
            <span>{increaseCount}</span>
            <DeepComp2/>
        </Scope>
    );
};

const DeepComp3 = ()=>{
    // still can be found in the deep provider child component
    const increaseModel = useModel(IncreaseModel);
    const decreaseModel = useModel(DecreaseModel);
    const decreaseCount = useAgentSelector(decreaseModel, s=>s);
    const {increase} = useAgentMethods(increaseModel);
    return (
        <>
            <span>{decreaseCount}</span>
            <button onClick={increase}>increase</button>
        </>
    );
};

const DeepContent3 = ()=>{
    // middle
    const DecreaseScope = useModelProvider(new DecreaseModel());
    return (
        <DecreaseScope>
            <DeepComp3/>
        </<DecreaseScope>
    );
};

const MyComp3 = ()=>{

    const increaseModel = new IncreaseModel();

    const increaseCount = useAgentSelector(increaseModel, s=>s);
    // mark the top Provider for model instance query.
    const IncreaseScope = useModelProvider(increaseModel, true);

    const DecreaseScope = useModelProvider(new DecreaseModel());

    return (
        <IncreaseScope>
            <span>{increaseCount}</span>
            <DeepContent3/>
        </IncreaseScope>
    );
};
```

The example above shows that API [useModel](/api?id=usemodel) can find model instance by class, property name and index from its provider which is created by [useModelProvider](/api?id=usemodelprovider). If it can not find any matched model instance, it will keep finding from the parent provider, if there is no provider above, and the matched model instance is still not exist, `useModel` throw an Error with a `can not find model instance` message. 
