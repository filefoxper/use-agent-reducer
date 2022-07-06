import React, {memo} from 'react';
import SimpleSearch from "@/simpleSearch";
import UseMiddleWare from "@/useMiddleWare";
import SplitModel from "@/splitModel";
import TakeLatest from "@/takeLatest";
import NewFeatures from "@/newFeatures";
import ModelProvider from "@/modelProvider";
import Flow from "@/flow";

const Title=({children})=>{
    return (
        <div style={{margin:'12px'}}>{children}:</div>
    );
}

export default memo(() => {

    return (
        <div>
            <div style={{margin:24,border:'1px solid #ddd'}}>
                <Title>Simple search page</Title>
                <SimpleSearch/>
                <Title>use MiddleWare</Title>
                <UseMiddleWare/>
                <Title>Split model</Title>
                <SplitModel/>
                <Title>use takeLatest MiddleWare</Title>
                <TakeLatest/>
                <Title>use new features</Title>
                <NewFeatures/>
                <Title>model provider</Title>
                <ModelProvider/>
                <Title>flow</Title>
                <Flow/>
            </div>
        </div>
    );
});
