import {middleWare, MiddleWarePresets, OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer, useMiddleWare} from "../../src";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe('MiddleWare 覆盖现象', () => {

    // 管理 User 数据的模型
    class UserModel implements OriginAgent<User> {

        // 默认 User 数据
        state: User = {id: null, name: null, role: 'GUEST'};

        changeUserName(name: string): User {
            return {...this.state, name};
        }

        changeUserRole(role: Role): User {
            return {...this.state, role};
        }

        // 通过 `agent-reducer` 接口 `middleWare` 添加的 MiddleWare
        @middleWare(MiddleWarePresets.takePromiseResolveAssignable())
        async fetchUser(): Promise<Partial<User>> {
            return {id: 1, name: 'Jimmy'};
        }
    }

    it('通过 `agent-reducer` 接口 `middleWare` 添加的 MiddleWare 会覆盖通过 api `useAgentReducer` 添加的 MiddleWare', async () => {
        // MiddleWarePresets.takePromiseResolveAssignable 会覆盖
        // `MiddleWarePresets.takePromiseResolve`
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'GUEST'});
    });

});