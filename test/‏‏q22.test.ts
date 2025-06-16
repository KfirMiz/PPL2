import fs from "fs";
import { expect } from 'chai';
import {  evalL32program } from '../src/L32/L32-eval';
import { Value } from "../src/L32/L32-value";
import { Result, bind, isFailure, makeFailure, makeOk } from "../src/shared/result";
import { parseL32, parseL32Exp } from "../src/L32/L32-ast";
import { makeEmptySExp } from "../src/L3/L3-value";

const evalP = (x: string): Result<Value> =>
    bind(parseL32(x), evalL32program);

describe('Q22 Tests', () => {

    it("Q22 basic tests 1", () => {
        expect(evalP(`(L32 ((dict (a 1) (b 2)) 'a))`)).to.deep.equal(makeOk(1));
    });
    
    it("Q22 tests 2", () => {
        expect(evalP(`(L32
                      (define x "a")
                      (define y "b")
                      ((dict (a x) (b y)) 'b))`)).to.deep.equal(makeOk("b"))
    });

    it("Q22 test 3", () => {
        expect(evalP(`(L32 
            (define x 1)
            (
              (if (< x 0)
                (dict (a 1) (b 2))
                (dict (a 2) (b 1)))
            'a))`)).to.deep.equal(makeOk(2));
    });
});