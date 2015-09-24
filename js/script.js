
function drawAll() {
	////////////////////////////////////////////////////////////// 
	////////////////// Create Set-up variables  ////////////////// 
	////////////////////////////////////////////////////////////// 

	var width = $("#chart").width() - 20,
		height = (window.innerWidth < 768 ? width : window.innerHeight - 90);

	var commaFormat = d3.format(','),
		mobileSize = (window.innerWidth < 768 ? true : false);

	////////////////////////////////////////////////////////////// 
	/////////////////////// Create SVG  /////////////////////// 
	////////////////////////////////////////////////////////////// 

	var svg = d3.select("#chart").append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		 .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	////////////////////////////////////////////////////////////// 
	/////////////////////// Create Scales  /////////////////////// 
	////////////////////////////////////////////////////////////// 

	var colorCircle = d3.scale.ordinal()
			.domain([0,1,2,3])
			.range(['#bfbfbf','#838383','#4c4c4c','#1c1c1c']);
			
	var colorBar = d3.scale.ordinal()
			.domain(["16 to 19","20 to 24","25 to 34","35 to 44","45 to 54","55 to 64","65+"])
			.range(["#EFB605", "#E3690B", "#CF003E", "#991C71", "#4F54A8", "#07997E", "#7EB852"]);		

	var diameter = Math.min(width*0.9, height*0.9);
	var pack = d3.layout.pack()
		.padding(1)
		.size([diameter, diameter])
		.value(function(d) { return d.size; })
		.sort(function(d) { return d.ID; });

	////////////////////////////////////////////////////////////// 
	//////// Function | Draw the bars inside the circles ///////// 
	////////////////////////////////////////////////////////////// 

	function drawBars() {
		
		var elementsPerBar = 7,
			barChartHeight = 0.7,
			barChartHeightOffset = 0.15;
			
		//Inside each wrapper create the complete bar chart
		d3.selectAll(".barWrapperOuter")
			.each(function(d, i){ 	
				if(this.id in dataById) {
					
					barsDrawn = true;
					
					//Save current circle data in separate variable	
					var current = d,
						currentId = this.id;
							  
					//Create a scale for the width of the bars for the current circle
					var barScale = d3.scale.linear()
						.domain([0,dataMax[dataById[this.id]].values]) //max value of bar charts in circle
						.range([0,(current.r)]); //don't make the max bar bigger than 0.7 times the radius minus the distance in between
					
					//Title inside circle
					d3.select(this).append("text")
						.attr("class","innerCircleTitle")
						.attr("y", function(d, i) { 
							d.titleHeight = (-1 + 0.25) * current.r;
							return d.titleHeight; 
						})
						.attr("dy","0em")
						.text(function(d,i) { return d.name; })
						.style("font-size", function(d) {
							//Calculate best font-size
							d.fontTitleSize = current.r / 10//this.getComputedTextLength() * 20;				
							return Math.round(d.fontTitleSize)+"px"; 
						})
						.each(function(d) { 
							d.textLength = current.r*2*0.7; 
							wrap(this, d.textLength); 
						});
					
					//Bar chart	wrapper			
					var barWrapperInner = d3.select(this).selectAll(".innerBarWrapper")
						.data(data[dataById[this.id]].values)
						.enter().append("g")
						.attr("class", "innerBarWrapper")
						.attr("x", function(d,i) { 
							//Some values are missing, set these to width 0)
							d.width = (isNaN(d.value) ? 0 : barScale(d.value)); 
							d.totalOffset = -current.r*0.3; 
							return d.totalOffset; 
						})
						.attr("y", function(d, i) { 
							d.eachBarHeight = ((1 - barChartHeightOffset) * 2 * current.r * barChartHeight)/elementsPerBar;
							d.barHeight = barChartHeightOffset*2*current.r + i*d.eachBarHeight - barChartHeight*current.r;
							return d.barHeight; 
						});
						
					//Draw the bars
					barWrapperInner.append("rect")
						.attr("class", "innerBar")
						.attr("width", function(d) { return d.width; }) 
						.attr("height", function(d) {d.height = d.eachBarHeight*0.8; return d.height;})
						.style("opacity", 0.8)
						.style("fill", function(d) { return colorBar(d.age); });
					
					//Draw the age text	next to the bars		
					barWrapperInner.append("text")
						.attr("class", "innerText")
						.attr("dx", function(d) {
							d.dx = -current.r*0.05; 
							return d.dx; 
						})
						.attr("dy", "1.5em")
						.style("font-size", function(d) {
							//Calculate best font-size
							d.fontSize = current.r / 18;				
							return Math.round(d.fontSize)+"px"; 
						})
						.text(function(d,i) { return d.age; });
						
					//Draw the value inside the bars		
					barWrapperInner.append("text")
						.attr("class", "innerValue")
						.attr("dy", "1.8em")
						.style("font-size", function(d) {
							//Calculate best font-size
							d.fontSizeValue = current.r / 22;				
							return Math.round(d.fontSizeValue)+"px"; 
						})
						.text(function(d,i) { return commaFormat(d.value); })
						.each(function(d) {
							d.valueWidth = this.getBBox().width;
						 })
						.attr("dx", function(d) {
							d.r = current.r;
							
							if(d.valueWidth*1.1 > (d.width - d.r * 0.03)) d.valuePos = "left"; 
							else d.valuePos = "right";
							
							if(d.valuePos === "left") d.valueLoc = d.width + d.r * 0.03;
							else d.valueLoc = d.width - d.r * 0.03;
							return d.valueLoc; 
						})
						.style("text-anchor", function(d) { return d.valuePos === "left" ? "start" : "end"; })
						.style("fill", function(d) { return d.valuePos === "left" ? "#333333" : "white"; }); 
				}//if
			});//each barWrapperOuter 
	}//drawBars

	////////////////////////////////////////////////////////////// 
	//////////////////// The zoom function ///////////////////////
	////////////////////////////////////////////////////////////// 

	//The zoom function
	//Change the sizes of everything inside the circle and the arc texts
	function zoomTo(d) {
		
		focus = d;
		var v = [focus.x, focus.y, focus.r * 2.05],
			k = diameter / v[2]; 
			
		//Remove the tspans of all the titles
		d3.selectAll(".innerCircleTitle").selectAll("tspan").remove();
				
		//Hide the bar charts, then update them
		d3.selectAll(".barWrapperOuter").transition().duration(0).style("opacity",0);
		
		//Hide the node titles, update them
		d3.selectAll(".hiddenArcWrapper")
			.transition().duration(0)
			.style("opacity",0)
			.call(endall, changeReset);

		function changeReset() {
			
			//Save the current ID of the clicked on circle
			//If the clicked on circle is a leaf, strip off the last ID number so it becomes its parent ID
			var currentID = (typeof IDbyName[d.name] !== "undefined" ? IDbyName[d.name] : d.ID.replace(/\.([^\.]*)$/, ""));
			////////////////////////////////////////////////////////////// 
			/////////////// Change titles on the arcs ////////////////////
			////////////////////////////////////////////////////////////// 
		
			//Update the arcs with the new radii	
			d3.selectAll(".hiddenArcWrapper").selectAll(".circleArcHidden")
				.attr("d", function(d,i) { return "M "+ (-d.r*k) +" 0 A "+ (d.r*k) +" "+ (d.r*k) +" 45 0 1 "+ (d.r*k) +" 0"; })
				.attr("transform", function(d,i) { 
					return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")rotate("+ rotationText[i] +")"; 
				});
				
			//Save the names of the circle itself and first children
			var kids = [d.name];
			if(typeof d.children !== "undefined") {
				for(var i = 0; i < d.children.length; i++) {
					kids.push(d.children[i].name)
				};	
			}//if	
		
			//Update the font sizes and hide those not close the the parent
			d3.selectAll(".hiddenArcWrapper").selectAll(".circleText")
				.style("font-size", function(d) { return Math.round(d.fontSize * k)+'px'; })
				.style("opacity", function(d) { return $.inArray(d.name, kids) >= 0 ? 1 : 0; });
				
			////////////////////////////////////////////////////////////// 
			////////////////////// The bar charts ////////////////////////
			////////////////////////////////////////////////////////////// 
			
			//The title inside the circles
			d3.selectAll(".innerCircleTitle")
				.style("display",  "none")
				//If the font-size becomes to small do not show it or if the ID does not start with currentID
				.filter(function(d) { return Math.round(d.fontTitleSize * k) > 4 & d.ID.lastIndexOf(currentID, 0) === 0; })
				.style("display",  null)
				.attr("y", function(d) { return d.titleHeight * k; })
				.style("font-size", function(d) { return Math.round(d.fontTitleSize * k)+'px'; })
				.text(function(d,i) { return "Total "+commaFormat(d.size)+" (in thousands) | "+d.name; })
				.each(function(d) { wrap(this, k * d.textLength); });
				
			//Rescale the bars
			d3.selectAll(".innerBarWrapper").selectAll(".innerBar")
				.style("display",  "none")
				//If the circle (i.e. height of one bar) becomes to small do not show the bar chart
				.filter(function(d) { return Math.round(d.height * k) > 2 & d.ID.lastIndexOf(currentID, 0) === 0; })
				.style("display",  null)
				.attr("x", function(d) { return d.totalOffset * k; })
				.attr("y", function(d) { return d.barHeight * k;})

				.attr("width", function(d)  {return d.width * k;  })
				.attr("height", function(d) {return d.height * k; });
				
			//Rescale the axis text
			d3.selectAll(".innerBarWrapper").selectAll(".innerText")
				.style("display",  "none")
				//If the font-size becomes to small do not show it
				.filter(function(d) { return Math.round(d.fontSize * k) > 4 & d.ID.lastIndexOf(currentID, 0) === 0; })
				.style("display",  null)
				.style("font-size", function(d) { return Math.round(d.fontSize * k)+'px'; })
				.attr("dx", function(d) { return d.dx * k; })
				.attr("x", function(d) { return d.totalOffset * k; })
				.attr("y", function(d) { return d.barHeight * k; });
				
			//Rescale and position the values of each bar
			d3.selectAll(".innerBarWrapper").selectAll(".innerValue")
				.style("display",  "none")
				//If the font-size becomes to small do not show it
				.filter(function(d) { return Math.round(d.fontSizeValue * k) > 4 & d.ID.lastIndexOf(currentID, 0) === 0; })
				.style("display",  null)
				.style("font-size", function(d) { return Math.round(d.fontSizeValue * k)+'px'; })
				.attr("x", function(d) { return d.totalOffset * k; })
				.attr("y", function(d) { return d.barHeight * k; })
				//Recalculate the left/right side location of the value because the this.getBBox().width has changed
				.each(function(d) { d.valueWidth = this.getBBox().width; })
				.attr("dx", function(d) {
					if(d.valueWidth*1.1 > (d.width - d.r * 0.03)*k) d.valuePos = "left"; 
					else d.valuePos = "right";
					
					if(d.valuePos === "left") d.valueLoc = (d.width + d.r * 0.03)*k;
					else d.valueLoc = (d.width - d.r * 0.03)*k;
					return d.valueLoc; 
				})
				.style("text-anchor", function(d) { return d.valuePos === "left" ? "start" : "end"; })
				.style("fill", function(d) { return d.valuePos === "left" ? "#333333" : "white"; }); 
			
			setTimeout(function() {
				changeLocation(d,v,k); 
			}, 50);	
		
		}//changeReset
				
	}//zoomTo

	//Move to the new location - called by zoom
	function changeLocation(d, v, k) {

		//Only show the circle legend when not at the leafs
		if(typeof d.children === "undefined") {
			d3.select("#legendRowWrapper").style("opacity", 0);
			d3.select(".legendWrapper").transition().duration(1000).style("opacity", 0);
		} else {
			d3.select("#legendRowWrapper").style("opacity", 1);
			d3.select(".legendWrapper").transition().duration(1000).style("opacity", 1);
		}//else
			
		////////////////////////////////////////////////////////////// 
		//////////////// Overal transform and resize /////////////////
		//////////////////////////////////////////////////////////////
		//Calculate the duration
		//If they are far apart, take longer
		//If it's a big zoom in/out, take longer
		//var distance = Math.sqrt(Math.pow(d.x - focus0.x,2) + Math.pow(d.y - focus0.y,2)),
		//	distancePerc = distance/diameter,
		//	scalePerc = Math.min(Math.max(k,k0)/Math.min(k,k0), 50)/50;
		//	duration = Math.max(1500*distancePerc + 1500, 1500*scalePerc + 1500);
		var	duration = 1750;
			
		//Transition the circles to their new location
		d3.selectAll(".plotWrapper").transition().duration(duration)
			.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
			
		//Transition the circles to their new size
		d3.selectAll("#nodeCircle").transition().duration(duration)
			.attr("r", function(d) {
				//Found on http://stackoverflow.com/questions/24293249/access-scale-factor-in-d3s-pack-layout
				if(d.ID === "1.1.1.1") scaleFactor = d.value/(d.r*d.r*k*k); 
				return d.r * k; 
			})
			.call(endall, function() {
				d3.select(".legendWrapper").selectAll(".legendText")
					.text(function(d) { return commaFormat(Math.round(scaleFactor * d * d / 10)*10); });
			});	

		setTimeout(function() {
			//Hide the node titles, update them at once and them show them again
			d3.selectAll(".hiddenArcWrapper")
				.transition().duration(1000)
				.style("opacity",1);
				
			//Hide the bar charts, then update them at once and show the magain	
			d3.selectAll(".barWrapperOuter")
				.transition().duration(1000)
				.style("opacity",1);
				
			focus0 = focus;
			k0 = k;
		},duration);
		
	}//changeSizes

	////////////////////////////////////////////////////////////// 
	//////////////// Function | Search Box Event ///////////////// 
	////////////////////////////////////////////////////////////// 

	function searchEvent(occupation) {	
		//If the occupation is not equal to the default - mouseover function
		if (occupation !== "" & typeof occupation !== "undefined") {
			d3.selectAll("#nodeCircle")
				.filter(function(d,i) { return d.name === occupation; })
				.each(function(d,i) { zoomTo(d); });
		} else {
			zoomTo(root);
		}//else
	}//searchEvent

	////////////////////////////////////////////////////////////// 
	///////////// Function | The legend creation /////////////////
	////////////////////////////////////////////////////////////// 

	var legendSizes = [10,20,30];

	function createLegend(scaleFactor) {

		d3.select("#legendRowWrapper").style("opacity", 0);
		
		var width = $("#legendCircles").width(),
			height = legendSizes[2]*2*1.2;

		var	legendCenter = -10,
			legendBottom = height,
			legendLineLength = legendSizes[2]*1.3,
			textPadding = 5
			
		//Create SVG for the legend
		var svg = d3.select("#legendCircles").append("svg")
			.attr("width", width)
			.attr("height", height)
		  .append("g")
			.attr("class", "legendWrapper")
			.attr("transform", "translate(" + width / 2 + "," + 0 + ")")
			.style("opacity", 0);
		
		//Draw the circles
		svg.selectAll(".legendCircle")
			.data(legendSizes)
			.enter().append("circle")
			.attr('r', function(d) { return d; })
			.attr('class',"legendCircle")
			.attr('cx', legendCenter)
			.attr('cy', function(d) { return legendBottom-d; });
		//Draw the line connecting the top of the circle to the number
		svg.selectAll(".legendLine")
			.data(legendSizes)
			.enter().append("line")
			.attr('class',"legendLine")
			.attr('x1', legendCenter)
			.attr('y1', function(d) { return legendBottom-2*d; })
			.attr('x2', legendCenter + legendLineLength)
			.attr('y2', function(d) { return legendBottom-2*d; });	
		//Place the value next to the line
		svg.selectAll(".legendText")
			.data(legendSizes)
			.enter().append("text")
			.attr('class',"legendText")
			.attr('x', legendCenter + legendLineLength + textPadding)
			.attr('y', function(d) { return legendBottom-2*d; })
			.attr('dy', '0.3em')
			.text(function(d) { return commaFormat(Math.round(scaleFactor * d * d / 10)*10); });
			
	}//createLegend

	////////////////////////////////////////////////////////////// 
	///////////////////// Helper Functions ///////////////////////
	////////////////////////////////////////////////////////////// 

	//Wraps SVG text - Taken from http://bl.ocks.org/mbostock/7555321
	function wrap(text, width) {
		//console.log(d3.select(text));
		var text = d3.select(text),
			words = text.text().split(/\s+/).reverse(),
			currentSize = +(text.style("font-size")).replace("px",""),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.2, // ems
			extraHeight = 0.2,
			y = text.attr("y"),
			dy = parseFloat(text.attr("dy")),
			//First span is different - smaller font
			tspan = text.text(null)
				.append("tspan")
				.attr("class","subTotal")
				.attr("x", 0).attr("y", y)
				.attr("dy", dy + "em")
				.style("font-size", (Math.round(currentSize*0.5) <= 5 ? 0 : Math.round(currentSize*0.5))+"px");
		while (word = words.pop()) {
		  line.push(word);
		  tspan.text(line.join(" "));
		  if (tspan.node().getComputedTextLength() > width | word === "|") {
			if (word = "|") word = "";
			line.pop();
			tspan.text(line.join(" "));
			line = [word];
			tspan = text.append("tspan")
						.attr("x", 0).attr("y", y)
						.attr("dy", ++lineNumber * lineHeight + extraHeight + dy + "em")
						.text(word);
		  }//if
		}//while
	}//wrap

	//Taken from https://groups.google.com/forum/#!msg/d3-js/WC_7Xi6VV50/j1HK0vIWI-EJ
	//Calls a function only after the total transition ends
	function endall(transition, callback) { 
		var n = 0; 
		transition 
			.each(function() { ++n; }) 
			.each("end", function() { if (!--n) callback.apply(this, arguments); }); 
	}//endall

	////////////////////////////////////////////////////////////// 
	///////////////// Function | Initiates /////////////////////// 
	////////////////////////////////////////////////////////////// 

	//Create the bars inside the circles
	function runCreateBars() {
		//console.log(d3.selectAll(".barWrapperOuter"));
		// create a deferred object
		var r = $.Deferred();

		var counter = 0;
		while(!barsDrawn & counter < 10) { 
			drawBars();
			counter  = counter+1;
			};

		setTimeout(function () {
			// and call `resolve` on the deferred object, once you're done
			r.resolve();
		}, 100);
		// return the deferred object
		return r;
	};

	//Call to the zoom function to move everything into place
	function runAfterCompletion() {
	  createLegend(scaleFactor);
	  focus0 = root;
	  k0 = 1;
	  d3.select("#loadText").remove();
	  zoomTo(root);
	};

	//Hide the tooltip when the mouse moves away
	function removeTooltip () {
	  $('.popover').each(function() {
		$(this).remove();
	  }); 
	}
	//Show the tooltip on the hovered over slice
	function showTooltip (d) {
	  $(this).popover({
		placement: 'auto top',
		container: '#chart',
		trigger: 'manual',
		html : true,
		content: function() { 
		  return "<p class='nodeTooltip'>" + d.name + "</p>"; }
	  });
	  $(this).popover('show')
	}

	////////////////////////////////////////////////////////////// 
	///////////////// Data | Read in Age data //////////////////// 
	////////////////////////////////////////////////////////////// 

	//Global variables
	var data,
		dataMax,
		dataById = {}; 
	 
	 d3.csv("data/occupations by age.csv", function(error, csv) {
		 csv.forEach(function(d) {
			d.value = +d.value;
		 });
		 
		data = d3.nest()
			.key(function(d) { return d.ID; })
			.entries(csv);
			
		dataMax = d3.nest()
			.key(function(d) { return d.ID; })
			.rollup(function(d) { return d3.max(d, function(g) {return g.value;}); })
			.entries(csv);
		
		data.forEach(function (d, i) { 
			dataById[d.key] = i; 
		});	
	 });
	 
	//Small file to get the IDs of the non leaf circles
	var IDbyName = {};
	d3.csv("data/ID of parent levels.csv", function(error, csv) {
		csv.forEach(function (d, i) { 
			IDbyName[d.name] = d.ID; 
		});	
	 });
	 
	////////////////////////////////////////////////////////////// 
	/////////// Read in Occupation Circle data /////////////////// 
	////////////////////////////////////////////////////////////// 

	//Global variables
	var allOccupations = [],
		root,
		focus,
		focus0,
		k0,
		scaleFactor,
		barsDrawn = false;

	//The rotation of each arc text
	var rotationText = [-14,4,23,-18,-10.5,-20,20,20,46,-30,-25,-20,20,15,-30,-15,-45,12,-15,-16,15,15,5,18,5,15,20,-20,-25];
		
	d3.json("data/occupation.json", function(error, dataset) {

		var nodes = pack.nodes(dataset);
		root = dataset;
		focus = dataset;		

		////////////////////////////////////////////////////////////// 
		/////////// Create a wrappers for each occupation //////////// 
		////////////////////////////////////////////////////////////// 
		var plotWrapper = svg.selectAll("g")
			.data(nodes)
			.enter().append("g")
			.attr("class", "plotWrapper")
			.attr("id", function(d,i) {
				allOccupations[i] = d.name;
				if (d.ID != undefined) return "plotWrapper_" + d.ID;
				else return "plotWrapper_node";
			});
			
		if(!mobileSize) {
			//Mouseover only on leaf nodes		
			plotWrapper.filter(function(d) { return typeof d.children === "undefined"; })
					.on("mouseover", showTooltip)
					.on("mouseout", removeTooltip);
		}//if
		
		////////////////////////////////////////////////////////////// 
		///////////////////// Draw the circles /////////////////////// 
		////////////////////////////////////////////////////////////// 
		var circle = plotWrapper.append("circle")
				.attr("id", "nodeCircle")
				.attr("class", function(d,i) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
				.style("fill", function(d) { return d.children ? colorCircle(d.depth) : null; })
				.attr("r", function(d) { 
					if(d.ID === "1.1.1.1") scaleFactor = d.value/(d.r*d.r); 
					return d.r; 
				})
				.on("click", function(d) { if (focus !== d) zoomTo(d); else zoomTo(root); });
						
		////////////////////////////////////////////////////////////// 
		//////// Draw the titles of parent circles on the Arcs /////// 
		////////////////////////////////////////////////////////////// 	
		
		//Create the data for the parent circles only
		var overlapNode = [];
		circle
			.filter(function(d,i) { return d3.select(this).attr("class") === "node"; })
			.each(function(d,i) {
					overlapNode[i] = {
						name: d.name,
						depth: d.depth,
						r: d.r,
						x: d.x,
						y: d.y
					}
			});
		
		//Create a wrapper for the arcs and text
		var hiddenArcWrapper = svg.append("g")
			.attr("class", "hiddenArcWrapper")
			.style("opacity", 0);
		//Create the arcs on which the text can be plotted - will be hidden
		var hiddenArcs = hiddenArcWrapper.selectAll(".circleArcHidden")
			.data(overlapNode)
		   .enter().append("path")
			.attr("class", "circleArcHidden")
			.attr("id", function(d, i) { return "circleArc_"+i; })
			.attr("d", function(d,i) { return "M "+ -d.r +" 0 A "+ d.r +" "+ d.r +" 0 0 1 "+ d.r +" 0"; })
			.style("fill", "none");
		//Append the text to the arcs
		var arcText = hiddenArcWrapper.selectAll(".circleText")
			.data(overlapNode)
		   .enter().append("text")
			.attr("class", "circleText")
			.style("font-size", function(d) {
				//Calculate best font-size
				d.fontSize = d.r / 10;				
				return Math.round(d.fontSize)+"px"; 
			})
		   .append("textPath")
			.attr("startOffset","50%")
			.attr("xlink:href",function(d,i) { return "#circleArc_"+i; })
			.text(function(d) { return d.name.replace(/ and /g, ' & '); });
			
		////////////////////////////////////////////////////////////// 
		////////////////// Draw the Bar charts /////////////////////// 
		////////////////////////////////////////////////////////////// 
		
		//Create a wrapper for everything inside a leaf circle
		var barWrapperOuter = plotWrapper.append("g")
				.attr("id", function(d) {
					if (d.ID != undefined) return d.ID;
					else return "node";
				})
				.style("opacity", 0)
				.attr("class", "barWrapperOuter");
		
		////////////////////////////////////////////////////////////// 
		////////////////// Create search box ///////////////////////// 
		////////////////////////////////////////////////////////////// 

		//Create new options
		var options = allOccupations;
		var select = document.getElementById("searchBox"); 
		//Put new options into select box
		for(var i = 0; i < options.length; i++) {
			var opt = options[i];
			var el = document.createElement("option");
			el.textContent = opt;
			el.value = opt;
			select.appendChild(el);
		}

		//Create combo box
		$('.combobox').combobox();
		
		// call runCreateBars and use the `done` method
		// with `runAfterCompletion` as it's parameter
		setTimeout(function() { runCreateBars().done(runAfterCompletion); }, 100);

	});
}//drawAll