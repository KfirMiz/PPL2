import { Exp, Program, isProgram, isBoolExp, isNumExp, isStrExp, isVarRef,
         isProcExp, isIfExp, isAppExp, isPrimOp, isDefineExp } from "./L3/L3-ast";
import { Result, makeOk, makeFailure, mapResult, bind } from "./shared/result";

/*
Purpose: Transform L2 AST to JavaScript program string
Signature: l2ToJS(l2AST)
Type: [EXP | Program] => Result<string>
*/
export const l2ToJS = (exp: Exp | Program): Result<string>  =>
    isProgram(exp) ?
        bind(mapResult(l2ToJS, exp.exps), strs => 
            makeOk(strs.join(";\n"))) :
    isBoolExp(exp) ? makeOk(exp.val ? "true" : "false") :
    isNumExp(exp) ? makeOk(exp.val.toString()) :
    isStrExp(exp) ? makeOk(`"${exp.val}"`) :
    isVarRef(exp) ? makeOk(exp.var) :
    isPrimOp(exp) ? makeOk(primOpToJS(exp.op)) :
    isDefineExp(exp) ?
        bind(l2ToJS(exp.val), val => 
            makeOk(`const ${exp.var.var} = ${val}`)) :
    isIfExp(exp) ?
        bind(l2ToJS(exp.test), test =>
            bind(l2ToJS(exp.then), then =>
                bind(l2ToJS(exp.alt), alt =>
                    makeOk(`(${test} ? ${then} : ${alt})`)))) :
    isProcExp(exp) ?
        bind(mapResult(l2ToJS, exp.body), body => {
            const params = exp.args.map(a => a.var).join(",");
            const bodyJS = body.length === 1 ? body[0] : `{\n${body.join(";\n")};\n}`;
            return makeOk(`((${params}) => ${bodyJS})`);
        }) :
    isAppExp(exp) ?
        bind(l2ToJS(exp.rator), rator =>
            bind(mapResult(l2ToJS, exp.rands), rands => {
                if (rator === "!") {
                    return makeOk(`(!${rands[0]})`);
                }
                if (["+", "-", "*", "/", "===", ">", "<"].includes(rator)) {
                    return makeOk(`(${rands.join(` ${rator} `)})`);
                }
                return makeOk(`${rator}(${rands.join(",")})`);
            })) :
    makeFailure(`Unsupported expression: ${JSON.stringify(exp)}`);

// Primitive operator mapping
const primOpToJS = (op: string): string =>
    ["+", "-", "*", "/", ">", "<"].includes(op) ? op :
    op === "=" || op === "eq?" ? "===" :
    op === "not" ? "!" :
    op === "number?" ? "((x) => typeof(x) === 'number')" :
    op === "boolean?" ? "((x) => typeof(x) === 'boolean')" :
    op;