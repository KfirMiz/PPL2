import fs from "fs";
import { expect } from 'chai';
import {  evalL3program } from '../src/L3/L3-eval';
import { Value } from "../src/L3/L3-value";
import { Result, bind, makeOk } from "../src/shared/result";
import { parseL3 } from "../src/L3/L3-ast";




const q23: string = fs.readFileSync(__dirname + '/../src/q23.l3', { encoding: 'utf-8' });

const evalP = (x: string): Result<Value> =>
    bind(parseL3(x), evalL3program);

describe('Q23 Tests', () => {
    
   it("Q23 test 1", () => {
        expect(evalP(`(L3 ` + q23 + ` (get (dict '((a . 1) (b . 2))) 'b))`)).to.deep.equal(makeOk(2));
    });

    it("Q23 test 2", () => {
        expect(evalP(`(L3 ` + q23 + ` (dict? (dict '((a . 1) (b . 2)))))`)).to.deep.equal(makeOk(true));
    });

    it("Q23 test 3", () => {
        expect(evalP(`(L3 ` + q23 + ` (dict? '((1 . a) (2 . b))))`)).to.deep.equal(makeOk(false));
    });

    it("Q23 test 4", () => {
        expect(evalP(`(L3 ` + q23 + ` 
            (is-error? (get (dict '((a . 1) (b . 2))) 'c)))`
        )).to.deep.equal(makeOk(true));
    });

    it("Q23 test 5", () => {
        expect(evalP(`(L3 ` + q23 + `
                      (define d1 (dict '((a . 1) (b . 3))))
                      (define d2 (dict '((a . 1) (b . 2))))
                      (eq? d1 d2))`)).to.deep.equal(makeOk(false));
    }); 

    it("Q23 test 6", () => {
        expect(evalP(`(L3 ` + q23 + ` 
            (define x 1)
            (get 
              (if (< x 0)
                (dict '((a . 1) (b . 2)))
                (dict '((a . 2) (b . 1))))
            'a))`)).to.deep.equal(makeOk(2));
    });

    it("Q23 test 7", () => {
        expect(evalP(`(L3 ` + q23 + `  
            (bind (get (dict '((a . 1) (b . 2))) 'b) (lambda (x) (* x x))))`
        )).to.deep.equal(makeOk(4));
    });
});