import {shallowEqual} from "../../src";

describe('shallowEqual',()=>{

    test('should be equal',()=>{
        const c={id:23}
        const r=shallowEqual({a:1,b:2,c},{a:1,b:2,c});
        expect(r).toBe(true);
    });

    test('should not be equal',()=>{
        const c={id:23}
        const r=shallowEqual({a:1,b:2,c},{a:1,b:2,c:{id:23}});
        expect(r).toBe(false);
    });

    test('should be equal without prototype',()=>{
        class A {
            a:number;
            b:number;
            constructor() {
                this.a=1;
                this.b=2;
            }
            c?:number;
        }
        A.prototype.c=23;
        const a = new A();
        const r=shallowEqual({a:1,b:2},a);
        expect(r).toBe(true);
    });

    test('should not be equal with prototype',()=>{
        class A {
            a:number;
            b:number;
            constructor() {
                this.a=1;
                this.b=2;
            }
            c?:number;
        }
        A.prototype.c=23;
        const a = new A();
        const r=shallowEqual({a:1,b:2,c:23},a);
        expect(r).toBe(false);
    });

});