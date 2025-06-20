import { expect } from 'chai';
import { parseL3, parseL3Exp } from '../src/L3/L3-ast';
import { bind, Result, makeOk, mapResult } from '../src/shared/result';
import { l2ToJS } from '../src/q3';
import { parse as p } from "../src/shared/parser";

const l2toJSResult = (x: string): Result<string> =>
    bind(bind(p(x), parseL3Exp), l2ToJS);

describe('Q3 Tests', () => {
    it('parses primitive ops', () => {
        expect(l2toJSResult(`(+ 3 5 7)`)).to.deep.equal(makeOk(`(3 + 5 + 7)`));
        expect(l2toJSResult(`(= 3 (+ 1 2))`)).to.deep.equal(makeOk(`(3 === (1 + 2))`));
    });

    it('parses "if" expressions', () => {
        expect(l2toJSResult(`(if (> x 3) 4 5)`)).to.deep.equal(makeOk(`((x > 3) ? 4 : 5)`));
    });

    it('parses "lambda" expressions', () => {
        expect(l2toJSResult(`(lambda (x y) (* x y))`)).to.deep.equal(makeOk(`((x,y) => (x * y))`));
        expect(l2toJSResult(`((lambda (x y) (* x y)) 3 4)`)).to.deep.equal(makeOk(`((x,y) => (x * y))(3,4)`));
    });

    it('parses "lambda" expressions 2', () => {
        expect(l2toJSResult(`(lambda (x) (eq? x 5))`)).to.deep.equal(makeOk(`((x) => (x === 5))`));
    });

    it('parses "lambda" expressions 3', () => {
        expect(l2toJSResult(`(lambda () 5 )`)).to.deep.equal(makeOk(`(() => 5)`));
    });
    
    it("defines constants", () => {
        expect(l2toJSResult(`(define pi 3.14)`)).to.deep.equal(makeOk(`const pi = 3.14`));
        expect(l2toJSResult(`(define e 2.71)`)).to.deep.equal(makeOk(`const e = 2.71`));
    });

    it("defines functions", () => {
        expect(l2toJSResult(`(define f (lambda (x y) (* x y)))`)).to.deep.equal(makeOk(`const f = ((x,y) => (x * y))`));
    });

    it("defines functions 2", () => {
        expect(l2toJSResult(`(define g (lambda () (+ 1 2)))`)).to.deep.equal(makeOk(`const g = (() => (1 + 2))`));
    });

    it("defines functions 3", () => {
        expect(l2toJSResult(`(define h (lambda (x y) (if (< x y) x y)))`)).to.deep.equal(makeOk(`const h = ((x,y) => ((x < y) ? x : y))`));
    });

    it("applies user-defined functions", () => {
        expect(l2toJSResult(`(f 3 4)`)).to.deep.equal(makeOk(`f(3,4)`));
    });

    it("applies user-defined functions 2", () => {
        expect(l2toJSResult(`(g )`)).to.deep.equal(makeOk(`g()`))
    });


    it('parses programs', () => {
        expect(bind(parseL3(`
            (L3 
              (define b (> 3 4)) 
              (define x 5) 
              (define f (lambda (y) (+ x y))) 
              (define g (lambda (y) (* x y))) 
              (if (not b) (f 3) (g 4)) 
              ((lambda (x) (* x x)) 7))
              `), l2ToJS)).to.deep.equal(makeOk(`const b = (3 > 4);\nconst x = 5;\nconst f = ((y) => (x + y));\nconst g = ((y) => (x * y));\n((!b) ? f(3) : g(4));\n((x) => (x * x))(7)`));
    });

    it('Q3 test 1', () => {
        expect(l2toJSResult(`+`)).to.deep.equal(makeOk(`+`));
    });

    it('Q3 test 2', () => {
        expect(l2toJSResult(`(not x)`)).to.deep.equal(makeOk(`(!x)`));
    });
    
    it('Q3 test 3', () => {
        expect(l2toJSResult(`(not (> 2 1))`)).to.deep.equal(makeOk(`(!(2 > 1))`));
    });
    
    it('Q3 test 4', () => {
        expect(l2toJSResult(`number?`)).to.deep.equal(makeOk(`((x) => typeof(x) === 'number')`));
    });

    it('Q3 test 5', () => {
        expect(l2toJSResult(`(number? x)`)).to.deep.equal(makeOk(`((x) => typeof(x) === 'number')(x)`));
    });

});