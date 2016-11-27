function make_rpg_dice_counter(){
    var VERSION = "1.0";
    var _dice_array = null;

    // dice count //////////////////////////////////////////////////////////
    function get_next_block(elem){
	while(elem){
	    if (elem.tagName == 'BLOCKQUOTE')
		return elem
	    elem = elem.nextElementSibling
	}
	return null;
    }

    function get_dice(id_no, bloq_element, input_element){
	var dice_line = null;
	var new_text_arr = [];
	bloq_element.innerHTML.split(/<br>/i).forEach(
	    function(ln, i, ar){
		if (ln.match(/<font\s+color="#ff0000"\s*>/i)){
		    dice_line = ln;
		    ln = ln.replace(/<font/i, '<span class="faces"><font');
		    ln = ln.replace(/<\/font>/i, '</font></span>');
		}
		new_text_arr.push(ln);
	    }
	);
	if (!dice_line)
	    return;

	bloq_element.innerHTML = new_text_arr.join('<br>');

	var dice_reg = RegExp(/dice(\d+)d(\d+)([-+]\d+)?=/i);
	var dice_match = dice_reg.exec(dice_line);
	if (!dice_match)
	    return null;
	
	var dice_num = dice_match[1];
	var dice_max = dice_match[2];
	var dice_add = 0;
	var dice_add_str = ''
	if (dice_match[3]){
	    dice_add = Number(dice_match[3]);
	    if (dice_add < 0)
		dice_add_str = '' + dice_add;
	    if (dice_add > 0)
		dice_add_str = '+' + dice_add;
	}
	var dice_kind = 'dice' + dice_num + 'd' + dice_max + dice_add_str;

	var face_match = /<font\s+color="#ff0000">\s*((\d+\s+)+)\((\d+)\)<\/font>/.exec(dice_line);
	if (!face_match){
	    console.log('---------something wrong ---' + id_no + '\n' + dice_line);
	    return null;
	}

	var face_sum = Number(face_match[3])
	var face_arr = face_match[1].replace(/\s+$/, '').split(/\s+/);
	face_arr.forEach(function(e, i, ar){ ar[i] = Number(e); })
	
	return 	{ dnum : dice_num, dmax : dice_max, dadd : dice_add, kind : dice_kind,
		  id : Number(id_no), input : input_element, bloq : bloq_element, faces : face_arr, sum : face_sum 
		};
    }

    function init_dies(){
	var input_arr = document.getElementsByTagName('input');
	_dice_array = []
	for(var i=0; i<input_arr.length; i++){
	    var id_match = /delcheck(\d+)/.exec(input_arr[i].getAttribute('id'))
	    if (!id_match)
		continue;

	    var bloq = get_next_block(input_arr[i]);
	    if (!bloq)
		continue;

	    var a_dice = get_dice(id_match[1], bloq, input_arr[i])
	    var r = get_rule(bloq);
	    if (!_rule && r) _rule = r;

	    if (a_dice)
		_dice_array.push(a_dice)
	}
    }

    // rules //////////////////////////////////////////////////////////
    _rule = null;
    function get_rule(bloq){
	function check_a_rule(r, i, arr){
	    var delimiter = ' ';
	    if (/;$/.exec(r))
		delimiter = '<br>'
	    r = r.replace(/[;,]$/, '');

	    var head_reg = /#(\d+)/;
	    var m = head_reg.exec(r);
	    var dice_no = Number(m[1]);

	    var rules_reg = /\d+:[^\s]*/g;
	    var rules_cand = r.match(rules_reg);
	    var face_rule = {};
	    if (rules_cand){
		for(var i=0; i<rules_cand.length; i++){
		    var key_val = rules_cand[i].split(":");
		    face_rule[Number(key_val[0])] = key_val[1];
		}
	    }

	    r = r.replace(head_reg, '');
	    r = r.replace(rules_reg, '');
	    r = r.replace(/^\s*/, '');
	    var rules = {'face_rule': null};
	    rules['name'] = r.replace(/\s*$/, '');
	    rules['delimiter'] = delimiter;

	    if (Object.keys(face_rule).length > 0)
		rules['face_rule'] = face_rule;

	    my_rule[dice_no] = rules;
	}

	var my_rule = {};
	var rule_count = 0;
	bloq.innerHTML.split(/<br>/).forEach(
	    function(ln, i, arr){
		if (ln.match(/<font/))
		    return;

		var reg = RegExp(/#\d+\s*[^;,]*[;,]/g);
		if (reg.exec(ln)){
		    rule_count++;
		    ln.match(reg).forEach(check_a_rule);
		}
	    }
	);

	if (rule_count > 0)
	    return my_rule;
	else
	    return null;
    }

    function apply_rule(rule, d){
	function apply_rule_proc(rule, f){
	    var html = "";

	    if (rule.face_rule){
		var ans = null;
		var min_diff = Number.MAX_VALUE;
		Object.keys(rule.face_rule).forEach(
		    function(rfs, i, ar){
			var rf = Number(rfs);
			if (f <= rf && (rf - f) <= min_diff){
			    min_diff = rf -f;
			    ans = rf;
			}
		    }
		);
		html += rule['name'] + ":";
		if (ans)
		    html += rule.face_rule[ans];
		else
		    html += f;
	    }else{
		html += rule['name'] + ":" + f;
	    }

	    html = '<font color=\'#841a75\' size=\'-1\'>' + html + '</font>';
	    html += rule['delimiter'];
	    return html;
	}

	var html = "";
	for(var i=0; i<d.faces.length; i++){
	    var r = {'name' : 'd' + (i+1), 'delimiter' : ' '};
	    if (String(i+1) in rule)
		r = rule[String(i+1)];

	    html += apply_rule_proc(r, d.faces[i]);
	}

	return html;
    }

    // insert descr //////////////////////////////////////////////////////////
    var _font_scale = null;

    function insert_descr(d){
	var text = '';
	var insHtml = apply_rule(_rule, d);
	d.bloq.innerHTML += "<br>" + insHtml;
    }

    function move_form(){
	var  $ = function(id){ return document.getElementById(id); }
	var t_area = $('ftbl');
	var pos_dummy = $('ufm');

	if (t_area.style.position != 'absolute')
	    return;
	t_area.style.top = pos_dummy.offsetTop + 'px';
    }

    // driver //////////////////////////////////////////////////////////
    function dispatch(d){
	init_dies();
	_dice_array.forEach(function(d, i, ar){ insert_descr(d); });
	move_form();
    }

    console.log('start rpg-dice ver' + VERSION + " ...");
    return dispatch;
}

if (typeof(__rpg_dice_counter__) == 'undefined'){
    __rpg_dice_counter__ = make_rpg_dice_counter();
    __rpg_dice_counter__();
    console.log('done.');
}

console.log("HELLO RPG");
