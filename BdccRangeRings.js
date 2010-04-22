// This shows range rings on the map. Interval is user choice or automatic
// Bill Chadwick Jan 2008

// point is the centre or origin of the rings which are drawn with colour, weight (width in pixels) and opacity (0-1). 
// The interval parameter is either
//	1 - null in which case the interval is automatic depending on zoom level, showing several rings on screen
//	2 - A single number specifying a fixed interval between rings in metres
//	3 - An array of ring spacings in metres 
// MaxRings is used for auto and fixed interval to limit the number of rings drawn, not used with an interval array
// if it is null, rings will be drawn to twice the map's diagonal
// if user labels are wanted, labels should be an array of length maxRings or the length of the interval array 
// if interval is an array, colour can be a matching length array

function BdccRangeRings(point, colour, weight, opacity, interval, maxRings, labels) {

  this.colour = colour || "#0000FF";
  this.weight = weight || 3;
  this.opacity = opacity || 0.7;
  this.centre = point;
  this.interval = interval;
  this.maxRings = maxRings;
  this.labels = labels;

}
BdccRangeRings.prototype = new GOverlay();

BdccRangeRings.prototype.initialize = function(map) {

  this.map = map;
  this.circles = new Array();
  this.divs = new Array();//labels

  this.drawFirst = true;
  this.lstnMove = null;
  this.lstnStart = null;
  this.lstnType = null;
      
}

BdccRangeRings.prototype.remove = function() {

  	this.unDraw();

	//remove handlers we use to trigger redraw / undraw
	try{
	    if(this.lstnMove != null)
		    GEvent.removeListener(this.lstnMove);
	    if(this.lstnStart != null)
		    GEvent.removeListener(this.lstnStart);
	    if(this.lstnType != null)
		    GEvent.removeListener(this.lstnType);
		}
    catch(ex)
    {
    }

}

BdccRangeRings.prototype.unDraw = function() {

  var div = this.map.getPane(G_MAP_MARKER_SHADOW_PANE);

  try{

	var i = 0;				
	for(i=0; i< this.circles.length; i++)
		this.map.removeOverlay(this.circles[i]);		 			
  }
  catch(e){
  }

  try{

	var i = 0;				
      for(i=0; i< this.divs.length; i++)
	      div.removeChild(this.divs[i]);		 			
  }
  catch(e){
  }
  this.circles = new Array();	
  this.divs = new Array();	

}

BdccRangeRings.prototype.copy = function() {
  return new BdccRangeRings(this.point, this.colour, this.weight, this.opacity, this.interval, this.maxRings, this.labels);
}

//This normally does nothing due to reentrancy problems and problems removing overlays from within an overlay
//Instead we use the moveend event to trigger a redraw, this event occurs after zoom and map type changes
BdccRangeRings.prototype.redraw = function(force) {

	//but draw it the very first time
	if(this.drawFirst)
	{
		this.safeRedraw();

  		// We use the moveend event to trigger the redraw
  		var rdrw = GEvent.callback(this,this.safeRedraw );
  		this.lstnMove = GEvent.addListener(this.map,"moveend",function(){rdrw ();});

  		// We use the map type change event to trigger a redraw too
  		var rdrw2 = GEvent.callback(this,this.safeRedraw );
  		this.lstnType = GEvent.addListener(this.map,"maptypechanged",function(){rdrw2 ();});

		// And undraw during moves - for speed
  		var udrw = GEvent.callback(this,this.unDraw );
  		this.lstnStart = GEvent.addListener(this.map,"movestart",function(){udrw ();});

		this.drawFirst = false;

	}
}


// Redraw the rings based on the current projection and zoom level
BdccRangeRings.prototype.safeRedraw = function() {

  //clear old
  this.unDraw();

  var bnds = this.map.getBounds();
  var sz = this.map.getSize();
  var pxDiag = Math.sqrt((sz.width*sz.width) + (sz.height*sz.height));
  var diagKm = bnds.getNorthEast().distanceFrom(bnds.getSouthWest()) / 1000.0;
  var pxPerKm = pxDiag/diagKm;
  var d;//km initial/min interval

  if(this.interval == null)
  {
  	//auto interval
    
	var width = sz.width / pxPerKm ;
  	var height = sz.height / pxPerKm;  
	var ww = Math.max(width,height); 
  
  	if(ww < 1.0)
		d = 0.1;
  	else if(ww < 2.0)
		d = 0.2;
  	else if(ww < 5.0)
		d = 0.5;
  	else if(ww < 10.0)
		d = 1.0;
  	else if(ww < 20.0)
    		d = 2.0;
  	else if(ww < 50.0)
    		d = 5.0;
  	else if(ww < 100.0)
    		d = 10.0;
  	else if(ww < 200.0)
    		d = 20.0;
  	else if(ww < 500.0)
    		d = 50.0;
  	else if(ww < 1000.0)
    		d = 100.0;
  	else if(ww < 2000.0)
    		d = 200.0;
  	else if(ww < 5000.0)
    		d = 500.0;
  	else 
    		d = 1000.0;
  }
  else if (this.interval.constructor.toString().indexOf("Array") == -1)
  	d = this.interval / 1000.0;// to km  
  else
	d = this.interval;//array of distances  	

  
  if (d.constructor.toString().indexOf("Array") == -1){

      var p = (d >= 10.0) ? 0 : 1;//precision for label distances in km

	if(this.maxRings == null){
		//draw the rings to no more than twice the screen diagonal, auto or fixed interval
		// no custom labels as # rings drawn varies
		for(var r = d; (r < (diagKm * 2)); r += d)
 		  this.drawCircle (r ,r.toFixed(p) + "km",this.colour);
	}
	else{
		//draw maxRings rings auto or fixed interval
		var r = d;
		for(var i = 0; i<this.maxRings; i++){
 		  this.drawCircle (r ,(this.labels == null)?r.toFixed(p)+ "km":this.labels[i],this.colour); 
		  r += d;
		}
	}
  }
  else{
	// interval array used
	for(var i = 0; i<d.length; i++){
	    var c;
	    if (this.colour.constructor.toString().indexOf("Array") == -1)
	        c = this.colour;
	    else
		  c = this.colour[i];
 	    this.drawCircle (d[i]/1000.0 ,(this.labels == null)?d[i].toFixed(p)+ "km":this.labels[i],c); 
	}

  }

}  

  // get a new GLatLng distanceMeters away on the compass bearing azimuthDegrees
  // from the GLatLng point - accurate to better than 200m in 140km (20m in 14km) in the UK

  BdccRangeRings.prototype.PointAtRangeAndBearing = function (point, distanceMeters, azimuthDegrees) 
        {
             var latr = point.lat() * Math.PI / 180.0;
             var lonr = point.lng() * Math.PI / 180.0;
     
             var coslat = Math.cos(latr); 
             var sinlat = Math.sin(latr); 
             var az = azimuthDegrees* Math.PI / 180.0;
             var cosaz = Math.cos(az); 
             var sinaz = Math.sin(az); 
             var dr = distanceMeters / 6378137.0; // distance in radians using WGS84 Equatorial Radius
             var sind = Math.sin(dr); 
             var cosd = Math.cos(dr);
      
            return new GLatLng(Math.asin((sinlat * cosd) + (coslat * sind * cosaz)) * 180.0 / Math.PI,
            (Math.atan2((sind * sinaz), (coslat * cosd) - (sinlat * sind * cosaz)) + lonr) * 180.0 / Math.PI); 
        }



BdccRangeRings.prototype.drawCircle = function (rKm, label, colour)
{
  if (r < 0)
	return;

  if (r > (6378137.0 * Math.PI * 2))
	return;

  var mapDiv = this.map.getPane(G_MAP_MARKER_SHADOW_PANE);
  var c;
  var b;
  var pts = new Array();
  var r = rKm * 1000.0;

  // use 40 segment polyline to approximate a circle

  for(b=0; b<=360; b+=9){

	pts.push(this.PointAtRangeAndBearing(this.centre,r,b));

      if ((b %90 == 0)&&(b!=360)){

		//draw a label every 45 degrees

		var p = this.map.fromLatLngToDivPixel(pts[pts.length-1]);
		var dv = document.createElement("DIV");
		mapDiv.insertBefore(dv,null);
		dv.style.position = "absolute";
		dv.style.border = "none";
		dv.style.color = colour;
		dv.style.fontFamily='Arial';
		dv.style.fontSize='x-small';
		dv.innerHTML = label;
		var dx;
		var dy;

		//offset the labels to be just outside the ring

		if(b==0) {
			dx = -dv.offsetWidth * 0.5;
			dy = -dv.offsetHeight;
		}
		// else if(b == 45){
		// 	dx = 3;
		// 	dy = -dv.offsetHeight;
		// }
		else if(b == 90){
			dx = 3;
			dy = -dv.offsetHeight * 0.5;
		}
		// else if(b == 135){
		// 	dx = 3;
		// 	dy = 3;
		// }
		else if(b == 180){
			dx = -dv.offsetWidth * 0.5;
			dy = 3;
		}
		// else if(b == 225){
		// 	dx = -dv.offsetWidth -3;
		// 	dy = 3;
		// }
		else if(b == 270){
			dx = -dv.offsetWidth -3;
			dy = -dv.offsetHeight * 0.5;
		}
		// else if(b == 315){
					// 	dx = -dv.offsetWidth -3;
					// 	dy = -dv.offsetHeight;
					// }
						
		dv.style.left = (p.x+dx).toString() + "px";
		dv.style.top = (p.y+dy).toString() + "px";

		this.divs.push(dv);
	}
  }

  var c = new GPolyline(pts,colour,this.weight,this.opacity);
  this.map.addOverlay(c);
  this.circles.push(c);

} 






