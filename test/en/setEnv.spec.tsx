import {OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer} from "../../src";

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