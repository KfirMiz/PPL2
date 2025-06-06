import { Exp, Program } from './L3/L3-ast';
import { Result, makeFailure} from './shared/result';

/*
Purpose: Transform L2 AST to JavaScript program string
Signature: l2ToJS(l2AST)
Type: [EXP | Program] => Result<string>
*/

export const l2ToJS = (exp: Exp | Program): Result<string>  => 
    makeFailure("Not implemented yet");