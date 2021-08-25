import React, {useEffect} from "react";
import {renderHook, act} from "@testing-library/react-hooks";
import {render} from "@testing-library/react";
import {
    AgentProvider,
    useAgent,
    useAgentContext,
    useAgentReducer,
    useBranch,
    useMiddleActions,
    useMiddleWare
} from "../../src";
import {
    BranchResolvers,
    clearGlobalConfig,
    globalConfig,
    MiddleActions,
    middleWare,
    MiddleWarePresets,
    OriginAgent
} from "agent-reducer";
import {ReactNodeLike} from "prop-types";

describe('使用基本的useAgent', () => {

    class CountAgent implements OriginAgent<number> {

        state = 0;

        // 返回值即下个 this.state，每个方法相当于一次 reducer 的 dispatch action
        stepUp = (): number => this.state + 1;

        stepDown = (): number => this.state - 1;

        sum = (...counts: number[]): number => this.state + counts.reduce((r, c): number => r + c, 0);

        step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

        doubleDispatchStep(isUp: boolean) {
            return isUp ? this.stepUp() : this.stepDown();
        }

        async returnPromise(){
            await Promise.resolve();
            return 1;
        }

        // 返回值为 "promise"，如果不加任何修饰，那下个 state 就会是个 "promise" 对象，
        // 如果我们想要将 "promise" resolve 的数据作为下一个 state 需要使用middleWare，这里使用的是 "agent-reducer" 的 MiddleWarePresets.takePromiseResolve()。
        @middleWare(MiddleWarePresets.takePromiseResolve())
        async callingStepUpAfterRequest() {
            await Promise.resolve();
            return this.stepUp(); // 调用一个 reduce-action。
        }
    }

    it('在agent调用一个方法后，this.state应该变成这个方法的返回值', () => {
        const {result, rerender} = renderHook(() => useAgent(CountAgent));
        const agent = result.current;
        act(() => {
            agent.stepUp();
        });
        expect(agent.state).toBe(1);
    });

    it('在agent中，一个方法调用另一个方法也是没问题的，不会出现不必要的dispatch，内部被调用方法没有改变 state 的能力', () => {
        const {result, rerender} = renderHook(() => useAgent(CountAgent));
        const agent = result.current;
        act(() => {
            agent.doubleDispatchStep(true);
        });
        expect(agent.state).toBe(1);
    });

    it('在agent调用一个返回promise的方法时，如果没有MiddleWare修饰，state 将变成promise对象', async () => {
        const {result, rerender} = renderHook(() => useAgent(CountAgent));
        const agent = result.current;
        await act(async () => {
            await agent.returnPromise();
        });
        expect(typeof (agent.state as any).then).toBe('function');
    });

    it('在agent调用一个返回promise的方法时，如果使用MiddleWare修饰，state将变成MiddleWare加工后的对象', async () => {
        const {result, rerender} = renderHook(() => useAgent(CountAgent));
        const agent = result.current;
        await act(async () => {
            await agent.callingStepUpAfterRequest();
        });
        expect(agent.state).toBe(1);
    });

});

describe('使用基本的useAgent配合一个useMiddleActions', () => {

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

    it('useMiddleActions可以很好的管理调用一个agent方法', async () => {
        const {result: ar} = renderHook(() => useAgent(CountAgent));
        const agent = ar.current;
        const {result: mr} = renderHook(() => useMiddleActions(new CountBeside(agent)));
        await act(async () => {
            await mr.current.callingStepUpAfterRequest();
        });
        expect(agent.state).toBe(1);
    });

});

describe('使用useMiddleWare复制一个专注一种任务模式的agent', () => {

    class CountAgent implements OriginAgent<number> {

        state = 0;

        stepUp = (): number => this.state + 1;

        stepDown = (): number => this.state - 1;

        sum = (...counts: number[]): number => this.state + counts.reduce((r, c): number => r + c, 0);

        step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

        doubleDispatchStep(isUp: boolean) {
            return isUp ? this.stepUp() : this.stepDown();
        }

        // middleWare修饰可以使用useMiddleWare的形式，复制一个agent版本，并添加在复制版的所有方法中
        async callingStepUpAfterRequest(tms: number) {
            await new Promise((r) => setTimeout(r, tms * 100));
            return this.sum(tms);
        }

        // 其实middleWare修饰器也是复制出一个agent版本，放在内存中，在获取该方法时，给出内存复制版对应的方法
        @middleWare(MiddleWarePresets.takeLatest())
        async callingStepUpAfterRequestWithTakeLatest(tms: number){
            await new Promise((r) => setTimeout(r, tms * 100));
            return this.sum(tms);
        }

    }

    it('使用useMiddleWare，可以让agent复制版使用各种MiddleWare特性，复制版的所有方法都具备统一的MiddleWare特性', async () => {
        const {result: ar} = renderHook(() => useAgent(CountAgent));
        const {result: mr} = renderHook(() => useMiddleWare(ar.current, MiddleWarePresets.takeLatest()));
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

    it('使用AgentProvider和useAgentContext可以在深层组件内使用外部agent', function () {
        const AgentProv=({children}:{children?:ReactNodeLike})=>{
            const agent=useAgentReducer(CountAgent);
            return (
                <AgentProvider value={agent}>
                    {children}
                </AgentProvider>
            );
        };
        const Deep=()=>{
            const agent=useAgentContext<CountAgent>();
            useEffect(()=>{
                agent.stepUp();
            },[]);
            return (
                <div className="agent">{agent.state}</div>
            )
        }
        const {container}=render(<Deep/>,{wrapper:AgentProv});
        const div=container.getElementsByClassName('agent')[0];
        expect(div.innerHTML).toBe('1');
    });

});

describe('使用 3.1.0+ 对 1.* 版的兼容功能',()=>{

    beforeAll(()=>{
        //在顶级将环境设置为 1.* 模式。
        globalConfig({env:{legacy:true}});
    });

    afterAll(()=>{
        //注意：正式使用时，不要调用该方法
        clearGlobalConfig();
    })

    class CountAgent implements OriginAgent<number> {

        state = 0;

        stepUp = (): number => this.state + 1;

        stepDown = (): number => this.state - 1;

        sum = (...counts: number[]): number => this.state + counts.reduce((r, c): number => r + c, 0);

        step = (isUp: boolean) => isUp ? this.stepUp() : this.stepDown();

        doubleDispatchStep(isUp: boolean) {
            return isUp ? this.stepUp() : this.stepDown();
        }

        // 在 1.* 中起作用，在 3.1.0+ 中需要使用 MiddleWare 的方法
        async callingSum(tms: number) {
            await new Promise((r) => setTimeout(r, tms * 100));
            return this.sum(tms); // 注意：3.1.0+ 中 this.sum 是个纯粹的方法调用，本身并不会修改 this.state，所以需要 return，否则this.state将变成undefined
        }

        async callingSumByLegacy(tms: number) {
            await new Promise((r) => setTimeout(r, tms * 100));
            this.sum(tms); // 注意：1.* 中因为 this 的层层代理作用，加上 middle-action 作用， this.sum 会修改 this.state，所以不需要 return
        }

    }

    test('1.* 用法',async ()=>{
        // useAgent 会收到全局 env.legacy 影响，变成 1.* 支持版本
        const {result: ar} = renderHook(() => useAgent(CountAgent));
        const {result: mr} = renderHook(() => useBranch(ar.current, BranchResolvers.takeLatest()));
        await act(async () => {
            const first = mr.current.callingSumByLegacy(5);
            const second = mr.current.callingSumByLegacy(2);
            await Promise.all([first, second]);
        });
        expect(ar.current.state).toBe(2);
    });

    test('3.* 用法',async ()=>{
        // useAgentReducer 只支持 3.0.0 以上写法，并忽略全局 env.legacy 设置
        const {result: ar} = renderHook(() => useAgentReducer(CountAgent));
        const {result: mr} = renderHook(() => useMiddleWare(ar.current, MiddleWarePresets.takeLatest()));
        await act(async () => {
            const first = mr.current.callingSum(5);
            const second = mr.current.callingSum(2);
            await Promise.all([first, second]);
        });
        expect(ar.current.state).toBe(2);
    });

    test('3.* 使用 1.* 的写法',async ()=>{
        // useAgentReducer 只支持 3.0.0 以上写法，并忽略全局 env.legacy 设置
        const {result: ar} = renderHook(() => useAgentReducer(CountAgent));
        const {result: mr} = renderHook(() => useMiddleWare(ar.current, MiddleWarePresets.takeLatest()));
        await act(async () => {
            const first = mr.current.callingSumByLegacy(5);
            // 注意：3.1.0+ 中 this.sum 是个纯粹的方法调用，本身并不会修改 this.state，所以需要 return，否则this.state将变成undefined
            const second = mr.current.callingSumByLegacy(2);
            await Promise.all([first, second]);
        });
        expect(ar.current.state).toBe(undefined);
    });

});