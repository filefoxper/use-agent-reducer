import React, {ChangeEvent, memo, useCallback} from "react";
import {Input, Select} from "antd";
import {PriorLevel} from "@/type";

const Option = Select.Option;

export const PriorLevelSelect = memo(({value, onChange}: { value: PriorLevel|undefined, onChange: (v: PriorLevel|undefined) => any }) => {

    const handleChange=useCallback((v:PriorLevel|-1)=>{
        onChange(v<0?undefined:v);
    },[onChange]);

    return (
        <Select style={{width: 160, marginRight: 8}} value={value===undefined?-1:value}
                onChange={handleChange}>
            <Option value={-1}>all</Option>
            <Option value={PriorLevel.NORMAL}>normal</Option>
            <Option value={PriorLevel.EMERGENCY}>emergency</Option>
        </Select>
    );
});

export const ContentInput = memo(({value, onChange}: { value: string|undefined, onChange: (v: string) => any }) => {

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    }, [onChange]);

    return (
        <Input style={{width: 160, marginRight: 8}} value={value||''} onChange={handleChange}/>
    );
});

export const PageContent = memo(({children})=>{
    return (
        <div style={{padding: 12}}>{children}</div>
    );
});

export const SearchContent = memo(({children})=>{
    return (
        <div style={{padding: '12px 0'}}>{children}</div>
    );
});

