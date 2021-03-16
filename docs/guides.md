# Guides

## what is model sharing

Model sharing is a new feature from `agent-reducer@3.2.0`. It declares every `Agent` bases on a same model object shares state updating with each other. 

That means we can create `Agents` base on a same model object in different react components, and they can update state synchronously. It is similar with the subscribe system in redux.

This feature is similar with redux, and you should know if you are using a normal object model, or using one generated from `agent-reducer` API `sharing` , the model is persistent。If you need a weak persistent model, try another `agent-reducer` API `weakSharing`. A weak persistent model is often reset when its `Agents` are all destroyed.

#### sharing
```typescript
function sharing<
    S,
    T extends OriginAgent<S> = OriginAgent<S>
    >(
  factory:()=>T|{new ():T},
):{current:T}
```

* factory - a factory function for generating a model（class 或 object）
  
It returns a wrap object which contains a persistent model at property `current`.

#### weakSharing

```typescript
function weakSharing<
    S,
    T extends OriginAgent<S> = OriginAgent<S>
    >(
  factory:()=>T|{new ():T},
):{current:T}
```

* factory - a factory function for generating a model（class 或 object）
  
It returns a wrap object which contains a weak persistent model at property `current`. When `Agents` from this model are all destroyed, the factory callback generates a new one.

You can go to our [tutorial](/tutorial?id=use-model-sharing) for a check about how to use this feature.

## about keyword this

Keyword `this` is instable in class method, when we are calling a method directly from class instance, `this` is equivalent to the instance, but if we reassign this method to another object, `this` will point to the object where you are calling from.

But, if you are using a method function from `Agent` object, you can pay less attention to keyword `this`, it has been bind to the model instance of `Agent`, when you get the method from `Agent` object. You can assign your method from `Agent` object to any other object, even pick it out, and call it just like calling a simple function, keyword `this` is still represent the model instance. (Before `agent-reducer@3.0.0`, keyword this in `Agent` method always represent itself.) 

## about MiddleWare override

There are three api functions for you to set MiddleWares.

1. `useAgentReducer`, it is a basic api in `use-agent-reducer`, you can set MiddleWares like: `useAgentReducer( OriginAgent, MiddleWare )`.
2. `middleWare` is from [agent-reducer](https://github.com/filefoxper/agent-reducer/blob/master/documents/en/api/middle_ware.md), it can add MiddleWare directly on a model method, and wake them up when the model's `Agent` method is called. These MiddleWares will override MiddleWares which are added by `useAgentReducer`.
3. `useMiddleWare`, this api will copy an `Agent` object, and override MiddleWares of `Agent` object on the copy one. It is used like: `useMiddleWare( Agent, MiddleWare )`. The MiddleWares added by this api have a highest running prior level in the copied `Agent` object.

You can check unit test in [middleWare.override.spec.ts](https://github.com/filefoxper/use-agent-reducer/blob/master/test/en/middleWare.override.spec.tsx). 

```typescript
import {middleWare, MiddleWarePresets, OriginAgent} from "agent-reducer";
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

## about run env

RunEnv is a running environment config of `Agent` object. You can use it to experience a next version feature, or tell `use-agent-reducer` updating state immediately.

An env object looks like:
```typescript
// running env config
export interface RunEnv {
  // default 'true',
  // if set it to be 'false',
  // 'Agent' state will be updated immediately,
  // and not wait state updating from reducer tool,
  // it means 'Agent' state may not equal with reducer tool state in moment.
  // though, the 'Agent' state will be equal with reducer tool state finally,
  // but, we still do not recommend you set it to 'false' 
  strict?: boolean;
  // default 'false',
  // if set it to be 'true',
  // 'agent-reducer' will run with a next version features
  nextExperience?:boolean;
}
```
You can check out the code about how to set env, [here](https://github.com/filefoxper/use-agent-reducer/blob/master/test/en/setEnv.spec.tsx).

```typescript
import {OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer} from "use-agent-reducer";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe("set run env",()=>{

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
    }

    it("do not set strict false, when we change state twice in a react event callback directly, " +
        "the first change should be override by the second one",()=>{
        const {result, rerender} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        act(() => {
            agent.changeUserRole('MASTER');
            agent.changeUserName('Jimmy');
        });
        expect(agent.state.role).toBe('GUEST');
    });

    it("set strict false, when we change state twice in a react event callback directly, " +
        "the first change should not be override by the second one",()=>{
        const {result, rerender} = renderHook(() => useAgentReducer(UserModel,{strict:false}));
        const agent = result.current;
        act(() => {
            agent.changeUserRole('MASTER');
            agent.changeUserName('Jimmy');
        });
        expect(agent.state.role).toBe('MASTER');
    });

});
```

Be careful in `env.strict`, you'd better not set it to be `false`. For it will make the state difference between `Agent` and your reducer tool.

