import React, {useCallback, useEffect, useState} from 'react';
import {useAgentReducer} from "use-agent-reducer";
import SimpleTodoList from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel} from "@/type";

export default function SimpleSearch() {

    const {
        state,
        changeSearchContent,
        changeSearchPriorLevel,
        changeDataSource,
        changePageInfo
    } = useAgentReducer(SimpleTodoList);

    // TODO problem 1: searchParams is part of model state,
    // when Pagination call it, state submit will be ignore,
    // every change about search params will participate in the page change searching.
    const search = useCallback(async (currentPage: number = 1, pageSize: number = 10) => {
        const {searchParams} = state;
        // TODO problem 2: fetchTodoList should be a part of model
        const {content, total} = await fetchTodoList({...searchParams, currentPage, pageSize});
        // TODO problem 3: change state twice is not good,
        // if we change state twice in a pure react event callback,
        // state may be override by the last change time.
        // Besides, it is not good for data change consistency.
        changeDataSource(content); // every change will cause a render...
        changePageInfo(currentPage, pageSize, total); // every change will cause a render...
    }, [state]);

    useEffect(() => {
        search(1, 10);
    }, []);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    // there are two state change happens in search callback,
    // so, the console.log print twice after we call the search function
    console.log('render...');
    return (
        <PageContent>
            <SearchContent>
                <label>content: </label>
                <ContentInput value={state.searchParams.content} onChange={changeSearchContent}/>
                <label>prior level: </label>
                <PriorLevelSelect value={state.searchParams.priorLevel} onChange={changeSearchPriorLevel}/>
                <Button type="primary" onClick={() => search(1, 10)}>submit</Button>
            </SearchContent>
            <Table dataSource={state.dataSource || []} pagination={false} rowKey="id">
                <Column title="id" dataIndex="id" width={'20%'}/>
                <Column title="content" dataIndex="content" width={'60%'}/>
                <Column title="prior level" dataIndex="priorLevel" render={renderPriorLevel} width={'20%'}/>
            </Table>
            <Pagination current={state.currentPage} total={state.total} pageSize={state.pageSize} onChange={search}/>
        </PageContent>
    );

}