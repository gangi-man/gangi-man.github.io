function make_dice_counter(){
    var VERSION = "1.1";
    var Dice_arr = null;
    var Master_value = 0;

    // util ///////////////////////////////////////////////////////////////////
    var  $ = function(id){ return document.getElementById(id); }
    var $$ = function(id){ return Disp_inner_document.getElementById(id); }

    // dice count //////////////////////////////////////////////////////////
    function get_next_block(elem){
	while(elem){
	    if (elem.tagName == "BLOCKQUOTE")
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

	bloq_element.innerHTML = new_text_arr.join("<br>");

	var dice_reg = RegExp(/dice(\d+)d(\d+)([-+]\d+)?=/i);
	var dice_match = dice_reg.exec(dice_line);
	if (!dice_match)
	    return null;
	
	var dice_num = dice_match[1];
	var dice_max = dice_match[2];
	var dice_add = 0;
	var dice_add_str = ""
	if (dice_match[3]){
	    dice_add = Number(dice_match[3]);
	    if (dice_add < 0)
		dice_add_str = "" + dice_add;
	    if (dice_add > 0)
		dice_add_str = "+" + dice_add;
	}
	var dice_kind = "dice" + dice_num + "d" + dice_max + dice_add_str;

	var face_match = /<font\s+color="#ff0000">\s*((\d+\s+)+)\((\d+)\)<\/font>/.exec(dice_line);
	if (!face_match){
	    console.log("---------something wrong ---" + id_no + "\n" + dice_line);
	    return null;
	}

	var face_sum = Number(face_match[3])
	var face_arr = face_match[1].replace(/\s+$/, "").split(/\s+/);
	face_arr.forEach(function(e, i, ar){ ar[i] = Number(e); })
	
	return 	{ dnum : dice_num, dmax : dice_max, dadd : dice_add, kind : dice_kind,
		  id : Number(id_no), input : input_element, bloq : bloq_element, faces : face_arr, sum : face_sum 
		};
    }

    function dump_a_dice(d){
	var text = d.bloq.innerHTML;

	text = text.replace(/&gt;/gi, ">");
	text = text.replace(/<br>/gi, "\n");
	text = text.replace(/<[^>]*>/g, '');
	console.log("id:" + d.id + " " + d.kind + " score:"+ d.ginga_score +"\n" + d.ginga_arr +"\n" + text)
    }

    function init_dies(){
	if (Dice_arr)
	    return;

	var input_arr = document.getElementsByTagName("input");
	Dice_arr = []
	for(var i=0; i<input_arr.length; i++){
	    var id_match = /delcheck(\d+)/.exec(input_arr[i].getAttribute("id"))
	    if (!id_match)
		continue;

	    var bloq = get_next_block(input_arr[i]);
	    if (!bloq)
		continue;

	    var a_dice = get_dice(id_match[1], bloq, input_arr[i])
	    if (a_dice)
		Dice_arr.push(a_dice)
	}

	Dice_arr.forEach(function(d, i, ar){ check_ginga_dice(d); });

	if (Dice_arr.length > 0)
	    Master_value = Dice_arr[0].sum;
    }

    // ginga check //////////////////////////////////////////////////////////
    function check_ginga_dice(d){
	function calc_ginga_score(arr){
	    var score = 0;
	    arr.forEach(function(e, i, ar){ if (arr[i] == Ginga_model[i]) score++; })

	    //bonus!
	    if (arr.length >= 4 &&
		arr[0] == 'GA' && arr[1] == 'NN' && arr[2] == 'GA' && arr[3] == 'NN')
		score += 4;

	    if (arr.length >= 7 && arr[4] == 'GI' && arr[5] == 'GI' && arr[6] == 'NN')
		score += 3;

	    if (arr.length >= 12 && arr[7] == 'GI' && arr[8] == 'NN' && arr[9] == 'GA' &&
		arr[10] == 'MA' && arr[11] == 'NN')
		score += 5;
	    
	    return score;
	}

	function gen_ginga_html(arr){
	    var result = "";
	    arr.forEach(
		function(e, i, ar){
		    if (arr[i] == Ginga_model[i]){
			result += '<font color="#191970">' + Ginga_dict_unicode[arr[i]] + '</font> ';
		    }else{
			result += '<font color="#4682b4">' + Ginga_dict_unicode[arr[i]] + '</font> ';
		    }
		}
	    );
	    return result;
	}
	if (d.ginga_html)
	    return;
	
	var Ginga_dict = ['GA', 'NN', 'GI', 'MA', '**'];
	var Ginga_dict_unicode = {'GA' :'&#12460;', 'NN' : '&#12531;', 'GI' : '&#12462;', 'MA' : '&#12510;', '**' : '&#65290;'};
	var Ginga_model = ['GA', 'NN', 'GA', 'NN', 'GI', 'GI', 'NN', 'GI', 'NN', 'GA', 'MA', 'NN'];
	var ginga_dict_idx = 0;
	var num_arr = [];
	var ginga_arr = [];
	var ginga_hash = {};

	var s = d.sum;
	while (s > 0){
	    num_arr = [(s % 10)].concat(num_arr);
	    s = Math.floor(s / 10);
	}

	num_arr = d.faces.concat(num_arr);
	num_arr.forEach(
	    function(e, i, ar)
	    {
		if (!(e in ginga_hash)){
		    ginga_hash[e] = Ginga_dict[ginga_dict_idx];
		    if (ginga_dict_idx < 4)
			ginga_dict_idx++;
		}
		ginga_arr.push(ginga_hash[e]);
	    }
	);

	d.ginga_html = gen_ginga_html(ginga_arr);
	d.ginga_score = calc_ginga_score(ginga_arr);
    }

    // display //////////////////////////////////////////////////////////
    function init_sort_mode(){
	var SORT_MODE = {
	    "no+" : function(a, b){ return b.id - a.id; },
	    "no-" : function(a, b){ return a.id - b.id; },
	    "sum+" : function(a, b){return b.sum - a.sum; },
	    "sum-" : function(a, b){return a.sum - b.sum; },
	    "gng+" : function(a, b){return b.ginga_score - a.ginga_score;},
	    "gng-" : function(a, b){return a.ginga_score - b.ginga_score;}
	};

	function get_sort_mode(){
	    var mode = localStorage.getItem("__ginga_counter__.sort_mode");
	    return mode;
	}
	
	function set_sort_mode(mode){
	    localStorage.setItem("__ginga_counter__.sort_mode", mode);
	}

	if (!get_sort_mode())
	    set_sort_mode("no-");

	return {get_func: function(mode)
		{
		    if (!mode)
			mode = get_sort_mode();

		    set_sort_mode(mode);
		    return SORT_MODE[mode];
		},
		get_mode : get_sort_mode
	       };
    }

    function init_descr_show_mode(){
	function get_show_mode(){
	    return Number(localStorage.getItem("__ginga_counter__.descr_show_mode"));
	}

	function set_show_mode(mode){
	    localStorage.setItem("__ginga_counter__.descr_show_mode", Number(mode));
	}

	return { get : get_show_mode, set : set_show_mode };
    }

    var _sort_mode = init_sort_mode();
    var _descr_show_mode = init_descr_show_mode();

    var Disp_frame = null
    var Disp_inner_document = null;
    var Disp_list = null;
    var Disp_control = null;
    var Disp_pop = null;
    var Font_scale = null;

    function init_disp(dies){
	if (Disp_frame)
	    return;

	var generatedIframe = $("_ginga_frame_");
	if (generatedIframe)
	    document.body.removeChild(generatedIframe);

	var ifrm = Disp_frame = document.createElement("IFRAME");
	ifrm.MaxHeight = Math.floor(window.innerHeight*0.8);
	ifrm.setAttribute("id", "_ginga_frame_");
	ifrm.style.position = "fixed";
	ifrm.style.top = "0px";
	ifrm.style.right = "0px";
	ifrm.style.width = "380px";
	ifrm.style.height = ifrm.MaxHeight + "px";
	ifrm.style.backgroundColor = "#e9dfe5";
    
	document.body.appendChild(ifrm);

	setTimeout(function(){
	    init_disp_control();
	    init_disp_popup();
	    clear_disp_list();
	    update_disp(Dice_arr, null);
	}, 500);
    }

    function init_disp_control(){
	if (Disp_control)
	    return;

	function is_list_open(){
	    var open_ = localStorage.getItem("__ginga_counter__.list_open");
	    if (open_)
		return Number(open_);
	    else
		return true;
	}

	function toggle_disp(e){
	    var open_ = is_list_open();
	    if (open_){
		Disp_frame.style.height = Disp_control.clientHeight + "px";
		Disp_pop.hide();
	    }else
		Disp_frame.style.height = Disp_frame.MaxHeight + "px";
	
	    localStorage.setItem("__ginga_counter__.list_open", Number(!open_));
	}

	function toggle_disp_descr(e){
	    dispatch("toggle_descr");
	}

	function sort_dies(mode, e){
	    var enable_ele = $$('enableGinga');
	    if ((mode=="gng+" || mode=="gng-") && !enable_ele.checked){
		enable_ele.checked = true;
		toggle_disp_descr(null);
	    }

	    update_disp(Dice_arr, _sort_mode.get_func(mode));
	}

	function update_master_value(e){
	    Master_value = Number($$("input_ginga").value);
	    update_disp(Dice_arr, _sort_mode.get_func());
	}

	Disp_inner_document = $("_ginga_frame_").contentDocument;

	var control = Disp_control = Disp_inner_document.createElement("DIV");


	control.innerHTML += "<button id='sortNoBtn_'>&#21476;&#38918;</button>";
	control.innerHTML += "<button id='sortNoBtn'>&#26032;&#38918;</button>";
	control.innerHTML += "<button id='sortSumBtn'>&#22810;&#38918;</button>";
	control.innerHTML += "<button id='sortSumBtn_'>&#23569;&#38918;</button>";
	control.innerHTML += "<button id='sortGngBtn'>&#12462;&#38918;+</button>";
	control.innerHTML += "<button id='sortGngBtn_'>&#12462;&#38918;-</button>";

	var checked = _descr_show_mode.get() ? "checked" : "";
	control.innerHTML += "<input id='enableGinga' type='checkbox' " + checked + ">";

	control.innerHTML += "<input id='input_ginga' size='8' value='" +Master_value + "'/>"
	control.innerHTML += "<button id='opclBtn'>open/close</button>";
	control.innerHTML += " ver:" + VERSION;
	control.style.position = "fixed"
	control.style.top = "0px";
	
	Disp_inner_document.body.appendChild(control);
	$$('sortNoBtn_').addEventListener('click', sort_dies.bind(null, 'no-'));
	$$('sortNoBtn').addEventListener('click', sort_dies.bind(null, 'no+'));
	$$('sortSumBtn').addEventListener('click', sort_dies.bind(null, 'sum+'));
	$$('sortSumBtn_').addEventListener('click', sort_dies.bind(null, 'sum-'));
	$$('sortGngBtn').addEventListener('click', sort_dies.bind(null, 'gng+'));
	$$('sortGngBtn_').addEventListener('click', sort_dies.bind(null, 'gng-'));

	$$('enableGinga').addEventListener('change', toggle_disp_descr);

	$$('opclBtn').addEventListener('click', toggle_disp);
	$$('input_ginga').addEventListener('input', update_master_value);
	if (!is_list_open())
	    Disp_frame.style.height = Disp_control.clientHeight + "px";
    }

    function clear_disp_list(){
	if (Disp_list){
	    while(Disp_list.firstChild)
		Disp_list.removeChild(Disp_list.firstChild);
	}else{
	    var idoc = Disp_inner_document;
	    var disp = Disp_list = idoc.createElement("DIV");
	    disp.style.position = "fixed";
	    disp.style.overflow = "scroll";
	    disp.style.top = Disp_control.clientHeight +  "px";
	    disp.style.width = "95%";
	    disp.style.height = (Disp_frame.MaxHeight - Disp_control.clientHeight) + "px";

	    Disp_inner_document.body.appendChild(disp);
	}
    }

    function update_disp(dies, sort_func){
	function scroll_to_bloq(d){
	    var jumpy = d.input.getBoundingClientRect().top + window.pageYOffset;
	    window.scrollTo(0, jumpy);
	}

	function mouse_over(e){
	    Disp_pop.update(e.target.dice.bloq.innerHTML);
	}

	clear_disp_list();

	if(!sort_func)
	    sort_func = _sort_mode.get_func();

	dies = dies.sort(sort_func);
	dies.forEach(function(d, i, arr){
	    var dsp = Disp_inner_document.createElement("DIV");
	    dsp.innerHTML = "id:" + d.id + " " + d.kind + " sum:" + d.sum + " GP:" + d.ginga_score;
	    dsp.addEventListener("click", scroll_to_bloq.bind(null, d));
	    dsp.dice = d;
	    dsp.addEventListener("mouseover", mouse_over);
	    
	    if (d.sum < Master_value)
		dsp.style.backgroundColor = "#8989ff";
	    else if(d.sum == Master_value)
		dsp.style.backgroundColor = "#89ffc4";
	    else
		dsp.style.backgroundColor = "#ff8989";
	    Disp_list.appendChild(dsp);
	});
    }

    function init_disp_popup(){
	if (Disp_pop)
	    return;

	Disp_pop = document.createElement('span');
	Disp_pop.style.position = "fixed";
	Disp_pop.style.bottom = "0px";
	Disp_pop.style.right = "0px";
	Disp_pop.style.backgroundColor = "#f5deb3";
	Disp_pop.style.display = "none";
	Disp_pop.innerHTML = "";
	Disp_pop.update = function(text){
	    Disp_pop.style.display = "";
	    Disp_pop.innerHTML = text; 
	};
	Disp_pop.hide = function(){ 
	    Disp_pop.style.display = "none"; 
	}

	setTimeout(function(){
	    document.body.appendChild(Disp_pop);
	}, 500);
    }

    // insert ginga //////////////////////////////////////////////////////////
    function insert_descr_ginga(d){
	var text = "";
	d.bloq.innerHTML.split(/<br>/i).forEach(
	    function(l, i, ar){
		text += l;
		if (l.match(/<font\s+color/i) && l.match(/"#ff0000"/i)){
		    text += '<span class="ginga_descr">';
		    text += '<br><span style="visibility:hidden;">'+ d.kind + '=</span>';
		    text += '<span class="faces">' + d.ginga_html + '</span>';
		    text += ' <font color="#4b0082">(GP:'+ d.ginga_score + ')</font></span>';
		}
		text += "<br>";
	    }
	);
	d.bloq.innerHTML = text;

	var fz = d.bloq.getElementsByClassName('faces');
	if (!Font_scale){
	    var ratio = Math.floor(100*fz[0].offsetWidth / fz[1].offsetWidth);
	    if (ratio < 20)
		ratio = 20;
	    Font_scale = ratio + "%";
	}
	fz[1].style.fontSize = Font_scale;
    }

    function move_form(){
	var t_area = $("ftbl");
	var pos_dummy = $("ufm");

	if (t_area.style.position != "absolute")
	    return;
	t_area.style.top = pos_dummy.offsetTop + "px";
    }

    function show_ginga_descr(show){
	var descrs = document.getElementsByClassName("ginga_descr")
	for (var i=0; i<descrs.length; i++)
	    descrs[i].style.display = (show ? "" : "none");

	move_form();
    }

    // driver //////////////////////////////////////////////////////////
    function dump_dies(){
	Dice_arr.forEach(function(d, i, arr){
	    dump_a_dice(d);
	});
    }

    function dispatch(d){
	if (d == "init"){
	    Dice_arr = null;

	    init_dies();
	    init_disp();
	    Dice_arr.forEach(function(d, i, ar){ insert_descr_ginga(d); });
	    show_ginga_descr(_descr_show_mode.get());
	}else if (d == "cls"){
	    update_disp(Dice_arr, null);
	}else if (d == "toggle_descr"){
	    var mode = !_descr_show_mode.get();

	    _descr_show_mode.set(mode);
	    show_ginga_descr(mode);
	}else if (d == "dump")
	    dump_dies();
	else
	    console.log("DISPATCH ERROR" + d);
    }

    return dispatch;
}

if (typeof(__dice_counter__) == "undefined"){
    __dice_counter__ = make_dice_counter();
    __dice_counter__("init");
}
