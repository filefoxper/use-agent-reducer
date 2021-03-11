import React, {memo, useCallback, useEffect, useState} from 'react';
import {useAgentReducer} from "use-agent-reducer";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel, SearchParams} from "@/type";

type SearchParamsProps = {
    // valid searchParams for searching from TodoList
    readonly searchParams: SearchParams,
    // submit current searchParams,
    // and make it valid for searching.
    readonly onSubmit: (data: SearchParams) => any
}

// we have split model SearchParamsModel out,
// so we can split the components about it out too.
const SearchParamComponent = memo((props: SearchParamsProps) => {

    const {state, changeSearchContent, changeSearchPriorLevel, feedback} = useAgentReducer(SearchParamsModel);

    useEffect(() => {
        // after the dataSource updates by fetching request,
        // the valid searchParams in TodoList state,
        // should feedback, and clear the dirty changes.
        feedback(props.searchParams);
    }, [props.searchParams]);

    const handleSubmit = useCallback(() => {
        // submit current searchParams,
        // and make it valid for searching.
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

export default function SplitModel() {

    const {
        state,
        search,
        changePage
    } = useAgentReducer(SimpleTodoList);

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
                onChange={changePage}
            />
        </PageContent>
    );

}