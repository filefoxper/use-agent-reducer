import {middleWare, MiddleWarePresets, OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer, useMiddleWare} from "../../src";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe('basic usage', () => {

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

    it('call a method from agent, will change agent.state', () => {
        const {result, rerender} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        act(() => {
            agent.changeUserName('Jimmy');
        });
        expect(agent.state.name).toBe('Jimmy');
    });

});

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