import { expect } from 'chai';
import { all, map } from "ramda";
import {  evalL32program, evalParse } from '../src/L32/L32-eval';
import { Value } from "../src/L32/L32-value";
import { Result, bind, makeOk } from "../src/shared/result";
import { Binding, CExp, Exp, isAppExp, isAtomicExp, isDefineExp, isDictExp, isIfExp, isLetExp, isLitExp, isProcExp, isProgram, parseL32, parseL32CExp, parseL32Exp, Program } from "../src/L32/L32-ast";
import { L32toL3 } from "../src/q24";
import { makeSymbolSExp } from '../src/L3/L3-value';


const noDictExp = (e : Program | Exp) : boolean =>
    isAtomicExp(e) ? true :
    isLitExp(e) ? true :
    isIfExp(e) ? noDictExp(e.test) && noDictExp(e.then) && noDictExp(e.alt) :
    isProcExp(e) ? all((b) => noDictExp(b), e.body) :
    isAppExp(e) ? noDictExp(e.rator) &&
              all((rand) => noDictExp(rand), e.rands) :
    isDefineExp(e) ? noDictExp(e.val) :
    isLetExp(e) ? all((val : CExp) => noDictExp(val), map((b : Binding) => b.val, e.bindings)) &&
                  all((b) => noDictExp(b), e.body) :
    isDictExp(e) ? false :
    isProgram(e) ? all((e) => noDictExp(e), e.exps) : 
    true;


const evalP = (x: string): Result<Value> => 
    bind(parseL32(x), (prog) => 
        evalL32program(L32toL3(prog)))

const noDict = (x: string): Result<boolean> => 
    bind(parseL32(x), (prog) => 
        makeOk(noDictExp(L32toL3(prog))))

describe('Q24 Tests', () => {


    it("Q24 test 1", () => {
        expect(noDict(`(L32 ((dict (a 1) (b 2)) 'a))`)).to.deep.equal(makeOk(true));
        expect(evalP(`(L32 ((dict (a 1) (b 2)) 'a))`)).to.deep.equal(makeOk(1));
    });
    
    it("Q24 test 2", () => {
        expect(noDict(`(L32 ((dict (a 1) (b 2)) 'a))`)).to.deep.equal(makeOk(true));
        expect(evalP(`(L32 ((dict (a 1) (b 2)) 'a))`)).to.deep.equal(makeOk(1));
    });

    it("Q24 test 3", () => {
        expect(noDict(`(L32 ((dict (a 1) (b #f)) 'b))`)).to.deep.equal(makeOk(true));
        expect(evalP(`(L32 ((dict (a 1) (b #f)) 'b))`)).to.deep.equal(makeOk(false));
    });

    it("Q24 test 4", () => {
        expect(noDict(`(L32 ((dict (a 1) (b #f)) 'a))`)).to.deep.equal(makeOk(true));
        expect(evalP(`(L32 ((dict (a "z") (b #f)) 'a))`)).to.deep.equal(makeOk("z"));
    });

    it("Q24 test 5", () => {
        expect(noDict(`(L32 ((dict (a 1) (b 'red)) 'b))`)).to.deep.equal(makeOk(true));
        expect(evalP(`(L32 ((dict (a "z") (b 'red)) 'b))`)).to.deep.equal(makeOk(makeSymbolSExp("red")));
    });

    
    it("Q24 test 6", () => {
        expect(noDict(`(L32 ((dict (a 1) (b +)) 'b))`)).to.deep.equal(makeOk(true));
        expect(evalP(`(L32 ((dict (a "z") (b +)) 'b))`)).to.deep.equal(makeOk(makeSymbolSExp("+")));
    });

    it("Q24 test 7", () => {
        expect(noDict(`(L32 ((dict (a 1) (b '())) 'b))`)).to.deep.equal(makeOk(true));
        expect(evalP(`(L32 ((dict (a "z") (b '())) 'b))`)).to.deep.equal(evalParse("'()"));
    });

    it("Q24 test 8", () => {
        expect(noDict(`(L32 ((dict (a 1) (b (1 #t -))) 'b))`)).to.deep.equal(makeOk(true));
        expect(evalP(`(L32 ((dict (a "z") (b (1 #t -))) 'b))`)).to.deep.equal(evalParse("'(1 #t -)"));
    });

    it("Q23 tests 9", () => {
    expect(noDict(`(L32
                      (define x "a")
                      (define y "b")
                      ((dict (a x) (b y)) 'b))`)).to.deep.equal(makeOk(true));
        
        expect(evalP(`(L32
                      (define x "a")
                      (define y "b")
                      ((dict (a x) (b y)) 'b))`)).to.deep.equal(makeOk(makeSymbolSExp('y')))
    });
    
    it("Q24 test 10", () => {
        expect(noDict(`(L32 
            (define x 1)
            (
              (if (< x 0)
                (dict (a 1) (b 2))
                (dict (a 2) (b 1)))
            'a))`)).to.deep.equal(makeOk(true));
            
        expect(evalP(`(L32 
            (define x 1)
            (
              (if (< x 0)
                (dict (a 1) (b 2))
                (dict (a 2) (b 1)))
            'a))`)).to.deep.equal(makeOk(2));
    });

    it("Q23 tests 11", () => {
        expect(noDict(`(L32
                          ((dict (a 1) (b (+ 1 1))) 'b))`)).to.deep.equal(makeOk(true));
            
        expect(evalP(`(L32
                          ((dict (a 1) (b (+ 1 1))) 'b))`)).to.deep.equal(evalParse("'(+ 1 1)"))
    });

    it("Q23 tests 12", () => {
        expect(noDict(`(L32
                          ((dict (a (lambda (x) (square x))) (b (+ 1 1))) 'a))`)).to.deep.equal(makeOk(true));
            
        expect(evalP(`(L32
                          ((dict (a (lambda (x) (square x))) (b (+ 1 1))) 'a))`)).to.deep.equal(evalParse("'(lambda (x) (square x))"))
    });


    it("Q23 tests 13", () => {
        expect(noDict(`(L32
                          ((dict (a (dict (c 2) (d 3))) (b (+ 1 1))) 'a))`)).to.deep.equal(makeOk(true));
            
        expect(evalP(`(L32
                          ((dict (a (dict (c 2) (d 3))) (b (+ 1 1))) 'a))`)).to.deep.equal(evalParse("'(dict (c 2) (d 3))"))
    });

});
