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
			
			// Our array of markers for this map
			$gmap.gMarkers= [];
			// Our array of maps
			$.fn.gMap.gMaps.push( $gmap );
			gmarkers= $gmap.gMarkers;
			
			// Try to center to the first marker
			if (!settings.latitude && !settings.longitude)
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
				// Get the options from current marker
				marker = settings.markers[j];
				
				// Create new icon
				gicon = new GIcon();
				
				// Set icon properties from global options
				gicon.image = settings.icon.image;
				gicon.shadow = settings.icon.shadow;
				gicon.iconSize = ( $.isArray( settings.icon.iconsize) ) ? new GSize( settings.icon.iconsize[ 0 ], settings.icon.iconsize[ 1 ] ) : settings.icon.iconsize;
				gicon.shadowSize = ( $.isArray( settings.icon.shadowsize ) ) ? new GSize( settings.icon.shadowsize[ 0 ], settings.icon.shadowsize[ 1 ] ) : settings.icon.shadowsize;
				gicon.iconAnchor = ( $.isArray( settings.icon.iconanchor ) ) ? new GPoint( settings.icon.iconanchor[ 0 ], settings.icon.iconanchor[ 1 ] ) : settings.icon.iconanchor;
				gicon.infoWindowAnchor = ( $.isArray( settings.icon.infowindowanchor ) ) ? new GPoint( settings.icon.infowindowanchor[ 0 ], settings.icon.infowindowanchor[ 1 ] ) : settings.icon.infowindowanchor;
				
				if (marker.icon)
				{
					// Overwrite global options with ther marker one's
					gicon.image = marker.icon.image;
					if ( marker.icon.shadow ) { gicon.shadow = marker.icon.shadow; }
					if ( marker.icon.iconsize ) { gicon.iconSize = ( $.isArray( marker.icon.iconsize ) ) ? new GSize( marker.icon.iconsize[ 0 ], marker.icon.iconsize[ 1 ]) : marker.icon.iconsize; }
					if ( marker.icon.shadowsize ) { gicon.shadowSize = ( $.isArray( marker.icon.shadowsize ) ) ? new GSize( marker.icon.shadowsize[ 0 ], marker.icon.shadowsize[ 1 ]) : marker.icon.shadowsize; }
					if ( marker.icon.iconanchor ) { gicon.iconAnchor = ( $.isArray( marker.icon.iconanchor ) ) ? new GPoint( marker.icon.iconanchor[ 0 ], marker.icon.iconanchor[ 1 ]) : marker.icon.iconanchor; }
					if ( marker.icon.infowindowanchor ) { gicon.infoWindowAnchor = ( $.isArray( marker.icon.infowindowanchor ) ) ? new GPoint( marker.icon.infowindowanchor[ 0 ], marker.icon.infowindowanchor[ 1 ] ) : marker.icon.infowindowanchor; }
				}
							
				var gmarkerOptions= { icon: gicon };
				if ( marker.draggable ) { $.extend( gmarkerOptions, { draggable : true  } ); }	
				
				// Create a new marker on the map
				gmarker = new GMarker( new GPoint( marker.longitude, marker.latitude), gmarkerOptions );
				
				// save the marker's configuration data
				gmarker.originalConfig= marker;
				
				// sb
				gmarkers.push( gmarker );
				
				// Only display info window if the marker contains a description
				if ( marker.html )
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
			}
		});
		
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