function make_dice_counter(){
    var _dice_array = null;

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

    function init_dies(){
	var input_arr = document.getElementsByTagName("input");
	_dice_array = []
	for(var i=0; i<input_arr.length; i++){
	    var id_match = /delcheck(\d+)/.exec(input_arr[i].getAttribute("id"))
	    if (!id_match)
		continue;

	    var bloq = get_next_block(input_arr[i]);
	    if (!bloq)
		continue;

	    var a_dice = get_dice(id_match[1], bloq, input_arr[i])
	    if (a_dice)
		_dice_array.push(a_dice)
	}

	_dice_array.forEach(function(d, i, ar){ check_ginga_dice(d); });
    }

    // ginga check //////////////////////////////////////////////////////////
    function check_ginga_dice(d){
	function calc_ginga_score(arr){
	    var score = 0;
	    arr.forEach(function(e, i, ar){ if (arr[i] == GINGA_MODEL[i]) score++; })

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
		    if (arr[i] == GINGA_MODEL[i]){
			result += '<font color="#191970">' + GINGA_DICT_UNICODE[arr[i]] + '</font> ';
		    }else{
			result += '<font color="#4682b4">' + GINGA_DICT_UNICODE[arr[i]] + '</font> ';
		    }
		}
	    );
	    return result;
	}
	if (d.ginga_html)
	    return;
	
	var GINGA_DICT = ['GA', 'NN', 'GI', 'MA', '**'];
	var GINGA_DICT_UNICODE = {'GA' :'&#12460;', 'NN' : '&#12531;', 'GI' : '&#12462;', 'MA' : '&#12510;', '**' : '&#65290;'};
	var GINGA_MODEL = ['GA', 'NN', 'GA', 'NN', 'GI', 'GI', 'NN', 'GI', 'NN', 'GA', 'MA', 'NN'];
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
		    ginga_hash[e] = GINGA_DICT[ginga_dict_idx];
		    if (ginga_dict_idx < 4)
			ginga_dict_idx++;
		}
		ginga_arr.push(ginga_hash[e]);
	    }
	);

	d.ginga_html = gen_ginga_html(ginga_arr);
	d.ginga_score = calc_ginga_score(ginga_arr);
    }

    // insert ginga //////////////////////////////////////////////////////////
    var _font_scale = null;

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
	if (!_font_scale){
	    var ratio = Math.floor(100*fz[0].offsetWidth / fz[1].offsetWidth);
	    _font_scale = ratio + "%";
	}
	fz[1].style.fontSize = _font_scale;
    }

    function move_form(){
	var  $ = function(id){ return document.getElementById(id); }
	var t_area = $("ftbl");
	var pos_dummy = $("ufm");

	if (t_area.style.position != "absolute")
	    return;
	t_area.style.top = pos_dummy.offsetTop + "px";
    }

    // driver //////////////////////////////////////////////////////////
    function dispatch(d){
	init_dies();
	_dice_array.forEach(function(d, i, ar){ insert_descr_ginga(d); });
    }

    return dispatch;
}

if (typeof(__dice_counter__) == "undefined"){
    console.log("start gingalize...");
    __dice_counter__ = make_dice_counter();
    __dice_counter__();
    console.log("done.");
}
