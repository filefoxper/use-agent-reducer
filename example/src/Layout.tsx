import React, {memo, useEffect} from 'react';
import {Button, Input, Pagination, Select, Table} from "antd";
import {useAgent} from "use-agent-reducer";
import {ClassifyQueryAgent} from "@/module";
import {Position} from "./type";
import Column from "antd/lib/table/Column";

const Option = Select.Option;

export default memo(() => {

    const {state, handleFormNameChange, handleFormPositionChange,handleQueryClick,handlePageChange} = useAgent(ClassifyQueryAgent);

    useEffect(()=>{
        handleQueryClick();
    },[]);

    return (
        <div style={{padding:12}}>
            <div style={{padding:'12px 0'}}>
                <label>name：</label>
                <Input style={{width:160,marginRight:8}} value={state.form.name} onChange={(e) => handleFormNameChange(e.target.value)}/>
                <label>position：</label>
                <Select style={{width:160,marginRight:8}} value={state.form.position} onChange={handleFormPositionChange}>
                    <Option value={Position.USER}>user</Option>
                    <Option value={Position.MASTER}>master</Option>
                    <Option value={Position.ADMIN}>admin</Option>
                </Select>
                <Button type="primary" onClick={handleQueryClick}>search</Button>
            </div>
            <Table dataSource={state.list} loading={state.loading} pagination={false} rowKey="id">
                <Column title="id" dataIndex="id"/>
                <Column title="name" dataIndex="name"/>
                <Column title="position" dataIndex="position"/>
            </Table>
            <Pagination current={state.page} total={state.total} pageSize={10} onChange={handlePageChange}/>
        </div>
    );
});