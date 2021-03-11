import React, {useCallback, useEffect, useState} from 'react';
import {useAgentReducer} from "use-agent-reducer";
import SimpleTodoList from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {fetchTodoList} from "@/service";
import {PriorLevel} from "@/type";

export default function UseMiddleWare() {

    const {
        state,
        changeSearchContent,
        changeSearchPriorLevel,
        fetchDataSource,
    } = useAgentReducer(SimpleTodoList);

    // use MiddleWarePresets.takePromiseResolve,
    // we put fetching request inside the model,and make state change once,
    // it is good for keeping data consistency
    const search = useCallback(async (currentPage: number = 1, pageSize: number = 10) => {
        try {
            await fetchDataSource(currentPage, pageSize);
        }catch (e) {
            alert(e.toString());
        }
    }, [state]);

    useEffect(() => {
        search(1, 10);
    }, []);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    // there are one state change happens in search callback,
    // so, the console.log print once after we call the search function
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