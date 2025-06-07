import { reduce } from "ramda";
import { PrimOp } from "./L31-ast";
import { isCompoundSExp, isEmptySExp, isSymbolSExp, makeCompoundSExp, makeEmptySExp, CompoundSExp, EmptySExp, Value, SExpValue } from "./L31-value";
import { List, allT, first, isNonEmptyList, rest } from '../shared/list';
import { isBoolean, isNumber, isString } from "../shared/type-predicates";
import { Result, makeOk, makeFailure } from "../shared/result";
import { format } from "../shared/format";

export const applyPrimitive = (proc: PrimOp, args: Value[]): Result<Value> =>
    proc.op === "+" ? (allT(isNumber, args) ? makeOk(reduce((x, y) => x + y, 0, args)) :
                                              makeFailure(`+ expects numbers only: ${format(args)}`)) :
    proc.op === "-" ? minusPrim(args) :
    proc.op === "*" ? (allT(isNumber, args) ? makeOk(reduce((x, y) => x * y, 1, args)) :
                                              makeFailure(`* expects numbers only: ${format(args)}`)) :
    proc.op === "/" ? divPrim(args) :
    proc.op === ">" ? makeOk(args[0] > args[1]) :
    proc.op === "<" ? makeOk(args[0] < args[1]) :
    proc.op === "=" ? makeOk(args[0] === args[1]) :
    proc.op === "not" ? makeOk(!args[0]) :
    proc.op === "and" ? (isBoolean(args[0]) && isBoolean(args[1]) ? makeOk(args[0] && args[1]) :
                                                                makeFailure(`Arguments to "and" not booleans: ${format(args)}`)) :
    proc.op === "or" ? (isBoolean(args[0]) && isBoolean(args[1]) ? makeOk(args[0] || args[1]) :
                                                               makeFailure(`Arguments to "or" not booleans: ${format(args)}`)) :
    proc.op === "eq?" ? makeOk(eqPrim(args)) :
    proc.op === "string=?" ? makeOk(args[0] === args[1]) :
    proc.op === "cons" ? makeOk(consPrim(args[0], args[1])) :
    proc.op === "car" ? carPrim(args[0]) :
    proc.op === "cdr" ? cdrPrim(args[0]) :
    proc.op === "list" ? makeOk(listPrim(args)) :
    proc.op === "pair?" ? makeOk(isPairPrim(args[0])) :
    proc.op === "number?" ? makeOk(typeof (args[0]) === 'number') :
    proc.op === "boolean?" ? makeOk(typeof (args[0]) === 'boolean') :
    proc.op === "symbol?" ? makeOk(isSymbolSExp(args[0])) :
    proc.op === "string?" ? makeOk(isString(args[0])) :
    // ======================================= NEW - START
    proc.op === "dict" ? makeOk(args[0]) : 
    proc.op === "get" ? (
        isCompoundSExp(args[0]) || isEmptySExp(args[0]) ?
            applyGet(args[0], args[1]) :
            makeFailure(`First argument to 'get' must be a list`)
    ) :
    proc.op === "dict?" ? (
        isCompoundSExp(args[0]) || isEmptySExp(args[0]) ?
            makeOk(isValidDict(args[0])) :
            makeOk(false)
    ) :
    // ======================================= NEW - END
    makeFailure(`Bad primitive op: ${format(proc.op)}`);


const minusPrim = (args: Value[]): Result<number> => {
    // TODO complete
    const x = args[0], y = args[1];
    if (isNumber(x) && isNumber(y)) {
        return makeOk(x - y);
    }
    else {
        return makeFailure(`Type error: - expects numbers ${format(args)}`);
    }
};

const divPrim = (args: Value[]): Result<number> => {
    // TODO complete
    const x = args[0], y = args[1];
    if (isNumber(x) && isNumber(y)) {
        return makeOk(x / y);
    }
    else {
        return makeFailure(`Type error: / expects numbers ${format(args)}`);
    }
};

const eqPrim = (args: Value[]): boolean => {
    const x = args[0], y = args[1];
    if (isSymbolSExp(x) && isSymbolSExp(y)) {
        return x.val === y.val;
    }
    else if (isEmptySExp(x) && isEmptySExp(y)) {
        return true;
    }
    else if (isNumber(x) && isNumber(y)) {
        return x === y;
    }
    else if (isString(x) && isString(y)) {
        return x === y;
    }
    else if (isBoolean(x) && isBoolean(y)) {
        return x === y;
    }
    else {
        return false;
    }
};

const carPrim = (v: Value): Result<Value> => 
    isCompoundSExp(v) ? makeOk(v.val1) :
    makeFailure(`Car: param is not compound ${format(v)}`);

const cdrPrim = (v: Value): Result<Value> =>
    isCompoundSExp(v) ? makeOk(v.val2) :
    makeFailure(`Cdr: param is not compound ${format(v)}`);

const consPrim = (v1: Value, v2: Value): CompoundSExp =>
    makeCompoundSExp(v1, v2);

export const listPrim = (vals: List<Value>): EmptySExp | CompoundSExp =>
    isNonEmptyList<Value>(vals) ? makeCompoundSExp(first(vals), listPrim(rest(vals))) :
    makeEmptySExp();

const isPairPrim = (v: Value): boolean =>
    isCompoundSExp(v);

// ======================================= NEW - START

const isValidDict = (dict: Value): boolean =>
    listToArray(dict).every(isCompoundSExp) &&
    (() => {
        const keys = listToArray(dict)
            .map(p => (p as CompoundSExp).val1);

        const symbolKeys = keys.filter(isSymbolSExp);
        const symbolVals = symbolKeys.map(sym => sym.val);

        return symbolKeys.length === keys.length &&
               symbolVals.every((k, i, arr) => arr.indexOf(k) === arr.lastIndexOf(k));
    })();


const applyGet = (dict: Value, key: Value): Result<Value> => {
    const items = listToArray(dict);

    const keys = items
        .filter(isCompoundSExp)
        .map(p => p.val1)
        .filter(isSymbolSExp)
        .map(sym => sym.val);

    return keys.every((k, i, arr) => arr.indexOf(k) === arr.lastIndexOf(k)) ?
        (() => {
            const found = items.find(pair =>
                isCompoundSExp(pair) &&
                isSymbolSExp(pair.val1) &&
                eqPrim([pair.val1, key])
            );

            return (found && isCompoundSExp(found)) ?
                makeOk(found.val2) :
                makeFailure(`Key ${format(key)} not found in dict`);
        })()
        :
        makeFailure(`Duplicate key(s) in dict: ${keys.join(", ")}`);
};
    

const listToArray = (v: Value): Value[] =>
    isCompoundSExp(v)
        ? [v.val1, ...listToArray(v.val2)]
        : [];

// ======================================= NEW - END
        