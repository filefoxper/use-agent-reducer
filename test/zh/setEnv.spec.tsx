import {OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer} from "../../src";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe("设置运行环境 RunEnv",()=>{

    // User 模型
    class UserModel implements OriginAgent<User> {

        // 初始化数据
        state: User = {id: null, name: null, role: 'GUEST'};

        // 方法返回值可被更新为最新 state
        changeUserName(name: string): User {
            return {...this.state, name};
        }

        changeUserRole(role: Role): User {
            return {...this.state, role};
        }
    }

    it("不修改 strict，当我们在 react 事件回调中连续两次修改 state ，第一次修改将被第二次覆盖",()=>{
        const {result, rerender} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        act(() => {
            agent.changeUserRole('MASTER');
            agent.changeUserName('Jimmy');
        });
        expect(agent.state.role).toBe('GUEST');
    });

    it("设置 strict 为 false，当我们在 react 事件回调中连续两次修改 state ，第一次修改会与被第二次累积起来",()=>{
        const {result, rerender} = renderHook(() => useAgentReducer(UserModel,{strict:false}));
        const agent = result.current;
        act(() => {
            agent.changeUserRole('MASTER');
            agent.changeUserName('Jimmy');
        });
        expect(agent.state.role).toBe('MASTER');
    });

});