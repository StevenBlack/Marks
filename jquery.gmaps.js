/**
 * jQuery gMap
 *
 * Original version:
 * @url		http://gmap.nurtext.de/
 * @author	Cedric Kastner <cedric@nur-text.de>
 * @version	1.0.4
 *
 * Adapted and modified
 * @url		http://k7waterfrong.org/marks/
 * @author	Steven Black <steveb@stevenblack.com>
 * @version	2.0  April 18 2010
 * 
 */

(function($)
{
	// Main plugin function
	$.fn.gMap = function( options )
	{
		// Check if the browser is compatible with Google Maps
		if ( !window.GBrowserIsCompatible || !GBrowserIsCompatible() ) { return this };
		
		// Build main options before element iteration
		var settings = $.extend( {}, $.fn.gMap.defaults, options );
    
		var gmarkers= $.fn.gMap.gMarkers;
		
		// Iterate each matched element
		return this.each( function()
		{
			// Create new map and set initial options
			$gmap = new GMap2( this );
			
			// Attach the maps settings to the map itself
			$gmap.settings= settings;
			
			// Our array of markers for this map
			$gmap.gMarkers= [];
			
			// Our array of maps
			$.fn.gMap.gMaps.push( $gmap );
			
			// Try to center to the first marker
			if ( !settings.latitude && !settings.longitude )
			{
				// Check for at least one marker
				if ( $.isArray( settings.markers) && settings.markers.length >= 1)
				{
					// Center to the first marker
					settings.latitude  =  settings.markers[ 0 ].latitude;
					settings.longitude =  settings.markers[ 0 ].longitude;
				}
				else
				{
					// Center Earth and lower zoom
					settings.latitude = 34.885931;
					settings.longitude = 9.84375;
					settings.zoom = 2;
				}
			}
			
			// Center the map and set the maptype
			$gmap.setCenter( new GLatLng( settings.latitude, settings.longitude ), settings.zoom );
			$gmap.setMapType( settings.maptype );
			
			// Check for custom map controls
			if ( settings.controls.length === 0 )
			{
				// Default map controls
				$gmap.setUIToDefault();
			}
			else
			{
				// Add custom map controls
				for (var i = 0; i < settings.controls.length; i++)
				{
					// Eval is evil - I know. ;)
					eval( '$gmap.addControl( new ' + settings.controls[i] + '());' );
				}
			}
						
			// Check if scrollwheel should be enabled when using custom controls
			if ( settings.scrollwheel === true && settings.controls.length !== 0 ) { $gmap.enableScrollWheelZoom(); }
									
			// Add all map markers
			for ( var j = 0; j < settings.markers.length; j++ )
			{
				$.fn.gMap.addMarker( settings.markers[j], $gmap )
			}
		});
		
	};
		
	
	// Add marker
	$.fn.gMap.addMarker = function( marker, $gmap ) {

		var gmarkers= $gmap.gMarkers,
		  settings= $gmap.settings,
		  settingsIcon= settings.icon,
		  markerIcon= marker.icon,
		  // Create new icon
		  gicon = new GIcon();

		// Set icon properties from the map's global settings
		gicon.image = settingsIcon.image;
		gicon.shadow = settingsIcon.shadow;
		gicon.iconSize = ( $.isArray( settingsIcon.iconsize) ) ? new GSize( settingsIcon.iconsize[ 0 ], settingsIcon.iconsize[ 1 ] ) : settingsIcon.iconsize;
		gicon.shadowSize = ( $.isArray( settingsIcon.shadowsize ) ) ? new GSize( settingsIcon.shadowsize[ 0 ], settingsIcon.shadowsize[ 1 ] ) : settingsIcon.shadowsize;
		gicon.iconAnchor = ( $.isArray( settingsIcon.iconanchor ) ) ? new GPoint( settingsIcon.iconanchor[ 0 ], settingsIcon.iconanchor[ 1 ] ) : settingsIcon.iconanchor;
		gicon.infoWindowAnchor = ( $.isArray( settingsIcon.infowindowanchor ) ) ? new GPoint( settingsIcon.infowindowanchor[ 0 ], settingsIcon.infowindowanchor[ 1 ] ) : settingsIcon.infowindowanchor;

		if (markerIcon)
		{
			// Overwrite global options with ther marker one's
			gicon.image = markerIcon.image;
			if ( markerIcon.shadow ) { gicon.shadow = markerIcon.shadow; }
			if ( markerIcon.iconsize ) { gicon.iconSize = ( $.isArray( markerIcon.iconsize ) ) ? new GSize( markerIcon.iconsize[ 0 ], markerIcon.iconsize[ 1 ]) : markerIcon.iconsize; }
			if ( markerIcon.shadowsize ) { gicon.shadowSize = ( $.isArray( markerIcon.shadowsize ) ) ? new GSize( markerIcon.shadowsize[ 0 ], markerIcon.shadowsize[ 1 ]) : markerIcon.shadowsize; }
			if ( markerIcon.iconanchor ) { gicon.iconAnchor = ( $.isArray( markerIcon.iconanchor ) ) ? new GPoint( markerIcon.iconanchor[ 0 ], markerIcon.iconanchor[ 1 ]) : markerIcon.iconanchor; }
			if ( markerIcon.infowindowanchor ) { gicon.infoWindowAnchor = ( $.isArray( markerIcon.infowindowanchor ) ) ? new GPoint( markerIcon.infowindowanchor[ 0 ], markerIcon.infowindowanchor[ 1 ] ) : markerIcon.infowindowanchor; }
		}

		var gmarkerOptions= { icon: gicon };
		if ( marker.draggable ) { $.extend( gmarkerOptions, { draggable : true  } ); }	

		// Create a new marker on the map
		gmarker = new GMarker( new GPoint( marker.longitude, marker.latitude), gmarkerOptions );
		
  	if ( marker.draggable ) {
  		GEvent.addListener( gmarker, "dragend",  function() { $( document ).trigger( { type: "markerChange"} ); } );
  	}

		// save the marker's configuration data
		gmarker.originalConfig= marker;

		this.addToMarkerCollection( gmarker, $gmap );

		// Only display info window if the marker contains a description AND if we're enabled.
		if ( marker.html && marker.infoWindowEnabled )
		{
			// Bind the info window to marker
			gmarker.bindInfoWindowHtml(settings.html_prepend + marker.html + settings.html_append);
			// Add overlay if marker was created and check if popup should be shown when map is loaded
			if ( gmarker ) { $gmap.addOverlay(gmarker); }
			if ( marker.popup === true ) { gmarker.openInfoWindowHtml( settings.html_prepend + marker.html + settings.html_append ); }
		} else
		{
			// Add overlay marker
			if (gmarker) { $gmap.addOverlay( gmarker ); }
		}
	//--	  
	  
	  
	};

	$.fn.gMap.addToMarkerCollection = function( marker, map ) {
		map.gMarkers.push( marker );
	};

			
	// Set default settings
	$.fn.gMap.defaults =
	{
		latitude:			44.220,
		longitude:		-76.500,
		zoom:					6,
		markers:			[],
		controls:			[],
		scrollwheel:	true,
		maptype:			G_NORMAL_MAP,
		html_prepend:	'<div class="gmap_marker">',
		html_append:	'</div>',
		icon:
  		{
  			image:				"http://www.google.com/mapfiles/marker.png",
  			shadow:				"http://www.google.com/mapfiles/shadow50.png",
  			iconsize:			[20, 34],
  			shadowsize:		[37, 34],
  			iconanchor:		[9, 34],
  			infowindowanchor:	[9, 2]
  		},
  	draggable: false
	};

	// Array of maps
	$.fn.gMap.gMaps = [];
	// Each has an array of markers
	$.fn.gMap.gMaps.gMarkers = [];	
	
})(jQuery);



