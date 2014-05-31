/**
 * AST nodes for constructing an Abstract Syntax Tree by the parser.
 *
 */
 
var identifiers_list = new Array();
var cells_list = new Array();
var identifiers_nbr = {};
var cur_condition = {};
cur_condition[0] = true;
var proc = new Array();
var CE = new Array();
var cur_proc = "";
var cur_id = 1;					// Identifier of the current IF THEN condition
var state_decl = new Array();
var cur_decl = 0;
var infinite_loop_avoid = new Array();
var return_identifier = new Array();
var param_list = new Array();

var ASTNode = function ASTNode() {
   this.type = 'ASTNode';
   this.children = [];

   this.getType = function()
   {
       return this.type;
   }
};

ASTNode.prototype.getType = function() {
	return this.type;
};

ASTNode.prototype.appendChild = function(node) {
	this.children.push(node);
	
	return node;
};

ASTNode.prototype.toString = function() {
	var str = "ASTNode of type "+this.type+" with "+this.children.length+" children";
	
	return str;
};

/**
 * Create a node for a compilation unit, the root of a Glass Cat AST.
 */

var CompilationUnit = function CompilationUnit() {
    this.type = 'CompilationUnit';
    this.children = [];
};

CompilationUnit.prototype.close = function () {
	identifiers_list = {};
	identifiers_nbr = {};
	cur_condition = {};
	cur_condition[0] = true;
	cur_id = 1;	
}

/*** -------------- NODES -------------- ***/

/* Block */

var Block = function() {
	this.type = 'Block';
	this.semantic = new Array();
};

Block.prototype.isEmpty = function() {
	return this.semantic.length==0;
}

Block.prototype.add_semantics = function(state_loc, stack, type) {
	var sem = new Object();
	sem.state_loc = state_loc;
	sem.stack = stack;
	sem.type = type;
	this.semantic.push(sem);
	
	
	
	
	
};

Block.prototype.eval_semantics = function(left, right) {
	var sem = [];
	sem = this.semantic.concat.apply(sem, this.semantic);
	
	var right_2 = [];
	right_2 = right_2.concat.apply(right_2, right);
	
	var left_2 = [];
	left_2 = left_2.concat.apply(left_2, left);
	
	this.semantic = new Array();
	this.semantic.push(right_2.concat(left_2).concat(sem));
	
};

Block.prototype.get_semantics = function() {
	return this.semantic;
};

function do_skip() {
	cur_proc+="do_skip(); this.add_semantics('skip','',99);"
}


/* Variables */

var VariableDeclarator = function(identifier, cur_decl_local) {
	
	this.type = 'VariableDeclarator';
	this.semantic = new Array();
	this.decl_nbr = cur_decl_local;
	cur_decl++;
	
	if(identifier.indexOf("_")>-1) {
		throw new Error("Identifiers <code>"+identifier+"</code> can't contain underscore.")
	}
	
	// must be declared
	if(typeof identifiers_nbr[identifier]=='undefined') {
		
		identifiers_nbr[identifier] = 0;
		this.identifier = identifier;
	}
	else {
		
		identifiers_nbr[identifier]+=1;
		new_value = identifiers_nbr[identifier];
		this.identifier = identifier+'_'+new_value;
		
	}
	identifiers_list[this.identifier]='';
	
	cur_proc+="new VariableDeclarator('"+identifier+"',"+this.decl_nbr+");";
	
	if(typeof state_decl[this.decl_nbr] != 'undefined' && state_decl[this.decl_nbr].state_loc!="") {
		var prev = new Object();
		prev.first_column = state_decl[this.decl_nbr].state_loc.first_column;
		prev.last_column = state_decl[this.decl_nbr].state_loc.last_column;
		prev.first_line = (state_decl[this.decl_nbr].state_loc.first_line)-1;
		prev.last_line = (state_decl[this.decl_nbr].state_loc.last_line)+1;
		//cur_proc+="this.add_semantics("+JSON.stringify(prev)+",'', 1);";
		cur_proc+="this.add_semantics("+JSON.stringify(state_decl[this.decl_nbr].state_loc)+",'"+this.identifier.toLowerCase()+"', 1);";
	}
	
};

/*function do_end_var(id) {
	// supprimer la variable du store
	// decrease le nbr identifiers
	delete identifiers_list[get_last(id)];
	identifiers_nbr[get_last(id).substring(0,get_last(id).indexOf('_'))] -=1;
	
	cur_proc+="do_end_var(id);";
}*/

VariableDeclarator.prototype.getIdentifier = function() {
	if(typeof this.identifier=='undefined') {
		return '';
	}
	return this.identifier.toLowerCase();
};

VariableDeclarator.prototype.endScope = function() {
	delete identifiers_list[this.identifier];
	
	//do_end_var(this.identifier);
};

VariableDeclarator.prototype.add_semantics = function(state_loc, stack, type) {
	var sem = new Object();
	sem.state_loc = state_loc;
	sem.stack = stack;
	sem.type = type;
	this.semantic.push(sem);
	state_decl[this.decl_nbr] = sem;
	
	
	
	
	
	
	
};

VariableDeclarator.prototype.get_semantics = function() {
	return this.semantic;
};

VariableDeclarator.prototype.eval_semantics = function(left, right) {
	var sem = [];
	sem = this.semantic.concat.apply(sem, this.semantic);
	
	var right_2 = [];
	right_2 = right_2.concat.apply(right_2, right);
	
	var left_2 = [];
	left_2 = left_2.concat.apply(left_2, left);
	
	this.semantic = new Array();
	this.semantic.push(right_2.concat(left_2));
	
};


VariableDeclarator.prototype.generate_semantics = function() {
	
	
	var sem = [];
	sem = sem.concat.apply(sem, this.semantic);
	
	
	
	var sem_length = sem.length;
	var state_loc;
	var stack;
	var type;
	// this.semantic = [state_loc, stack, type]
	
	var lines = editor.getValue().split('\n');
	var state;
	var tmp;
	
	for(var i=0; i<sem_length; i++) {
		state = "";
		state_loc = sem[i].state_loc;
		stack = sem[i].stack;
		type = sem[i].type;
		
		
		if(state_loc != '') {
			for(var j=state_loc.first_line-1; j<state_loc.last_line; j++) {
				tmp = lines[j].replace("<","&lt");
				tmp = tmp.replace(">","&gt");
				state += ("<p>"+tmp.split(' ').join("&nbsp")+"</p>");
			}
		}
		
		
		if(cnt_exe == 0) {
			states[cnt_exe] = '<fieldset id="state_'+cnt_exe+'" class="hero-unit"><legend>'+(sem_length-cnt_exe)+'</legend><p>DONE !</fieldset>';
		}
		else {
			states[cnt_exe] = '<fieldset id="state_'+cnt_exe+'" class="hero-unit"><legend>'+(sem_length-cnt_exe)+'</legend><div class="scrollable">'+state+'</div></fieldset>';
		}
				
		stacks[cnt_exe] = [stack, type];
		//
		cnt_exe++;
	}
}

/*** VARIABLE INITIALIZER ***/

function deep_value(value) {
	var ret = value;
	while(typeof ret.get_value() == 'object' && ret.type != 'Condition') {
		ret = ret.get_value();
	}
	return ret;
}

var VariableInitializer = function(identifier, value, cur_decl_local) {
	this.type = 'VariableInitializer';
	this.identifier = identifier;
	this.value = value;
	this.semantic = new Array();
	this.is_cell = false;
	
	this.decl_nbr = cur_decl_local;
	cur_decl++;
	
	if(identifiers_nbr[identifier]>0) {
		this.identifier = get_last(identifier);
	}
	
	if(value.get_type() == 'Cell') {
		this.is_cell = true;
	}
	
	else if(value.get_type() == 'Procedure') {
		value.set_id(identifier);
	}

	if(identifiers_list[this.identifier]=='') {
		identifiers_list[this.identifier] = this.value;
		
	}
	else if(typeof identifiers_list[this.identifier]=='undefined') {
		
		throw new Error("Identifier <code>"+this.identifier+"</code> is not declared.");
	}
	else {
			
		a = cur_proc.indexOf("else");
		if(a>-1) {
			b = cur_proc.substring(a,cur_proc.length);
			if(b.indexOf("new VariableInitializer('"+this.identifier+"'")>-1) {
				throw new Error("Identifier <code>"+this.identifier+"</code> has already a value.");	
			}
		} else if(return_identifier.indexOf(this.identifier) == -1 ) {
			throw new Error("Identifier <code>"+this.identifier+"</code> has already a value.");	
		} 
	}
	
	if(value.get_type() == 'Identifier') {
		
		cur_proc+="new VariableInitializer('"+identifier+"', new "+value.get_type()+"('"+value.get_id()+"'),"+this.decl_nbr+");";
		if(typeof value.get_value() != 'undefined' && value.get_value() != '' && typeof state_decl[this.decl_nbr] != 'undefined') {
			cur_proc+="this.add_semantics("+JSON.stringify(state_decl[this.decl_nbr].state_loc)+",'"+this.identifier.toLowerCase()+" = "+identifiers_list[get_last(value.get_id())].get_value().value+"', 2);"
		}
	}
	else {
		dp_value = deep_value(value);
		if(dp_value.get_type() == 'Condition' && value.get_type() != "Parenthesis") {
			throw new Error("Identifier <code>"+this.identifier+"</code> is a condition, it requires parenthesis.");
		}
		if((value.get_type() == 'Expression' || value.get_type() == "Parenthesis")  && typeof value.get_value()=='object') {
			
			if(value.get_value().get_type() == 'MathExp' || dp_value.get_type() == 'Condition' || dp_value.get_type() == 'Get_entry_record' || dp_value.type == 'Integer' || dp_value.type == 'Float') {
				
				
				cur_proc+="new VariableInitializer('"+identifier+"', new "+value.get_type()+"("+value.get_value().get_proc_ret()+"),"+this.decl_nbr+");";
						
				
				if(typeof value.get_value().get_value() != 'undefined' && typeof state_decl[this.decl_nbr] != 'undefined') {
					if(dp_value.get_type() == 'Condition') {
						cur_proc+="this.add_semantics("+JSON.stringify(state_decl[this.decl_nbr].state_loc)+",'"+this.identifier.toLowerCase()+" = "+dp_value.get_value()+"', 2);";
					}
					else {
						cur_proc+="this.add_semantics("+JSON.stringify(state_decl[this.decl_nbr].state_loc)+",'"+this.identifier.toLowerCase()+" = "+value.get_value().get_value()+"', 2);";
					}	
				}
			}			
		}
		else if(value.get_type() == 'Cell') {
			cur_proc+="new VariableInitializer('"+identifier+"', new "+value.get_type()+"('"+value.get_value().get_id()+"'),"+this.decl_nbr+");";
			if(typeof value.get_value() != 'undefined' && typeof state_decl[this.decl_nbr] != 'undefined') {
				cur_proc+="this.add_semantics("+JSON.stringify(state_decl[this.decl_nbr].state_loc)+",'"+this.identifier.toLowerCase()+" = "+value.get_id()+"', 2);";
			}
		}
		else if(value.get_type() == 'Record') {
			cur_proc+="new VariableInitializer('"+identifier+"', new "+value.get_type()+"("+value.get_proc_ret()+"),"+this.decl_nbr+");";
			if(typeof value.get_value() != 'undefined' && typeof state_decl[this.decl_nbr] != 'undefined') {
				cur_proc+="this.add_semantics("+JSON.stringify(state_decl[this.decl_nbr].state_loc)+",'"+this.identifier.toLowerCase()+" = "+value.get_value()+"', 2);";
			}
		}
		else {
			var a = "'"+value.get_value()+"'";
			if(typeof value.get_value() == 'number') {
				a = value.get_value();
			}
					
			cur_proc+="new VariableInitializer('"+identifier+"', new "+value.get_type()+"("+a+"),"+this.decl_nbr+");";
			if(typeof value.get_value() != 'undefined' && typeof state_decl[this.decl_nbr] != 'undefined') {
				cur_proc+="this.add_semantics("+JSON.stringify(state_decl[this.decl_nbr].state_loc)+",'"+this.identifier.toLowerCase()+" = "+value.get_value()+"', 2);";
			}
		}	
		
	}
	
	
};

VariableInitializer.prototype.get_value = function() {
	var val = this.value;
	
	if(typeof this.identifier=='undefined') {
		return '';
	}
	
	while(typeof val=='object') {
		if(val.get_type() == 'Cell') {
			val = val.get_id();
		}
		else {
			val = val.get_value();
		}		
	}
	
	
	
	return this.identifier.toLowerCase()+" = "+val;
};

VariableInitializer.prototype.getIdentifier = function() {
	if(typeof this.identifier=='undefined') {
		return '';
	}
	return this.identifier.toLowerCase();
};

VariableInitializer.prototype.add_semantics = function(state_loc, stack, type) {
	var sem = new Object();
	sem.state_loc = state_loc;
	sem.stack = stack;
	sem.type = type;
	this.semantic.push(sem);
	state_decl[this.decl_nbr] = sem;
	
	
	
	
	
};

VariableInitializer.prototype.get_semantics = function() {
	return this.semantic;
};


function set_identifier(identifier) {
	if(typeof identifiers_list[identifier]!='undefined') {
		return identifiers_list[identifier];
	}
	else {
		
		return '';
	}
}

function get_identifier(identifier) {
	if(typeof identifiers_list[identifier]!='undefined') {
		return identifiers_list[identifier];
	}
	else {
		
		return '';
	}
}

var GetIdentifierValue = function(identifier) {
	var id = identifier;
	
	/*if(identifiers_list[id]=='') {
		// identifier not linked
		AbortJavaScript();
	}
	else */if(typeof identifiers_list[id]!='undefined') {
		return identifiers_list[id];
	}
	else {
		
	}
};


/*** CELL INITIALIZER ***/

function update(list, value) {
	var index = is_value_in_array(cells_list, value[0]);
	
	if(index>-1) {
		list.splice(index, 1, value);		
	}
	else {
		list.store.push(value);
	}
}

var CellInitializer = function(identifier, value, cur_decl_local) {
	this.type = 'CellInitializer';
	this.identifier = identifier;
	this.value = value;
	this.semantic = new Array();
	this.is_cell = false;
	
	this.decl_nbr = cur_decl_local;
	cur_decl++;
	
	if(identifiers_nbr[identifier]>0) {
		this.identifier = identifier+'_'+identifiers_nbr[identifier];
	}
	
	if(value.get_type() == 'Cell') {
		this.is_cell = true;
	}
	
	cells_list.push([identifiers_list[this.identifier].get_id(), this.value]);
	
	
	if(typeof identifiers_list[this.identifier]!='undefined') {
		identifiers_list[this.identifier].update(this.value);
		
	}
	else { 
		
	}
	
	if(value.get_type() == 'Identifier') {
		
		cur_proc+="new CellInitializer('"+identifier+"', new "+value.get_type()+"('"+value.get_id()+"'),"+this.decl_nbr+");";
		if(typeof value.get_value()!= 'undefined' && typeof state_decl[this.decl_nbr] != 'undefined') {
			cur_proc+="this.add_semantics("+JSON.stringify(state_decl[this.decl_nbr].state_loc)+",'"+identifiers_list[this.identifier].get_id()+" := "+value.get_id()+"', 2);"
		}
	}	
		
	
};

CellInitializer.prototype.get_value = function() {
	var val = this.value;
	
	if(typeof this.identifier=='undefined') {
		return '';
	}
	
	while(typeof val=='object') {
		if(val.get_type() == 'Cell') {
			val = val.get_id();
		}
		else {
			val = val.get_value();
		}		
	}
	
	
	
	
	return identifiers_list[this.identifier.toUpperCase()].get_id()+" := "+this.value.get_id();
};

CellInitializer.prototype.getIdentifier = function() {
	if(typeof this.identifier=='undefined') {
		return '';
	}
	return this.identifier.toLowerCase();
};

CellInitializer.prototype.add_semantics = function(state_loc, stack, type) {
	var sem = new Object();
	sem.state_loc = state_loc;
	sem.stack = stack;
	sem.type = type;
	this.semantic.push(sem);
	state_decl[this.decl_nbr] = sem;
	
	
	
	
	
};

CellInitializer.prototype.get_semantics = function() {
	return this.semantic;
};


//regarder si l'id appartient a la liste des cell et si oui changer la valeur
function set_cell_value(id, value) {
	
	if(cells_list.indexOf(id) !=-1) {
		identifiers_list[id] = value;
	} 
	
}

var Get_cell_value = function(id) {
	this.type = 'Get_cell_value';
	var id_2 = id;
	if(identifiers_nbr[id]>0) {
		id_2 = id+'_'+identifiers_nbr[id];
	}
	this.id = id_2;
	id_2 = id_2.toLowerCase();
	
	
	var index = is_value_in_array(cells_list,identifiers_list[this.id].get_id());
	
	if(index>-1) {
		
		this.value = identifiers_list[get_last_init(cells_list[index][1].get_id())];
	}
};

Get_cell_value.prototype.get_type = function() {
	return this.type;
};

Get_cell_value.prototype.get_id = function() {
	return this.id;
};

Get_cell_value.prototype.get_value = function() {
	return this.value;
};

Get_cell_value.prototype.get_proc_ret = function() {
	return "new Get_cell_value('"+this.id+"')";
};

/*** CONDITION ***/

var Condition = function(left, right, operator) {
	this.l = left;
	this.r = right;
	this.operator = operator;
	this.type = "Condition";
};

Condition.prototype.get_type = function() {
	return this.type;
};

Condition.prototype.get_proc_ret = function() {
	var a = this.l.get_value();
	var b = this.r.get_value();
	if(this.l.get_type() == 'Identifier') {
		a = "'"+this.l.get_id()+"'";
	}
	if(this.r.get_type() == 'Identifier') {
		b = "'"+this.r.get_id()+"'";
	}
	return "new Condition(new "+this.l.get_type()+"(get_last_if("+a+")),new "+this.r.get_type()+"(get_last_if("+b+")),'"+this.operator+"')";
};

Condition.prototype.get_value = function() {
	if(typeof this.l.get_value() == 'undefined' || typeof this.r.get_value() == 'undefined') {		
		return 'undefined';
	}
	var left = this.l.get_value();
	var right = this.r.get_value();
	
	if(this.l.get_type() == 'Identifier' && typeof identifiers_list[get_last(this.l.get_id())] != 'undefined') {
		left = left.value;
	}
	else if(typeof left != 'number' && left.get_value() != 'undefined' && left.get_type() == 'Get_cell_value') {
		left = left.get_value().get_value();
		
	}
	if(this.r.get_type() == 'Identifier' && typeof identifiers_list[get_last(this.r.get_id())] != 'undefined') {
		right = right.value;
	}
	else if(typeof right != 'number' && typeof right.get_value() != 'undefined' && right.get_type() == 'Get_cell_value') {
		right = right.get_value().get_value();
		
	}
	switch(this.operator) {
	case "<=":
		this.value = left<= right;
		break;
	case "<":
		this.value = left < right;
		break;
	case "==":
		this.value = left == right;
		break;
	case ">=":
		this.value = left >= right;
		break;
	case ">":
		this.value = left > right;
		break;
	case "!=":
		this.value = left != right;
		break;
	}
	return this.value;
};


/*** IF THEN ***/

var IfThen = function(condition, cur_decl_local) {
	var dp_value = deep_value(condition);
	if(typeof dp_value.get_type() != 'undefined' && dp_value.get_type() != 'Condition') {
		throw new Error("In <code>if</code>: The identifier <code>"+condition.get_id()+"</code> must be a condition.");
	}
	
	this.type = 'IfThen';
	this.id = cur_id;
	if(condition.get_value() != "") {
		cur_condition[this.id] = condition.get_value().get_value().get_value();
	}
	
	this.condition = condition.get_value();
	cur_id++;
	this.semantic = new Array();
	this.cur_decl = cur_decl_local;
	cur_decl++;
	this.cur_decl_else = cur_decl_local+1;
	cur_decl++;
	
	cur_proc += "new IfThen(new Identifier('"+condition.get_id()+"'), "+cur_decl_local+");";
	if(typeof this.condition.value.value == 'undefined') {
		cur_proc += "if(identifiers_list[get_last_if('"+condition.get_id()+"')].get_value().get_value().get_value()){";	
	}
	else {
		cur_proc += "if("+this.condition.value.value+"){";
	}
	
	if(typeof state_decl[this.cur_decl] != 'undefined') {
		cur_proc += "this.add_semantics("+JSON.stringify(state_decl[this.cur_decl])+",'',6);";
	}
};

IfThen.prototype.getCondition = function() {
	if(this.condition == "") {
		return true;
	}
	if(this.condition.get_value().get_value() != 'undefined') {
		return this.condition.get_value().get_value();
	}
	return this.condition.get_value();
};

IfThen.prototype.set_block = function(state_loc, type) {
	if(type == 1) {
		state_decl[this.cur_decl] = state_loc;
		new Gen_cur_proc_if(this.cur_decl, type);
	}
	else {
		state_decl[this.cur_decl_else] = state_loc;
	}
};

var Gen_cur_proc_if = function(cur_decl, type) {
	cur_proc += "new Gen_cur_proc_if("+cur_decl+","+type+");";

	if(typeof state_decl[cur_decl+type-1] != 'undefined') {
		//cur_proc += "this.add_semantics("+JSON.stringify(state_decl[cur_decl+type-1])+",'',6);";
	}
	if(type == 1) {
		cur_proc += "do_end();}else{"; //TODO problem with the number of } (prob: at every step, increase step)
		cur_proc += "new Gen_cur_proc_if("+cur_decl+",1);";
		if(typeof state_decl[cur_decl+1] != 'undefined') {
			cur_proc += "this.add_semantics("+JSON.stringify(state_decl[cur_decl+1])+",'',6);";
		}
	}
};

function do_end() {
	cur_proc += "do_end();}"
}

IfThen.prototype.endIf = function() {
	cur_condition[this.id] = true;
	
	do_end();
};

IfThen.prototype.set_state_loc = function(state_loc) {
	this.state_loc = state_loc;
};

IfThen.prototype.get_state_loc = function() {
	return this.state_loc;
};

IfThen.prototype.add_semantics = function(state_loc, stack, type) {
	var sem = new Object();
	sem.state_loc = state_loc;
	sem.stack = stack;
	sem.type = type;
	this.semantic.push(sem);
	
	
	
	
	
};

IfThen.prototype.get_semantics = function() {
	return this.semantic;
};

IfThen.prototype.eval_semantics = function(left, right) {
	var right_2 = [];
	right_2 = right_2.concat.apply(right_2, right);
	
	var left_2 = [];
	left_2 = left_2.concat.apply(left_2, left);
	
	this.semantic = new Array();
	this.semantic.push(right_2.concat(left_2));
	
};

/*** CASE ***/

var Gen_cur_proc_case = function(cur_decl, type) {
	cur_proc += "new Gen_cur_proc_case("+cur_decl+","+type+");";

	if(typeof state_decl[cur_decl+type-1] != 'undefined') {
		//cur_proc += "this.add_semantics("+JSON.stringify(state_decl[cur_decl+type-1])+",'',7);";
	}
	if(type == 1) {
		cur_proc += "do_end();}else{"; 
		cur_proc += "new Gen_cur_proc_case("+cur_decl+",1);";
		if(typeof state_decl[cur_decl+1] != 'undefined') {
			cur_proc += "this.add_semantics("+JSON.stringify(state_decl[cur_decl+1])+",'',7);";
		}
	}
};


// input: an identifier and a pattern
function is_good_pattern(id, pattern) {
	var record = identifiers_list[get_last(id)];
	
	
	if(record.type == 'Expression' && pattern.type == 'Identifier') {
		var identifier = pattern.identifier;
		if(typeof identifiers_list[identifier]=='undefined' || identifiers_list[identifier]=="") {			
			
			identifiers_nbr[identifier] = 0;
		}
		else {
			
			identifiers_nbr[identifier]+=1;
			new_value = identifiers_nbr[identifier];
			identifier = identifier+'_'+new_value;
			
		}
		
		identifiers_list[identifier] = identifiers_list[get_last(id)];
		return true;
	}
	
	if(record.label != pattern.label) {
		return false;
	}
	if(record.entries.length != pattern.entries.length) {
		return false;
	}
	
	for(var i=0; i<record.entries.length ; i++) {
		if(record.entries[i].feature != pattern.entries[i].feature) {
			return false
		}
		else {
			var identifier = pattern.entries[i].id.id;
			if(typeof identifiers_list[identifier]=='undefined') {			
				
				identifiers_nbr[identifier] = 0;
			}
			else {
				
				identifiers_nbr[identifier]+=1;
				new_value = identifiers_nbr[identifier];
				identifier = identifier+'_'+new_value;
				
			}
			pattern.entries[i].id = record.entries[i].id;
			identifiers_list[identifier] = record.entries[i].id;
		}
	}
	return true;
}

function generate_identifier(id, pattern) {	
	if(typeof identifiers_list[get_last(id)] != 'undefined') {
		if(pattern.type == 'Identifier' && identifiers_list[get_last(id)].type != 'Record') {
			if(identifiers_list[get_last(id)].value.type == 'Integer' || identifiers_list[get_last(id)].value.type == 'Float') {
				return [pattern.identifier + " = " + identifiers_list[get_last(id)].value.value];
			}
		}
		
		if(pattern.type == 'Record' && identifiers_list[get_last(id)].type == 'Record') {
			var record = identifiers_list[get_last(id)];
			var ret = [];
			for(var i=0; i<pattern.entries.length; i++) {
				if(typeof record.entries[i].id.value == 'object') {
					ret.push(pattern.entries[i].id.id + " = " + record.entries[i].id.value.value);
				}
				else {
					ret.push(pattern.entries[i].id.id + " = " + record.entries[i].id.value);
				}
				
			}
			return ret;
		}
	}
	return '';
}

var Case = function(identifier, pattern, cur_decl_local) {
	this.identifier = generate_identifier(identifier, pattern);
	this.type = 'Case';
	this.semantic = new Array();	
	this.pattern = pattern;
	
	if(typeof identifiers_list[get_last(identifier)] != 'undefined') {
		this.is_good = is_good_pattern(identifier, pattern);
	}
	
	this.semantic = new Array();
	this.cur_decl = cur_decl_local;
	cur_decl++;
	this.cur_decl_else = cur_decl_local+1;
	cur_decl++;
	
	cur_proc += "new Case('"+identifier+"', "+JSON.stringify(pattern)+","+cur_decl_local+");";
	cur_proc += "if(is_good_pattern('"+identifier+"',"+JSON.stringify(pattern)+")){";
	if(typeof state_decl[this.cur_decl] != 'undefined') {
		cur_proc += "this.add_semantics("+JSON.stringify(state_decl[this.cur_decl])+",'',7);";
	}
};

Case.prototype.is_it_good = function() {
	return this.is_good;
};

Case.prototype.set_block = function(state_loc, type) {
	if(type == 1) {
		state_decl[this.cur_decl] = state_loc;
		new Gen_cur_proc_case(this.cur_decl, type);
	}
	else {
		state_decl[this.cur_decl_else] = state_loc;
	}
};

Case.prototype.endIf = function() {
	cur_condition[this.id] = true;
	
	do_end();
};

Case.prototype.set_state_loc = function(state_loc) {
	this.state_loc = state_loc;
};

Case.prototype.get_state_loc = function() {
	return this.state_loc;
};

Case.prototype.add_semantics = function(state_loc, stack, type) {
	var sem = new Object();
	sem.state_loc = state_loc;
	sem.stack = stack;
	sem.type = type;
	this.semantic.push(sem);
	
	
	
	
	
};

Case.prototype.get_semantics = function() {
	return this.semantic;
};

Case.prototype.eval_semantics = function(left, right) {
	var sem = [];
	sem = this.semantic.concat.apply(sem, this.semantic);
	
	var right_2 = [];
	right_2 = right_2.concat.apply(right_2, right);
	
	var left_2 = [];
	left_2 = left_2.concat.apply(left_2, left);
	
	this.semantic = new Array();
	this.semantic.push(right_2.concat(left_2));
	
};

Case.prototype.getIdentifier = function() {
	return this.identifier;
};

Case.prototype.endScope = function() {
	delete identifiers_list[this.identifier];
};

/** 
 * 
 *     PATTERN 
 *
 **/

var Pattern_Expression = function(value) {
	this.type = 'Expression';
	this.id = id;	
};

Pattern_Expression.prototype.get_type = function() {
	return this.type;
};

Pattern_Expression.prototype.get_id = function() {
	return this.id;
};

Pattern_Expression.prototype.set_expression = function(exp) {
	console.debug("\t\t\t ----------- I M IN SET EXPRESSION ")
    new VariableInitializer(this.id,new Expression(exp.get_value()));
};

var Pattern_Parentheses = function(value) {
	this.type = 'Parentheses'+"_"+value.get_type();
	this.value = value;
	this.identifier = value.get_id();
}

Pattern_Parentheses.prototype.get_type = function() {
	 return this.type;
};

Pattern_Parentheses.prototype.get_value = function() {
	return this.value;
};

var Pattern_Identifier = function(identifier) {
	this.type = 'Identifier';
	this.identifier = identifier;
	
	// must be declared
	if(typeof identifiers_list[identifier]=='undefined') {
		
		identifiers_list[identifier]='';
	}
	else {
		
	}
	
};

Pattern_Identifier.prototype.get_type = function() {
	return this.type;
};

Pattern_Identifier.prototype.get_id = function() {
	return this.identifier;
};

Pattern_Identifier.prototype.set_expression = function(exp) {
	console.debug("\t\t\t ----------- I M IN SET EXPRESSION ")
    new VariableInitializer(this.identifier,new Expression(exp.get_value()));
};

var Pattern_List = function(identifier, identifier2) {
	this.type = 'List';
	this.identifier = [identifier, identifier2];
	
	new VariableDeclarator(identifier);
	new VariableDeclarator(identifier2);
	
};

Pattern_List.prototype.get_type = function() {
	return this.type;
};

Pattern_List.prototype.get_id = function() {
	return this.identifier;
};

Pattern_List.prototype.set_expression = function(exp) {
	console.debug("\t\t\t ----------- I M IN SET EXPRESSION ")
	this.value = exp.get_value();
    new VariableInitializer(this.identifier[0],new Expression(exp.get_a()));
	new VariableInitializer(this.identifier[1],new Expression(exp.get_b())); //TODO: generate_list for recursion
};


/*** EXPRESSION ***/

var Expression = function(value) {
	this.type = 'Expression';
	this.value = value;	
};

Expression.prototype.get_type = function() {
	return this.type;
};

Expression.prototype.get_value = function() {
	return this.value;
};

Expression.prototype.get_proc_ret = function() {
	return "new Expression("+this.value.get_proc_ret()+")";
};

var String_literal = function(value) {
	this.type = 'String';
	this.value = value;
};

String_literal.prototype.get_type = function() {
	return this.type;
};

String_literal.prototype.get_value = function() {
	return this.value;
};

String_literal.prototype.get_proc_ret = function() {
	return "new String_literal("+this.value+")";
};

var Keyword_nil = function(value) {
	this.type = 'Nil';
	this.value = value;
};

Keyword_nil.prototype.get_type = function() {
	return this.type;
};

Keyword_nil.prototype.get_value = function() {
	return this.value;
};

Keyword_nil.prototype.get_proc_ret = function() {
	return "new Keyword_nil("+this.value+")";
};

var MathExp = function(l,r, operator) {
	this.type = 'MathExp';
	this.l = l;	
	this.r = r;
	this.operator = operator;
	/*if(this.l.get_type() == 'Identifier' && typeof identifiers_list[this.l.get_id()] == 'undefined') {
		throw new Error("Identifier <code>"+this.l.get_id()+"</code> not declared.");
	}
	if(this.r.get_type() == 'Identifier' &&typeof identifiers_list[this.r.get_id()] == 'undefined') {
		throw new Error("Identifier <code>"+this.r.get_id()+"</code> not declared.");
	}*/
};

MathExp.prototype.get_type = function() {
	return this.type;
};

//TODO make generic
MathExp.prototype.get_proc_ret = function() {
	
	var a = this.l.get_value();
	var a1 = "";
	var b = this.r.get_value();
	
	
	
	/*if(a == '' && b == '' && param_list.indexOf(this.l.id)==-1 && param_list.indexOf(this.r.id)==-1) {
		throw new Error("Identifiers <code>"+this.l.get_id()+"</code> AND <code>"+this.r.get_id()+"</code> are not mapped before the creation of the procedure value.");
	}
	else if(a == '' && param_list.indexOf(this.l.id)==-1) {
		throw new Error("Identifier <code>"+this.l.get_id()+"</code> is not mapped before the creation of the procedure value.");
	}
	else if(typeof b == '' && param_list.indexOf(this.r.id)==-1) {
		throw new Error("Identifier <code>"+this.r.get_id()+"</code> is not mapped before the creation of the procedure value.");
	}*/

		if(a == '' || b == '') {
			return "new MathExp(new "+this.l.get_type()+"('"+this.l.id+"'),new "+this.r.get_type()+"('"+this.r.id+"'),'"+this.operator+"')";
		}
		if(typeof a != 'undefined' && typeof a!='number') {
			if(a.get_type() == 'Identifier') {
				a = "'"+this.l.get_id()+"'";
			}
			else if(a.get_type() == 'Get_cell_value') {
				a = a.get_proc_ret();
			}
		}
		if(this.l.get_type() == 'Identifier') {
			a = "'"+this.l.get_id()+"'";
		} 
		else if(a.type == 'Integer' || a.type == 'Float') {
			a = "new "+a.type+"("+a.value+")";
		}
		
		if(typeof b != 'undefined' && typeof b!='number') {
			if(b.get_type() == 'Identifier') {
				b = "'"+this.r.get_id()+"'";
			}
			else if(b.get_type() == 'Get_cell_value') {
				b = b.get_proc_ret();
			}
		}
		if(this.r.get_type() == 'Identifier') {
			b = "'"+this.r.get_id()+"'";
		} 
		else if(b.type == 'Integer' || b.type == 'Float') {
			b = "new "+b.type+"("+b.value+")";
		}
		
		
	
	return "new MathExp(new "+this.l.get_type()+"("+a+"),new "+this.r.get_type()+"("+b+"),'"+this.operator+"')";
};

MathExp.prototype.get_value = function() {
	if(typeof this.l.get_value() == 'undefined' || typeof this.r.get_value() == 'undefined') {
		return 'undefined';
	}
	
	var left = this.l.get_value();
	var right = this.r.get_value();
	
	if(this.l.get_type() == 'Identifier' && typeof identifiers_list[get_last(this.l.get_id())] != 'undefined') {
		left = identifiers_list[get_last(this.l.get_id())].get_value();
	}
	else if(typeof left != 'number' && left.get_value() != 'undefined' && left.get_type() == 'Get_cell_value') {
		left = left.get_value().get_value();
		
	}
	if(this.r.get_type() == 'Identifier' && typeof identifiers_list[get_last(this.r.get_id())] != 'undefined') {
		right = identifiers_list[get_last(this.r.get_id())].get_value();
	}
	else if(typeof right != 'number' && typeof right.get_value() != 'undefined' && right.get_type() == 'Get_cell_value') {
		right = right.get_value().get_value();
		
	}
	switch(this.operator) {
	case "+":
		if(left.type != right.type) {
			throw new Error("The <code>+</code> operation can only work with 2 Integers or 2 Floats.");
		}
		this.value = left.value + right.value;
		break;
	case "-":
		if(left.type != right.type) {
			throw new Error("The <code>-</code> operation can only work with 2 Integers or 2 Floats.");
		}
		this.value = left.value - right.value;
		break;
	case "*":
		if(left.type != right.type) {
			throw new Error("The <code>*</code> operation can only work with 2 Integers or 2 Floats.");
		}
		this.value = left.value * right.value;
		break;
	case "/":
		if(left.type != 'Float' && right.type != 'Float') {
			throw new Error("The <code>/</code> operation can only work with Floats.");
		}
		this.value = left.value / right.value;
		break;
	case "div":
		if(left.type != 'Integer' && right.type != 'Integer') {
			throw new Error("The <code>div</code> operation can only work with Integer.");
		}
		this.value = Math.floor(left.value / right.value);
		break;
	case "mod":
		if(left.type != 'Integer' && right.type != 'Integer') {
			throw new Error("The <code>mod</code> operation can only work with Integer.");
		}
		this.value = left.value % right.value;
		break;
	}
	return this.value;
};

var Parenthesis = function(value) {
	this.type = 'Parenthesis';
	this.value = value;	
};

Parenthesis.prototype.get_type = function() {
	return this.type;
};

Parenthesis.prototype.get_value = function() {
	return this.value;
};

var Integer = function(value) {
	this.type = 'Integer';
	this.value = value;	
};

Integer.prototype.get_type = function() {
	return this.type;
};

Integer.prototype.get_value = function() {
	return this.value;
};

Integer.prototype.get_proc_ret = function() {
	return "new Integer("+this.value+")";
};

var Float = function(value) {
	this.type = 'Float';
	this.value = value;	
};

Float.prototype.get_type = function() {
	return this.type;
};

Float.prototype.get_value = function() {
	return this.value;
};

Float.prototype.get_proc_ret = function() {
	return "new Float("+this.value+")";
};

var Identifier = function(id, value) {
	this.type = 'Identifier';
	this.id = id;	
	if(typeof value == 'undefined') {
		
		if(identifiers_list[get_last(id)] != "" && typeof identifiers_list[get_last(id)] != 'undefined') {
			this.value = identifiers_list[get_last(id)].get_value();
		}
		else {
			this.value = identifiers_list[get_last(id)];
			/*if(typeof this.value == 'undefined') {
				throw new Error("Identifier <code>"+id+"</code> is not declared or not initialized.")
			}*/
		}
	}
	else {
		this.value = value;
	}
	
	
};

Identifier.prototype.get_type = function() {
	return this.type;
};

Identifier.prototype.get_id = function() {
	return this.id;
};

Identifier.prototype.get_value = function() {
	return this.value;
};

var ReturnIdentifier = function(id) {
	this.type = 'ReturnIdentifier';
	this.id = id;	
	if(typeof value == 'undefined') {
		if(identifiers_list[get_last(id)] != "" && typeof identifiers_list[get_last(id)] != 'undefined') {
			this.value = identifiers_list[get_last(id)].get_value();
		}
		else {
			if(typeof identifiers_nbr[id]=='undefined') {
				
				identifiers_nbr[id] = 0;
				this.id = id;
			}
			else {
				
				identifiers_nbr[id]+=1;
				new_value = identifiers_nbr[id];
				this.id = identifier+'_'+new_value;
				
			}
			identifiers_list[this.id]='';
			return_identifier.push(this.id);
			
			/*if(typeof this.value == 'undefined') {
				throw new Error("Identifier <code>"+id+"</code> is not declared or not initialized.")
			}*/
		}
	}
	else {
		this.value = value;
	}
};

ReturnIdentifier.prototype.get_type = function() {
	return this.type;
};

ReturnIdentifier.prototype.get_id = function() {
	return this.id;
};

ReturnIdentifier.prototype.get_value = function() {
	return this.value;
};

var Cell = function(value) {
	this.type = 'Cell';
	this.value = new Identifier(value);
	this.identifier = "c"+((cells_list.length)+1);
	
	cells_list.push([this.identifier, this.value]);
};

Cell.prototype.get_type = function() {
	return this.type;
};

Cell.prototype.get_id = function() {
	return this.identifier;
};

Cell.prototype.get_value = function() {
	return this.value;
};

Cell.prototype.update = function(value) {
	this.value = value;
};

/*** LIST ***/

var List = function(exp1, exp2) {
	this.type = 'List';
	this.l = new Object();
	this.l.a = exp1;
	this.l.b = exp2;
};

List.prototype.get_a = function() {
	return this.l.a;
};

List.prototype.get_b = function() {
	return this.l.b;
};

List.prototype.get_value = function() {
	
	var to_s = "'|'(";
	var cur = this.l;
	

    if(typeof cur.a =='object') {
		to_s = to_s+cur.a.get_value();
	}
	else {
		to_s = to_s+cur.a;
	}
	
	if(typeof cur.b =='object') {
		to_s = to_s+" "+cur.b.get_value();
	}
	else {
		to_s = to_s+" "+cur.b;
	}
	
	
	return to_s+")";
};

List.prototype.get_type = function() {
	return this.type;
};


var Record_entry = function(feature, id) {
	this.type = 'Record_entry';
	this.feature = feature;
	this.id = id;	
};

Record_entry.prototype.get_type = function() {
	return this.type;
};

Record_entry.prototype.get_feature = function() {
	return this.feature;
};

Record_entry.prototype.get_id = function() {
	return this.id;
};

var Record = function(label, entries) {
	this.type = 'Record';
	this.label = label;
	this.entries = entries;
	this.record = {};
	
	// entries is a list of Record_entry
	// we must add all the [feature] = id in a dictionary
	for(var i=0; i<entries.length; i++) {
		this.record[entries[i].feature] = entries[i].id;
	}
};

Record.prototype.get_type = function() {
	return this.type;
};

Record.prototype.get_feature = function() {
	return this.feature;
};

Record.prototype.get_record = function() {
	return this.record;
};

Record.prototype.get_value = function() {
	var str = this.label+"(";
	for(var i=0; i<this.entries.length; i++) {
		str = str + this.entries[i].feature  +":"+ this.entries[i].id.id + " ";
	}
	if(str.slice(-1) == " ") {
		str=str.substring(0, str.length-1);
	}
	str += ")";
	return str;
};

Record.prototype.get_proc_ret = function() {
	var ret = "'"+this.label+"', [";
	for(var i=0; i<this.entries.length; i++) {
		ret = ret + "new Record_entry('"+this.entries[i].feature+"',new Identifier('"+this.entries[i].id.id+"')),";
	}
	if(ret.slice(-1) == ",") {
		ret=ret.substring(0, ret.length-1);
	}
	return ret+"]";
};

/*** -------------- PROCEDURES -------------- ***/


function get_state(start, end) {
	var lines = editor.getValue().split('\n');
	var j = start.first_line-1;
	
	state = lines[j].substring(lines[j].indexOf("proc"));
	
	state = state.split(' ').join("&nbsp");

	for(j=start.first_line; j<end.last_line; j++) {
		state += ("<p>"+lines[j].split(' ').join("&nbsp")+"</p>");
	}
	
	
	return state;
}

function get_ce() {
	var str = "";
	for(var keys in identifiers_list) {		
		if(identifiers_list[keys] == "") {
			if(return_identifier.indexOf(keys)==-1) {
				str += ", ";
				str = str + keys.toLowerCase();
			}
			else {
				continue
			}			
		}
		else if(typeof identifiers_list[keys].get_value() == 'object') {			
			if(identifiers_list[keys].value.type != 'ReturnIdentifier') {
				str += ", ";
				a = identifiers_list[keys].get_value();
				while(typeof a.value != 'undefined') {
					a = a.get_value();
				}
				str = str + keys.toLowerCase() + " = " + a;
			}				
		}				
	}
	return str;
}

function get_return_places(param) {
	// recoit des params, retourne une liste d'index (0..N) des valeurs de retour
	var ret = new Array();
	for(var i=0; i<param.length; i++) {
		if(param[i].type == 'ReturnIdentifier') {
			ret.push(i);
		}
	}
	return ret;
}

function add_param(param) {
	for(var i=0; i<param.length; i++) {
		param_list.push(param[i].get_id());
	}
}

var Procedure = function(param, start, end, content) {
	this.type = 'Procedure';
	this.param = param;
	this.ce = cur_ce;
	this.CE = cur_CE;
	this.value = "("+get_state(start,end)+""+this.ce+")";
	this.semantic = new Array();
	this.steps = "";
	this.content = content;	
	
	add_param(param);
	this.return_places = get_return_places(param);
	
	
	
};

Procedure.prototype.get_value = function() {
	return this.value;
};

Procedure.prototype.get_type = function() {
	return this.type;
};

Procedure.prototype.get_param = function() {
	return this.param;
};

Procedure.prototype.get_content = function() {
	return this.content;
};

Procedure.prototype.set_id = function(identifier) {
	this.id = identifier;
	proc[identifier] = cur_proc;
	CE[identifier] = this.CE;
	cur_proc = "";
	
};

Procedure.prototype.get_steps = function() {
	return this.steps;
};

Procedure.prototype.add_semantics = function(state_loc, stack, type) {
	var sem = new Object();
	sem.state_loc = state_loc;
	sem.stack = stack;
	sem.type = type;
	if(stack.indexOf('undefined') >-1) {
		this.semantic.push(sem);
	}
	
	
	
	
	
};

Procedure.prototype.eval_semantics = function(left, right) {
	var sem = [];
	sem = this.semantic.concat.apply(sem, this.semantic);
	
	var right_2 = [];
	right_2 = right_2.concat.apply(right_2, right);
	
	var left_2 = [];
	left_2 = left_2.concat.apply(left_2, left);
	
	this.semantic = new Array();
	this.semantic.push(right_2.concat(left_2));
	
};

Procedure.prototype.get_semantics = function() {
	return this.semantic;
};

Procedure.prototype.call = function(id, args) {
	if(args.length == this.param.length) {
		redo_proc(id, args, this.param);
	}
	else {
		
	}	
};

Procedure.prototype.compile = function() {
new VariableInitializer(this.param[2], new Expression(identifiers_list[this.param[0]].get_value() +identifiers_list[this.param[1]].get_value()));
}

function get_state_call(start, end) {
	var state = start;
	state.last_column = end.last_column;
	state.last_line = end.last_line;
	return state;
}

function get_last(identifier) {
	// parcourir identifier_lists et trouver la clé qui a le nbr
	var ret = new Array();
	for(var key in identifiers_list) {
		if(key.indexOf(identifier)==0) {
			var index = key.indexOf('_')
			if(index>-1 && index == identifier.length) {
				ret.push(key);
			}
			else if(key.length == identifier.length){
				ret.push(key);
			}
		}
	}
	
	return ret.slice(-1)[0];
}

function get_last_closure(identifier, closure) {
	// parcourir identifier_lists et trouver la clé qui a le nbr
	var ret = new Array();
	for(var key in closure) {
		if(key.indexOf(identifier)==0) {
			var index = key.indexOf('_')
			if(index>-1 && index == identifier.length) {
				ret.push(key);
			}
			else if(key.length == identifier.length){
				ret.push(key);
			}
		}
	}
	
	return ret.slice(-1)[0];
}

function get_last_if(identifier) {
	// parcourir identifier_lists et trouver la clé qui a le nbr
	if(typeof identifier == 'number') {
		return identifier;
	}
	var ret = new Array();
	for(var key in identifiers_list) {
		if(key.indexOf(identifier)==0) {
			var index = key.indexOf('_')
			if(index>-1 && index == identifier.length) {
				ret.push(key);
			}
			else if(key.length == identifier.length){
				ret.push(key);
			}
		}
	}
	
	return ret.slice(-2)[0];
}

function get_last_init(identifier) {
	// parcourir identifier_lists et trouver la clé qui a le nbr
	var ret = new Array();
	for(var key in identifiers_list) {
		if(key.indexOf(identifier)==0 && identifiers_list[key]!="") {
			var index = key.indexOf('_')
			if(index>-1 && index == identifier.length) {
				ret.push(key);
			}
			else if(key.length == identifier.length){
				ret.push(key);
			}
		}
	}
	
	return ret.slice(-1)[0];
}

function generate_new_args(args) {
	var str = "";
	for(var i=0; i<args.length; i++){
		if(i!=0) {
			str += ",";
		}
		str = str + "new "+args[i].type+"('"+args[i].get_id()+"')";
	}
	return str;
}

var ProcedureCall = function(id, args, start, end, cur_decl_local) {
	
	this.id = id;
	this.args = args;
	this.semantic = new Array();
	this.call = get_state_call(start, end);
	this.decl_nbr = cur_decl_local;
	cur_decl++;
	
	new_args = generate_new_args(args);
	
	cur_proc += "new ProcedureCall('"+id+"',["+new_args+"],"+JSON.stringify(start)+","+JSON.stringify(end)+","+this.decl_nbr+");";
	if(identifiers_list[this.id] != '') {
		
		//cur_proc += "this.add_semantics("+JSON.stringify(this.call)+","+"'',42);";
		cur_proc+="this.add_semantics("+JSON.stringify(identifiers_list[id].get_content())+",'',42);";
		var my_proc = cur_proc;
		cur_proc = "";
		this.redo_proc(id, args, identifiers_list[this.id].get_param());
		cur_proc = my_proc+cur_proc;
	}
};

ProcedureCall.prototype.get_semantics = function() {
	//var c = new Block(); 
	//c.add_semantics('','zx = 3',40);
	//return c.get_semantics();
	return this.semantic;
};

ProcedureCall.prototype.add_semantics = function(state_loc, stack, type) {
	var sem = new Object();
	sem.state_loc = state_loc;
	sem.stack = stack;
	sem.type = type;
	this.semantic.push(sem);
	state_decl[this.decl_nbr] = sem;
	
	
	
	
	
};

ProcedureCall.prototype.redo_proc = function(id, args, param) {
	// id : l'id de la procedure
	// args : les arguments avc les valeurs choisies par l'utilisateur
	// param : les noms officiels des arguments de la procedure
	
	if(typeof proc[id]=='undefined') {
		return -1;
	}
	if(typeof infinite_loop_avoid[id] == 'undefined') {
		infinite_loop_avoid[id] = 0;
	}
	infinite_loop_avoid[id]++;
	if(infinite_loop_avoid[id]>10000) {
		throw new Error("I think there is an infinite loop somewhere.");
	}
	cur_proc="";
	var closure = jQuery.extend(true, {}, identifiers_list);
	identifiers_list = jQuery.extend(true, {}, CE[id]);
	identifiers_list[id] = closure[id];
	
	// 1) créer les nouvelles variables avec les noms param
	for(var i=0; i<param.length; i++) {
		
		new VariableDeclarator(param[i].get_id(), cur_decl);
		/*if(param[i].get_type() == 'ReturnIdentifier') {
			new VariableDeclarator(param[i].get_id(), cur_decl);
			//
		}*/
	}
	
	// 2) assigner les param aux args
	var return_id = {};
	for(var j=0; j<args.length; j++) {
		
		
		
		if(identifiers_list[id].return_places.indexOf(j) >-1) {			
			return_id[get_last(param[j].get_id())]=args[j];
		}
		else {
			if(args[j].value.type == 'MathExp') {
				if(isNaN(args[j].value.value)) {				
					return
				}
				new VariableInitializer(param[j].get_id(), new Expression(new Integer(args[j].value.value)), cur_decl);
				//this.add_semantics(identifiers_list[id].get_content(), get_last(param[j].get_id())+' = '+args[j].value.value , 2);
			}
			else if(closure[get_last_closure(args[j].id, closure)].type == 'Record') {
				new VariableInitializer(param[j].get_id(), closure[get_last_closure(args[j].id, closure)], cur_decl);
			}
			else {
				new VariableInitializer(param[j].get_id(), args[j], cur_decl);
				//"this.add_semantics("+JSON.stringify(identifiers_list[id].get_content()+", "+get_last(param[j].get_id())+' = '+args[j].get_value()+" , 2)";
			}
			
		}
	}	
	
	// 3) je sais ce que la procédure fait en le stockant sous forme de string 'new VariableDeclarator('ZX'); new VariableInitializer('ZX', new Expression(3));' et puis faire eval de ce bordel
	//proc[id] = "new VariableDeclarator('ZX'); new VariableInitializer('ZX', new Identifier('X'));";
	/*this.add_semantics('','zx',1);
	this.add_semantics('','zx = 3',2);*/
	
	
	eval(proc[id]);
	var sem_tmp = this.semantic;
	this.semantic = new Array();
	this.add_semantics(identifiers_list[id].get_content(), '', 1);
	
	//
	
	for(var key in return_id) {
		
		
		cur_proc = cur_proc.replace(key, return_id[key].get_id());		
		cur_proc = cur_proc.replace(key.toLowerCase()+" ",return_id[key].get_id().toLowerCase()+" ");		
	}
	
	var caca = cur_proc;
	cur_proc = "";		
	eval(caca);
	if(cur_proc.indexOf('undefined')>-1){
		cur_proc = caca;
	}
		
	this.semantic.reverse();	
	identifiers_list = jQuery.extend(true, {}, closure);
	
	// SEMANTIQUE 
};

/*** -------------- UTILS -------------- ***/


function sem_only(str) {
	var arr = str.match(/this.add_semantics*[(]+[\a-zA-Z]*[)]$/gm);
	return(arr);
}

/**
 * Prepares the 'states' array and the 'stacks' array to display semantics
 *
 * @param state_loc : informations about the scope if the current state
 * @param stack : the stack as it is (request to be toLowercase before)
 */
function displaySemantics(state_loc, stack, type) {
	var lines = editor.getValue().split('\n');
	var state = "";
	//
	
	if(state_loc != '') {
		for(var i=state_loc.first_line-1; i<state_loc.last_line; i++) {
			state += ("<p>"+lines[i].split(' ').join("&nbsp")+"</p>");
		}
	}
	
	//
	if(cnt_exe == 0) {
		states[cnt_exe] = '<fieldset id="state_'+cnt_exe+'" class="hero-unit"><legend>'+cnt_exe+'</legend><p>DONE !</fieldset>';
	}
	else {
		states[cnt_exe] = '<fieldset id="state_'+cnt_exe+'" class="hero-unit"><legend>'+cnt_exe+'</legend><p><div class="scrollable">'+state+'</div></fieldset>';
	}
	
	stacks[cnt_exe] = [stack, type];
	//
	cnt_exe++;
}

/**
 * Returns the stack from the previous state as one box
 * cell_2s est generée a l'envers donc le top est la nouvelle valeur et on ajoute les anciennes en dessous
 *
 * @param from : the index from which we want the state (descending order)
 */
function getStackFrom(from) {
	var stack_2s = "";
	var cell_2s = "";
	
	if(from==cnt_exe-1) {
		stack_2s = "<p>"+stacks[from][0]+"</p>";
	}
	else {
		var index = -1;
		var line = stacks[from][0];
		
		switch(stacks[from][1]){
		case 2: // is it an initialization ?
			// find the line in stacks to skip
			//
			
			var identifier = line.substring(0,line.indexOf(" = "));
			index = findDeclaration(identifier, from);
			break;
		}
		for(var i=from; i<cnt_exe; i++) {
			
			if(exclude_from_stack.indexOf(i)>=0) {
				continue;
			}
			if(stacks[i][1]!=100) {
				if( Object.prototype.toString.call(stacks[i][0]) === '[object Array]' ) {
					for(var k=0; k<stacks[i][0].length; k++) {
						if(!is_array_in_array(exclude_from_stack, [i, k])) {
							stack_2s = stack_2s + "<p>"+stacks[i][0][k].toLowerCase()+"</p>";
						}	 
					}
				}
				else {
					
					var end = stacks[i][0].indexOf(" ");
					if(end == -1) {
						end = stacks[i][0].length;
					}
					var variable_name = stacks[i][0].substring(0,end);
					
					var is_cell_init = stacks[i][0].indexOf(" := ");
					
					// not a cell init
					var start = stacks[i][0].indexOf("= ")+2;
					if(start == 1) {
						start = stacks[i][0].length;
					}
					var value = stacks[i][0].substring(start, stacks[i][0].length);
					var index = is_value_in_array(cells_list, value);
					
					if(index >= 0 && (is_cell_init<0)) {
						stack_2s = stack_2s + "<p>"+stacks[i][0].toLowerCase()+"</p>";
						if(cell_2s == "") {
							cell_2s = cell_2s + "<p>"+cells_list[index][0]+" : "+cells_list[index][1].get_id()+"</p>";
						}
						else {
							cell_2s = cell_2s;
						}
						
					}
					else if(is_cell_init >= 0) {
						cell_2s = cell_2s+ "<p>"+stacks[i][0].replace("=","")+"</p>";
					}
					else {
						stack_2s = stack_2s + "<p>"+stacks[i][0].toLowerCase()+"</p>";
					}
					
				}
			}
		}
	}
	
	cell_2s = clean_cell_2s(cell_2s);
	stack_2s = stack_2s.split(' ').join("&nbsp");
	
	if(cell_2s == "") {
		return '<fieldset id="stack_'+from+'" class="hero-unit"><legend>'+(cnt_exe-from)+'</legend><div class="scrollable">'+stack_2s+'</div></fieldset>';
	}
	return '<fieldset id="stack_'+from+'" class="hero-unit stack"><legend>'+(cnt_exe-from)+'</legend><div class="scrollable">'+stack_2s+'</div><div class="multiple_store"><div class="scrollable>"'+cell_2s+'</div></div></fieldset>';
}

function is_array_in_array(array, sub) {
	for(var i=0; i<array.length; i++) {
		if(typeof array[i] == 'object') {
			return (array[i][0] == sub[0] && array[i][1] == sub[1]);
		}
	}
	return false;
}

/*
 * for cells which are [identifier, identifier]
 */
function is_value_in_array(array, sub) {
	
	if(sub.length>0) {
		for(var i=0; i<array.length; i++) {
			
			if(array[i][0] == sub) {
				return i;
			}
		}
	}
	
	return -1;
}

function findDeclaration(identifier, from) {
	for(var i=from+1; i<cnt_exe; i++) {
		// 1) est ce que cet element de la stack est une stack?
		if(typeof stacks[i][0] == 'object') {
			// si oui, la parcourir
			for(var j=0; j<stacks[i][0].length; j++) {
				// is it a declaration or a cell ?
				var end = stacks[i][0][j].indexOf(" ");
				if(end == -1) {
					end = stacks[i][0][j].length;
				}
				
				var variable_name = stacks[i][0][j].substring(0,end);
				if(stacks[i][1] == 1 || cells_list.indexOf(variable_name)!=-1) {
					index = stacks[i][0][j].indexOf(identifier);
					if(index>-1 && stacks[i][0].length == identifier.length) {					
						exclude_from_stack.push([i, j]);
						
					}
				}
			}	
		}
		else {
			// is it a declaration or a cell ?
			var end = stacks[i][0].indexOf(" ");
			if(end == -1) {
				end = stacks[i][0].length;
			}
			
			var variable_name = stacks[i][0].substring(0,end);
			if(stacks[i][1] == 1 || cells_list.indexOf(variable_name)!=-1) {
				index = stacks[i][0].indexOf(identifier);
				if(index>-1 && stacks[i][0].length == identifier.length) {
					exclude_from_stack.push(i);
					
				}
			}
		}
	}
	return -1;
}

var Get_entry_record = function(identifier, entry) {
	this.type = 'Get_entry_record';
	this.identifier = identifier;
	this.entry = entry;
	if(typeof identifiers_list[get_last(identifier)].record[entry] != 'undefined') {
		if(typeof identifiers_list[get_last(identifier)].record[entry].value != 'undefined') {
			this.value = identifiers_list[get_last(identifier)].record[entry].value.value;
		}		    
	}
	else {
		throw new Error("Feature <code>"+entry+"</code> is not in the record <code>"+identifier+"</code>.");
	}
	
};

Get_entry_record.prototype.get_type = function() {
	return this.type;
};

Get_entry_record.prototype.get_id = function() {
	return this.identifier;
};

Get_entry_record.prototype.get_value = function() {
	return this.value;
};

Get_entry_record.prototype.get_proc_ret = function() {
	return "new Get_entry_record('"+this.identifier+"','"+this.entry+"')";
};

// Input: <p>c1 : X</p><c1 : Y</p><p>c2 : R</p>
// Output: <p>c1 : X</p><p>c2 : R</p>
function clean_cell_2s(cell_2s) {
	var ret = "";
	var past = new Array();
	if(cell_2s != "") {
		var arr = cell_2s.split("</p>");
		var value, cur;
		for(var i=0; i<arr.length; i++) {
			value = arr[i].substring(3, arr[i].indexOf(" :"));
			if(past.indexOf(value)==-1) {
				past.push(value);
				ret = ret+arr[i]+"</p>";
			}
		}
	}
	return ret;
}