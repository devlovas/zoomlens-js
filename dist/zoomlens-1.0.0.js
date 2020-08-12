/**
 * zoomlens-js v1.0.0
 * Licensed MIT for open source use.
 * Copyright(c)2020-present, Dev Lovas.
 * Github: https://github.com/devlovas/zoomlens-js
 * E-mail: <devlovas@gmail.com>
 * Author: Dev Lovas.
 */
!(function(global,factory){'use strict';

	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define  === 'function' && define.amd ? define(factory) :
  (global = global || self,global.ZoomLens = factory());


})(this,function(){ 'use strict';

  var

	// version number
	VERSION = 'v1.0.0',

	// element class
	BOXCLASSNAME = 'zoom-lens',

	// subclass
	MZMCLASSNAME = {mmoc:Mmoc, zoom:Zoom, mask:Mask, pics:Pics},

	// public style
	STYLETEXTELS = {top:0,left:0,margin:0,border:0,padding:0,position:'absolute'},

	/************************************/
	/**
	 *
	 * Default configuration item
	 */

	CONFIGURATION = {
		// default setting
		config: {

			/**
			 * html Target node
			 */
			el             : null,

			/**
			 * param image path
			 */ 
			paths          : null,

			/**
			 *
			 * state of 'mask' and 'zoom'
       * If one party's size changes, the other party will also be affected by it
			 */
			correlate      : true,

			/**
			 *
			 * Scale of 'Zoom' -> for 'mask'
			 */
			zoomScale      : .38,

			/**
			 *
			 * Whether 'Zoom' allows resizing
			 */ 
			zoomResize     : false,

			/**
			 *
			 * The layout of 'Zoom'
			 */ 
			zoomSeat       : 'right',

			/**
			 *
			 * The layout of 'Pics'
			 */ 
			picsSeat       : 'bottom',

			/**
			 *
			 * 'Mask' draws point spacing
			 */
			dotGap         : 1,

			/**
			 *
			 * 'Mask' draws the dot size
			 */
			dotSize        : [1,1],

			/**
			 *
			 * 'Mask' paints dots
			 */
			dotColor	   : '#36c',

			/**
			 *
			 * The spacing of the images
			 */ 
			imgGap         : 10,

			/**
			 *
			 * Slow delay value for ul element under 'Pics'
			 */
			picsSpeed      : .2,

			/**
			 *
			 *	Duration of adsorption animation performed after a ul element under 'Pics' crosses a boundary
			 */ 
			adsorbSpeed    : .2,

			/**
			 *
			 * The border value of the selected image under 'Pics'
			 */
			imgBorder	   : '1px solid #666',

			/**
			 *
			 * Mode: normal / inside / drag
			 */
			zoomType	   : 'normal'
		},

		// Default style
		styles: {
			mmoc: {
				width: 300,
				height: 200,
				border: '1px solid #222'
			},
			zoom: {
				width:  0,
				height: 0
			},
			mask: {
				width: 80,
				height: 80
			},
			pics: {
				width:  0,
				height: 0
			}
		}
	}


	/***********************************/
	/**
	 * subtools
	 */

	function Mmoc(){}
	function Zoom(){}
	function Mask(){}
	function Pics(){}

	/**
	 *
	 * The main tool
	 */ 

	var ZoomLens = function(ops){

		// If the key attribute 'el' or 'paths' is missing, the program terminates execution
		if( !(ops && 'el' in ops && 'paths' in ops)){
			throw new Error('Missing the necessary parameters "el" or "paths".');
		}


		return new ZoomLens.Fn.Init(ops);
	}

	ZoomLens.Fn = ZoomLens.prototype;

	ZoomLens.Fn.version = VERSION;

	ZoomLens.Fn.extend  = function(o){

		for(var k in o) this[k] = o[k];
	}

	// This is equivalent to Object. Create under Es6
	ZoomLens.Fn.sProto = function(){
		function F(){};F.prototype = ZoomLens.Fn;
		return new F;
	}

	function forEach(data,callback,thisArg){
		var dataType = Object.prototype.toString.call(data);

		if('[object Object]' == dataType){
			for(var key in data){
				callback.call(thisArg,data[key],key);
			}
		}

		if('[object Array]' == dataType){
			for(var idx=0;idx<data.length;idx++){
				callback.call(thisArg,data[idx],idx);
			}
		}
	}

	forEach(MZMCLASSNAME,function(Func,name){
		Func.Fn = Func.prototype = ZoomLens.Fn.sProto();

		Func.Fn.extend = function(o){
			for(var key in o){
				this[key] = o[key];
			}
		}

		Func.Fn.constructor = Func;
		Func.Fn.name = name;
	})

	/***********************************************************/
	function clone(obj){
		var key,temp = {}

		for(key in obj){
			temp[key] = obj[key];
		}

		return temp;
	}

	function suspend(fn,sec){
		var fn = fn, sec = sec || 1;
		(function(fn,sec){ setTimeout(fn,sec) })(fn,sec);
	}

	function waitFor(fn,sec){
		var fn = fn, sec = sec || 1;

		(function(fn,sec){

			var sign,timer = setInterval(function(){

				if( fn(timer) ) sign = true,clearInterval(timer);

			},sec)

			// Timeout 30 seconds to turn off the timer
			suspend(function(){
				if(!sign){
					console.warn(timer,':: run suspend!')
					clearInterval(timer)
				}
			},30000)

		})(fn,sec);
	}

	function addEvent(target,type,fn){
		// Advanced browser
		if(!!target.addEventListener){
			target.addEventListener(type,fn);
		}

		// Compatible with Internet Explorer
		else if(!!target.attachEvent){
			target.attachEvent('on'+type,fn);
		}
	}

	function removeEvent(target,type,fn){
		// Advanced browser
		if(!!target.addEventListener){
			target.removeEventListener(type,fn);
		}

		// Compatible with Internet Explorer
		else if(!!target.attachEvent){
			target.detachEvent('on'+type,fn);
		}
	}

	function getElement(target){
		if(/^\[object HTML.+Element\]$/.test(Object.prototype.toString.call(target))){ return target }

		if(target.charAt(0) == '#'){
			return document.getElementById(target.slice(1));
		}
	}

	function getZoomScale(value){
		// Check that the values given by the user meet the requirements
		return value > 1 ? 1 : value < 0 ? 0 : value;
	}

	function getPicsSpeed(value){
		// Check that the values given by the user meet the requirements
		return value > 1 ? 1 : value < 0 ? 0 : value;
	}

	function getAdsorbSpeed(value){
		// Check that the values given by the user meet the requirements
		return value > 1 ? 1 : value < 0 ? 0 : value;
	}

	function getCursorPos(){
		/**
		 * 
		 * Gets the coordinate value of the current mouse in the page
		 */ 

		if(!!event.pageX){

			return {

				pageX: event.pageX,
				pageY: event.pageY
			}
		}

		return {

			pageX: event.clientX +
			document.body.scrollLeft +
			document.documentElement.scrollLeft,

			pageY: event.clientY +
			document.body.scrollTop +
			document.documentElement.scrollTop
		}
	}

	function setCursorStyle(elemStyle,type){

		if(elemStyle.cursor != type) elemStyle.cursor = type;
	}

	function bindDragEvent(target,downFunc,moveFunc,removeFunc){
		/**
		 *
		 * Binds a mouse drag event to the specified element
		 */

		var pack = {};	// Store temporary data

		function move(){

			// Mouse moved
			moveFunc(pack);
		}

		function remove(){

			// The mouse is lifted
			removeFunc(pack);

			// Removes mouse movement events
			// Remove the mouse lift event
			removeEvent(document,'mousemove',move);
			removeEvent(document,'mouseup',remove);
		}

		function mousedown(){

			// The mouse is pressed
			downFunc(pack);

			// Bind mouse movement events
			// Bind the mouse lift event
			addEvent(document,'mousemove',move);
			addEvent(document,'mouseup',remove);
		}

		addEvent(target,'mousedown',mousedown)
	}

	function removeSelected(){
		/**
		 *
		 * Cancels all currently selected elements on the page
		 */ 
		try{

			// Compatible with Internet Explorer
			!!document.selection && document.selection.empty();

			// Compatible with advanced browsers
			!!window.getSelection && window.getSelection().removeAllRanges();
		}catch(e){}
	}

	function showOrHideElem(elemStyle,type){
		/**
		 *
		 * Toggles the display state of the element
		 */ 

		type = !type ? 'none' : 'block';
		if(elemStyle.display != type){ elemStyle.display = type};
	}

	function setBgTransparency(elemStyle,scale){
		/**
		 *
		 * Sets a transparent background for the specified element
		 */

		elemStyle.filter = 'alpha(opacity='+scale*100+')' // Compatible with Internet Explorer
		elemStyle.opacity = scale;
	}

	function nodeFormat(tagName,props,children){

		return { tagName:tagName,props:props,children:children }
	}

	/***********************************************************/
	ZoomLens.Fn.extend({
		toCss: function(obj){
			/**
			 *
			 * This method converts the object into a browser-recognized Css style string
			 */ 
			var tempStr = '',

			// Elements that need to be suffixed with 'px'
			regExps = /^top$|^left$|^width$|^height$|^padding$|^margin$/;


			forEach(obj,function(value,key){

				if(regExps.test(key)){
					value = value.toString();

					// Add the suffix 'PX' to it according to the rule
					value = value[value.length-1] != '%' ? value+'px' : value;
				}

				// Concatenates key-value pairs into new strings
				tempStr += key+':'+value+';'
			})

			return tempStr;
		},

		finder: function(target){
			if(!!this.name){ return this.great.subsets[target];
			}else{ return this.subsets[target] }
		},

		setSize: function(width,height){

			this.getSize(function(width,height,element){
				element.style.width = width;
				element.style.height = height;
			})
		},
		setAttrs: function(elem,data){
			forEach(data,function(value,key){
				switch(key){

					// Set the name of the class
					case 'cls':
					elem.className = value; break;

					// Set the style
					case 'style':
					elem.style.cssText = this.toCss(value); break;

					// Set other properties
					default: elem.setAttribute(key,value);
				}
			},this)
		},
		saveNode: function(node){
			this.great.element.children.push(node);
			this.element = node;
		},

		setImgSize: function(idx){
			this.getImgSize(idx,function(width,height,element){
				element.style.width  = width;
				element.style.height = height;
			})
		},
		setImgSeat: function(idx){
			this.getImgSeat(idx,function(offsetX,offsetY,element){
				element.style.top  = offsetY;
				element.style.left = offsetX;
			})
		},
		setLocation: function(){
			// Gets its offset on the page
			this.getLocation(function(offsetX,offsetY,element){
				element.style.top = offsetY;
				element.style.left = offsetX;
			})
		},

		updateElems: function(node,boxs){
			/**
			 *
			 * This method is used to create HTML elements，
			 * Generate nodes in the virtual DOM as HTML elements that are recognized by the browser
			 */ 

			node = node || this.element;
			var elem = document.createElement(node.tagName);


			// Set element properties
			this.setAttrs(elem,node.props);

			// If it contains child nodes
			if('children' in node){

				/**
				 * Iterate through the child nodes; Perform a recursive operation to create a new element
				 */
				forEach(node.children,function(children){
					this.updateElems(children,elem)
				},this)
			}

			// Adds the created HTML element to the parent node
			if(!!boxs) boxs.appendChild(elem);

			node.tag = elem; // Store the created HTML elements in the virtual DOM
		},



		getImgPaths: function(){
			var paths = this.datum.paths;
			switch(this.name){
				case 'mmoc':
				case 'pics': return 'min' in paths ? paths.min : paths;
				case 'zoom': return 'max' in paths ? paths.max : paths;
			}
		},
		getLocation: function(callback){

			var data = this.calcLocation(),

			// Store the resulting offsets in the node
			elementNode = this.element.data = {};
			elementNode.offsetX = data.offsetX;
			elementNode.offsetY = data.offsetY;

			callback(data.offsetX,data.offsetY,this)
		},
		getCurrImgNode: function(){
			var imgIndex = this.finder('pics').element.data.imgChecked || 0;

			// Get the image currently displayed under 'MMOC' or 'ZOOM'
			return this.finder(this.name).element.children[imgIndex];
		},

		calcLocation: function(){
			var 
			tmW = 0,
			tmH = 0,

			key = this.name+'Seat',
			seat = this.datum[key],

			offsetY = this.style.top,
			offsetX = this.style.left,

			mmocData = this.finder('mmoc').getData();

			if(!!seat){

				switch(seat){
					case 'top': tmH = -this.style.height,offsetY = -offsetY; break;
					case 'left': tmW = -this.style.width,offsetX = -offsetX; break;
					case 'right': tmW = mmocData.maxWidth; break;
					case 'bottom': tmH = mmocData.maxHeight; break;
				}

				offsetX = offsetX + mmocData.offsetX + tmW;
				offsetY = offsetY + mmocData.offsetY + tmH;
			}

			return {
				offsetX : offsetX,
				offsetY : offsetY
			}
		},

		upStyles: function(name,data){
			/**
			 *
			 * Update style values in the subclass tool
			 */

			forEach(data,function(value,key){
				this.finder(name).style[key] = value;
			},this)
		},
		upSetting: function(data){
			/**
			 *
			 * Update the configuration values in the instance
			 */

			forEach(data,function(value,key){
				this.setting[key] = value;
			},this)
		},
		upConfIntoSetting: function(){
			/**
			 *
			 * Updates the default configuration in the system to the subtool class instance object
			 */

			// Add the default configuration to the instance
			this.upSetting(CONFIGURATION.config)

			// Update the common style to the subset
			forEach(this.subsets,function(subset){
				subset.style = clone(STYLETEXTELS);
			})

			// Update the default style to the subset
			forEach(CONFIGURATION.styles,function(value,key){
				this.upStyles(key,value);
			},this)
		},
		upUserIntoSetting: function(ops){

			// Saves the user's configuration value to the tempData temporary object
			var tempData = {};

			forEach(ops,function(value,key){

				// In addition to 'styles', other 'key values' are uniformly treated as user configuration values
				if(key != 'styles'){

					if(key == 'el'){ ops[key] = getElement(value) }
					if(key == 'zoomScale'){ ops[key] = getZoomScale(value) }
					if(key == 'picsSpeed'){ ops[key] = getPicsSpeed(value) }
					if(key == 'adsorbSpeed'){ ops[key] = getAdsorbSpeed(value) }

					tempData[key] = ops[key];
				}else{

					// Update the default style to the subset
					forEach(ops.styles,function(value,key){
						this.upStyles(key,value);
					},this)

				}
			},this)

			// Update the user configuration value to the instance object
			this.upSetting(tempData)
		}
	})

	/***********************************************************/
	Mmoc.Fn.extend({ 
		getData: function(){
			var
			mmocStyle = this.style,
			mmocBorder = this.getBorder(),
			mmocPadding = this.getPadding();

			return {

				offsetY   : mmocStyle.top,
				offsetX   : mmocStyle.left,

				// Includes border and spacing
				maxWidth  : mmocStyle.width  + (mmocBorder+mmocPadding)*2,
				maxHeight : mmocStyle.height + (mmocBorder+mmocPadding)*2
			}
		},
		getBorder: function(){

			return +(this.style.border+'').match(/\d+/)[0];
		},
		getOffset: function(){
			var mmocElem = this.element.tag;
			return {
				offsetY: mmocElem.offsetTop,
				offsetX: mmocElem.offsetLeft
			}
		},
		getPadding: function(){

			return this.style.padding;
		},
		getImgSize: function(idx,callback){
			var 
			mmoc = this,
			mmocWidth  = this.style.width,
			mmocHeight = this.style.height,
			mmocImgNode = this.element.children[idx],

			/**
			 *
			 * To prevent the Image under IE from obtaining its width and height value when its state is display: none, 
			 * so build an Image object and use it instead
			 */
			imgElem = new Image;

			// Set the image path
			imgElem.src = this.getImgPaths()[idx];

			waitFor(function(){

				var 
				imgWidth  = imgElem.width,
				imgHeight = imgElem.height;

				if(!!imgWidth && !!imgHeight && !!mmocImgNode.tag){

					// Calculate the imG element size so that it does not exceed the 'MMOC' visible region
					var percent = mmocWidth / imgWidth;

					if(imgHeight * percent > mmocHeight){

						/**
						 *
						 * After the first round of calculation, if the height of the image still exceeds the 'MMOC' area, 
						 * the height of the IMG element is used as the base point to calculate again, 
						 * strictly ensuring that the width and height of the IMG element do not exceed the visible area of the 'MMOC'
						 */
						percent = mmocHeight / imgHeight;
					}

					imgWidth  = percent * imgWidth;
					imgHeight = percent * imgHeight;

					// The computed final width and height is stored in the node
					var mmocImgNodeData = mmocImgNode.data = {};
					mmocImgNodeData.width = imgWidth;
					mmocImgNodeData.height = imgHeight;

					callback(imgWidth+'px',imgHeight+'px',mmocImgNode.tag)
					return true;
				}
			})
		},
		getImgSeat: function(idx,callback){
			/**
			 *
			 * This method is used to center the image Settings under 'Mmoc'
			 */

			var 
			mmoc = this,
			mmocData = this.getData();

			waitFor(function(){

				var mmocImgNode = mmoc.element.children[idx];

				if(!!mmocImgNode.data && 
					!!mmocImgNode.data.width && 
					!!mmocImgNode.data.height){

					var 

					/**
					 *
					 * The offset of the image under 'Mmoc' 
					 * = (the maximum width and height of 'MMOC' minus the width and height of the image under 'MMOC') 
					 * divided by 2 minus the border size of the 'Mmoc'
					 */
					offsetX = (mmocData.maxWidth  - mmocImgNode.data.width)  / 2 - mmoc.getBorder(),
					offsetY = (mmocData.maxHeight - mmocImgNode.data.height) / 2 - mmoc.getBorder();

					// The calculated offsets are stored in their nodes
					mmocImgNode.data.offsetX = offsetX;
					mmocImgNode.data.offsetY = offsetY;

					callback(
						offsetX+'px', offsetY+'px',
						mmocImgNode.tag
					)

					return true;
				}
			})
		}
	})

	Zoom.Fn.extend({
		getSize: function(callback){
			var 
			zoom = this,
			zoomNode = this.element;

			if(this.datum.zoomType == 'inside'){

				waitFor(function(){

					var 
					zoomElem = zoom.element.tag,
					mmocCurrImgNode = zoom.finder('mmoc').getCurrImgNode();

					if(!!zoomElem && !!mmocCurrImgNode.data){

						var
						width = mmocCurrImgNode.data.width,
						height = mmocCurrImgNode.data.height;

						zoomNode.data.width  = width;
						zoomNode.data.height = height;

						callback(width+'px',height+'px',zoomElem);

						return true;
					}
				})
			}
		},
		upImgSeat: function(){
			
			// Get the image currently displayed under 'Zoom'
			var zoomCurrImgNode = this.getCurrImgNode();

			// Resets the position of the image currently displayed under 'Zoom'
			this.setImgSeat(this.finder('pics').element.data.imgChecked)
		},
		upLocation: function(){

			var 
			zoom = this,
			mmoc = this.finder('mmoc');

			if(this.datum.zoomType == 'inside'){

				waitFor(function(){

					var
					mmocBorder = mmoc.getBorder(),
					mmocOffset = mmoc.getOffset(),
					zoomElemData = zoom.element.data,
					mmocCurrImgNode = mmoc.getCurrImgNode();

					if(!!zoomElemData && mmocCurrImgNode.data){

						var
						offsetX = mmocCurrImgNode.data.offsetX + mmocOffset.offsetX + mmocBorder,
						offsetY = mmocCurrImgNode.data.offsetY + mmocOffset.offsetY + mmocBorder;

						// Reset the offset of 'Zoom'
						zoom.element.tag.style.top  = offsetY +'px';
						zoom.element.tag.style.left = offsetX +'px';

						// Stores the newly acquired offset bits into its nodes
						zoomElemData.offsetX = offsetX;
						zoomElemData.offsetY = offsetY;

						return true;
					}
				})
			}
		},
		getImgSize: function(idx,callback){

			var 
			zoom = this,mask = this.finder('mask'),
			zoomImgNode = this.element.children[idx],
			mmocImgNode = this.finder('mmoc').element.children[idx];

			waitFor(function(){

				if(!!mmocImgNode.data && 
					!!mmocImgNode.data.width && 
					!!mmocImgNode.data.height && !!zoomImgNode.tag){

					var 
					zoomWidth  = zoom.element.data.width  || zoom.style.width,
					zoomHeight = zoom.element.data.height || zoom.style.height,

					maskWidth  = mask.element.data.width  || mask.style.width,
					maskHeight = mask.element.data.height || mask.style.height,

			 		// Image size under 'ZOOM' = Image size under 'zoom'/('mask'/image size under 'MMOC')
					zoomImgWidth  = zoomWidth  / (maskWidth  / mmocImgNode.data.width),
					zoomImgHeight = zoomHeight / (maskHeight / mmocImgNode.data.height);

					// The calculated width and height values are stored in its nodes
					var zoomImgNodeData = zoomImgNode.data = {};
					zoomImgNode.data.width = zoomImgWidth;
					zoomImgNode.data.height = zoomImgHeight;

					callback(zoomImgWidth+'px',zoomImgHeight+'px',zoomImgNode.tag)
					return true;
				}
			})
		},
		getImgSeat: function(idx,callback){

			/**
			 *
			 * The offset of the 'zoom' image 
			 * = the offset of the 'mask' image/the width and height of the 'MMOC' image * the width and height of the 'ZOOM' image
			 */

			var 
			zoom = this,
			mmoc = this.finder('mmoc'),
			mask = this.finder('mask'),

			mmocImgNode = mmoc.element.children[idx],
			zoomImgNode = zoom.element.children[idx],
			maskNodeData = mask.element.data;

			function calcImgSeat(){

				var mmocImgNodeData = mmocImgNode.data,

				// 'Mask' moving distance in 'mMOc' picture (percentage)
				percentX = (maskNodeData.offsetX - mmocImgNodeData.minEdgeX) / mmocImgNodeData.width,
				percentY = (maskNodeData.offsetY - mmocImgNodeData.minEdgeY) / mmocImgNodeData.height;

				return {
					offsetX: -percentX * zoomImgNode.data.width,
					offsetY: -percentY * zoomImgNode.data.height
				}
			}

			function isCanCalcImgSeat(){

				if(!!maskNodeData && 
					!!mmocImgNode.data &&
					!!zoomImgNode.data &&
					!!maskNodeData.offsetX &&
					!!maskNodeData.offsetY &&
					typeof mmocImgNode.data.minEdgeX != 'undefined' &&
					typeof mmocImgNode.data.minEdgeY != 'undefined'
				){ return true }else{ return false }

			}

			if( isCanCalcImgSeat() ){
				var data = calcImgSeat();

				// Stores the offset of the 'ZOOM' image to its node
				zoomImgNode.data.offsetX = data.offsetX;
				zoomImgNode.data.offsetY = data.offsetY;

				callback(data.offsetX +'px',data.offsetY +'px',zoomImgNode.tag )
			}else{

				// Gets the smallest movable boundary of the 'mask'
				mask.getMoveableArea(idx);

				// Calculates the offset of a 'mask' in a 'MMOc' picture
				waitFor(function(){

					// Gets the latest value of 'data' under the 'mask' node
					maskNodeData = mask.element.data;

					if( isCanCalcImgSeat() ){

						var data = calcImgSeat();

						// Stores the offset of the 'ZOOM' image to its node
						zoomImgNode.data.offsetX = data.offsetX;
						zoomImgNode.data.offsetY = data.offsetY;

						callback(data.offsetX +'px',data.offsetY +'px',zoomImgNode.tag )

						return true;
					}

				})
			}
		}
	})

	Mask.Fn.extend({
		move: function(){
			var 
			mask = this,
			zoom = this.finder('zoom'),
			maskElemStyle = this.element.tag.style,
			zoomElemStyle = zoom.element.tag.style;

			// Hide the 'mask' element
			// Hide the 'zoom' element
			showOrHideElem(maskElemStyle,0);
			showOrHideElem(zoomElemStyle,0);

			addEvent(document,'mousemove',function(){

				// Detects if the cursor hovers over the image under 'mmoc'
				if(mask.isCanMove()){

					// Update the 'mask' position
					mask.upLocation();

					// Update the location of the larger image
					zoom.upImgSeat();

					// Unselect the selected element
					removeSelected();

					if(mask.datum.zoomType != 'inside'){

						// Show 'mask' and 'zoom' elements
						showOrHideElem(maskElemStyle,1);
						showOrHideElem(zoomElemStyle,1);
					}else{
						showOrHideElem(zoomElemStyle,1);
						setCursorStyle(zoomElemStyle,'crosshair');
					}

					// Set cursor style
					setCursorStyle(maskElemStyle,'crosshair');
				}else{

					// Hide 'mask' and 'zoom' elements
					showOrHideElem(maskElemStyle,0);
					showOrHideElem(zoomElemStyle,0);
				}
			})
		},
		drag: function(){
			var 
			mask = this,
			zoom = this.finder('zoom'),
			maskElemStyle = this.element.tag.style;

			// Set cursor style
			setCursorStyle(maskElemStyle,'pointer');

			bindDragEvent(this.element.tag,
			function(){ // MouseDown

				// Record the coordinate point when the mouse is currently pressed
				mask.element.data.lastCoordX = event.offsetX;
				mask.element.data.lastCoordY = event.offsetY;

				// Set cursor style
				setCursorStyle(maskElemStyle,'move');

			},function(){ // mousemove

				// Update the 'mask' position
				mask.upLocation();

				// Update the location of the larger image
				zoom.upImgSeat();

				// Unselect the selected element
				removeSelected();

			},function(){ // MouseUP

				// Restore cursor style
				setCursorStyle(maskElemStyle,'pointer');
			})
		},
		getSize: function(callback){
			var
			mask = this,
			mmoc = this.finder('mmoc'),
			zoomScale = this.datum.zoomScale,
			mmocCurrImgNode = mmoc.getCurrImgNode();

			waitFor(function(){
				if(!!mmocCurrImgNode.data){

					var
					maskWidth  = mmocCurrImgNode.data.width  / (zoomScale*10),
					maskHeight = mmocCurrImgNode.data.height / (zoomScale*10);

					// Stores the newly obtained dimensions in its nodes
					mask.element.data.width  = maskWidth;
					mask.element.data.height = maskHeight;

					callback(maskWidth+'px',maskHeight+'px',mask.element.tag)
				}

				return true;
			})

		},
		isCanMove: function(){
			var 
			mouse = getCursorPos(),
			imgIndex = this.finder('pics').element.data.imgChecked,

			// Gets the image currently displayed under 'mmoc'
			mmocCurrImgNode = this.finder('mmoc').element.children[imgIndex];

			if(
				!!mmocCurrImgNode.data &&
				mouse.pageX >= mmocCurrImgNode.data.minEdgeX &&
				mouse.pageY >= mmocCurrImgNode.data.minEdgeY &&
				mouse.pageX <= mmocCurrImgNode.data.maxEdgeX &&
				mouse.pageY <= mmocCurrImgNode.data.maxEdgeY 
			){ return true }else{ return false }
		},
		upLocation: function(){
			var 

			mouse = getCursorPos(),

			maskWt = this.element.data.width,
			maskHt = this.element.data.height,

			// Gets the image currently displayed under 'mmoc'
			mmocCurrImgNodeData = this.finder('mmoc').getCurrImgNode().data;

			if(this.datum.zoomType == 'drag'){
				var 

				// Click the mouse to the location of the event
				offsetX = mouse.pageX - this.element.data.lastCoordX,
				offsetY = mouse.pageY - this.element.data.lastCoordY;
			}else{

				var 

				// Position the mouse in the middle of the 'mask'
				offsetX = mouse.pageX - maskWt/2,
				offsetY = mouse.pageY - maskHt/2;
			}


			// Beyond the minimum boundary, take the minimum boundary
			offsetX = offsetX < mmocCurrImgNodeData.minEdgeX ? mmocCurrImgNodeData.minEdgeX : offsetX;
			offsetY = offsetY < mmocCurrImgNodeData.minEdgeY ? mmocCurrImgNodeData.minEdgeY : offsetY;

			// Beyond the maximum boundary, take the maximum boundary
			offsetX = offsetX > mmocCurrImgNodeData.maxEdgeX - maskWt ? mmocCurrImgNodeData.maxEdgeX - maskWt : offsetX;
			offsetY = offsetY > mmocCurrImgNodeData.maxEdgeY - maskHt ? mmocCurrImgNodeData.maxEdgeY - maskHt : offsetY;

			// Updates the resulting offset bit to its node
			this.element.data.offsetX = offsetX;
			this.element.data.offsetY = offsetY;

			// Reset the position of 'mask'
			this.setLocation();
		},
		getLocation: function(callback){
			var  data = this.getCenterAlign();

			if(!!this.element.data &&
				typeof this.element.data.offsetX != 'undefined' &&
				typeof this.element.data.offsetY != 'undefined'
			){

				callback(

					// 'Mask' moves the callback that the event performs
					this.element.data.offsetX +'px',
					this.element.data.offsetY +'px',
					this.element.tag
				)

			}else{

				// Stores the offsets of the 'mask' into its nodes
				var maskNodeData = this.element.data;
				maskNodeData.offsetX = data.offsetX;
				maskNodeData.offsetY = data.offsetY;

				// The first time 'mask' locates the callback to be executed
				callback(data.offsetX,data.offsetY,this)
			}

		},
		getLoopData: function(){
			var

			gap = this.datum.dotGap,

			// length-width ratio
			sizeX = this.datum.dotSize[0],
			sizeY = this.datum.dotSize[1],

			//  recurring number
			loopX = (this.style.width  / (gap+sizeX)).toFixed(),
			loopY = (this.style.height / (gap+sizeX)).toFixed(),

			// Partial feet long
			stepX = sizeX+(this.style.width-loopX*sizeX) /(loopX-1),
			stepY = sizeY+(this.style.height-loopY*sizeY) /(loopY-1);

			return {
				loopX: loopX,loopY: loopY,
				sizeX: sizeX,sizeY: sizeY,
				stepX: stepX,stepY: stepY
			}
		},
		getDrawTool: function(){
			var ctx = this.element.tag.getContext('2d');

			//Set the width and height of the canvas
			ctx.canvas.width  = this.style.width;
			ctx.canvas.height = this.style.height;

			// Set the color of the dot
			ctx.fillStyle = this.datum.dotColor;

			return ctx
		},
		drawingStyle: function(type,ctx){

			var 
			i,j,
			html = '',
			data = this.getLoopData();

			for(i=0;i<data.loopX;i++){
				for(j=0;j<data.loopY;j++){

					if(type == 'can'){

						ctx.fillRect(i*data.stepX,j*data.stepY,data.sizeX,data.sizeY)

					}else{
						var spanElem = document.createElement('span'),
						spanElemStyle = spanElem.style;

						// Add default styles to span labels
						spanElemStyle.cssText = this.toCss(STYLETEXTELS);

						spanElemStyle.top     = j*data.stepY;
						spanElemStyle.left    = i*data.stepX;
						spanElemStyle.width   = data.sizeX +'px';
						spanElemStyle.height  = data.sizeY +'px';
						spanElemStyle.background = this.datum.dotColor;
						spanElemStyle.overflow = 'hidden';	// Prevent low pixel overflow from lower version of Internet Explorer

						html += spanElem.outerHTML;
					}

				}
			}

			if(type == 'div'){
				this.element.tag.innerHTML = html;
				this.element.tag.appendChild(this.element.children[0].tag);
			}
		},
		setCenterAlign: function(){
			var 
			data = this.getCenterAlign(),
			maskElemStyle = this.element.tag.style;

			maskElemStyle.top  = data.offsetY +'px';
			maskElemStyle.left = data.offsetX +'px';

			// Record the current offset to its node
			this.element.data.offsetX = data.offsetX;
			this.element.data.offsetY = data.offsetY;
		},
		getCenterAlign: function(){
			var mmocData = this.finder('mmoc').getData();

			return {
				offsetX: mmocData.offsetX + mmocData.maxWidth  /2 - this.style.width/2,
				offsetY: mmocData.offsetY + mmocData.maxHeight /2 - this.style.height/2
			}
		},
		getMoveableArea: function(idx){

			var
			mask = this,
			mmoc = this.finder('mmoc'),
			imgNode  = mmoc.element.children[idx],

			// The minimum boundary
			minEdgeY = mmoc.style.top  + mmoc.getBorder(),
			minEdgeX = mmoc.style.left + mmoc.getBorder();

			waitFor(function(){

				if(!!imgNode.data && 
					typeof imgNode.data.offsetX != 'undefined' &&
					typeof imgNode.data.offsetY != 'undefined'){

					minEdgeX = minEdgeX + imgNode.data.offsetX;
					minEdgeY = minEdgeY + imgNode.data.offsetY;

					// The 'mask' movable boundary value in each image is stored in the image node under its corresponding 'mmoc'
					imgNode.data.minEdgeX = minEdgeX;
					imgNode.data.minEdgeY = minEdgeY;
					imgNode.data.maxEdgeX = minEdgeX + imgNode.data.width;
					imgNode.data.maxEdgeY = minEdgeY + imgNode.data.height;

					return true;
				}
			})
		}
	})

	Pics.Fn.extend({
		drag: function(){

			var pics = this,

			// The UL element used to place the picture
			ulElem = this.element.children[0].tag,
			spanElem = this.element.children[1].tag;

			// Set cursor style
			spanElem.style.cursor = 'pointer';

			function jumperSwitch(pack){
				/**
				 *
				 * Specifies the orientation and offset that ul elements need to change
				 */ 

				if(/^left$|^right$/.test(pics.datum.picsSeat)){ 
					pack.changer = ['top','differentY'];
				}else{ 
					pack.changer = ['left','differentX'];
				}
			}

			function updateUlElemOffset(pack){

				var 
				minus  = pack[pack.changer[1]],

				// Gets the traversal of the current UL element
				offset = parseFloat(ulElem.style[pack.changer[0]]);

				// Limit the maximum distance a UL element can move when it exceeds a specified range
				if(offset > 0 || offset < pics.getData().minEdge){
					pack[pack.changer[1]] = 0; minus *= 0.1;
				}

				// Sets the offset value of the UL element
				ulElem.style[pack.changer[0]] = offset + minus + 'px';
			}

			function resetUlElemOffset(type,offset){
				/**	
				 *
				 * When the UL element exceeds the boundary, the ul reset operation is performed
				 */

				// Turn on a timer to perform a slow effect
				waitFor(function(){

					offset *= 0.5;

					ulElem.style[type] = 
					parseFloat(ulElem.style[type]) - offset.toFixed() +'px';

					if(Math.abs(offset) < 0.5) return true;
				},pics.datum.adsorbSpeed*100)
			}

			bindDragEvent(this.element.tag,
				function(pack){ // MouseDown

					// Set cursor style
					spanElem.style.cursor = 'move';

					// Gets the coordinate value of the first mouse click
					var mouseCoord  = getCursorPos();
					pack.lastCoordX = mouseCoord.pageX;
					pack.lastCoordY = mouseCoord.pageY;

					// Stores the current coordinates that need to be changed
					jumperSwitch(pack);

				},function(pack){ // mousemove

					// Gets the mouse coordinates of the current point
					var mouseCoord  = getCursorPos();

					// Calculate the mouse difference between the two points
					pack.differentX = mouseCoord.pageX - pack.lastCoordX;
					pack.differentY = mouseCoord.pageY - pack.lastCoordY;

					// Update the mouse coordinates of the previous point
					pack.lastCoordX = mouseCoord.pageX;
					pack.lastCoordY = mouseCoord.pageY;

					// Update ul offset on the page
					updateUlElemOffset(pack);

					// Uncheck the selected element
					removeSelected();

				},function(pack){ // MouseUP

					// Set cursor style
					spanElem.style.cursor = 'pointer';

					// Turn on the timer after the mouse is lifted and set the slow effect of UL element
					waitFor(function(){

						pack.differentX *= 0.9;
						pack.differentY *= 0.9

						var changer = pack.changer;

						if(Math.abs(pack[changer[1]]) < 1.2){
							/**
							 * Perform 'boundary detection' when easing is over
							 */

							// The minimum movable boundary of UL is obtained
							var minEdge = pics.getData().minEdge,

							// Gets the offset of the current UL on the page
							ulOffset = parseFloat(ulElem.style[changer[0]]);
							
							// Reset the offset of ul if the current UL exceeds the specified range
							ulOffset < minEdge && resetUlElemOffset(changer[0],ulOffset - minEdge);
							ulOffset > 0 && resetUlElemOffset(changer[0],ulOffset);

							return true;
						}


						// Update ul offset on the page
						updateUlElemOffset(pack);

					},pics.datum.picsSpeed*100)
				});
		},
		hover: function(){
			var 
			pics = this,
			zoom = this.finder('zoom'),
			mask = this.finder('mask'),
			zoomImgs = zoom.element.children,
			mmocImgs = this.finder('mmoc').element.children;

			zoom.datum.zoomType == 'inside' && zoom.setSize(),zoom.upLocation();

			// Records the index of the currently selected image
			pics.element.data.imgChecked = 0;

			// An image under 'pics' is hover to get the subscript of the current image
			this.imgHover(function(currentIdx,lastIdx){

				// Unselect the selected element
				removeSelected();

				// Sets the border of the currently selected image
				pics.setImgBorder(currentIdx,lastIdx);

				// Records the index of the currently selected image
				pics.element.data.imgChecked = currentIdx;

				/**
				 * Compatible with Internet Explorer:
				 * If the 'zoom' element is display: none, the image element under 'ZOOM' cannot be switched properly
				 */
				showOrHideElem(zoom.element.tag.style,1)

				// Toggle images in 'mmoc' and 'zoom'
				mmocImgs[lastIdx].tag.style.display = 'none';
				zoomImgs[lastIdx].tag.style.display = 'none';
				mmocImgs[currentIdx].tag.style.display = 'block';
				zoomImgs[currentIdx].tag.style.display = 'block';

				if(zoom.datum.zoomType == 'inside'){

					zoom.setSize();
					mask.setSize();
					zoom.upLocation();
					zoom.setImgSize(currentIdx);
				}

				// Set 'mask' to center display
				mask.setCenterAlign();

				// Update the location of the larger image
				zoom.upImgSeat();

			})
		},
		getSize: function(callback){
			var mmocData = this.finder('mmoc').getData();

			if(/^left$|^right$/.test(this.datum.picsSeat)){

				callback(
					this.style.width || 80,
					this.style.height || mmocData.maxHeight,this
				);

			}else{

				callback(
				this.style.width || mmocData.maxWidth,
				this.style.height || 80,this
				);
			}
		},
		getData: function(){
			var 

			// Picture interval under UL
			imgGap = this.datum.imgGap,

			// Image width under UL
			imgWH = this.getPicsMinLength(),

			// Number of images under UL
			imgLength = this.element.children[0].children.length,

			// Maximum length of UL element
			ulLength = imgLength * imgWH + imgLength * imgGap - imgGap,

			minEdge = (imgWH+imgGap) * imgLength - this.getPicsMaxLength() - imgGap;

			return {
				minEdge: - minEdge,
				ulLength: ulLength
			}
		},
		imgHover: function(callback){
			var pics = this, lastIdx = 0;

			// Bind the 'pics' element to a mouse motion event
			addEvent(this.element.tag,'mousemove',function(){

				// Gets the image subscript
				var index = pics.getImgElemIndex();

				/**
				 *
				 * The imgHover event can only be triggered once when the mouse hovers over the IMg element;
				 * Prevent multiple triggers from causing unnecessary performance losses
				 */
				if(~index && index != lastIdx){
					callback(index,lastIdx);
					lastIdx = index;
				}
			})
		},
		getImgSize: function(idx,callback){

			// The length and width of the picture is equal to the minimum length of the pics
			var imgWH = this.getPicsMinLength(),

			imgNode = this.element.children[0].children[idx].children[0].children[0];

			callback(imgWH,imgWH,imgNode.props);
		},
		getImgSeat: function(idx,callback){

			var 
			offsetX = 0,
			offsetY = 0,
			imgNode = this.element.children[0].children[idx].children[0].children[0],
			movingStepLength = (this.datum.imgGap + this.getPicsMinLength()) * idx;

			/^left$|^right$/.test(this.datum.picsSeat)
			? offsetY = movingStepLength : offsetX = movingStepLength;

			callback(offsetX,offsetY,imgNode.props);
		},
		setImgBorder: function(currentIdx,lastIdx){

			try{

				var 
				imgWH = this.getPicsMinLength(),
				imgBorder = this.datum.imgBorder,
				ulElemNode = this.element.children[0],
				picsLastImgElem = ulElemNode.children[lastIdx].children[0].children[0].tag,
				picsCurrImgElem = ulElemNode.children[currentIdx].children[0].children[0].tag;

				// Sets the border for the selected image
				picsLastImgElem.style.border = 0;
				picsCurrImgElem.style.border = imgBorder;

				// Reset image width and height
				imgBorder = parseFloat(imgBorder);
				picsLastImgElem.style.width  = imgWH +'px';
				picsLastImgElem.style.height = imgWH +'px';
				picsCurrImgElem.style.width  = imgWH - imgBorder*2 +'px';
				picsCurrImgElem.style.height = imgWH - imgBorder*2 +'px';
			}catch(e){}
		},
		getImgElemIndex: function(){

			var type,coord,offset;
			if(/^left$|^right$/.test(this.datum.picsSeat)){
				type = 'top',coord = 'pageY',offset = 'offsetY';
			}else{ type = 'left',coord = 'pageX',offset = 'offsetX'}

			/**
			 *
			 * Find the imG subscript:
			 *	
			 * Assume imG width: 80; Img interval: 10; Mouse coordinate: 97
			 *		
			 *		Coordinates/width/((width + spacing)/ width)
			 *		97 / 80 / ((80+10)/80) = 1.0777777777777777
			 *		
			 *		Width/(width + spacing) + '= 1.07777777... 'Integral part
			 *		80 / (80+10) + 1 = 1.8888888888888888
			 *		
			 *		if 1.07777777... <= 1.88888888... 
			 *		The '1.07777777... The integer part of 'is the subscript of the picture
			 *		If the equation is not true, it indicates that the mouse is hovering over the interval and the return value should be set to -1
			 */

			// Gets the offset of the current UL element on the page
			var ulElemOffset = parseFloat(this.element.children[0].tag.style[type]),

			imgWH = this.getPicsMinLength(),

			// Gets the offset of the mouse in the UL element
			offset = Math.abs(ulElemOffset) + getCursorPos()[coord] - this.element.data[offset],

			// Calculate the mouse pointer
			result = offset/imgWH/((imgWH+this.datum.imgGap)/imgWH),

			index = parseInt(result);

			// Check the value of index
			// Checks whether the mouse is currently hovering over the image interval
			if(result > imgWH/(imgWH+this.datum.imgGap) + index){

				// Set the index value to -1 to indicate that the mouse is currently hovering over the IMg element
				index = -1;
			}

			return index;
		},
		getPicsMinLength: function(){
			/**
			 *
			 * Gets the minimum length of the 'pics'
			 */ 

			var 
			picsWidth  = this.style.width,
			picsHeight = this.style.height;

			return picsWidth < picsHeight ? picsWidth : picsHeight;
		},
		getPicsMaxLength: function(){
			/**
			 *
			 * Gets the maximum length of the 'pics'
			 */ 

			var 
			picsWidth  = this.style.width,
			picsHeight = this.style.height;

			return picsWidth > picsHeight ? picsWidth : picsHeight;
		}
	})


	/***********************************************************/
	Mmoc.Fn.extend({ 
		computeLayout: function(){ 

			// Hide the element beyond
			this.style.overflow = 'hidden';

			var imgNodes = this.element.children;

			forEach(imgNodes,function(imgNode,idx){

				// Set image size
				this.setImgSize(idx);

				// Set image position
				this.setImgSeat(idx);

				// Hide all images
				imgNode.props.style.display = 'none';
			},this)

			// Show the first picture
			waitFor(function(){
				if(!!imgNodes[0].tag){
					imgNodes[0].tag.style.display = 'block';
					return true;
				}
			})
		}
	})
	Zoom.Fn.extend({ 
		computeLayout: function(){ 

			// set size
			this.setSize();

			// set position
			this.setLocation();

			// Hide the element beyond
			this.style.overflow = 'hidden';

			var imgNodes = this.element.children;

			forEach(imgNodes,function(imgNode,idx){

				// Set image size
				this.setImgSize(idx);

				// Set image position
				this.setImgSeat(idx);

				// Hide all images
				imgNode.props.style.display = 'none';
			},this)

			// Show the first picture
			waitFor(function(){
				if(!!imgNodes[0].tag){
					imgNodes[0].tag.style.display = 'block';
					return true;
				}
			})
		}
	})
	Mask.Fn.extend({
		createElement: function(){

			var 
			mask = this,
			tagName = 'div',
			children = [],
			canvasElem = document.createElement('canvas');

			// Draw with Canvas if the browser supports canvas
			if(typeof canvasElem.getContext == 'function') {tagName = 'canvas'}else{
				children.push(nodeFormat(tagName,{style: clone(STYLETEXTELS)},[]))
			}

			// Store the generated virtual nodes in the DOM tree
			this.saveNode(nodeFormat(tagName,{cls: this.name,style: this.style},children))

			if(mask.datum.zoomType != 'inside'){

				waitFor(function(){

					if(!!mask.element.tag){

						// If the browser supports canvas, it will draw as canvas, otherwise it will draw as HTML elements
						if('canvas' == mask.element.tagName){
							mask.drawingStyle('can',mask.getDrawTool());
						}else{
							suspend(function(){
								mask.drawingStyle('div');
							},20)
						}

						return true;
					}
				})
			}
		},
		computeLayout: function(){ 

			// set position
			this.setLocation();

			var divNode = this.element.children[0];

			if(!!divNode){

				/**
				 *
				 * Compatible with Internet Explorer
				 * Prevents elements from mousedown failure without a background
				 */

				divNode.props.style.width = this.style.width;
				divNode.props.style.height = this.style.height;
				divNode.props.style.background = '#FFF';

				// Sets the element to a transparent background
				setBgTransparency(divNode.props.style,0);
			}

			this.element.data.width  = this.style.width;
			this.element.data.height = this.style.height;
		},
		triggerEvents: function(){
			var zoom = this.finder('zoom');

			this.datum.zoomType != 'drag' ? this.move() : this.drag();

			if(this.datum.zoomType == 'inside'){

				zoom.setSize();
				this.setSize();
				zoom.upLocation();
				zoom.setImgSize(0);
			}
		}
	})

	Pics.Fn.extend({ 
		createElement: function(){
			var liElem = [], children = [];

			forEach(this.getImgPaths(),function(path){

				liElem.push(

					// Add child node Li to UL
					nodeFormat('li',{style: clone(STYLETEXTELS)},[

					// Add child node A to Li
					nodeFormat('a',{style: clone(STYLETEXTELS)},[

					// Add the child node IMg to A
					nodeFormat('img',{src:path,style: clone(STYLETEXTELS)},[]) ]) ])
				)
			})

			// Add ul child node to 'pics'
			children.push(nodeFormat('ul',{style: clone(STYLETEXTELS)},liElem))

			// Add a span child node to 'pics' to prevent the drag event that triggers img and make 'mouseup' take effect
			children.push(nodeFormat('span',{style: clone(STYLETEXTELS)},[]))

			// Store the generated virtual nodes in the DOM tree	
			this.saveNode(nodeFormat('div',{cls: this.name,style: this.style},children))
		},
		computeLayout: function(){ 

			// Set size
			this.setSize();

			// set position
			this.setLocation();

			// Hide the element beyond
			this.style.overflow = 'hidden';


			var
			ulNode = this.element.children[0],
			spanNode = this.element.children[1];

			// Remove bullets for li elements under UL
			ulNode.props.style['list-style'] = 'none';

			/**
			 *
			 * Sets the style of the span element
			 */ 
			spanNode.props.style.width  = this.style.width;
			spanNode.props.style.height = this.style.height;
			spanNode.props.style.background = 'skyblue';

			// Set the background of the span element to be transparent
			setBgTransparency(spanNode.props.style,0);

			// Flat calendar li node, set the size and position of the picture under Li
			forEach(ulNode.children,function(liNode,idx){

				var imgNode = liNode.children[0].children[0];

				// Hide all images
				imgNode.props.style.display = 'none';

				// Set image size
				this.setImgSize(idx);

				// Set image position
				this.setImgSeat(idx);

				// Display images
				waitFor(function(){

					if(!!imgNode.tag){
						imgNode.tag.style.display = 'block';

						return true;
					}

				})
			},this)
		},
		triggerEvents: function(){ 

			var data = this.getData();

			// An image drag event needs to be bound only when the image is out of the display area
			data.ulLength > this.getPicsMaxLength() && this.drag();

			// Bind the 'pics' hover event
			this.hover();
		}
	})

	/***********************************************************/
	/**
	 * primary function
	 *
	 */ 

	ZoomLens.Fn.extend({
		initEeprom: function(ops){

			// The HTML root element of the main tool on the page
			this.element = nodeFormat('div',{
				cls:BOXCLASSNAME,
				style: clone(STYLETEXTELS)
			},[])

			forEach(this.subsets,function(subset){

				// Stores its corresponding element style sheet
				subset.style = {};

				// Records the currently created instance object
				subset.great = this;

				// Setting links to subtools
				subset.datum = this.setting;
			},this)

			// Update the default value to the instance object
			this.upConfIntoSetting();

			// Update the user value into the subclass tool
			this.upUserIntoSetting(ops);
		},
		createElement: function(){ 
			/**
			 *
			 * This method creates a virtual DOM node for the subclass tool that corresponds to it on the page
			 */

			if(!!this.name){
				var children = [];

				// Create images for 'Mmoc' and 'Zoom'
				forEach(this.getImgPaths(),function(path){
					children.push( nodeFormat('img',{src:path,style: clone(STYLETEXTELS)},[]))
				})

				// Store the generated virtual nodes in the DOM tree
				this.saveNode(nodeFormat('div',{cls: this.name,style: this.style},children))
			}

			// Create the corresponding virtual DOM node in the subclass tool
			forEach(this.subsets,function(subset){
				subset.createElement();
			})
		},
		computeLayout: function(){ 

			var datum = this.setting,

			zoomScale = datum.zoomScale,
			maskStyle = this.subsets.mask.style,
			zoomStyle = this.subsets.zoom.style;


			if(datum.correlate){

				if(datum.zoomResize){

					// When 'W' and 'h' of the 'zoom' are adjustable
					// The 'w' and 'h' of the 'mask' vary with the size of the 'zoom'
					maskStyle.width  = zoomStyle.width  / (zoomScale*10);
					maskStyle.height = zoomStyle.height / (zoomScale*10);
				}else{

					// When 'zoom' 'W' and 'h' are not adjustable
					// The 'W' and 'h' of the 'zoom' vary with the size of the 'mask'
					zoomStyle.width  = maskStyle.width  * (zoomScale*10);
					zoomStyle.height = maskStyle.height * (zoomScale*10);
				}

			}

			// Sets the style of the element in the subclass tool
			forEach(this.subsets,function(subset){
				subset.element.data = {};
				subset.computeLayout();
			})
		},
		drawingLayout: function(){ 

			// create Element
			this.updateElems();

			// Adds the created HTML element to the page
			if(!!this.setting.el){ this.setting.el.appendChild(this.element.tag)
			}else{ this.warn('The specified tag element could not be found!') }
		},
		triggerEvents: function(){ 
			
			forEach(this.subsets,function(subset){
				subset.triggerEvents();
			})
		}
	})

	/***********************************************************/
	/**
	 * Main tool initialization
	 *
	 */ 
	ZoomLens.Fn.Init = function(ops){

		// configuration item
		this.setting = {};

		// subtools
		this.subsets = {
			mmoc: new Mmoc,
			zoom: new Zoom,
			mask: new Mask,
			pics: new Pics
		};

		// Initial system data
		this.initEeprom(ops);

		// Create Nodes
		this.createElement();

		// Handling element styles
		this.computeLayout();

		// Render page layout
		this.drawingLayout();

		// Triggering event behavior
		this.triggerEvents();
	}

	// Associate the ZoomLens prototype to Init
	ZoomLens.Fn.Init.prototype = ZoomLens.Fn.sProto();
	ZoomLens.Fn.Init.prototype.constructor = ZoomLens.Fn.Init;

	// Return to main tool
	return ZoomLens;
});