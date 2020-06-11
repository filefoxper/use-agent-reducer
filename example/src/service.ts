import {Position, RequestParams, RequestResult} from "./type";

export const fetchData=(request:RequestParams):Promise<RequestResult>=>{
    const {name,position,page,size}=request;
    return Promise.resolve({
        list:page===1?[
            {id:0,name:'Jimmy',position:Position.MASTER},
            {id:1,name:'Master',position:Position.MASTER},
            {id:2,name:'Admin',position:Position.ADMIN},
            {id:3,name:'Daisy',position:Position.USER},
            {id:4,name:'Tester',position:Position.USER},
            {id:5,name:'Lily',position:Position.USER},
            {id:6,name:'Peter',position:Position.USER},
            {id:7,name:'Sunny',position:Position.USER},
            {id:8,name:'Kasim',position:Position.USER},
            {id:9,name:'Water',position:Position.USER},
        ]:[
            {id:10,name:'Willy',position:Position.USER}
        ],
        page,
        total:11
    });
};