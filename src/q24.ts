//import { isProgram, makeProgram, Program } from './L3/L3-ast';
import { map } from 'ramda';
import { AppExp, CExp, DictExp, Exp, isAppExp, isAtomicExp, isCExp, isDefineExp, isDictExp, isExp, isIfExp, isLetExp, isLitExp, 
        isProcExp, isProgram, isVarRef, LetExp, LitExp, makeAppExp, makeBinding, makeDefineExp, makeIfExp, makeLetExp, makeProcExp, makeProgram, 
        makeVarRef, parseL32, parseLitExp, Program, unparseL32 } from './L32/L32-ast';
import { Sexp } from 's-expression';
import { parse as p, isSexpString, isToken, isCompoundSexp, isSexp } from "./shared/parser";
import { isOk, mapv } from './shared/result';

/*
Purpose: rewrite all occurrences of DictExp in a program to AppExp.
Signature: Dict2App (exp)
Type: Program -> Program
*/
export const Dict2App  = (exp: Program) : Program => {
    const newProgramL32 = rewriteAllDict(exp); 
    return isProgram(newProgramL32) ? newProgramL32 :
    makeProgram([]); // SHOULD NEVER HAPPEN
}

// ==============================================================

/*
Purpose: rewrite a single DictExp as a lambda-application form
Signature: rewriteDict(cexp)
Type: [DictExp => AppExp]
*/
const rewriteDict = (e: DictExp): AppExp => {
    const unparsedDict = unparseL32(e);
    const transformedDict = transformDictString(unparsedDict);
    const finalResult =  mapv(p(transformedDict), (sexpResult: Sexp) =>
                            mapv(parseLitExp(sexpResult), (literalExpression: LitExp) => 
                                makeAppExp(makeVarRef("dict"), [literalExpression])));   
    if (isOk(finalResult) && isOk(finalResult.value)) {
        return finalResult.value.value;
    }
    // SHOULD NEVER HAPPEN
    throw new Error("Unexpected failure in rewriteDict");
}

/*
Purpose: rewrite all occurrences of Dict in an expression to lambda-applications.
Signature: rewriteAllDict(exp)
Type: [Program | Exp -> Program | Exp]
*/
export const rewriteAllDict = (exp: Program | Exp): Program | Exp =>
    isExp(exp) ? rewriteAllDictExp(exp) :
    isProgram(exp) ? makeProgram(map(rewriteAllDictExp, exp.exps)) :
    exp;


const rewriteAllDictExp = (exp: Exp): Exp =>
    isCExp(exp) ? rewriteAllDictCExp(exp) :
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllDictCExp(exp.val)) :
    exp;


const rewriteAllDictCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isLitExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteAllDictCExp(exp.test),
                             rewriteAllDictCExp(exp.then),
                             rewriteAllDictCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(rewriteAllDictCExp(exp.rator),
                               map(rewriteAllDictCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllDictCExp, exp.body)) :
    isLetExp(exp) ? makeLetExp(exp.bindings.map(b => makeBinding(b.var.var, rewriteAllDictCExp(b.val))),
                               exp.body.map(rewriteAllDictCExp)) :
    isDictExp(exp) ? rewriteAllDictCExp(rewriteDict(exp)) :
    exp;

// ==============================================================

const transformDictString = (input: string): string => {
  // Remove the outer (dict ...) wrapper
  const trimmed = input.trim();
  if (!trimmed.startsWith("(dict")) return input;

  const content = trimmed.slice(5).trim(); // remove "(dict"
  const tokens = tokenize(content.slice(0, -1)); // remove last ')'
  const parsed = parseList(tokens);

  // Transform each (key value) pair into (key . value)
  const transformed = parsed.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2) {
      throw new Error("Invalid key-value pair structure.");
    }

    let value = pair[1];

    // Unwrap 'quoted values (i.e., ['quote', x]) in second element
    if (Array.isArray(value) && value.length === 2 && value[0] === 'quote') {
      value = value[1]; // remove the quote
    }

    return `(${toString(pair[0])} . ${toString(value)})`;
  });

  return `(${transformed.join(' ')})`;
};

const tokenize = (str: string): string[] => {
  const result: string[] = [];
  let token = '';
  let inString = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '"') {
      token += char;
      inString = !inString;
    } else if (inString) {
      token += char;
    } else if (char === '(' || char === ')' || char === "'") {
      if (token) {
        result.push(token);
        token = '';
      }
      result.push(char);
    } else if (/\s/.test(char)) {
      if (token) {
        result.push(token);
        token = '';
      }
    } else {
      token += char;
    }
  }

  if (token) result.push(token);
  return result;
};

const parseList = (tokens: string[]): any[] => {
  const parseExpr = (i: number): [any, number] => {
    const token = tokens[i];

    if (token === "'") {
      const [quotedExpr, nextIndex] = parseExpr(i + 1);
      return [['quote', quotedExpr], nextIndex];
    } else if (token === '(') {
      const list: any[] = [];
      let index = i + 1;
      while (tokens[index] !== ')') {
        const [expr, nextIndex] = parseExpr(index);
        list.push(expr);
        index = nextIndex;
        if (index >= tokens.length) throw new Error("Unmatched '('");
      }
      return [list, index + 1];
    } else if (token === ')') {
      throw new Error("Unexpected ')'");
    } else {
      return [token, i + 1];
    }
  };

  const result: any[] = [];
  let i = 0;
  while (i < tokens.length) {
    const [expr, nextIndex] = parseExpr(i);
    result.push(expr);
    i = nextIndex;
  }
  return result;
};

const toString = (value: any): string => {
  if (Array.isArray(value)) {
    // Convert ['quote', x] → 'x
    if (value.length === 2 && value[0] === 'quote') {
      return `'${toString(value[1])}`;
    }
    return `(${value.map(toString).join(' ')})`;
  }
  return value;
};

// ==============================================================

/*
Purpose: Transform L32 program to L3
Signature: L32ToL3(prog)
Type: Program -> Program
*/
export const L32toL3 = (prog : Program): Program => {
    const additionProgram = parseL32(additionString);
    const appExpProg = Dict2App(prog);
    const appExpGetProg = DictApp2GetApp(appExpProg);
    if (isOk(additionProgram) && isProgram(additionProgram.value)) {
        return makeProgram([...additionProgram.value.exps, ...appExpGetProg.exps]);
    }
    return makeProgram([]); // SHOULD NEVER HAPPEN 
}

// ==============================================================

/*
Purpose: rewrite all occurrences of DictAppExp in a program to GetDictAppExp.
Signature: DictApp2GetApp (exp)
Type: Program -> Program
*/
export const DictApp2GetApp  = (exp: Program) : Program => {
    const newProgramL32 = rewriteAllDictApp(exp); 
    return isProgram(newProgramL32) ? newProgramL32 :
    makeProgram([]); // SHOULD NEVER HAPPEN
}
    
/*
Purpose: rewrite a single DictAppExp as a GetDictAppExp.
Signature: rewriteDictApp(rator, symb)
Type: [CExp * LitExp => AppExp]
*/
const rewriteDictApp = (rator: CExp, symb: LitExp): AppExp => // symb contains the symbol key as field
    makeAppExp(makeVarRef("get"), [rator, symb]);

/*
Purpose: rewrite all occurrences of DictAppExp in an expression to GetDictAppExp.
Signature: rewriteAllDictApp(exp)
Type: [Program | Exp -> Program | Exp]
*/
export const rewriteAllDictApp = (exp: Program | Exp): Program | Exp =>
    isExp(exp) ? rewriteAllDictAppExp(exp) :
    isProgram(exp) ? makeProgram(map(rewriteAllDictAppExp, exp.exps)) :
    exp;


const rewriteAllDictAppExp = (exp: Exp): Exp =>
    isCExp(exp) ? rewriteAllDictAppCExp(exp) :
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllDictAppCExp(exp.val)) :
    exp;
    

const rewriteAllDictAppCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isLitExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteAllDictAppCExp(exp.test),
                             rewriteAllDictAppCExp(exp.then),
                             rewriteAllDictAppCExp(exp.alt)) :
    isAppExp(exp) ? handleAppExp(exp) :              
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllDictAppCExp, exp.body)) :
    isLetExp(exp) ? makeLetExp(exp.bindings.map(b => makeBinding(b.var.var, rewriteAllDictAppCExp(b.val))),
                               exp.body.map(rewriteAllDictAppCExp)) :
    exp;

const handleAppExp = (exp: AppExp): AppExp => 
    (exp.rands.length == 1 && isLitExp(exp.rands[0]) && containsDictAppExp(exp.rator)) ? 
    rewriteDictApp(exp.rator, exp.rands[0]) :
    exp;

const containsDictAppExp = (exp: CExp): boolean =>  
    isAtomicExp(exp) ? false :
    isLitExp(exp) ? false :
    isIfExp(exp) ? (containsDictAppExp(exp.then) || containsDictAppExp(exp.alt)) :
    isAppExp(exp) ? ((isVarRef(exp.rator) && exp.rator.var === "dict") || containsDictAppExp(exp.rator)):            
    isProcExp(exp) ? containsDictAppExp(exp.body[exp.body.length - 1]) :
    isLetExp(exp) ? containsDictAppExp(exp.body[exp.body.length - 1]) :
    false;

// ==============================================================

// addition for converting a program from L32 to L3
const additionString = `(L32
(define null?
  (lambda (x)
    (eq? x '())))

(define dotted-pair?
  (lambda (p)
    (and (pair? p)
         (symbol? (car p))
         (if (pair? (cdr p)) #f #t)
         (if (null? (cdr p)) #f #t))))

(define all-dotted-pairs?
  (lambda (lst)
    (if (null? lst)
        #t
        (if (dotted-pair? (car lst))
            (all-dotted-pairs? (cdr lst))
            #f))))

(define has-key
  (lambda (key keys)
    (if (null? keys)
        #f
        (if (eq? key (car keys))
            #t
            (has-key key (cdr keys))))))

(define check-duplicate-keys
  (lambda (dict keys-seen)
    (if (null? dict)
        #f
        ((lambda (key)
           (if (has-key key keys-seen)
               #t
               (check-duplicate-keys (cdr dict) (cons key keys-seen))))
         (car (car dict))))))

(define has-duplicate-keys?
  (lambda (dict)
    (check-duplicate-keys dict '())))

(define dict
  (lambda (lst)
    (if (all-dotted-pairs? lst)
        lst
        (make-error 'invalid-dict))))

(define dict?
  (lambda (lst)
    (if (all-dotted-pairs? lst)
        (if (has-duplicate-keys? lst)
            #f
            #t)
        #f)))

(define get
  (lambda (dict key)
    (if (null? dict)
        (make-error 'key-not-found)
        (if (eq? (car (car dict)) key)
            (cdr (car dict))
            (get (cdr dict) key)))))

(define make-error
  (lambda (msg)
    (cons 'error msg)))

(define is-error?
  (lambda (val)
    (if (pair? val)
        (if (eq? (car val) 'error) #t #f)
        #f)))

(define bind
  (lambda (val f)
    (if (is-error? val)
        val
        (f val))))
)`