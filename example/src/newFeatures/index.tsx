import React, {memo, useCallback, useEffect, useState} from 'react';
import {RunEnv, useAgentReducer, useMiddleWare} from "use-agent-reducer";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel, SearchParams} from "@/type";
import {MiddleWarePresets} from "agent-reducer";

type SearchParamsProps = {
    // submit current searchParams,
    // and make it valid for searching.
    readonly onSubmit: (data: SearchParams) => any
}

// We can use new feature of 'agent-reducer@3.2.0' to update state synchronously.
// `Agents` based on a same model object can updating state synchronously.
const searchParamsModel = new SearchParamsModel();

const simpleTodoList = new SimpleTodoList();

const SearchParamComponent = memo((props: SearchParamsProps) => {

    const {state, changeSearchContent, changeSearchPriorLevel} = useAgentReducer(searchParamsModel);

    // `Agents` based on a same model object can updating state synchronously.
    const {search}=useAgentReducer(simpleTodoList);

    const handleSubmit = useCallback(() => {
        // submit current searchParams,
        // and make it valid for searching.
        search(state);
    }, [state]);

    return (
        <SearchContent>
            <label>content: </label>
            <ContentInput value={state.content} onChange={changeSearchContent}/>
            <label>prior level: </label>
            <PriorLevelSelect value={state.priorLevel} onChange={changeSearchPriorLevel}/>
            <Button type="primary" onClick={handleSubmit}>submit</Button>
        </SearchContent>
    );
});

export default function NewFeatures() {

    const searchParamAgent = useAgentReducer(searchParamsModel);

    const agent = useAgentReducer(simpleTodoList);

    const {
        state,
        search,
    } = agent;

    const {changePage: changePageLatest} = useMiddleWare(agent, MiddleWarePresets.takeLatest());

    // submit
    const submit = useCallback(async (params: SearchParams) => {
        // `Agents` based on a same model object can updating state synchronously.
        searchParamAgent.feedback(params);
        try {
            await search(params);
        } catch (e) {
            alert(e.toString());
        }
    }, []);

    useEffect(() => {
        search();
    }, []);

    // handle page change
    const handleChangePage = useCallback(async (currentPage: number, pageSize: number = 10) => {
        // `Agents` based on a same model object can updating state synchronously.
        searchParamAgent.feedback(state.searchParams);
        await changePageLatest(currentPage, pageSize);
    }, [state]);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    return (
        <PageContent>
            <SearchParamComponent onSubmit={submit}/>
            <Table dataSource={state.dataSource || []} pagination={false} rowKey="id">
                <Column title="id" dataIndex="id" width={'20%'}/>
                <Column title="content" dataIndex="content" width={'60%'}/>
                <Column title="prior level" dataIndex="priorLevel" render={renderPriorLevel} width={'20%'}/>
            </Table>
            <Pagination
                current={state.currentPage}
                total={state.total}
                pageSize={state.pageSize}
                onChange={handleChangePage}
            />
        </PageContent>
    );

}