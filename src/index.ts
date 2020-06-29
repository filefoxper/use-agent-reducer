import {useEffect, useReducer, useRef} from "react";
import {branch, BranchResolver, createAgentReducer, OriginAgent, Resolver} from "agent-reducer";

export type RunEnv = {
    strict?: boolean
};

export function useAgent<S, T extends OriginAgent<S>>(entry: T | { new(): T }, resolver?: Resolver | RunEnv, env?: RunEnv): T {

    const envData = typeof resolver !== 'function' ? resolver : env;

    const resolverFunc = typeof resolver === 'function' ? resolver : undefined;

    const runEnv = envData && envData.strict !== undefined ? {strict: envData.strict} : undefined;

    let {current: reducer} = useRef(createAgentReducer(entry, resolverFunc,{
        ...runEnv,
        expired: false,
        updateBy: 'manual'
    }));

    const [state, dispatch] = useReducer(reducer, reducer.initialState);

    reducer.update(state, dispatch);

    useEffect(() => {
        return () => {
            reducer.env.expired = true;
        }
    }, []);

    return reducer.agent;
}

export function useBranch<S, T extends OriginAgent<S>>(agent: T, branchResolver: BranchResolver) {
    const {current} = useRef(branch(agent, branchResolver));
    return current;
}
