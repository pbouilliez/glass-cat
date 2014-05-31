
/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex

%s 					comment

%%

"%".*				  /* skip comments */
\s+                   /* skip whitespace */

"~"					  return '~'

"{"                   {return 'EMBRACE';}
"}"                   {return 'UNBRACE';}

"true"                {return 'TRUE_LITERAL';}
"false"               {return 'FALSE_LITERAL';}
"NewCell"			  {return 'NEWCELL_LITERAL';}

"=<"                  {return 'OPERATOR_LESS_THAN_EQUAL';}
"<"                   {return 'OPERATOR_LESS_THAN';}
"=="                  {return 'OPERATOR_EQUAL';}
">="                  {return 'OPERATOR_GREATER_THAN_EQUAL';}
">"                   {return 'OPERATOR_GREATER_THAN';}
"\="                  {return 'OPERATOR_NOT_EQUAL';}

"*"                   return '*'
"div"                 return "div"
"mod"				  return "mod"
"-"                   return '-'
"+"                   return '+'
"/"                   return '/'
"("                   return '('
")"                   return ')'
"$"					  {return 'DOLLAR';}
"?"                   {return 'QUESTION_MARK';}
"="                   return 'OPERATOR_ASSIGNMENT'
":="                  return 'OPERATOR_CELL_ASSIGNMENT'
":"                   {return 'COLON';}
"@"					  {return 'OPERATOR_CELL_GET';}
"."                   {return 'OPERATOR_RECORD_GET';}

"skip"                {return 'KEYWORD_SKIP';}
"nil"				  {return 'KEYWORD_NIL';}
"local"				  	return 'KEYWORD_LOCAL'
"in"					return 'KEYWORD_IN'
"end"					return 'KEYWORD_END'
"if"                  {return 'KEYWORD_IF';}
"then"                {return 'KEYWORD_THEN';}
"else"                {return 'KEYWORD_ELSE';}
"case"                {return 'KEYWORD_CASE';}
"of"                  {return 'KEYWORD_OF';}
"proc"				  {return 'KEYWORD_PROC';}
"[]"       			  {return 'OPERATOR_BRACE';}


[0-9]+["."]{1}[0-9]+  return 'FLOAT'
[0-9]+([0-9]+)?\b     return 'INTEGER'
[A-Z][a-zA-Z0-9_]*    return 'IDENTIFIER'
"\"\""                {return 'STRING_LITERAL';}
"\""([^"]|{BSL})*"\"" {return 'STRING_LITERAL';}
[']*[a-z0-9\W][a-zA-Z0-9]*[']*   return 'LABEL'


<<EOF>>               return 'EOF'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' "div" '/'
%right "mod"

%start instruction

%% /* language grammar */

instruction
	: EOF
	    { throw new Error("Did you forget to write something?"); }
	| variable_creation EOF
        { var cu = new CompilationUnit(); $1.add_semantics(@1, "\{\}", 100); $1.generate_semantics(); cu.close(); return cu; }
	| KEYWORD_SKIP EOF
	    { var cu = new CompilationUnit(); var v = new VariableDeclarator('E'); v.add_semantics('', '', 99); v.add_semantics(@1, "\{\}", 100); v.generate_semantics(); cu.close(); return cu;}
	;
	
block
	: 
	  { $$=new Block(); }
	| variable_creation block
	  { $$=new Block(); 
			if(!$2.isEmpty()) {
				$$.add_semantics(@1, '', 4); 
				$2.add_semantics(@2, '', 5);
			}
			$$.eval_semantics($1.get_semantics(), $2.get_semantics());
	  }
	| KEYWORD_SKIP block
	  { $$=new Block(); 
			do_skip();
			if(!$2.isEmpty()) {
				$$.add_semantics(@1, '', 4); 
				$2.add_semantics(@2, '', 5);
			}
			$$.eval_semantics([], $2.get_semantics());
	  }	
	| if_then_statement block
	  { $$=new Block(); 
			if(!$2.isEmpty()) {
				$$.add_semantics(@1, '', 4); 
				$2.add_semantics(@2, '', 5);
			}
			$$.eval_semantics($1.get_semantics(), $2.get_semantics());
	  }
	| if_then_else_statement block
	  { $$=new Block(); 
			if(!$2.isEmpty()) {
				$$.add_semantics(@1, '', 4); 
				$2.add_semantics(@2, '', 5);
			}
			$$.eval_semantics($1.get_semantics(), $2.get_semantics());
	  }
	| smth block
	  { $$=new Block(); 
			if($2.isEmpty()) {				
				$1.add_semantics('', $1.get_value(), 2); 
			}
			else {
				$1.add_semantics(@2, $1.get_value(), 2); 
			}
			$$.eval_semantics($1.get_semantics(), $2.get_semantics());
	  }		  
	| case_of_statement block
	  { $$=new Block(); 
			if(!$2.isEmpty()) {
				$$.add_semantics(@1, '', 4); 
				$2.add_semantics(@2, '', 5);
			}
			$$.eval_semantics($1.get_semantics(), $2.get_semantics());
	  }
	| procedure_call block
	  { $$=new Block(); 
			if(!$2.isEmpty()) {
				$$.add_semantics(@1, '', 4); 
				$2.add_semantics(@2, '', 5);
			}
			$$.eval_semantics($1.get_semantics(), $2.get_semantics());
	  }
	;
	
smth
	: variable_initializer
	  { $$ = $1; }
	| cell_initializer
	  { $$ = $1; }
	| cell_getter
	;
	
/*** VARIABLE CREATION ***/

variable_creation
	: variable_use KEYWORD_END
	  { $$=$1; $1.endScope(); }
	;

variable_use
	: variable_decl block
      { $$ = $1; $1.add_semantics(@2, $1.getIdentifier(), 1);  $1.eval_semantics($1.get_semantics(), $2.get_semantics());  }
	;
	
variable_decl
	: KEYWORD_LOCAL variable_creation_id KEYWORD_IN
	  { $$ = new VariableDeclarator($2, cur_decl); }
	;

variable_creation_id
	: IDENTIFIER
	    { $$ = $1; }
	;

/*** VARIABLE INITIALIZATION ***/
	
variable_initializer
	: variable_creation_id OPERATOR_ASSIGNMENT variable_assign
	    { $$ = new VariableInitializer($1, $3, cur_decl); }
	;
	
variable_assign
	: expression
	;

/*** CELL INITIALIZATION ***/
	
cell_initializer
	: IDENTIFIER OPERATOR_CELL_ASSIGNMENT cell_assign
	    { $$ = new CellInitializer($1, $3, cur_decl); }
	;
	
cell_assign
	: expression
	;
	
cell_getter
	: OPERATOR_CELL_GET IDENTIFIER
		{ $$ = get_cell_value($2); }
	;

/*** IF THEN ***/

if_then_statement
	:  if_use KEYWORD_END
	  { $$ = $1; $1.endIf(); }
	;
	
if_use
	: if_cond block
	  { $$ = $1; $1.set_block(@2, 1);  if($1.getCondition()) { $1.add_semantics(@2, '', 4); $1.eval_semantics($1.get_semantics(), $2.get_semantics());} }
	;

if_cond
	: KEYWORD_IF IDENTIFIER KEYWORD_THEN
	  { $$ = new IfThen(new Identifier($2), cur_decl); }
	;

/*** IF THEN ELSE ***/

if_then_else_statement
	:  if_use_else KEYWORD_END
	  { $1.endIf(); }
	;
	
if_use_else
	: if_use KEYWORD_ELSE block 
	  { $$ = $1; $1.set_block(@3, 2); if(! $1.getCondition()) {cur_condition[cur_id-1]=true; $1.add_semantics(@3, '', 4); $1.eval_semantics($1.get_semantics(), $3.get_semantics());} }
	;
	
	
/*** CASE OF ***/

case_of_statement
	: case_use KEYWORD_ELSE block KEYWORD_END
	 { $$ = $1;  $1.set_block(@3, 2); if(!$1.is_it_good()){$1.add_semantics(@3, '', 5);  $1.eval_semantics($1.get_semantics(), $3.get_semantics());} $1.endIf(); }
	;

case_use
	: case_cond block
	  { $$ = $1; $1.set_block(@2, 1); if($1.is_it_good()){$1.add_semantics(@2, $1.getIdentifier(), 5);  $1.eval_semantics($1.get_semantics(), $2.get_semantics());} $$.endScope(); }
	;

case_cond
	: case_eval KEYWORD_THEN 
	;
	
case_eval
 	: KEYWORD_CASE IDENTIFIER KEYWORD_OF pattern
	  { $$ = new Case($2, $4, cur_decl); }
	;
	
pattern
	: IDENTIFIER
	  { $$ = new Pattern_Identifier($1); }
	| LABEL '(' records_list ')'
		{ $$ = new Record($1, $3); }
	;
	
	
/*** PROCEDURE ***/

formal_parameter_list
	: formal_parameter
	  { $$ = [$1]; cur_ce = get_ce(); cur_CE=jQuery.extend(true, {}, identifiers_list); cur_proc = ""; }
	| formal_parameter_list formal_parameter
	  { $$ = $1; $$.push($2); cur_ce = get_ce(); cur_CE=jQuery.extend(true, {}, identifiers_list); cur_proc = ""; }
	;
	
formal_parameter
	: IDENTIFIER
	  { $$ = new Identifier($1); }
	| QUESTION_MARK IDENTIFIER
	  { $$ = new ReturnIdentifier($2); }
	;
	
formal_parameter_list_call
	: formal_parameter_call
	  { $$ = [$1]; }
	| formal_parameter_list_call formal_parameter_call
	  { $$ = $1; $$.push($2); }
	;
	
formal_parameter_call
	: IDENTIFIER
	  { $$ = new Identifier($1); }
	;
	
procedure_call
	: EMBRACE IDENTIFIER formal_parameter_list_call UNBRACE
	  { $$ = new ProcedureCall($2, $3, @1, @4, cur_decl); }
	;

/*** EXPRESSION ***/

expression_case
	: IDENTIFIER
		{ $$ = get_identifier($1); }
	;

records_list
	: records_entry
	  { $$ = [$1]; }
	| records_list records_entry
	  { $$ = $1; $$.push($2); }
	;

records_entry	
	: LABEL COLON IDENTIFIER
	  { $$ = new Record_entry($1, new Identifier($3)); }
	| INTEGER COLON IDENTIFIER
	  { $$ = new Record_entry($1, new Identifier($3)); }
	;
	
expression
	: expression1
	   { $$ = new Expression($1); }
	| '(' expression ')'
        {$$ = new Parenthesis($2);}
	| KEYWORD_PROC EMBRACE DOLLAR formal_parameter_list UNBRACE block KEYWORD_END
	    { $$ = new Procedure($4, @1, @7, @6); $$.eval_semantics([],$6.get_semantics()); }
	| IDENTIFIER
		{ $$ = new Identifier($1); }
	| EMBRACE NEWCELL_LITERAL IDENTIFIER UNBRACE
	    { $$ = new Cell($3); }
	| TRUE_LITERAL
		{ $$ = new Parenthesis(new Expression(new Condition(new Expression(4),new Expression(4),'=='))); }
	| FALSE_LITERAL
	    { $$ = new Parenthesis(new Expression(new Condition(new Expression(4),new Expression(4),'!='))); }
	| LABEL '(' records_list ')'
		{ $$ = new Record($1, $3); }
	| KEYWORD_NIL
		{ $$ = new Keyword_nil($1);}
	| STRING_LITERAL
		{ $$ = new String_literal($1); }
	;

expression1
	: expression '+' expression
        { $$ = new MathExp($1,$3,$2); }
    | expression '-' expression
        {$$ = new MathExp($1,$3,$2); }
    | expression '*' expression
        {$$ = new MathExp($1,$3,$2); }
    | expression "div" expression
        {$$ = new MathExp($1,$3,$2); }
    | expression "mod" expression
        {$$ = new MathExp($1,$3,$2); }
	| expression '/' expression
        { $$ = new MathExp($1,$3,$2); }
	| INTEGER OPERATOR_LESS_THAN_EQUAL exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '<='); }
	| IDENTIFIER OPERATOR_LESS_THAN_EQUAL exp
	    { $$ = new Condition(new Identifier($1), $3, '<='); }
	| FLOAT OPERATOR_LESS_THAN_EQUAL exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '<='); }	
	| INTEGER OPERATOR_LESS_THAN exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '<'); }
	| IDENTIFIER OPERATOR_LESS_THAN exp
	    { $$ = new Condition(new Identifier($1), $3, '<'); }
	| FLOAT OPERATOR_LESS_THAN exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '<'); }		
	| INTEGER OPERATOR_EQUAL exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '=='); }
	| IDENTIFIER OPERATOR_EQUAL exp
	    { $$ = new Condition(new Identifier($1), $3, '=='); }
	| FLOAT OPERATOR_EQUAL exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '=='); }		
	| INTEGER OPERATOR_GREATER_THAN_EQUAL exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '>='); }
	| IDENTIFIER OPERATOR_GREATER_THAN_EQUAL exp
	    { $$ = new Condition(new Identifier($1), $3, '>='); }
	| FLOAT OPERATOR_GREATER_THAN_EQUAL exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '>='); }		
	| INTEGER OPERATOR_GREATER_THAN exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '>'); }
	| IDENTIFIER OPERATOR_GREATER_THAN exp
	    { $$ = new Condition(new Identifier($1), $3, '>'); }
	| FLOAT OPERATOR_GREATER_THAN exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '>'); }		
	| INTEGER OPERATOR_NOT_EQUAL exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '!='); }
	| IDENTIFIER OPERATOR_NOT_EQUAL exp
	    { $$ = new Condition(new Identifier($1), $3, '!='); }
	| FLOAT OPERATOR_NOT_EQUAL exp
	    { $$ = new Condition(new Expression(Number($1)), $3, '!='); }		
    | '~' expression %prec '*'
        {$$ = new Integer(-Number(yytext));}	
	| INTEGER
       { $$ = new Integer(Number(yytext)); }
	| FLOAT
       { $$ = new Float(Number(yytext)); }   
    | PI
        {$$ = Math.PI;}
	| IDENTIFIER OPERATOR_RECORD_GET LABEL
		{ $$ = new Get_entry_record($1, $3); }
	| IDENTIFIER OPERATOR_RECORD_GET INTEGER
		{ $$ = new Get_entry_record($1, $3); }
	| OPERATOR_CELL_GET IDENTIFIER
		{ $$ = new Get_cell_value($2); }
	;
	
exp
	: INTEGER
	  { $$ = new Expression(Number(yytext)); }
	| IDENTIFIER
	  { $$ = new Identifier($1); }
	| FLOAT
	  { $$ = new Expression(Number(yytext)); }	  
	;