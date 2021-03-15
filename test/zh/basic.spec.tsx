import {middleWare, MiddleWarePresets, OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer, useMiddleWare} from "../../src";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe('基本用法', () => {

    // 创建 User 数据管理模型
    class UserModel implements OriginAgent<User> {

        // 默认 User 数据
        state: User = {id: null, name: null, role: 'GUEST'};

        // 调用方法，产生的返回值可被认为是下一个最新的 state 数据
        changeUserName(name: string): User {
            return {...this.state, name};
        }

        changeUserRole(role: Role): User {
            return {...this.state, role};
        }
    }

    it('调用 `Agent` 代理方法可以修改 state 数据', () => {
        const {result, rerender} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        act(() => {
            agent.changeUserName('Jimmy');
        });
        expect(agent.state.name).toBe('Jimmy');
    });

});

describe('通过 API 来使用 MiddleWare ', () => {

    // 创建 User 数据管理模型
    class UserModel implements OriginAgent<User> {

        state: User;

        constructor() {
            // 初始化默认 state 数据
            this.state = {id: null, name: null, role: 'GUEST'};
            // 在 constructor 中，可使用 `agent-reducer` API `middleWare` 直接
            // 对指定方法添加 `MiddleWare`
            middleWare(this.changeUserRole, MiddleWarePresets.takeAssignable());
        }

        // 调用方法，产生的返回值可被认为是下一个最新的 state 数据
        changeUserName(name: string): User {
            return {...this.state, name};
        }

        changeUserRole(role: Role): Partial<User> {
            return {role};
        }

        // 如果我们不对返回的 promise 值使用 MiddleWare,
        // 最新 state 将变成一个 promise 对象.
        // 我们可以通过 api `useAgentReducer`
        // 对其添加 MiddleWare 来解决这个问题
        async fetchUser(): Promise<User> {
            return {id: 1, name: 'Jimmy', role: 'USER'};
        }
    }

    it('直接调用 `Agent` 代理的异步方法，会让 state 变成一个 promise 对象', async () => {
        const {result} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        const state: User & { then?: () => any } = agent.state;
        expect(typeof state.then).toBe('function');
    });

    it('使用 `useAgentReducer` 添加相应的 `MiddleWare` 可以把返回 promise 对象的 resolve 值变成最新 state', async () => {
        // 使用 `useAgentReducer` 添加相应的 `MiddleWare`，
        // `MiddleWarePresets.takePromiseResolve` 可以把返回 promise 对象的 resolve 值变成最新 state。
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'USER'});
    });

    it('在 constructor 中，可使用 `agent-reducer` API `middleWare` 直接对指定方法添加 `MiddleWare`', () => {
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));
        const agent = result.current;
        act(() => {
            agent.changeUserRole('MASTER');
        });
        expect(agent.state).toEqual({id: null, name: null, role: 'MASTER'});
    });

    it('使用 API `useMiddleWare` 添加相应的 `MiddleWare` 可以把返回 promise 对象的 resolve 值变成最新 state', async () => {
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));

        // 使用 `useAgentReducer` 添加相应的 `MiddleWare`，
        // `MiddleWarePresets.takePromiseResolve` 可以把返回 promise 对象的 resolve 值变成最新 state。
        const {result: resultCopy} = renderHook(() => useMiddleWare(result.current, MiddleWarePresets.takePromiseResolve()))
        const agent = result.current;
        const agentCopy = resultCopy.current;
        await act(async () => {
            await agentCopy.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'USER'});
    });

});

describe('使用 decorator 来添加 MiddleWare', () => {

    // 创建 User 数据管理模型
    class UserModel implements OriginAgent<User> {

        // 初始化默认 state 数据
        state: User = {id: null, name: null, role: 'GUEST'};

        // 调用方法，产生的返回值可被认为是下一个最新的 state 数据
        changeUserName(name: string): User {
            return {...this.state, name};
        }

        // 如果我们不对返回的 promise 值使用 MiddleWare,
        // 最新 state 将变成一个 promise 对象.
        // 我们可以使用 `agent-reducer` api `middleWare` 的 decorator 形式
        // 对方法添加 `MiddleWarePresets.takeAssignable()` 来解决问题，
        // 这个 MiddleWare 可以将返回值与当前 state 数据合成最新的 state.
        @middleWare(MiddleWarePresets.takeAssignable())
        changeUserRole(role: Role): Partial<User> {
            return {role};
        }

        // 如果我们不对返回的 promise 值使用 MiddleWare,
        // 最新 state 将变成一个 promise 对象.
        // 我们可以使用 `agent-reducer` api `middleWare` 的 decorator 形式
        // 对方法添加 `MiddleWarePresets.takePromiseResolve()` 来解决问题，
        // 这个 MiddleWare 可以将 promise resolve 值转换成最新的 state.
        @middleWare(MiddleWarePresets.takePromiseResolve())
        async fetchUser(): Promise<User> {
            return {id: 1, name: 'Jimmy', role: 'USER'};
        }
    }

    it('使用 `agent-reducer` api `middleWare` 的 decorator 形式添加 ``MiddleWarePresets.takeAssignable()`', () => {
        const {result} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        act( () => {
            agent.changeUserRole('MASTER');
        });
        expect(agent.state).toEqual({id: null, name: null, role: 'MASTER'});
    });

    it('使用 `agent-reducer` api `middleWare` 的 decorator 形式添加 ``MiddleWarePresets.takePromiseResolve()`', async () => {
        const {result} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'USER'});
    });

});