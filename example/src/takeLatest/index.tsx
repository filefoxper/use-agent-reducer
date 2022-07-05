import React, {memo, useCallback, useEffect, useState} from 'react';
import {useAgentReducer, useMiddleWare} from "use-agent-reducer";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel, SearchParams} from "@/type";
import {MiddleWarePresets} from "agent-reducer";

type SearchParamsProps = {
    readonly searchParams: SearchParams,
    readonly onSubmit: (data: SearchParams) => any
}

const SearchParamComponent = memo((props: SearchParamsProps) => {

    const {state, changeSearchContent, changeSearchPriorLevel, feedback} = useAgentReducer(SearchParamsModel);

    useEffect(() => {
        feedback(props.searchParams);
    }, [props.searchParams]);

    const handleSubmit = useCallback(() => {
        props.onSubmit(state);
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

export default function TakeLatest() {

    const agent = useAgentReducer(SimpleTodoList);

    const {
        state,
        search,
        // when currentPage is 2, we make a delay 3000 ms,
        // so if you quickly change page to 3 during 3000 ms,
        // the newest dataSource of page 3 should be covered by dataSource of page 2
        changePage
    } = agent;

    // MiddleWarePresets.takeLatest() has chained with a MiddleWares.takePromiseResolve()
    // useMiddleWare create a copy version from 'agent',
    // and its MiddleWare will cover MiddleWare from decorators in 'OriginAgent'.
    // when currentPage is 2, we make a delay 3000 ms,
    // so if you quickly change page to 3 during 3000 ms,
    // the newest dataSource of page 3 should be covered by dataSource of page 2,
    // but MiddleWarePresets.takeLatest can keep the newest dataSource of page 3.
    const {changePage:changePageLatest} = useMiddleWare(agent,MiddleWarePresets.takeLatest());

    // submit for searching
    const submit = useCallback(async (searchParams: SearchParams) => {
        try {
            await search(searchParams);
        } catch (e) {
            alert(e.toString());
        }
    }, [state]);

    useEffect(() => {
        search();
    }, []);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    return (
        <PageContent>
            <SearchParamComponent searchParams={state.searchParams} onSubmit={submit}/>
            <Table dataSource={state.dataSource || []} pagination={false} rowKey="id">
                <Column title="id" dataIndex="id" width={'20%'}/>
                <Column title="content" dataIndex="content" width={'60%'}/>
                <Column title="prior level" dataIndex="priorLevel" render={renderPriorLevel} width={'20%'}/>
            </Table>
            <Pagination
                current={state.currentPage}
                total={state.total}
                pageSize={state.pageSize}
                onChange={changePageLatest}
            />
        </PageContent>
    );

}
