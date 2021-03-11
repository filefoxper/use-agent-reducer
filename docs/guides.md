# Guides

## about keyword this

Keyword `this` is instable in class method, when we are calling a method directly from class instance, `this` is equivalent to the instance, but if we reassign this method to another object, `this` will point to the object where you are calling from.

But, if you are using a method from an `Agent` object created by `use-agent-reducer`, you can pay less attention to keyword `this`. For `use-agent-reducer` always bind `this` to `Agent` object, you can assign your method from `Agent` object to any other object, even pick it out, and call it just like calling a simple function, keyword `this` is still equivalent to `Agent` object.

You can check detail from [agent-reducer guide about keyword this](https://github.com/filefoxper/agent-reducer/blob/master/documents/en/guides/about_this.md).

## about MiddleWare override

There are three api functions for you to set MiddleWares.

1. `useAgentReducer`, it is a basic api in `use-agent-reducer`, you can set MiddleWares like: `useAgentReducer( OriginAgent, MiddleWare )`.
2. `middleWare` is from [agent-reducer](https://www.npmjs.com/package/agent-reducer), it can add MiddleWare directly on an `OriginAgent` method, and when the `Agent` method is called, it can uses this MiddleWare on its origin one. These MiddleWares will override MiddleWares which are added by `useAgentReducer`.
3. `useMiddleWare`, this api will copy an `Agent` object, and override MiddleWares of `Agent` object on the copy one. It is used like: `useMiddleWare( Agent, MiddleWare )`. The MiddleWare additions from this api has a highest running prior level in this version. So, in the copied `Agent` object, its MiddleWare can override MiddleWares which are added by `useAgentReducer` and `middleWare`.

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

RunEnv is a running environment config of `Agent` object. You can use it to experience a next version feature, or tell `use-agent-reducer` updating state with other reducer tools, even stop updating state, and so on.

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
You can check out the code about how to set env, [here](https://github.com/filefoxper/agent-reducer/blob/master/test/en/guides/tryEnv.spec.ts).

Be careful in `env.strict`, you'd better not set it to be `false`. For it will make the state difference between `Agent` and your reducer tool.

