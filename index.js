var dataset;
var state_name_map = {};
var state_name_unAbv_map = {};
var usdata;
var mydata;
var COLOR_COUNTS = 9;
var COLOR_FIRST = "#c3e2ff",
    COLOR_LAST = "#08306B";
var rgb = hexToRgb(COLOR_FIRST);
var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);
rgb = hexToRgb(COLOR_LAST);
var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);
var startColors = COLOR_START.getColors(),
    endColors = COLOR_END.getColors();
var colors = [];
for (var i = 0; i < COLOR_COUNTS; i++) {
    var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
    var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
    var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
    colors.push(new Color(r, g, b));
}

var quantize = d3.scaleQuantize()
    .domain([0, 50000])
    .range(d3.range(COLOR_COUNTS).map(function(i) {
        return i
    }));


$(document).ready(function(){
	$('input[type=radio]').click(function(){
		console.log($(this).val());
        createMap($(this).val());
        createBarChartStart();
        $('#reset').css("display", "none");
        $('.overview').css("display", "none");
        $('.overview_blank_space').css("display", "block");
        if($(this).val() == "") {
            createBarChartSubmit();
            $('#form_complete').css("display", "block");
            $('.percentage').css('display', 'inline-block');
        } else {
            $('#form_complete').css("display", "none");
            $('.percentage').css('display', 'none');
            $('#bar_chart_2').empty();
        }
	});

    $("#reset").click(function(){
        // console.log()
        state_selected = false;
        createMap($('input[name=filter]:checked').val());
        createBarChartStart();
        createBarChartSubmit();
        $(this).css("display", "none");
        $('.overview').css("display", "none");
        $('.overview_blank_space').css("display", "block");
        // createBarChart();
    });
});


function loadDashboard() {
    d3.csv("https://raw.githubusercontent.com/nipun03/VA_Project/master/Data/LendingTreeDataSet.csv", function(error, data) {
        if (error) throw error;
        dataset = data;

        d3.tsv("https://raw.githubusercontent.com/nipun03/VA_Project/master/Data/us-state-names.tsv", function(error, state_names) {

            for (var i = 0; i < state_names.length; i++) {
                state_name_map[state_names[i].id] = state_names[i].code;
                state_name_unAbv_map[state_names[i].id] = state_names[i].name;
            }

            d3.json("https://raw.githubusercontent.com/nipun03/VA_Project/master/Data/us-10m.json", function(error, us) {
                usdata = us
                if (error) throw error;
                createBarChartStart();
                createBarChartSubmit();
                createMap();
            });
        });
    });
}



function createBarChartStart(state_name = "", state_unAbv_name="") {

    // console.log("SELECTED PR: " + $('#filter_form input[name=filter]:checked').val());

    $('#bar_chart').empty();

    var svg = d3.select("#bar_chart"),
        margin = {
            top: 10,
            right: 10,
            bottom: 30,
            left: 5
        },
        width = 500 - margin.left - margin.right,
        height = 70 - margin.top - margin.bottom;

    var tooltip = d3.select("body").append("div").attr("class", "toolTip");

    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleBand().range([height, 0]);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    if (state_name == "") {
        var product_reporting = $('#filter_form input[name=filter]:checked').val();
        $("#state_label").html("All");
        mydata = d3.nest()
            .key(function(d) {
                return "Form Start";
            })
            .rollup(function(d) { 
                return d3.sum(d, function(g) {
                    if (product_reporting == "") return g.Form_Start;
                    else {
                        if (product_reporting === 'Refinance') return g.Refinance;
                        if (product_reporting === 'Browsing') return g.Browsing;
                        if (product_reporting === 'Personal') return g.Personal;
                        if (product_reporting === 'Purchase') return g.Purchase;
                        if (product_reporting === 'Housing') return g.Housing;
                        if (product_reporting === 'Auto') return g.Auto;
                    }
                });
            })
            .entries(dataset);

    } else {
        $("#state_label").html(state_unAbv_name);
        mydata = d3.nest()
            .key(function(d) {
                return "Form Start";
            })
            .rollup(function(d) { 
                return d3.sum(d, function(g) {
                    return g.Form_Start;
                });
            })
            .entries(dataset.filter(function(d) {
                return d.State_Abv == state_name;
            }));
    }



    // console.log(mydata);

    mydata.sort(function(a, b) {
        return b.value - a.value;
    });

    x.domain([0, d3.max(mydata, function(d) {
        return d.value;
    })]);

    y.domain(mydata.map(function(d) {
        return d.key;
    })).padding(0.1);

    g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(7).tickFormat(function(d) {
            return parseInt(d);
        }).tickSizeInner([-height*10]));

    g.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

    g.selectAll(".bar")
        .data(mydata)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("y", function(d) {
            return y(d.key);
        })
        .attr("width", function(d) {
            return x(d.value);
        })
        .style("fill", function(d) {
            var i = quantize(d.value);
            var color = colors[i].getColors();
            return "rgb(" + color.r + "," + color.g +
                "," + color.b + ")";
        })
        .on("mousemove", function(d) {
            tooltip
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY - 70 + "px")
                .style("display", "inline-block")
                .html((d.key) + "<br>" + (d.value));
        })
        .on("mouseout", function(d) {
            tooltip.style("display", "none");
        });
}


function createBarChartSubmit(state_name = "") {

    $('#bar_chart_2').empty();

    var svg = d3.select("#bar_chart_2"),
        margin = {
            top: 10,
            right: 10,
            bottom: 30,
            left: 5
        },
        width = 500 - margin.left - margin.right,
        height = 70 - margin.top - margin.bottom;

    var tooltip = d3.select("body").append("div").attr("class", "toolTip");

    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleBand().range([height, 0]);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    if (state_name == "") {
        var product_reporting = $('#filter_form input[name=filter]:checked').val();
//        $("#state_label").html("All");
        mydata = d3.nest()
            .key(function(d) {
                return "Form Complete";
            })
            .rollup(function(d) { 
                return d3.sum(d, function(g) {
                    $('#percentage_span').html(g.ratio_submitted_vs_started+"%");
                    return g.Form_Submit;
                });
            })
            .entries(dataset);
            

    } else {
//        $("#state_label").html(state_name);
        mydata = d3.nest()
            .key(function(d) {
                return "Form Complete";
            })
            .rollup(function(d) { 
                return d3.sum(d, function(g) {
                    $('#percentage_span').html(g.ratio_submitted_vs_started+"%");
                    return g.Form_Submit;
                });
            })
            .entries(dataset.filter(function(d) {
                return d.State_Abv == state_name;
            }));
    }



    console.log(mydata);

    mydata.sort(function(a, b) {
        return b.value - a.value;
    });

    x.domain([0, d3.max(mydata, function(d) {
        return d.value;
    })]);

    y.domain(mydata.map(function(d) {
        return d.key;
    })).padding(0.1);

    g.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(7).tickFormat(function(d) {
            return parseInt(d);
        }).tickSizeInner([-height*10]));

    g.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

    g.selectAll(".bar")
        .data(mydata)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("y", function(d) {
            return y(d.key);
        })
        .attr("width", function(d) {
            return x(d.value);
        })
        .style("fill", function(d) {
            var i = quantize(d.value);
            var color = colors[i].getColors();
            return "rgb(" + color.r + "," + color.g +
                "," + color.b + ")";
        })
        .on("mousemove", function(d) {
            tooltip
                .style("left", d3.event.pageX - 50 + "px")
                .style("top", d3.event.pageY - 70 + "px")
                .style("display", "inline-block")
                .html((d.key) + "<br>" + (d.value));
        })
        .on("mouseout", function(d) {
            tooltip.style("display", "none");
        });
}



function createMap(product_reporting = "") {
    var svg = d3.select("#choropleth_map");
    var path = d3.geoPath();
    var SCALE = 0.7;

    var total_visits = 0;

    console.log("Product Reporting: " + product_reporting);

    if (product_reporting == "") {
        $("#barchart_heading").html("All Forms <span id=\"bch_span\"></span>");
        $("#bch_span").html("(No filter applied)");
        mydata = d3.nest()
            .key(function(d) {
                return d.State_Code;
            })
            .rollup(function(d) { 
                return d3.sum(d, function(g) {
                    total_visits = g.Total;
                    return g.Total;
                });
            })
            .entries(dataset);
    } else {
        $("#barchart_heading").html(product_reporting + " <span id=\"bch_span\"></span>");
        $("#bch_span").html("(Filter applied)");
        // $("#barchart_heading").children()[0].html("(Filter applied)");?\
        mydata = d3.nest()
            .key(function(d) {
                return d.State_Code;
            })
            .rollup(function(d) { 
                return d3.sum(d, function(g) {
                    total_visits = g.Total;
                    if (product_reporting === 'Refinance') return g.Refinance;
                    if (product_reporting === 'Browsing') return g.Browsing;
                    if (product_reporting === 'Personal') return g.Personal;
                    if (product_reporting === 'Purchase') return g.Purchase;
                    if (product_reporting === 'Housing') return g.Housing;
                    if (product_reporting === 'Auto') return g.Auto;
                });
            })
            .entries(dataset);
    }


    name_id_map = {};

    for (var i = 0; i < mydata.length; i++) {

        var dataState = mydata[i].key;
        var dataValue = mydata[i].value;
        name_id_map[dataState] = dataValue;
        for (var j = 0; j < usdata.objects.states.length; j++) {
            var jsonState = usdata.objects.states[j].id;

            if (dataState == jsonState) {
                usdata.states[j].properties.value = dataValue;
                break;
            }
        }

    }

    express_data = d3.nest()
            .key(function(d) {
                return d.State_Code;
            })
            .rollup(function(d) { 
                return d3.sum(d, function(g) {
                    return g.Express_Visited;
                });
            })
            .entries(dataset);


    express_map = {};

    for (var i = 0; i < express_data.length; i++) {

        var expressState = express_data[i].key;
        var expressValue = express_data[i].value;
        express_map[expressState] = expressValue;
        // console.log("ExpressMap[" + expressState + "]: " + expressValue)

    }

    auth_data = d3.nest()
            .key(function(d) {
                return d.State_Code;
            })
            .rollup(function(d) { 
                return d3.sum(d, function(g) {
                    return g.TreeAuthID;
                });
            })
            .entries(dataset);


    auth_map = {};

    for (var i = 0; i < auth_data.length; i++) {

        var authState = auth_data[i].key;
        var authValue = auth_data[i].value;
        auth_map[authState] = authValue;
        // console.log("authmap[" + authState + "]: " + authValue)

    }

    // console.log("MY DATA: " + auth_data[0].key);
    //Montana 30 NewYork 36 Utah 49
    
    svg.append("g")
        .attr("class", "categories-choropleth")
        .selectAll("path")
        .data(topojson.feature(usdata, usdata.objects.states).features)
        .enter().append("path")
        .attr("d", path)
        .attr("transform", "scale(" + SCALE + ")")
        .style("fill", function(d) {
            var temp = parseInt(d.id, 10)
            if (name_id_map[temp]) {
                var i = quantize(name_id_map[temp]);
                var color = colors[i].getColors();
                return "rgb(" + color.r + "," + color.g +
                    "," + color.b + ")";
            } else {
                return "";
            }
        })
        .on("click", function(d) {
            $('#form_complete').css("display","block");
            $('#reset').css("display","inline-block");
            createBarChartStart(state_name_map[parseInt(d.id)], state_name_unAbv_map[parseInt(d.id)]);
            createBarChartSubmit(state_name_map[parseInt(d.id)]);
            console.log("d.id: " + d.id);
            var val = name_id_map[parseInt(d.id)];

            var val_express = express_map[parseInt(d.id)];
            var val_auth = auth_map[parseInt(d.id)];
            $('#total_visits').find("span").html(val);
            $('#primary_channel').find("span").html("Google");
            $('#express_offers').find("span").html(val_express);
            $('#signups').find("span").html(val_auth);

            $('#top_form_1').find("span").html("Refinance");
            $('#top_form_2').find("span").html("Browsing");
            
            console.log("state_name_map[" + parseInt(d.id) + "]: " + state_name_map[parseInt(d.id)]);

            if (state_name_map[parseInt(d.id)] === 'NY' || state_name_map[parseInt(d.id)] === 'MT' || state_name_map[parseInt(d.id)] === 'UT')
                $('#top_form_3').find("span").html("Purchase");
            else 
                $('#top_form_3').find("span").html("Personal");

            $(".overview").css("display", "inline-block");
            $('.overview_blank_space').css("display", "none");
            
        })
        .on("mousemove", function(d) {
            var html = "";
            var val = name_id_map[parseInt(d.id)];
            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\"><span class=\"blue\">";
            html += state_name_unAbv_map[parseInt(d.id)];
            html += "</span><br>Total Visits: <span class=\"blue\">" + val + "</span><br>";
            html += "Total Visits vs. Form Submission: <span class=\"blue\">" + getVisitsToSubmissionRatio(state_name_map[parseInt(d.id)]) + "%</span>";
            html += "</span>";
            html += "</div>";

            $("#tooltip-container").html(html);
            $(this).attr("fill-opacity", "0.8");
            $("#tooltip-container").show();

            var coordinates = d3.mouse(this);

            var map_width = $('.categories-choropleth')[0].getBoundingClientRect().width;

            if (d3.event.pageX < map_width / 2) {
                d3.select("#tooltip-container")
                    .style("top", (d3.event.pageY + 15) + "px")
                    .style("left", (d3.event.pageX + 15) + "px");
            } else {
                var tooltip_width = $("#tooltip-container").width();
                d3.select("#tooltip-container")
                    .style("top", (d3.event.pageY + 15) + "px")
                    .style("left", (d3.event.pageX - tooltip_width - 30) + "px");
            }
        })
        .on("mouseout", function() {
            // createBarChart()
            // $(this).attr("fill-opacity", "1.0");
            $("#tooltip-container").hide();
        });

    svg.append("path")
        .datum(topojson.mesh(usdata, usdata.objects.states, function(a, b) {
            return a !== b;
        }))
        .attr("class", "categories")
        .attr("transform", "scale(" + SCALE + ")")
        .attr("d", path);


}

function getStateUnAbvName(state_abv = "") {
    
}

function getVisitsToSubmissionRatio(stateAbv = "") {
    var value;
    mydata = d3.nest()
            .rollup(function(d) { 
                return d3.sum(d, function(g) {
                    value = g.ratio_submitted_vs_total;
                });
            })
            .entries(dataset.filter(function(d) {
                return d.State_Abv == stateAbv;
            }));
    return value;
}

function Interpolate(start, end, steps, count) {
    var s = start,
        e = end,
        final = s + (((e - s) / steps) * count);
    return Math.floor(final);
}

function Color(_r, _g, _b) {
    var r, g, b;
    var setColors = function(_r, _g, _b) {
        r = _r;
        g = _g;
        b = _b;
    };

    setColors(_r, _g, _b);
    this.getColors = function() {
        var colors = {
            r: r,
            g: g,
            b: b
        };
        return colors;
    };
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}