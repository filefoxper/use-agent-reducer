# Introduction

The primary work of this tool is generating a `state changeable agent` from its `state producible model`. An agent changes state according to what its model produces out. So, [Model](/introduction?id=model) and [Agent](/introduction?id=agent) are very important concepts in this document.

## Motivation

The core library [agent-reducer](https://www.npmjs.com/package/agent-reducer) is a powerful independent tool for managing state changes. But it can not work in `react` system directly, so we designed this library to connect `agent-reducer` with `react hooks`. 

## Concept

There are two concepts we have mentioned above, `Model` and `Agent`. They will  be explained in this section.

#### Model

`Model` is a class or an object which describes what kind of data you want to maintian and how to produce a new one. You can describe a maintainable data with property name `state` in `Model`, and prepare some state producible methods beside. In `agent-reducer`, concept `Model` has another name `OriginAgent`, but here, we call it `Model`.

1. Property `state` stores the data you want to maintian, it can be any type. Do not modify `state` manually, this may causes some problems.
2. `method` is a function for producing a new `state`. You can consider what returns from a `method` as a new state.
   
This is a `Model` example:

```typescript
import {OriginAgent} from 'agent-reducer';

// model
class CountAgent implements OriginAgent<number> {
    // set a initial state
    state = 0;

    // use arrow function to produce a new state
    stepUp = (): number => this.state + 1;

    // use a method function to produce a new state
    stepDown(): number {
      // use this.state to produce a new state
      return this.state - 1;
    }

    step(isUp: boolean): number {
      // use other model functions to produce a new state.
      return isUp ? this.stepUp() : this.stepDown();
    }

    // you can pass any params as you whish,
    // it is better than reducer action param.
    sum(...counts: number[]): number{
      return this.state + counts.reduce((r, c): number => r + c, 0);
    };
}
```

#### Agent

`Agent` is a Proxy object, it provides a newest state and some methods base on the same name methods in its `Model` for changing state. You can create an `Agent` object by using api useAgentReducer with a `Model`. 

The state of `Agent` object always keeps equal with its `Model` state.

```typescript
import {OriginAgent} from 'agent-reducer';
import {useAgentReducer} from 'use-agent-reducer';

class CountAgent implements OriginAgent<number> {

    state = 0;

    stepUp = (): number => this.state + 1;

    stepDown(): number {
      return this.state - 1;
    }

    step(isUp: boolean): number {
      return isUp ? this.stepUp() : this.stepDown();
    }

    sum(...counts: number[]): number{
      return this.state + counts.reduce((r, c): number => r + c, 0);
    };
}

......

// api useAgentReducer returns `Agent` object directly
const agent = useAgentReducer(CountAgent);
```

## Installation

The `use-agent-reducer` package lives in [npm](https://www.npmjs.com/get-npm). To install the latest stable version, run the following command:
```
npm i use-agent-reducer
```
You'd better add `agent-reducer` into your package.json dependencies too. When  you are installing package `use-agent-reducer`, a `agent-reducer` package is always brought into your `node_modules` directory, but this is not helpful for using `agent-reducer` API. 

## Getting started

This section describes how to create a model, and how to call `agent-reducer` API for help. After reading this section, you can master the basic usage of `use-agent-reducer`. 

#### create model

`Model` can be a ES6 class, or an object with state property. Follow code below, you can learn how to create a model.

with object pattern:

```typescript
import React from 'react';
import {OriginAgent} from 'agent-reducer';
import {useAgentReducer} from 'use-agent-reducer';

interface Model extends OriginAgent<number>{
    state: number
}

const model: Model={

    state: 0, // initial state

    // method for producing a new state
    increase():number {
        return this.state + 1;
    }

}

const MyComponent = () =>{
    // api useAgentReducer is a react hook
    const agent = useAgentReducer(model);
    // you can reassign agent method into another object,
    // keyword `this` in method always represent the model.
    const {state,increase} = agent;

    return (
        <div>
            <span>count: {state}</span>
            <button onClick={increase}>setName</button>
        </div>
    );

};

```

with class pattern:

```typescript
import React from 'react';
import {OriginAgent} from 'agent-reducer';
import {useAgentReducer} from 'use-agent-reducer';

class Model implements OriginAgent<number>{

    state: number;

    constructor(){
        // initial state
        this.state = 0;
    }

    // method for producing a new state
    increase():number {
        return this.state + 1;
    }

}

const MyComponent = () =>{
    // api useAgentReducer is a react hook
    const agent = useAgentReducer(Model);
    // you can reassign agent method into another object,
    // keyword `this` in method always represent 
    // the instance of Model which is created inside api `useAgentReducer`.
    const {state,increase} = agent;

    return (
        <div>
            <span>count: {state}</span>
            <button onClick={increase}>setName</button>
        </div>
    );

};
```

We recommend to create a model with class pattern. In ES6 class, we can use  `decorators` to simplify the usage of `agent-reducer` helpers.

#### calling help from agent-reducer

The core library `agent-reducer` also can be used in our code. It provides some useful api like `middleWare` and `MiddleWarePresets`.

MiddleWare system makes `Agent` methods more flexible. You can use MiddleWare to reproduce a new state which is returned from a method, or control the method calling feature ( like adding method debounce, and so on ).

The code below shows how to use MiddleWare, and we use `MiddleWarePresets.takePromiseResolve` for example.

``` typescript
import {middleWare, MiddleWarePresets, OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer, useMiddleWare} from "use-agent-reducer";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe('use MiddleWare with APIs', () => {

    // model for managing user data
    class UserModel implements OriginAgent<User> {

        state: User;

        constructor() {
            // initial default state
            this.state = {id: null, name: null, role: 'GUEST'};
            // use API `middleWare` from `agent-reducer` to
            // add MiddleWare directly to a method in constructor
            middleWare(this.changeUserRole, MiddleWarePresets.takeAssignable());
        }

        // call method to change state by taking what it returns
        changeUserName(name: string): User {
            return {...this.state, name};
        }

        changeUserRole(role: Role): Partial<User> {
            return {role};
        }

        // if we do nothing about the return promise,
        // next state will be a promise object.
        // we can add MiddleWare from api `useAgentReducer`
        async fetchUser(): Promise<User> {
            return {id: 1, name: 'Jimmy', role: 'USER'};
        }
    }

    it('call an async method from agent directly, will change agent.state to be a promise object', async () => {
        const {result} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        const state: User & { then?: () => any } = agent.state;
        expect(typeof state.then).toBe('function');
    });

    it('use MiddleWare with `useAgentReducer` to take promise resolve value as next state', async () => {
        // we can add MiddleWare as a param for useAgentReducer
        // `MiddleWarePresets.takePromiseResolve` can take the resolve data from promise,
        // and put it as a new state.
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'USER'});
    });

    it('use API `middleWare` from `agent-reducer` to add MiddleWare directly to a method in constructor', () => {
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));
        const agent = result.current;
        act(() => {
            agent.changeUserRole('MASTER');
        });
        expect(agent.state).toEqual({id: null, name: null, role: 'MASTER'});
    });

    it('use API `useMiddleWare` to take promise resolve value as next state', async () => {

        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));
        // we can add MiddleWare as a param for useAgentReducer
        // `MiddleWarePresets.takePromiseResolve` can take the resolve data from promise,
        // and put it as a new state.
        const {result: resultCopy} = renderHook(() => useMiddleWare(result.current, MiddleWarePresets.takePromiseResolve()))
        const agent = result.current;
        const agentCopy = resultCopy.current;
        await act(async () => {
            await agentCopy.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'USER'});
    });

});
```

The code above shows 3 ways to use MiddleWares to `Agent` method.

If you are using `Babel decorator plugin`, you can use MiddleWares more simple.

``` typescript
import {middleWare, MiddleWarePresets, OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer} from "use-agent-reducer";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe('use decorator MiddleWare', () => {

    // model for managing user data
    class UserModel implements OriginAgent<User> {

        // default state
        state: User = {id: null, name: null, role: 'GUEST'};

        // call method to change state by taking what it returns
        changeUserName(name: string): User {
            return {...this.state, name};
        }

        // if we do nothing about the return data,
        // the new state will become a partial state.
        // we can add 'MiddleWarePresets.takeAssignable()'
        // by using api `middleWare` decorator,
        // this MiddleWare can merge your return data with current state.
        @middleWare(MiddleWarePresets.takeAssignable())
        changeUserRole(role: Role): Partial<User> {
            return {role};
        }

        // if we do nothing about the return promise,
        // next state will be a promise object.
        // we can add 'MiddleWarePresets.takePromiseResolve()'
        // by using api `middleWare` decorator,
        // this MiddleWare can take a resolve data from promise as a new state.
        @middleWare(MiddleWarePresets.takePromiseResolve())
        async fetchUser(): Promise<User> {
            return {id: 1, name: 'Jimmy', role: 'USER'};
        }
    }

    it('use decorator api middleWare from `agent-reducer` to add MiddleWarePresets.takeAssignable()', () => {
        const {result} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        act( () => {
            agent.changeUserRole('MASTER');
        });
        expect(agent.state).toEqual({id: null, name: null, role: 'MASTER'});
    });

    it('use decorator api middleWare from `agent-reducer` to add MiddleWarePresets.takePromise()', async () => {
        const {result} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'USER'});
    });

});
```

You can check [simple unit test here](https://github.com/filefoxper/use-agent-reducer/blob/master/test/en/basic.spec.tsx), and learn more about MiddleWare in [agent-reducer guides about middleWare](https://github.com/filefoxper/agent-reducer/blob/master/documents/en/guides/about_middle_ware.md). You can check a MiddleWare list from `agent-reducer` api [MiddleWares](https://github.com/filefoxper/agent-reducer/blob/master/documents/en/api/middle_wares.md) and [MiddleWarePresets](https://github.com/filefoxper/agent-reducer/blob/master/documents/en/api/middle_ware_presets.md).
