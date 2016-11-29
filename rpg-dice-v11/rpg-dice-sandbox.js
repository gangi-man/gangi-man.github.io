var DEFAULT_RESPONSE_NUMBER = 10;;
var _last_number = 1000;

var DEFAULT_RULES = [
    { dice_num: 3, dice_max: 10, rule:
"sample1\n" + 
"#1 ATK; #2 DEF; #3 INT;\n"
     }
    ,
    { dice_num: 3, dice_max: 10, rule:
"sample1 comma\n" + 
"#1 ATK, #2 DEF, #3 INT,\n"
     }
    ,
    { dice_num: 2, dice_max: 5, rule:
"sample2\n" +
"#1 武器 1:弓 2:剣 3:銃 4:槍 5:盾;\n" +
"#2 色 1:桃 2:青 3:黄 4:赤 5:黒;"
    }
    ,
    { dice_num:4, dice_max: 10, rule:
"sample3\n" + 
"#1 ATK; #2 DEF; #3 INT; #4 ALI 3:善 6:悪 10:中立;\n"
    }
    ,
    {dice_num: 5, dice_max: 20, rule:
"char making\n" +
"#1 攻撃; #2 防御; #3 知性;\n" +
"#4 戒律 6:善 12:悪 20:中立;\n" +
"#5 種族 4:人間 8:エルフ 12:ドワーフ 16:ノーム 20:ホビット;\n"
     }
];
var DEFAULT_RULE_NUMBER = DEFAULT_RULES.length;


function gen_a_response(date_, dice_num, dice_max, content){
    var line = '<input type="checkbox" id="delcheck'+ _last_number +'">';
    line += (date_.getFullYear()-2000) + '/' + (date_.getMonth()+1) + '/' + (date_.getDate());
    line += '(' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date_.getDay()] + ')';
    line += date_.getHours() + ':' + date_.getMinutes() + ':' + date_.getSeconds();
    line += ' No.' + _last_number++;
    line += ' <a href="javascript:void(0)">del</a>\n';

    var faces = [];
    var sum = 0;
    for (var i=0; i<dice_num; i++){
	var f = Math.ceil(Math.random()*dice_max);
	sum += f;
	faces = faces.concat(String(f));
    }

    line += '<blockquote>';
    if (content)
	line += content + "<br>";
    line += 'dice' + dice_num + 'd' + dice_max + '=';
    line += '<font color="#ff0000">';
    line += faces.join(' ');
    line += ' (' + sum + ')</font><br>'
    line += '</blockquote>\n';

    return line;
}

function gen_thread_proc(dice_num, dice_max, master_rule, num){
    var nowms = Date.now();

    clear_thread();
    for (var i=0; i<num; i++){
	var tbl = document.createElement('table');
	tbl.classList.add('generated-table');
	var td = tbl.insertRow(-1).insertCell(-1);
	td.classList.add(master_rule ? "rtd-m" : "rtd");
	
	var now_date = new Date(nowms + i*30*1000);
	td.innerHTML = gen_a_response(now_date, dice_num, dice_max, master_rule);
	document.body.appendChild(tbl);
	master_rule = "";
    }
}

function get_dice_number_max(text_line){
    var m = RegExp(/dice(\d+)d(\d+)=/).exec(text_line);
    if (m){
	var dice_num = Number(m[1]);
	var dice_max = Number(m[2]);
    }
    return {'dice_num': dice_num, 'dice_max': dice_max};
}

function gen_thread(){
    unload_rpg_dice();
    var rule = document.getElementById('rule_definition').value;
    rule = rule.replace(/\r?\n/g, "<br>");
    var dice_rule_line = document.getElementById('rule_dice').value;

    dice_info = get_dice_number_max(dice_rule_line);
    var res_number = DEFAULT_RESPONSE_NUMBER;
    var num_match = window.location.href.match(/#tnum=(\d+)/);
    if (num_match)
	res_number = Number(num_match[1]);    

    gen_thread_proc(dice_info["dice_num"],  dice_info["dice_max"], rule, res_number);
}

function clear_thread(){
    var tables = document.getElementsByClassName('generated-table');
    while(tables.length>0){
	tables[0].parentNode.removeChild(tables[0]);
    }
}

function set_preset_rule(no){
    document.getElementById('rule_definition').value = DEFAULT_RULES[no]['rule'];
    var dice_num = DEFAULT_RULES[no]['dice_num'];
    var dice_max = DEFAULT_RULES[no]['dice_max'];
    document.getElementById('rule_dice').value = 'dice' + dice_num + 'd' + dice_max + '=';
}

function save_user_rule(){
    var dice_rule_line = document.getElementById('rule_dice').value;
    var dice_info = get_dice_number_max(dice_rule_line);
    var dice_rule = document.getElementById('rule_definition').value;

    localStorage.setItem('dice_num', dice_info['dice_num']);
    localStorage.setItem('dice_max', dice_info['dice_max']);
    localStorage.setItem('dice_rule', dice_rule);
}

function load_user_rule(){
    var dice_num = Number(localStorage.getItem('dice_num'));
    var dice_max = Number(localStorage.getItem('dice_max'));
    var dice_rule = localStorage.getItem('dice_rule');

    if (!dice_num || !dice_max || !dice_rule)
	return;
    
    DEFAULT_RULES[DEFAULT_RULE_NUMBER] = {
	'dice_num': dice_num,
	'dice_max': dice_max,
	'rule': dice_rule
    };

    var select = document.getElementById('rule_options');
    if (select.length == DEFAULT_RULE_NUMBER){
	var o = document.createElement('option');
	o.setAttribute('value', DEFAULT_RULE_NUMBER);
	o.innerHTML = '*user rule*';
	select.appendChild(o);
    }
}

function delete_user_rule(){
    var result = confirm("delete user rule?");
    if (result)
	localStorage.clear();
}

function unload_rpg_dice(){
    var s = document.getElementById('__rpg_dice_js__');
    if (s){
	s.parentNode.removeChild(s);
    }
    __rpg_dice_counter__ = undefined;
}

function init(){
    var select = document.getElementById('rule_options');
    for(var idx=0; idx<DEFAULT_RULES.length; idx++){
	var o = document.createElement('option');
	var rule_text = DEFAULT_RULES[idx]['rule'].split(/\r?\n/)[0];
	o.setAttribute('value', idx);
	o.innerHTML = rule_text;
	select.appendChild(o);
    }
    select.addEventListener('change', function(e){
	clear_thread();
	set_preset_rule(Number(select.value));
	gen_thread();
	localStorage["rule_index"] = Number(select.value);
    });
    load_user_rule();

    var rule_index = 0;
    if (localStorage["rule_index"])
	var rule_index = Number(localStorage["rule_index"]);

    set_preset_rule(rule_index);
    gen_thread();
}
