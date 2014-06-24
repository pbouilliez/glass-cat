var states;
var stacks;
var cnt_exe;
var cnt_browse;
var exclude_from_stack;
var result;
var goto_var;
function remove_overlay() {
	$(".overlay").remove();
	$(".modal").remove();
	$(".top").remove();
	$(".mid").remove();
	$(".vertical_align").remove();
	$(".but").remove();
	goto();
}
function goto() {
	while((cnt_exe-cnt_browse)>goto_var){
		pre_quick();
	}
	while((cnt_exe-cnt_browse)<goto_var){
		next_quick();
	}
	
}

function set_goto(index) {
	if(typeof goto_var!='undefined') {
		$("#go_"+goto_var).removeClass("go_active");
	}
	$("#go_"+index).addClass("go_active");
	
	goto_var = index;
}



function browse_go() {
	var str=""
	if(cnt_exe>10) {
		for(var i=1,count=1; i<=cnt_exe && count<12; i=i+(Math.round(cnt_exe/8)), count++) {
			str+='<div class="go" id="go_'+i+'" onclick=set_goto('+i+')>'+i+'</div>';
		}
	}
	else {
		for(var i=1; i<=cnt_exe; i++) {
			str+='<div class="go" id="go_'+i+'" onclick=set_goto('+i+')>'+i+'</div>';
		}
	}
	
	return str;
}


function error_manager(e) {
	var str;
	if(e.message.indexOf('undefined')>-1) {
		str = "I‘m sorry I’m not a wizard of Oz."
	}
	else {
		str = e.message;
	}
	$("body").append('<div class="overlay"></div><div class="modal"><div class="top error"><div class="vertical_align">Error !</div></div><div class="mid"><div class="message">'+str+'</div></div><button type="button" class="but" onclick="remove_overlay()">Done</button></div>');
}

function next() {
	if(cnt_browse>=0 && cnt_browse<=cnt_exe){
		// move the previous state to the right, hide the prev-prev state
		//console.log(cnt_browse+" >> "+cnt_exe);
		//console.log('#state_'+cnt_browse);
		if(cnt_browse>0 && cnt_browse<cnt_exe){
			document.getElementById('state').innerHTML = document.getElementById('state').innerHTML+states[cnt_browse-1];
			document.getElementById('stack').innerHTML = document.getElementById('stack').innerHTML+getStackFrom(cnt_browse-1, cnt_exe);
			cnt_browse--;
		}
		// if second state, only move first state
		else if(cnt_browse==cnt_exe-1){
			document.getElementById('state').innerHTML = document.getElementById('state').innerHTML+states[cnt_browse-1];
			document.getElementById('stack').innerHTML = document.getElementById('stack').innerHTML+getStackFrom(cnt_browse-1, cnt_exe);
			cnt_browse--;
		}
		// if first state, browse it
		else if(cnt_browse == cnt_exe){
			document.getElementById('state').innerHTML = states[cnt_browse-1];
			document.getElementById('stack').innerHTML = getStackFrom(cnt_browse-1);
			cnt_browse--;
		}
		$('#state_'+(cnt_browse+1)).animate({'margin-left':'0px','right': 'auto'});
		$('#stack_'+(cnt_browse+1)).animate({'margin-left':'0px','right': 'auto'}, function() {
			if(cnt_browse+1>0 && cnt_browse+1<cnt_exe){
				$('#state_'+(cnt_browse+2)).hide();
				$('#stack_'+(cnt_browse+2)).hide();
			}
		});
	}
}

function next_quick() {
	if(cnt_browse>=0 && cnt_browse<=cnt_exe){
		// move the previous state to the right, hide the prev-prev state
		//console.log(cnt_browse+" >> "+cnt_exe);
		//console.log('#state_'+cnt_browse);
		if(cnt_browse>0 && cnt_browse<cnt_exe){
			$('#state_'+(cnt_browse+1)).hide();
			$('#stack_'+(cnt_browse+1)).hide();
			document.getElementById('state').innerHTML = document.getElementById('state').innerHTML+states[cnt_browse-1];
			document.getElementById('stack').innerHTML = document.getElementById('stack').innerHTML+getStackFrom(cnt_browse-1, cnt_exe);
			cnt_browse--;
		}
		// if second state, only move first state
		else if(cnt_browse==cnt_exe-1){
			document.getElementById('state').innerHTML = document.getElementById('state').innerHTML+states[cnt_browse-1];
			document.getElementById('stack').innerHTML = document.getElementById('stack').innerHTML+getStackFrom(cnt_browse-1, cnt_exe);
			cnt_browse--;
		}
		// if first state, browse it
		else if(cnt_browse == cnt_exe){
			document.getElementById('state').innerHTML = states[cnt_browse-1];
			document.getElementById('stack').innerHTML = getStackFrom(cnt_browse-1);
			cnt_browse--;
		}
		$('#state_'+(cnt_browse+1)).css({'margin-left':'0px','right': 'auto'});
		$('#stack_'+(cnt_browse+1)).css({'margin-left':'0px','right': 'auto'});
	}
}

function pre() {
	if(cnt_browse<=cnt_exe+1){
		$('#state_'+(cnt_browse+1)).css("z-index", 1 );	
 	    $('#stack_'+(cnt_browse+1)).css("z-index", 1 );	
		
		if(cnt_browse==cnt_exe){
			document.getElementById('state').innerHTML = "";
			document.getElementById('stack').innerHTML = "";
		}
		else if(cnt_browse==cnt_exe-1){
			$('#state_'+(cnt_browse-1)).hide();
			$('#stack_'+(cnt_browse-1)).hide();							
			cnt_browse++;
		}
		else if(cnt_browse<0) {
			cnt_browse=0;
		}
		else {
			console.log("PRE 1 >> "+cnt_browse);
			$('#state_'+(cnt_browse+2)).show();	
			$('#stack_'+(cnt_browse+2)).show();		
			$('#state_'+(cnt_browse+1)).animate({'margin-left':'400px','right': 'auto'});
			$('#stack_'+(cnt_browse+1)).animate({'margin-left':'400px','right': 'auto'}, function () {
				var end = document.getElementById('state').innerHTML.lastIndexOf("<fieldset");
				var end_stack = document.getElementById('stack').innerHTML.lastIndexOf("<fieldset");
				document.getElementById('state').innerHTML = document.getElementById('state').innerHTML.substring(0,end);
				document.getElementById('stack').innerHTML = document.getElementById('stack').innerHTML.substring(0,end_stack);
				$('#state_'+(cnt_browse+1)).css("z-index", 0 );	
		 	    $('#stack_'+(cnt_browse+1)).css("z-index", 0 );	
			});	
			cnt_browse++;	
		}
		
		$('#state_'+(cnt_browse-1)).animate({'margin-left':'400px','right': 'auto'});
		$('#stack_'+(cnt_browse-1)).animate({'margin-left':'400px','right': 'auto'});
		$('#state_'+(cnt_browse)).css("z-index", 0 );	
 	    $('#stack_'+(cnt_browse)).css("z-index", 0 );	
	}
}

function pre_quick() {
	if(cnt_browse<=cnt_exe+1){
		
			if(cnt_browse==cnt_exe){
				document.getElementById('state').innerHTML = "";
				document.getElementById('stack').innerHTML = "";
			}
			else if(cnt_browse==cnt_exe-1){
				$('#state_'+(cnt_browse-1)).hide();
				$('#stack_'+(cnt_browse-1)).hide();							
				cnt_browse++;
			}
			else if(cnt_browse<0) {
				cnt_browse=0;
			}
			else {
				console.log("PRE 1 >> "+cnt_browse);
				var end = document.getElementById('state').innerHTML.lastIndexOf("<fieldset");
				var end_stack = document.getElementById('stack').innerHTML.lastIndexOf("<fieldset");
				document.getElementById('state').innerHTML = document.getElementById('state').innerHTML.substring(0,end);
				document.getElementById('stack').innerHTML = document.getElementById('stack').innerHTML.substring(0,end_stack);
				cnt_browse++;
				console.log("PRE 2 >> "+cnt_browse);
				$('#state_'+(cnt_browse)).animate({'margin-left':'400px','right': 'auto'});
				$('#stack_'+(cnt_browse)).animate({'margin-left':'400px','right': 'auto'});
				$('#state_'+(cnt_browse+1)).show();	
				$('#stack_'+(cnt_browse+1)).show();	
			}
			$('#state_'+(cnt_browse-1)).css({'margin-left':'400px','right': 'auto'});
			$('#stack_'+(cnt_browse-1)).css({'margin-left':'400px','right': 'auto'});
		}
}

jQuery.noConflict(); jQuery(document).ready(function () {
  document.getElementById('exe').onclick = function () {
    try {
		identifiers_list = {};
		cells_list = new Array();
		identifiers_nbr = {};
		cur_condition = {};
		cur_condition[0] = true;
		proc = new Array();
		CE = new Array();
		cur_proc = "";
		cur_id = 1;					// Identifier of the current IF THEN condition
		state_decl = new Array();
	  	cur_decl = 0;
	 	states = new Array();
	  	stacks = new Array();
		identifiers_nbr = new Array();
	    cnt_exe = 0; 
	    cnt_browse = 0;
	    exclude_from_stack = new Array();
		infinite_loop_avoid = new Array();		
		param_list = new Array();     	    
	    document.getElementById('state').innerHTML = "";
	  document.getElementById('stack').innerHTML = "";
	  //console.log(">> "+editor.getValue());
      result = oz.parse(editor.getValue());
	  cnt_browse = cnt_exe;
        //$("span").html(result);
	  $('input').attr('disabled',false);	
	  $('input').removeClass('first_but');	 
    } catch (e) {
        error_manager(e);
    }
  };
document.getElementById('next').onclick = next;

document.getElementById('pre').onclick = pre;

document.getElementById('goto').onclick = function () {
	var str = "Hello World!";
	$("body").append('<div class="overlay"></div><div class="modal"><div class="top"><div class="vertical_align">Where do you want to go?</div></div><div class="mid"><div class="center">'+browse_go()+'</div></div><button type="button" class="but" onclick="remove_overlay()">Done</button></div>');
};

document.getElementById('gc').onclick = function () {
	console.debug(cnt_browse);
	gc_pressed = new Array();
	for(var i=0;i<GC.length; i++) {
		if(GC[i][0]>=cnt_browse) {
			gc_pressed.push(GC[i][1]);
		}
	}
};

});
 