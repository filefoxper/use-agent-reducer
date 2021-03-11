import {middleWare, MiddleWarePresets, OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer, useMiddleWare} from "../../src";

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
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));
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
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve(), {nextExperience: true}));
        const agent = result.current;
        const {result: copyResult} = renderHook(() => useMiddleWare(agent, MiddleWarePresets.takePromiseResolve()));
        const copy = copyResult.current;
        await act(async () => {
            await copy.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy'});
    });

});