import {useEffect, useReducer, useRef} from "react";
import {OriginAgent, createAgentReducer, Env} from "agent-reducer";

export type RunEnv = {
    strict?: boolean
};

export function useAgent<S, T extends OriginAgent<S>>(entry: T | { new(): T }, env?: RunEnv): T {

    const runEnv = env && env.strict !== undefined ? {strict: env.strict} : undefined;

    let {current: reducer} = useRef(createAgentReducer(entry, {
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
