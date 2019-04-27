function __imo_dice__() {                          
  if (typeof __imo_dice_exports__ !== "undefined") 
    return __imo_dice_exports__;                   
  let exports = {};                                
                                                   
  function jpeg_operations_constructor(image_array) {
    function on_browser() {
	if (typeof window !== 'undefined')
	    return true;
	else
	    return false;
    }

    function image_segment_length(pos) {
	if (image_array[pos] == 0xff && image_array[pos+1] == 0xda) // SOS
	    return image_array.length - pos - 2;
	else
	    throw new Error("wrong_image_array");
    }
    
    function segment_length(pos) {
	function is_sos_marker(code) {
	    return code == 0xda; // SOS
	}
	
	function is_stand_alone_marker(code) {
	    if (code == 0xd7 || // RST
		code == 0xd8 || // SOI
		code == 0xd9 || //EOI
		code == 0x01 // TEM
	       )
		return true;
	    else
		return false;
	}

	function is_valid_segment(pos) {
	    if (image_array[pos] != 0xff)
		return false;
	    let c = image_array[pos+1];

	    // marker codes https://hp.vector.co.jp/authors/VA032610/JPEGFormat/markers.htm
	    if ( c == 0x01 ||
		 (0x02 <= c && c <= 0x4e) || // reserved
		 c == 0xc0 ||
		 c == 0xc1 ||
		 c == 0xc2 ||
		 c == 0xc3 ||
		 c == 0xc4 ||
		 c == 0xc5 ||
		 c == 0xc6 ||
		 c == 0xc7 ||
		 c == 0xc8 ||
		 c == 0xc9 ||
		 c == 0xca ||
		 c == 0xcb ||
		 c == 0xcc ||
		 c == 0xcd ||
		 c == 0xce ||
		 c == 0xcf ||
		 (0xd0 <= c && c <= 0xd7) ||
		 c == 0xd8 ||
		 c == 0xd9 ||
		 c == 0xda ||
		 c == 0xdb ||
		 c == 0xdc ||
		 c == 0xdd ||
		 c == 0xde ||
		 c == 0xdf ||
		 (0xe0 <= c && c <= 0xef) || // APP
		 (0xf0 <= c && c <= 0xfd) ||
		 c == 0xfe
	       )
		return true;

	    return false;
	}
	
	let rest_length = image_array.length - pos;
	//if (rest_length < 2 || image_array[pos] != 0xff || !is_valid_marker(image))
	if (rest_length < 2 || !is_valid_segment(pos))
	    throw new Error("wrong_image_array");
	
	if (is_sos_marker(image_array[pos+1]))
	    return image_segment_length(pos);
	
	if (is_stand_alone_marker(image_array[pos+1]))
	    return 0;
	
	return 256 * image_array[pos+2] + image_array[pos+3];
    }
    
    function get_segment(pos) {
	let segment_body_len = segment_length(pos);
	let end_pos = pos + segment_body_len + 2;
	return image_array.slice(pos, end_pos);
    }

    function get_all_segments() {
	if (m_segments.length > 0 )
	    return m_segments;

	let pos = 0;
	while (pos < image_array.length) {
	    let seg = get_segment(pos);
	    pos += seg.length;
	    m_segments.push(seg);
	}

	if (m_segments.length <= 0)
	    throw new Error("wrong_image_array");

	return m_segments;
    }

    function get_image_array() { return image_array; }

    function is_comment_segment(segment) {
	if (segment[0] == 0xff && segment[1] == 0xfe) // COM
	    return true;
	else
	    return false;
    }

    function get_comment() {
	function extract_comment_str(segment) {
	    if (on_browser())  {
		return new TextDecoder('utf-8').decode( segment.slice(4) );
	    }else {
		return new Buffer( segment.slice(4) ).toString('utf-8');
	    }
	}

	for (let i=0; i<m_segments.length; i++) {
	    if (is_comment_segment(m_segments[i]))
		return extract_comment_str(m_segments[i]);
	}

	return null;
    }

    function set_comment(comment) {
	function str2u8array(str) {
	    if(on_browser()) {
		return new TextEncoder('utf-8').encode(str);
	    } else {
		let buffer = Buffer.from(str);
		return new Uint8Array(buffer);
	    }
	}

	function create_comment_segment(segment_body_array) {
	    const MaxCommentLength = 65533; // 0xffff - 2

	    if (segment_body_array.length > MaxCommentLength)
		throw new Error("Too long comment");

	    let segment_head = new Uint8Array([ 0xff, 0xfe, 0, 0]);

	    let segment_body_len = segment_body_array.length + 2;
	    segment_head[2] = Math.floor(segment_body_len / 256);
	    segment_head[3] = segment_body_len % 256;

	    let comment_segment = new Uint8Array(segment_head.length + segment_body_array.length);
	    comment_segment.set(segment_head);
	    comment_segment.set(segment_body_array, segment_head.length);

	    return comment_segment;
	}

	function concat_segments(segments) {
	    let whole_len = 0;
	    for (let i=0; i<segments.length; i++)
		whole_len += segments[i].length;

	    let buffer = new Uint8Array(whole_len);
	    let pos = 0;
	    for (let i=0; i<segments.length; i++) {
		buffer.set(segments[i], pos);
		pos += segments[i].length;
	    }

	    return buffer;
	}

	let new_segments = [];
	for (let i=0; i<m_segments.length; i++) {
	    if (!is_comment_segment(m_segments[i]))
		new_segments.push(m_segments[i]);
	}

	if (comment) {
	    let comment_segment = create_comment_segment( str2u8array(comment) );
	    new_segments.splice(new_segments.length-1, 0, comment_segment);
	}

	m_segments = new_segments;
	image_array = concat_segments(new_segments);
    }
        
    // main //////////////////////////////////////////////////////////
    let m_segments = [];
    get_all_segments();
    return {
	get_image_array : get_image_array,
	get_all_segments : get_all_segments,
	get_comment : get_comment,
	set_comment : set_comment
    };
}

exports.jpeg_operations_constructor = jpeg_operations_constructor;

function rpg_dice_html_extract() {
    /*
      rpg_dice_extract_responses doesn't hold any data.
      This object is pointers to functions which handle html document (imoge responses).

      extract() returnes array of response object.
      Each response object contains data below.

      { element: response element in document,
        dice: dice object if dice line exists in the respnse, otherwise null
      }

      dice object detail
      { dice_number : number of cast dice,
        dice_value_max: max value of dice,
	dice_addition : +X in dice rule,
	eyes: array of each dice value.
	sum: sum of eyes
      }
     */

    function extract() {
	function get_next_block_quote(elem){
	    while(elem){
		if (elem.tagName == 'BLOCKQUOTE')
		    return elem
		elem = elem.nextElementSibling
	    }
	    return null;
	}

	let result = [];
	let input_arr = document.getElementsByTagName('input');
	for(let i=0; i<input_arr.length; i++){
	    let id_match = /delcheck(\d+)/.exec(input_arr[i].getAttribute('id'))
	    if (!id_match)
		continue;

	    let bloq = get_next_block_quote(input_arr[i]);
	    if (bloq)
		result.push( { element : bloq,
			       dice : _get_dice(bloq)
			     });
	}

	return result;
    }

    function _get_dice(blocq_element) {
	const DiceFaceRegex = /<\s*font\s+color="#ff0000"\s*>\s*([^<]*)<\/\s*font\s*>/i

	let dice_line = null;
	blocq_element.innerHTML.split(/<br>/i).forEach(
	    function(ln, i, ar){
		if (ln.match(DiceFaceRegex)) {
		    dice_line = ln;
		    return;
		}
	    }
	);

	if (!dice_line)
	    return null;

	let found = dice_line.match(/dice(\d+)d(\d+)/);
	if (!found)
	    return null;

	let dice_number = Number(found[1]);
	let dice_value_max = Number(found[2]);

	let dice_addition = 0;
	found = dice_line.match(/\d\+(\d+)=/);
	if (found)
	    dice_addition = Number(found[1]);

	found = dice_line.match(DiceFaceRegex);
	if (!found)
	    return null;

	let dice_eyes = found[1];
	const ReplaceSumRegex = /\s*\(\s*(\d+)\s*\)/;
	found = dice_eyes.match(ReplaceSumRegex);
	if (!found)
	    return null;
	let sum = Number(found[1]);
	dice_eyes = dice_eyes.replace(ReplaceSumRegex, "");

	let eyes = [];
	dice_eyes.split(/\s+/).forEach(
	    function(e) {
		eyes.push(Number(e));
	    });

	return {
	    dice_number : dice_number,
	    dice_value_max : dice_value_max,
	    dice_addition : dice_addition,
	    eyes : eyes,
	    sum : sum
	};
    }

    function extract_image(strict_mode=true) {
	let alist = document.getElementsByTagName('a');

	for(let i=0; i<alist.length; i++) {
	    let a_element = alist[i];
	    let found = null;

	    if (!a_element.innerHTML.match(/\d+\.jpe?g/i))
		continue;

	    if (strict_mode && !a_element.href.match(/^https?:\/\/[^.]+\.2chan.net\//i))
		continue;

	    return _get_image_binary_promise(a_element.href);
	}

	throw new Error("no_image_in_html_error");
    }

    function _get_image_binary_promise(url, callback) {
	return new Promise(
	    function(resolve, reject) {
		let req = new XMLHttpRequest();
		req.responseType = "arraybuffer";
		req.open("GET", url);

		req.onload = function(e) {
		    let array_buffer = req.response;
		    resolve(new Uint8Array(array_buffer));
		};

		req.onerror = function(e) {
		    reject(e);
		};

		req.send(null);
	    });
    }

    return { extract: extract,
	     extract_image: extract_image
	   };
}

exports.rpg_dice_html_extract = rpg_dice_html_extract;

function rpg_dice_rule(rule_string) {
    /*
      rpg_dice_rule holds rules (m_rules). m_rules is array of rule object.
      rule object is like below.

      { name: rule_name_string,
        newline : boolean if we should newline,
	pip_value_list: list of values corresponding to dice(pip)
      }

      apply() function returns list of applied object.
      The applied object is like below.
      { disp: rule applied result. This value will be displayed,
        name: name of pip,
        value: value of dice,
	is_pip_value: boolean value is modified by pip_value_list or not,
	delimiter: '<br>' or one space ' '
      }
     */

    function parse(rule_str) {
	const MaxDiceNumber  = 10;

	function check_rule_number(sharp_number) {
	    let result = [];
	    let m = null;
	    while(m = sharp_number.match(/#(\d+)/)) {
		result.push(Number(m[1]));
		sharp_number = sharp_number.replace(/#\d+/, "");
	    }
	    return result;
	}

	rule_str = rule_str.replace(/<br>/ig, "\n");
	rule_str = rule_str.replace(/;/g, ";\n");
	rule_str = rule_str.replace(/,/g, ",\n");
	let rule_candidates = rule_str.split(/\r?\n/);

	let rules = {};
	rule_candidates.forEach(
	    function(e, i, arr) {
		let m = null;
		if (m = e.match(/^\s*(#[#\d]+)[^,;]*[,;]\s*$/)) {
		    check_rule_number(m[1]).forEach(
			function(n) {
			    if (n<0 || n>MaxDiceNumber || isNaN(n))
				throw new Error("pip_value_error");
			    let rule = parse_rule_line(m[0]);

			    // special rule #0 means all rules are smme.
			    if (n==0) {
				for (let i=1; i<=MaxDiceNumber; i++){
				    rules[i] = rule;
				}
			    } else {
				rules[n] = rule;
			    }
			}
		    );
		}
	    }
	);

	return rules;
    }

    function parse_rule_line(rule) {
	function sort_pip_value_list(pv_list) {
	    let tmp_list = [];

	    for (let i=0; i<pv_list.length; i++){
		let p_v = pv_list[i].split(/:/);
		if (p_v.length != 2)
		    throw new Error("pip_value_error");

		let pip = Number(p_v[0]);
		if (pip <= 0 || Number.isNaN(pip))
		    throw new Error("pip_value_error");

		tmp_list.push({pip:Number(p_v[0]), value:p_v[1]})
	    }

	    let duplicate_check = {}
	    for (let i=0; i<tmp_list.length; i++) {
		if (tmp_list[i].pip in duplicate_check)
		    throw new Error("pip_value_error");
		duplicate_check[ tmp_list[i].pip ] = 1;
	    }

	    return tmp_list.sort( (a, b) => { return (a.pip - b.pip); } );
	}

	let m = rule.match(/\s*[#\d]+\s+([^;,]*)([;,])/);
	if (!m)
	    return null;

	let rule_str = m[1].replace(/\s*$/, "");
	let delimiter_newline = (m[2] === ";");

	let rule_portions = rule_str.split(/\s+/);
	let rule_name = rule_portions.shift();

	return { name: rule_name,
		 newline: delimiter_newline,
		 pip_value_list: sort_pip_value_list(rule_portions)
	       };
    }

    function apply(dice_object) {
	function applied_obj(disp, name, value, is_newline=false, is_pip_value=false) {
	    return {disp : disp,
		    name : name,
		    value : value,
		    is_pip_value : is_pip_value,
		    delimiter: is_newline ? '<br>' : ' '
		   };
	}

	function apply_pip_value_list(pv_list, pip) {
	    for (let i = 0; i<pv_list.length; i++) {
		let pv_element = pv_list[i];
		if (pip <= pv_element.pip)
		    return pv_element.value;
	    }

	    return pip;
	}
	
	if (!m_rules || !dice_object)
	    return null;

	let result = [];
	let eyes = dice_object.eyes;
	for (let i=0; i<eyes.length; i++) {
	    let ri = m_rules[i+1];
	    	    
	    if (typeof(ri) === "undefined") {
		result.push( applied_obj("d"+(i+1) + ":" + eyes[i],
					 "d"+(i+1),
					 eyes[i]
					)
			   );
		continue;
	    }

	    // Special rule: if parameter name starts '#' the name is not displayed.
	    let name_str = "";
	    let name_val = "";
	    if (ri.name.length && ri.name[0] != '#') {
		name_str = ri.name + ":";
		name_val = ri.name;
	    }

	    if (ri.pip_value_list.length > 0)
		result.push( applied_obj(
		    name_str + apply_pip_value_list(ri.pip_value_list, eyes[i]),
		    name_val,
		    eyes[i],
		    ri.newline,
		    true
		) );
	    else {
		result.push( applied_obj(name_str + eyes[i],
					 name_val,
					 eyes[i],
					 ri.newline,
					 false
					)
			   );
	    }
	}

	return result;
    }

    function rules() {
	if (!m_rules || Object.keys(m_rules).length <= 0)
	    return null;

	return m_rules;
    }

    function is_valid() {
	if (!m_rules)
	    return false;

	return (Object.keys(m_rules).length > 0);
    }

    let m_rules = {};
    if (rule_string)
	m_rules = parse(rule_string);

    return { rules: rules,
	     parse : parse,
	     parse_rule_line : parse_rule_line,
	     apply : apply,
	     is_valid: is_valid
	   };
}

exports.rpg_dice_rule = rpg_dice_rule;

function rpg_dice_display() {
    const ZIndexTop = 99999;
    const BackgroundColor = "#ffffee";
    const TextColor = "#841a75";
    const ChartTextSize = 14;
    const ChartLineColor = "#000000";
    const ChartWidth = 250;
    const ChartHeight = 270;
    let m_rule = null;
    let m_chart = null;
    let m_error_display = null;

    function $get_element(id){
	return document.getElementById(id);
    }

    function get_rule(buffer) {
	if (m_rule)
	    return;

	try {
	    get_image_rule(buffer);
	} catch (e) {
	    // ignore errors while parsing rules.
	}

	get_text_rule();
    }

    function get_image_rule(buffer) {
	if (m_rule)
	    return;

	let jpeg_op = jpeg_operations_constructor(buffer);
	let rule_cand = rpg_dice_rule(jpeg_op.get_comment());
	if (rule_cand.rules())
	    m_rule = rule_cand;
    }

    function get_text_rule() {
	if (m_rule)
	    return;

	let dice_element_list = rpg_dice_html_extract().extract();
	for (let i=0; i<dice_element_list.length; i++) {
	    let elem = dice_element_list[i].element;

	    try {
		let rule_cand = rpg_dice_rule(elem.innerHTML);

		if (rule_cand.rules()) {
		    m_rule = rule_cand;
		    return;
		}
	    } catch(e) {
		// ignore errors while parsing rules.
	    }
	}
    }

    function move_form(){
	let text_area = $get_element('ftbl');
	let pos_dummy = $get_element('ufm');

	if (!text_area || !pos_dummy)
	    return;
	text_area.style.top = pos_dummy.offsetTop + 'px';
    }


    function has_displayed(element) {
	parent.ELEM = element;
	let elements = element.getElementsByClassName('imodice_show');
	return (elements.length > 0);
    }

    function append_display(element, dice) {
	let applied = m_rule.apply(dice);
	let disp = applied.map( a => a.disp + a.delimiter).join("");
	parent.APP = applied;
	let div = document.createElement('div');
	div.className = "imodice_show";
	div.innerHTML = `<font color='${TextColor}' size='-1'>${disp}</font>`;

	let names = [];
	let values = [];
	let pip_values = [];
	for (let i=0; i<applied.length; i++) {
	    if (!applied[i].is_pip_value) {
		names.push(applied[i].name);
		values.push(applied[i].value);
	    } else {
		pip_values.push(applied[i].disp);
	    }
	}

	div.onmouseover = function() {
	    show_chart(dice.dice_value_max, names, values, pip_values);
	};

	element.appendChild(div);
    }

    function show_proc() {
	if (!m_rule) {
	    throw new Error("no rule found");
	    return;
	}

	let dice_element_list = rpg_dice_html_extract().extract();
	for (let i=0; i<dice_element_list.length; i++) {
	    let element = dice_element_list[i].element;
	    if(has_displayed(element))
	       continue;

	    let dice = dice_element_list[i].dice;
	    if (dice)
		append_display(element, dice);
	}
    }

    function display_rule_error(e) {
	if (!m_error_display) {
	    m_error_display = document.createElement('div');
	    m_error_display.style.zIndex = ZIndexTop;
	    m_error_display.style.position = "fixed";
	    m_error_display.style.top = 0;
	    m_error_display.style.right = 0;
	    m_error_display.style.backgroundColor = "red";
	    m_error_display.onclick = () => m_error_display.style.display = "none";

	    document.body.appendChild(m_error_display);
	}

	let error_message = "IMODICE ERROR!:" + e.message;
	console.log(error_message);
	m_error_display.innerHTML = error_message;
	m_error_display.style.display = "";
    }

    function show(strict_mode=true) {
	if (!m_rule) {
	    rpg_dice_html_extract().
		extract_image(strict_mode).
		then(get_rule).
		then(show_proc).
		then(move_form).
		catch(display_rule_error);
	} else {
	    show_proc();
	    move_form();
	}
    }

    function hide() {
    }

    function show_chart(max_value, names, values, pip_values) {
	function pos(val, rad) {
	    let x = val/max_value*R*Math.cos(rad) + cx;
	    let y = -val/max_value*R*Math.sin(rad) + cy;

	    return {x:x, y:y};
	}

	function draw_guide_background() {
	    let rad = Math.PI/2;
	    let p = pos(max_value, rad);

	    ctx.fillStyle = BackgroundColor;
	    ctx.fillRect(0, 0, ChartWidth, ChartHeight);
	}

	function draw_label(x, y, name, value) {
	    let text = name ? `${name}:` : "";
	    text += value;
	    ctx.fillStyle = TextColor;
	    ctx.font = `${ChartTextSize}px Arial`;

	    let w = ctx.measureText(text).width;
	    let h = ChartTextSize;

	    x = (x < cx) ? x : x+h;
	    y = (y < cy) ? y : y+w;

	    x = Math.max(0, x-w/2);
	    x = Math.min(x, ChartWidth-w);
	    y = Math.max(h, y);
	    y = Math.min(y, ChartWidth-h);

	    ctx.fillText(text, x, y);
	}

	function draw_guide_foreground(N) {
	    let rad = Math.PI/2;

	    for (let i=0; i<N; i++) {
		let p = pos(max_value, rad);
		ctx.strokeStyle = ChartLineColor;
		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.lineTo(p.x, p.y);
		ctx.closePath();
		ctx.stroke();
		rad -= 2*Math.PI/N;

		draw_label(p.x, p.y, names[i], values[i]);
	    }

	    const RN = 4;
	    for (let i=1; i<=RN; i++) {
		let r = R*i/RN;
		ctx.strokeStyle = ChartLineColor;
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0.0, 2*Math.PI);
		ctx.closePath();
		ctx.stroke();
	    }
	}

	function draw_pip_text() {
	    if (pip_values.length <= 0)
		return;
	    let text = pip_values.reduce((a,b)=> a+" "+b);
	    const Margin = 4;

	    ctx.fillStyle = TextColor;
	    ctx.font = `${ChartTextSize}px Arial`;
	    ctx.fillText(text, Margin, ChartHeight-Margin, ChartWidth - 2*Margin);
	}

	if (values.length < 3) {
	    hide_chart();
	    return;
	}

	const CeilMargin = 0.10;
	let intensity = values.reduce((a,b)=>a+b) / (max_value*values.length);
	intensity = (intensity-0.5)*0.5/(0.5-CeilMargin) + 0.5;
	intensity = Math.min(1.0, intensity);
	intensity = Math.max(0.0, intensity);

	let r_col;
	let b_col;

	if (intensity < 0.50) {
	    r_col = Math.floor(2*intensity*255);
	    b_col = 255;
	} else {
	    r_col = 255;
	    b_col = Math.floor((1-2*(intensity-0.5))*255);
	}

	let graph_color = `rgb(${r_col}, 0, ${b_col})`;
	if (!m_chart) {
	    m_chart = document.createElement('canvas');
	    m_chart.id = "imodice_chart";
	    m_chart.width = ChartWidth;
	    m_chart.height = ChartHeight;
	    m_chart.style.zIndex = ZIndexTop;
	    m_chart.style.position = "fixed";
	    m_chart.style.top = 0;
	    m_chart.style.right = 0;
	    m_chart.onclick = () => hide_chart();
	    document.body.appendChild(m_chart);
	}
	let dc = $get_element('imodice_chart');
	dc.style.display = "none";

	let ctx = m_chart.getContext('2d');

	let R = ChartWidth * 0.90 / 2;
	let cx = ChartWidth/2;
	let cy = cx;
	let N = values.length;

	draw_guide_background(N);
	ctx.fillStyle = graph_color;
	let rad = Math.PI/2;
	let p = pos(values[0], rad);
	ctx.beginPath();
	ctx.moveTo(p.x, p.y);
	for (let i=1; i<N; i++) {
	    rad -= 2*Math.PI/N;
	    p = pos(values[i], rad);
	    ctx.lineTo(p.x, p.y);
	}
	ctx.closePath();
	ctx.fill();

	draw_guide_foreground(N);
	draw_pip_text();

	dc.style.display = "";
    }

    function hide_chart() {
	if (!m_chart)
	    return;

	$get_element('imodice_chart').style.display = "none";
    }

    return { show: show,
	     hide: hide,
	     show_chart: show_chart,
	     hide_chart: hide_chart
    };
}

exports.rpg_dice_display = rpg_dice_display;

                                       
                                                   
  __imo_dice_exports__ = exports;                  
  return exports;                                  
}
