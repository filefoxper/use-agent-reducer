import {Position, RequestParams, RequestResult} from "./type";

export const fetchData=(request:RequestParams):Promise<RequestResult>=>{
    const {name,position,page,size}=request;
    return Promise.resolve({
        list:page===1?[
            {id:0,name:'Jimmy',position:Position.USER},
            {id:1,name:'Master',position:Position.MASTER},
            {id:2,name:'Admin',position:Position.ADMIN}
        ]:[
            {id:3,name:'Daisy',position:Position.USER}
        ],
        page,
        size
    });
};