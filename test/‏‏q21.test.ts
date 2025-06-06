import { expect } from 'chai';
import {  evalL31program } from '../src/L31/L31-eval';
import { Value } from "../src/L31/L31-value";
import { Result, bind, isFailure, makeOk } from "../src/shared/result";
import { parseL31 } from "../src/L31/L31-ast";
import { makeSymbolSExp } from '../src/L3/L3-value';

const evalP = (x: string): Result<Value> =>
    bind(parseL31(x), evalL31program);

describe('Q21 Tests', () => {
    
    it("Q21 test 1", () => {
        expect(evalP(`(L31 (get (dict '((a . 1) (b . 2))) 'a))`)).to.deep.equal(makeOk(1));
    });

    it("Q21 test 2", () => {
        expect(evalP(`(L31 (get (dict '((a . 1) (b . 2))) 'c))`)).is.satisfy(isFailure);
    });

    it("Q21 test 3", () => {
        expect(evalP(`(L31 (dict? (dict '((a . 1) (b . 2)))))`)).to.deep.equal(makeOk(true));
    });

    it("Q21 test 4", () => {
        expect(evalP(`(L31 (dict? '((a . 1) b)))`)).to.deep.equal(makeOk(false));
    });

    it("Q21 test 5", () => {
        expect(evalP(`(L31 (dict? '((a . 1) (b))))`)).to.deep.equal(makeOk(true));
    });

    it("Q21 test 6", () => {
        expect(evalP(`(L31
                      (define d1 (dict '((a . 1) (b . 3))))
                      (define d2 (dict '((a . 1) (b . 2))))
                      (eq? d1 d2))`)).to.deep.equal(makeOk(false));
    });

    it("Q21 basic tests 7", () => {
        expect(evalP(`(L31
                      (define x "a")
                      (define y "b")
                      (get (dict '((a . x) (b . y))) 'b))`)).to.deep.equal(makeOk(makeSymbolSExp('y')))
    });

    it("Q21 test 8", () => {
        expect(evalP(`(L31 
            (define x 1)
            (get 
              (if (< x 0)
                (dict '((a . 1) (b . 2)))
                (dict '((a . 2) (b . 1))))
            'a))`)).to.deep.equal(makeOk(2));
    });

});