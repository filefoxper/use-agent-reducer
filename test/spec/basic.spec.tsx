import {renderHook, act} from "@testing-library/react-hooks";
import {useAgent, useMiddleActions, useMiddleWare, useReduceAgent} from "../../src";
import {LifecycleMiddleWares, MiddleActions, middleWare, OriginAgent} from "agent-reducer";

describe('使用基本的useAgent', () => {

    class CountAgent implements OriginAgent<number> {

        state = 0;

        // 返回值不为 "promise" ，也非 "undefined"，定义成 reduce-action，一个 reduce-action 在被调用后会 dispatch 一个 action，
        // 并修改this.state
        stepUp = (): number => this.state + 1;

        stepDown = (): number => this.state - 1;

        sum = (...counts: number[]): number => this.state + counts.reduce((r, c): number => r + c, 0);

        step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

        // 这是一个 reduce-action ，但同时它也是个 method ，我们把非箭头函数的其他属性函数统一称为 method ，一个 method 会对this进行层层代理，
        // 这使得 method 里的 reduce-action 能够正常的 dispatch action，在 middle-action 中是很有用的，
        // 但如果一个 method reduce-action 调用了其他 reduce-action，就会导致多次你期望之外的 dispatch action 行为发生，虽然结果应该是正确的，但这明显不是我们希望发生的，
        // 而 arrow-function 箭头函数能够很好的断开 this 的层层代理行为，所以，箭头函数比 method更适合作为 reduce-action。
        // 当然我们也可以通过 env.reduceOnly 或 直接使用 useReduceAgent 把 agent 当作一个纯粹的 reducer 来处理，这时，defaultMiddleWare就不再会采取this层层代理模式了。
        doubleDispatchStep(isUp: boolean) {
            return isUp ? this.stepUp() : this.stepDown();
        }

        // 返回值为 "promise" 或 "undefined"，定义成 middle-action，一个 middle-action 在被调用后，不会 dispatch 任何 action。
        // 但可以通过调用一个 reduce-action 来进行 dispatch 并修改 this.state 的工作。
        async callingStepUpAfterRequest() {
            await Promise.resolve();
            return this.stepUp(); // 调用一个 reduce-action。
        }
    }

    it('在agent触发 reduce-action 后，this.state应该变成 reduce-action return 值', () => {
        const {result, rerender} = renderHook(() => useAgent(CountAgent));
        const agent = result.current;
        act(() => {
            agent.stepUp();
        });
        expect(agent.state).toBe(1);
    });

    it('在agent触发一个调用了其他 reduce-action 的 method reduce-action，会导致不期望的dispatch行为，但结果依然是期望结果', () => {
        const {result, rerender} = renderHook(() => useAgent(CountAgent));
        const agent = result.current;
        act(() => {
            agent.doubleDispatchStep(true);
        });
        expect(agent.state).toBe(1);
    });

    it('在agent触发 middle-action 后，this.state应该变成 middle-action resolve 值', async () => {
        const {result, rerender} = renderHook(() => useAgent(CountAgent));
        const agent = result.current;
        await act(async () => {
            await agent.callingStepUpAfterRequest();
        });
        expect(agent.state).toBe(1);
    });

});

describe('使用基本的useReduceAgent配合一个useMiddleActions', () => {

    class CountAgent implements OriginAgent<number> {

        state = 0;

        stepUp = (): number => this.state + 1;

        stepDown = (): number => this.state - 1;

        sum = (...counts: number[]): number => this.state + counts.reduce((r, c): number => r + c, 0);

        step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

    }

    // 一个继承 MiddleActions 的 自定义类型可以调用指定 agent
    class CountBeside extends MiddleActions<CountAgent> {

        // 使用agent的 reduce-action 可修改 agent.state
        async callingStepUpAfterRequest() {
            await Promise.resolve();
            return this.agent.stepUp();
        }

    }

    it('useReduceAgent和useMiddleActions可以很好的隔离 reduce-actions 和 middle-actions', async () => {
        const {result: ar} = renderHook(() => useReduceAgent(CountAgent));
        const agent = ar.current;
        const {result: mr} = renderHook(() => useMiddleActions(agent, CountBeside));
        await act(async () => {
            await mr.current.callingStepUpAfterRequest();
        });
        expect(agent.state).toBe(1);
    });

});

describe('使用useMiddleWare复制一个专注一种任务模式的agent', () => {

    class CountAgent implements OriginAgent<number> {

        state = 0;

        // 返回值不为 "promise" ，也非 "undefined"，定义成 reduce-action，一个 reduce-action 在被调用后会 dispatch 一个 action，
        // 并修改this.state
        stepUp = (): number => this.state + 1;

        stepDown = (): number => this.state - 1;

        sum = (...counts: number[]): number => this.state + counts.reduce((r, c): number => r + c, 0);

        step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

        // 这是一个 reduce-action ，但同时它也是个 method ，我们把非箭头函数的其他属性函数统一称为 method ，一个 method 会对this进行层层代理，
        // 这使得 method 里的 reduce-action 能够正常的 dispatch action，在 middle-action 中是很有用的，
        // 但如果一个 method reduce-action 调用了其他 reduce-action，就会导致多次你期望之外的 dispatch action 行为发生，虽然结果应该是正确的，但这明显不是我们希望发生的，
        // 而 arrow-function 箭头函数能够很好的断开 this 的层层代理行为，所以，箭头函数比 method更适合作为 reduce-action。
        // 当然我们也可以通过 env.reduceOnly 或 直接使用 useReduceAgent 把 agent 当作一个纯粹的 reducer 来处理，这时，defaultMiddleWare就不再会采取this层层代理模式了。
        doubleDispatchStep(isUp: boolean) {
            return isUp ? this.stepUp() : this.stepDown();
        }

        // 返回值为 "promise" 或 "undefined"，定义成 middle-action，一个 middle-action 在被调用后，不会 dispatch 任何 action。
        // 但可以通过调用一个 reduce-action 来进行 dispatch 并修改 this.state 的工作。
        async callingStepUpAfterRequest(tms: number) {
            await new Promise((r) => setTimeout(r, tms * 100));
            return this.sum(tms);
        }

        @middleWare(LifecycleMiddleWares.takeLatest())
        async callingStepUpAfterRequestWithTakeLatest(tms: number){
            await new Promise((r) => setTimeout(r, tms * 100));
            return this.sum(tms);
        }

    }

    it('使用useMiddleWare，可以让agent复制版使用各种MiddleWare特性', async () => {
        const {result: ar} = renderHook(() => useAgent(CountAgent));
        const {result: mr} = renderHook(() => useMiddleWare(ar.current, LifecycleMiddleWares.takeLatest()));
        await act(async () => {
            const first = mr.current.callingStepUpAfterRequest(5);
            const second = mr.current.callingStepUpAfterRequest(2);
            await Promise.all([first, second]);
        });
        expect(ar.current.state).toBe(2);
    });

    it('使用agent-reducer的middleWare可以让一个agent方法具备各种MiddleWare特性', async () => {
        const {result: ar} = renderHook(() => useAgent(CountAgent));
        await act(async () => {
            const first = ar.current.callingStepUpAfterRequestWithTakeLatest(5);
            const second = ar.current.callingStepUpAfterRequestWithTakeLatest(2);
            await Promise.all([first, second]);
        });
        expect(ar.current.state).toBe(2);
    });

});