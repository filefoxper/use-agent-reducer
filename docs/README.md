# Introduction

## motivation

[agent-reducer](https://www.npmjs.com/package/agent-reducer) is a very powerful tool, it converts a model object (`OriginAgent`) to be an [Agent](/?id=agent) object. It is designed on the reducer running base. Every thing returned from an [Agent](/?id=agent) method will be a next state.

`use-agent-reducer` is designed for using [agent-reducer](https://www.npmjs.com/package/agent-reducer) in react hooks environment。

## Concept

#### OriginAgent

`OriginAgent` is an object or a class which has a `state` property for storing the data you want to persist. And you can maintian `methods` in it, for producing a `next state`. So, consider it as a data-flow model.

1. Property `state` stores the data you want to persist, it can be any type. When you want to use it, please ensure it is immutable.
2. `method` is a function for producing a `next state`.
   
for example:

```typescript
import {OriginAgent} from 'agent-reducer';

// OriginAgent
class CountAgent implements OriginAgent<number> {
    // OriginAgent should has a state for storing what you want persist
    state = 0;

    // you can use arrow function to generate the next state candidate
    stepUp = (): number => this.state + 1;

    // you can use a method function to generate the next state candidate
    stepDown(): number {
      // use this.state to generate next state
      return this.state - 1;
    }

    step(isUp: boolean): number {
      // use other functions here to generate a next state candidate,
      // when the method in 'agent' is called,
      // only the final result will be dispatched into 'reducer',
      // the inside methods 'stepUp' ,'stepDown' only provides data.
      return isUp ? this.stepUp() : this.stepDown();
    }

    // you can write a function with any params as you whish
    sum = (...counts: number[]): number => {
      return this.state + counts.reduce((r, c): number => r + c, 0);
    };
}
```

#### Agent

`Agent` is a `Proxy` object for your `OriginAgent` instance. It provides a latest state and some methods for changing state. You can create a `Agent` object by using api `useAgentReducer`.

```typescript
import {OriginAgent} from 'agent-reducer';
import {useAgentReducer} from 'use-agent-reducer';

class CountAgent implements OriginAgent<number | undefined> {

  state = 0;

  stepUp = (): number => this.state + 1;

  stepDown = (): number => this.state - 1;

  step = (isUp: boolean) => (isUp ? this.stepUp() : this.stepDown());

  sum = (...counts: number[]): number => {
      return this.state + counts.reduce((r, c): number => r + c, 0);
  };

}

// get `Agent` object directly
const agent = useAgentReducer(CountAgent);
```

## Installation

The `use-agent-reducer` package lives in [npm](https://www.npmjs.com/get-npm). To install the latest stable version, run the following command:
```
npm i use-agent-reducer
```
You'd better add `agent-reducer` to your package.json dependencies. 

## Getting started

#### OriginAgent

`OriginAgent` is a basic model for generating an proxy instance (`Agent`). It can be an object or a class.

object model:

```typescript
import {OriginAgent} from 'agent-reducer';
import {useAgentReducer} from 'use-agent-reducer';

interface State{
    name?:string,
}

interface Model extends OriginAgent<State>{
    state:State
}

const model:Model={

    state:{}, // the data you want to persist

    // the method to generate a next state
    setName( primaryName:string, secondaryName:string ):State {
        const name = `${primaryName}.${secondaryName}`;
        return { ...this.state, name };
    }

}

const agent = useAgentReducer(model);
const {state,setName} = agent;
```

class model:

```typescript
import {OriginAgent} from 'agent-reducer';
import {useAgentReducer} from 'use-agent-reducer';

interface State{
    name?:string,
}

class Model implements OriginAgent<State>{

    state:State; // the data you want to persist

    constructor(){
        this.state = {};
    }

    // the method to generate a next state
    setName( primaryName:string, secondaryName:string ):State {
        const name = `${primaryName}.${secondaryName}`;
        return { ...this.state, name };
    }

}

const agent = useAgentReducer(new Model());
const {state,setName} = agent;
```
We recommend using class model.

#### MiddleWare

MiddleWare system makes `agent` more flexible. You can use MiddleWare to reproduce the `next state` when it is returned by a agent method, or control `agent` lifecycle (disable an `agent` changing state action).

promise MiddleWare:

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

describe('take a promise resolve data as part of state', () => {

    // model for managing user data
    class UserModel implements OriginAgent<User> {

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
        const state:User&{then?:()=>any}=agent.state;
        expect(typeof state.then).toBe('function');
    });

    it('use MiddleWare with `useAgentReducer` to take promise resolve value as next state', async () => {
        const {result} = renderHook(() => useAgentReducer(UserModel,MiddleWarePresets.takePromiseResolve()));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'USER'});
    });

});
```
If you are using `Babel decorator plugin`, you can use `MiddleWarePresets.takePromiseResolve()` more simple.

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

        changeUserRole(role: Role): User {
            return {...this.state, role};
        }

        // if we do nothing about the return promise,
        // next state will be a promise object.
        // we can add MiddleWare by using api `middleWare` decorator
        @middleWare(MiddleWarePresets.takePromiseResolve())
        async fetchUser(): Promise<User> {
            return {id: 1, name: 'Jimmy', role: 'USER'};
        }
    }

    it('use decorator api middleWare from `agent-reducer`', async () => {
        const {result} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'USER'});
    });

});
```

You can check [simple unit test here](https://github.com/filefoxper/use-agent-reducer/blob/master/test/en/basic.spec.tsx), and learn more MiddleWare in [agent-reducer guides about middleWare](https://github.com/filefoxper/agent-reducer/blob/master/documents/en/guides/about_middle_ware.md).
