import React, {memo, useCallback, useEffect, useState} from 'react';
import {RunEnv, useAgentReducer, useMiddleWare} from "use-agent-reducer";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel, SearchParams} from "@/type";
import {MiddleWarePresets} from "agent-reducer";

// every `Agent` bases on a same model object,
// shares state updating with each other.
const searchParamsModel = new SearchParamsModel();

const simpleTodoList = new SimpleTodoList();

const SearchParamComponent = memo(() => {

    const {state, changeSearchContent, changeSearchPriorLevel,feedback} = useAgentReducer(searchParamsModel);

    // `Agent` bases on object simpleTodoList,
    // If we use class `SimpleTodoList` as a model,
    // `useAgentReducer` should create a private model object inside,
    // and then, no state updating can be shared now.
    // So, model sharing only works on 'Agents' base on a same model object.
    const {search} = useAgentReducer(simpleTodoList);

    const handleSubmit = useCallback(async () => {
        // submit current searchParams with model object `simpleTodoList`
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

    const {feedback} = useAgentReducer(searchParamsModel);

    // `Agent` bases on model `simpleTodoList`
    const agent = useAgentReducer(simpleTodoList);

    const {
        state,
        search,
    } = agent;

    const {changePage: changePageLatest} = useMiddleWare(agent, MiddleWarePresets.takeLatest());

    useEffect(() => {
        search();
    }, []);

    // handle page change
    const handleChangePage = useCallback(async (currentPage: number, pageSize: number = 10) => {
        // feedback searchParams with model object `searchParamsModel`.
        feedback(state.searchParams);
        await changePageLatest(currentPage, pageSize);
    }, [state]);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    return (
        <PageContent>
            <SearchParamComponent/>
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