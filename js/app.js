(function () {

    //console.log(window.innerHeight);

    // mapbox API parameters

    // mapbox://styles/coxco96/ckvl92tev0qt215p6w8co1mz0
    // initialize map, centered on Kenya
    var map = L.map('map').setView([-0.23, 37.8], 6.5, {
        minZoom: 6,
        maxZoom: 9,
        zoomSnap: 0.1,
        zoomControl: false,

        maxBounds: L.latLngBounds([-6.22, 27.72], [5.76, 47.83]),
    });

   


    // mapbox API access Token
    var accessToken = "pk.eyJ1IjoiY294Y285NiIsImEiOiJja3BrY2k0ZHgwa3Y0MnZwYTl3NWs4emJ5In0.ItwJEcRmF0LwO1DkHFgpZw";

    // request a mapbox raster tile layer and add to map
    L.tileLayer(
        `https://api.mapbox.com/styles/v1/coxco96/ckvsmcsga16m614mxuj1qe9dz/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY294Y285NiIsImEiOiJja3BrY2k0ZHgwa3Y0MnZwYTl3NWs4emJ5In0.ItwJEcRmF0LwO1DkHFgpZw`, {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            //id: "light-v10",
            accessToken: 'pk.eyJ1IjoiY294Y285NiIsImEiOiJja3BrY2k0ZHgwa3Y0MnZwYTl3NWs4emJ5In0.ItwJEcRmF0LwO1DkHFgpZw',
        }
    ).addTo(map);



    window.addEventListener("resize", adjustHeight);


    const button = document.querySelector("#legend button");
    button.addEventListener('click', function () {
        const legend = document.querySelector(".leaflet-legend")
        legend.classList.toggle('show-legend')
    })

    //add leaflet default markers:
    //omnivore.csv("data/kenya_education_2014.csv").addTo(map);
    omnivore
        .csv("data/kenya_education_2014.csv")
        .on("ready", function (e) {
            // access to the GeoJSON here!
            drawMap(e.target.toGeoJSON());
            drawLegend(e.target.toGeoJSON());
            // console.log(e.target.toGeoJSON());
        })
        .on("error", function (e) {
            console.log(e.error[0].message);
        });
    //.addTo(map);








    // FUNCTIONS:






    function adjustHeight() {
        const mapSize = document.querySelector("#map"),
            contentSize = document.querySelector("#content"),
            removeHeight = document.querySelector("#footer").offsetHeight,
            resize = window.innerHeight - removeHeight;

        mapSize.style.height = `${resize}px`;

        if (window.innerWidth >= 768) {

            contentSize.style.height = `${resize}px`;
            mapSize.style.height = `${resize}px`;
        } else {
            contentSize.style.height = `${resize * 0.25}px`;
            mapSize.style.height = `${resize * 0.75}px`;
        }

    } // end adjustHeight function






    function drawMap(data) {
        // access to data here
        //console.log(data);
        const options = {
            pointToLayer: function (feature, ll) {
                return L.circleMarker(ll, {
                    opacity: 1,
                    weight: 2,
                    fillOpacity: 0,
                });
            },
        };
        // create 2 separate layers from geoJSON data
        const girlsLayer = L.geoJson(data, options).addTo(map);
        const boysLayer = L.geoJson(data, options).addTo(map);

        // color the layers different colors
        girlsLayer.setStyle({
            color: getColor("girls"),
        });
        boysLayer.setStyle({
            color: getColor("boys"),
        });



        // fit the bounds of the map to one of the layers
        map.fitBounds(girlsLayer.getBounds(), {
            padding: [50, 50],
        });
        map.fitBounds(boysLayer.getBounds(), {
            padding: [50, 50],

        });

        resizeCircles(girlsLayer, boysLayer, 1);
        sequenceUI(girlsLayer, boysLayer);

    } // end drawMap()








    function getColor(x) {
        // access the fourth styleseet referenced in the HTML head element
        const stylesheet = document.styleSheets[2];
        const colors = [];

        // check out the rules in the stylesheet
        // console.log(stylesheet.cssRules);

        // loop through the rules in the stylesheet
        for (let i of stylesheet.cssRules) {
            // when we find girls, add its color to an array
            if (i.selectorText === '.girls') {
                colors[0] = i.style.backgroundColor;
            }
            if (i.selectorText === '.boys') {
                colors[1] = i.style.backgroundColor;
            }
        }

        // if function was given 'girls' return that color
        if (x == 'girls') {
            return colors[0];
        } else {
            return colors[1];
        }
    } // end getColor(x) function






    function calcRadius(val) {
        const radius = Math.sqrt(val / Math.PI);
        return radius * .5; // adjust .5 as a scale factor
    } // end calcRadius function





    function resizeCircles(girlsLayer, boysLayer, currentGrade) {
        girlsLayer.eachLayer(function (layer) {
            const radius = calcRadius(
                Number(layer.feature.properties['G' + currentGrade])
            );
            layer.setRadius(radius);
        });
        boysLayer.eachLayer(function (layer) {
            const radius = calcRadius(
                Number(layer.feature.properties['B' + currentGrade])
            );
            layer.setRadius(radius);
        });
        retrieveInfo(boysLayer, currentGrade);
    } // end resizeCircles





    function sequenceUI(girlsLayer, boysLayer) {
       
        // create Leaflet control for the slider
        const sliderControl = L.control({
            position: "bottomleft",
        });

        sliderControl.onAdd = function (map) {
            const controls = L.DomUtil.get("slider");

            L.DomEvent.disableScrollPropagation(controls);
            L.DomEvent.disableClickPropagation(controls);

            return controls;
        };

        // add it to the map
        sliderControl.addTo(map);

            

          // add sliderGrade info box
          const sliderGrade = L.control({
            position: "bottomleft",
        });
        
        // when the sliderGrade box is added to the map
        sliderGrade.onAdd = function () {
            // select the slider grade box using id of it
            const sliderBox = L.DomUtil.get("sliderGrade");
            // disable scroll and click functionality
            L.DomEvent.disableScrollPropagation(sliderBox);
            L.DomEvent.disableClickPropagation(sliderBox);
            // document.querySelector("#sliderGrade span").innerHTML = `${currentGrade}`;
            
        
            // return the selection
            return sliderBox;
        };
            sliderGrade.addTo(map);
            //console.log(currentGrade);
            //console.log(document.querySelector("#sliderGrade"));

      

        // select the slider's input and listen for change
        const slider = document.querySelector("#slider input");
        // select the slider's input and listen for change
        slider.addEventListener("input", function (e) {
            console.log(e.target.value);


            // current value of slider is current grade level
            var currentGrade = e.target.value;
            

            // resize the circles with updated grade level
            resizeCircles(girlsLayer, boysLayer, currentGrade);

                document.querySelector("#sliderGrade").innerHTML = `Grade: ${currentGrade}`;
              
            

        });

    } // end sequenceUI function





    function drawLegend(data) {
        const legendControl = L.control({
            position: "bottomright",
        });

        // when the control is added to the map
        legendControl.onAdd = function () {
            // select the legend using id attribute of legend
            const legend = L.DomUtil.get("legend");

            // disable scroll and click functionality
            L.DomEvent.disableScrollPropagation(legend);
            L.DomEvent.disableClickPropagation(legend);

            // return the selection
            return legend;
        };

        legendControl.addTo(map);

        // empty array to hold values
        const dataValues = [];

        // loop through all features (i.e., the schools)
        data.features.forEach(function (school) {
            // for each grade in a school
            for (let grade in school.properties) {
                // shorthand to each value
                const value = school.properties[grade];
                // if the value can be converted to a number
                // the + operator in front of a number returns a number
                if (+value) {
                    //return the value to the array
                    dataValues.push(+value);
                }
            }
        });
        // verify your results!
        // console.log(dataValues);

        // sort our array
        const sortedValues = dataValues.sort(function (a, b) {
            return b - a;
        });

       // console.log(sortedValues);

        // round the highest number and use as our large circle diameter
        const maxValue = Math.round(sortedValues[0] / 1000) * 1000;

       //  console.log(maxValue);

        // calc the diameters
        const largeDiameter = calcRadius(maxValue) * 2,
            smallDiameter = largeDiameter / 2;

        // create a function with a short name to select elements
        const $ = function (x) {
            return document.querySelector(x);
        };

        // select our circles container and set the height
        $(".legend-circles").style.height = `${largeDiameter.toFixed()}px`;

        // set width and height for large circle
        $(".legend-large").style.width = `${largeDiameter.toFixed()}px`;
        $(".legend-large").style.height = `${largeDiameter.toFixed()}px`;

        // set width and height for small circle and position
        $(".legend-small").style.width = `${smallDiameter.toFixed()}px`;
        $(".legend-small").style.height = `${smallDiameter.toFixed()}px`;
        $(".legend-small").style.top = `${largeDiameter - smallDiameter - 2}px`;
        $(".legend-small").style.left = `${smallDiameter / 2}px`;

        // label the max and half values
        $(".legend-large-label").innerHTML = `${maxValue.toLocaleString()}`;
        $(".legend-small-label").innerHTML = (maxValue / 2).toLocaleString();

        // adjust the position of the large based on size of circle
        $(".legend-large-label").style.top = `${-11}px`;
        $(".legend-large-label").style.left = `${largeDiameter + 30}px`;

        // adjust the position of the large based on size of circle
        $(".legend-small-label").style.top = `${smallDiameter - 13}px`;
        $(".legend-small-label").style.left = `${largeDiameter + 30}px`;

        // insert a couple hr elements and use to connect value label to top of each circle
        $("hr.small").style.top = `${largeDiameter - smallDiameter - 10}px`;




    } // end drawLegend function





    function retrieveInfo(boysLayer, currentGrade) {
        // select the element and reference with variable
        const info = document.querySelector('#info');

        // since boysLayer is on top, use to detect mouseover events
        boysLayer.on('mouseover', function (e) {
            // replace the display property  with block and show
            info.style.display = 'block';

            // raise opacity level as visual affordance
            e.layer.setStyle({
                fillOpacity: 0.6,
            });

            // access properties of target layer
            const props = e.layer.feature.properties;

            // create a function with a short name to select elements
            const $ = function (x) {
                return document.querySelector(x);
            };

            // populate HTML elements with relevant info
            // console.log($('#info span')); comes back null
            // console.log($('h4 span'));
            // console.log($('.girls span:first-child'));
            $('h4 span').innerHTML = props.COUNTY;
            //console.log($('h4 span'));

            $('.girls span:first-child').innerHTML = `(grade ${currentGrade})`;
            $('.boys span:first-child').innerHTML = `(grade ${currentGrade})`;
            $('.girls span:last-child').innerHTML = Number(
                props[`G${currentGrade}`]
            ).toLocaleString();
            // console.log($('.boys span:last-child'));
            $('.boys span:last-child').innerHTML = Number(
                props[`B${currentGrade}`]
            ).toLocaleString();

            // empty arrays for boys and girls values
            const girlsValues = [],
                boysValues = [];

            // loop through the grade levels and push values into those arrays
            for (let i = 1; i <= 8; i++) {
                girlsValues.push(Number(props["G" + i]));
                boysValues.push(Number(props["B" + i]));
            }
            const girlsOptions = {
                id: "girlspark",
                width: 280, //280, // No need for units; D3 will use pixels.
                height: 40,
                color: getColor("girls"),
                lineWidth: 3,
            };

            const boysOptions = {
                id: "boyspark",
                width: 280,
                height: 40,
                color: getColor("boys"),
                lineWidth: 3,
            };

            sparkLine(girlsValues, girlsOptions, currentGrade);
            sparkLine(boysValues, boysOptions, currentGrade);


            console.log(currentGrade);






        });
        // hide the info panel when mousing off layergroup and remove affordance opacity
        boysLayer.on('mouseout', function (e) {
            // hide the info panel
            info.style.display = 'none';

            // reset the layer style
            e.layer.setStyle({
                fillOpacity: 0,
            });
        });

        // when the mouse moves on the document
        document.addEventListener("mousemove", function (e) {
            // If the page is on the small screen, calculate the position of the info window
            if (window.innerWidth < 768) {
                info.style.right = "10px";
                info.style.top = `${window.innerHeight * 0.25 + 5}px`;
            } else {
                // Console the page coordinates to understand positioning
                //   console.log(e.pageX, e.pageY);

                // offset info window position from the mouse position
                (info.style.left = `${e.pageX + 6}px`),
                (info.style.top = `${e.pageY - info.offsetHeight - 25}px`);

                // if it crashes into the right, flip it to the left
                if (e.pageX + info.offsetWidth > window.innerWidth) {
                    info.style.left = `${e.pageX - info.offsetWidth - 6}px`;
                }
                // if it crashes into the top, flip it lower right
                if (e.pageY - info.offsetHeight - 25 < 0) {
                    info.style.top = `${e.pageY + 6}px`;
                }
            }
        });


    } // end retrieveInfo function

    function sparkLine(data, options, currentGrade) {
        d3.select(`#${options.id} svg`).remove();

        const w = options.width,
            h = options.height,
            m = {
                top: 5,
                right: 5,
                bottom: 5,
                left: 5,
            },
            iw = w - m.left - m.right,
            ih = h - m.top - m.bottom,
            x = d3.scaleLinear().domain([0, data.length]).range([0, iw]),
            y = d3
            .scaleLinear()
            .domain([d3.min(data), d3.max(data)])
            .range([ih, 0]);

        const svg = d3
            .select(`#${options.id}`)
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .append("g")
            .attr("transform", `translate(${m.left},${m.top})`);

        const line = d3
            .line()
            .x((d, i) => x(i))
            .y((d) => y(d));

        const area = d3
            .area()
            .x((d, i) => x(i))
            .y0(d3.min(data))
            .y1((d) => y(d));

        svg
            .append("path")
            .datum(data)
            .attr("stroke-width", 0)
            .attr("fill", options.color)
            .attr("opacity", 0.5)
            .attr("d", area);

        svg
            .append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", options.color)
            .attr("stroke-width", options.lineWidth)
            .attr("d", line);

        svg
            .append("circle")
            .attr("cx", x(Number(currentGrade) - 1))
            .attr("cy", y(data[Number(currentGrade) - 1]))
            .attr("r", "4px")
            .attr("fill", "white")
            .attr("stroke", options.color)
            .attr("stroke-width", options.lineWidth / 2);



    } // end sparkLine function








})();