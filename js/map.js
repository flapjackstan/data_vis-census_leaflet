// GLOBAL

const boundary = "data/lac_boundary.geojson"
const tracts = "data/lac_tracts.geojson"
const missing_tracts = "data/lac_tracts_missing.geojson"
const points ="data/points.geojson"

async function get_geojson(polygon){
    const response = await fetch(polygon)
    const json = await response.json()
    return json
};

const osm_layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const CartoDB_Positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 19
});


function boundary_style(feature) {
    return {
        fillOpacity:0,
        weight: 2,
        opacity: 1,
        color: 'black',
    };
};

function points_style(feature) {
    return {
        radius: 8,
        fillColor: getPointsColor(feature.properties.Type),
        color: getPointsColor(feature.properties.Type),
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
};

function tracts_style(feature) {
    return {
      fillColor: getColor(feature.properties.Total),
      weight: .5,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.8
    };
  };

function cat_style(feature) {
    return {
        fillColor: getCatColor(feature.properties.majority),
        weight: .5,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.8
    };
};
  
  
//https://colorbrewer2.org/#type=sequential&scheme=BuPu&n=6
function getColor(d) {
return  d > 9000 ? '#800026' :
        d > 7501 ? '#BD0026' :
        d > 6001 ? '#E31A1C' :
        d > 4501 ? '#FC4E2A' :
        d > 3001 ? '#FD8D3C' :
        d > 1501 ? '#FEB24C' :
        d > 0    ? '#FED976' :
                        '#808080';
};

//https://colorbrewer2.org/#type=sequential&scheme=BuPu&n=6
function getCatColor(d) {
    return  d === 'H_Other' ?   '#a6cee3' :
            d === 'H_White' ?   '#1f78b4' :
            d === 'NH_AIAN' ?   '#b2df8a' :
            d === 'NH_Asian' ?  '#33a02c' :
            d === 'NH_Black' ?  '#fb9a99' :
            d === 'NH_White' ?  '#e31a1c' :
                                '#ffff';
};

function getPointsColor(d) {
    return  d === 'Cat 1' ?     '#a6cee3' :
            d === 'Cat 2' ?     '#1f78b4' :
            d === 'Cat 3' ?     '#b2df8a' :
            d === 'Cat 4' ?     '#33a02c' :
                                '#ffff';
};

function tracts_click_tip(feature, layer) {
    let popupContent = "<p>I started out as a GeoJSON " +
            feature.geometry.type + ", but now I'm a Leaflet vector!</p>";
    
    layer.on('mouseover', function(evt) {
        if (feature.properties && feature.properties.GEOID) {
            hoverContent = feature.properties.GEOID;
        }
        //evt.target is the marker that is being moused over 
        //bindPopup() does not need to be called here if it was already called
        //somewhere else for this marker.
        evt.target.bindPopup(hoverContent).openPopup();
    });

    layer.on('click', function(evt) {
        if (feature.properties && feature.properties.NAME) {
            popupContent += feature.properties.NAME;
        }
        //again, evt.target will contain the marker that was clicked
        evt.target.bindPopup(popupContent).openPopup();
    });
}

///////////////////////////////////////[LEGEND DEFINITION]//////////////////////////////////////////////////////

let pop_legend = L.control({position: 'bottomright'});  
    pop_legend.onAdd = function (mymap) {

        let div = L.DomUtil.create('div', 'info legend'),
            grades = [0, 1501, 3001, 4501, 6001, 7501, 9000],
            labels = ['<strong> LA County Population </strong>'],
            from, to;

        for (let i = 0; i < grades.length; i++) {
            from = grades [i];
            to = grades[i+1]-1;

            labels.push('<i style="background:' + getColor(from + 1) + '"></i> ' + from + (to ? '&ndash;' + to : '+'));
        }
        labels.push('<i style="background:' + '#808080' + '"></i> '+ 'Missing');
        div.innerHTML = labels.join('<br>');
        return div;
    };

/////////////////////////////

let cat_legend = L.control({position: 'bottomright'});  
    cat_legend.onAdd = function (mymap) {

    let div = L.DomUtil.create('div', 'info legend'),
        grades = ['H_Other', 'H_White', 'NH_AIAN', 'NH_Asian', 'NH_Black', 'NH_White'],
        labels = ['<strong> LA County Ethnic Majorities </strong>'],
        category;

    for (let i = 0; i < grades.length; i++) {
        category = grades[i];

        labels.push('<i style="background:' + getCatColor(category) + '"></i> ' + category);
    }
    div.innerHTML = labels.join('<br>');
    return div;
        };

/////////////////////////////

let points_legend = L.control({position: 'bottomright'});  
    points_legend.onAdd = function (mymap) {

    let div = L.DomUtil.create('div', 'info legend'),
        grades = ['Cat 1', 'Cat 2', 'Cat 3', 'Cat 4'],
        labels = ['<strong> LA County<br>Point Categories </strong>'],
        category;

    for (let i = 0; i < grades.length; i++) {
        category = grades[i];

    labels.push(
        '<i class="circle" style="background:' + getPointsColor(category) + '"></i> ' + category);
        }
        div.innerHTML = labels.join('<br>');
        return div;
        };

///////////////////////////////////////[MAP DEFINITION]//////////////////////////////////////////////////////

function draw_map(){    

    const boundary_layer = L.layerGroup()
    const points_layer = L.layerGroup()
    const tracts_layer = L.layerGroup()
    const cat_layer = L.layerGroup()

    get_geojson(boundary)
    .then(results => L.geoJSON(results, {style: boundary_style}))
    .then(results1 => boundary_layer.addLayer(results1).addTo(mymap))
    .catch(err => console.error(err))

    get_geojson(points)
    .then(results => L.geoJSON(results, {pointToLayer: function (feature, latlng) {return L.circleMarker(latlng)}, style: points_style}))
    .then(results2 => points_layer.addLayer(results2))
    .catch(err => console.error(err))

    get_geojson(missing_tracts)
    .then(results => L.geoJSON(results, {style: tracts_style, onEachFeature: tracts_click_tip}))
    .then(results3 => tracts_layer.addLayer(results3))
    .catch(err => console.error(err))

    get_geojson(tracts)
    .then(results => L.geoJSON(results, {style: cat_style,onEachFeature: tracts_click_tip}))
    .then(results3 => cat_layer.addLayer(results3))
    .catch(err => console.error(err))

    const overlayMaps = {
        "LA County Boundary": boundary_layer,
        "LA Points": points_layer,
        "Population": tracts_layer,
        "Ethnic Majority": cat_layer
    };

    const baseMaps = {
        "Grayscale": CartoDB_Positron,
        "Streets": osm_layer
    };
    const myLayersControl = L.control.layers(baseMaps, overlayMaps, {collapsed: false}).addTo(mymap);
};


///////////////////////////////////////[BASIC MAP CREATION]//////////////////////////////////////////////////////

// NEEDS TO BE OUTSIDE OF ASYNC FOR THIS TO BE IN THE SAME SCOPE AS LEGEND EVENT LOOP

const mymap = L.map('choropleth',{
    zoomControl: true,
    layers: [CartoDB_Positron],
    maxZoom: 18,
    minZoom: 6,
    center:[34.2654394,-118.2673874],
    zoom:10
});

draw_map();

///////////////////////////////////////[LEGEND EVENTLOOP]//////////////////////////////////////////////////////


mymap.on('overlayadd', function(eventLayer){
    if (eventLayer.name === 'Population'){
        mymap.addControl(pop_legend);
    }
    if (eventLayer.name === 'Ethnic Majority'){
        mymap.addControl(cat_legend);
    }
    if (eventLayer.name === 'LA Points'){
        mymap.addControl(points_legend);
    }
});

mymap.on('overlayremove', function(eventLayer){
    if (eventLayer.name === 'Population'){
         mymap.removeControl(pop_legend);
    } 
    if (eventLayer.name === 'Ethnic Majority'){
        mymap.removeControl(cat_legend);
    }
    if (eventLayer.name === 'LA Points'){
        mymap.removeControl(points_legend);
    } 
});




