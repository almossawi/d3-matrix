(function() {
    var args = {
        padding: 52,
        matrix_height: 800,
        employee_data: {},
        in_manager_view: false
    };    

    d3.csv('data/employees-dependencies.csv', function(data) {
        d3.text('data/employees.txt', function(text) {
            args.dependencies = data;

            // make sure our data is sorted by employee ID so that our timezone
            // labels are added at the beginning of each range
            args.dependencies.sort(function(a, b) {
                return a.from_employee - b.from_employee;
            });

            // we have dependencies in one file and employee names and geo data in another
            // so we first need to consolidate our data sets. In the second file, line 
            // numbers are being used to denote employee IDs
            d3.csv.parseRows(text).forEach(function(row, i) {
                args.employee_data[++i] = {
                    name: row[0],
                    region: row[1],
                    timezone: row[2]
                }
            });
            
            args.employee_count = +Object.keys(args.employee_data).length;
            d3.select('.total_employees').html(args.employee_count);

            // employees by region hash table
            var employees_by_region = {
                'USA': 0,
                'LATAM': 0,
                'EMEA': 0,
                'CANADA': 0,
                'APAC': 0
            };

            // get a summary of employees split by region
            d3.entries(args.employee_data).forEach(function(employee) {
                employees_by_region[employee.value.region] = employees_by_region[employee.value.region] + 1;
            });

            // populate the table
            $('.employees-by-region td:nth-child(2)').html(
                getPercentage(employees_by_region.APAC / args.employee_count)
            );

            $('.employees-by-region td:nth-child(3)').html(
                getPercentage(employees_by_region.CANADA / args.employee_count)
            );

            $('.employees-by-region td:nth-child(4)').html(
                getPercentage(employees_by_region.EMEA / args.employee_count)
            );

            $('.employees-by-region td:nth-child(5)').html(
                getPercentage(employees_by_region.LATAM / args.employee_count)
            );

            $('.employees-by-region td:nth-child(6)').html(
                getPercentage(employees_by_region.USA / args.employee_count)
            );

            // managers by region hash table
            var managers_by_region = {
                'USA': {},
                'LATAM': {},
                'EMEA': {},
                'CANADA': {},
                'APAC': {}
            };

            // get a summary of managers split by region
            args.dependencies.forEach(function(d) {
                var manager = d.to_employee;
                var region = args.employee_data[manager].region;
                managers_by_region[region][manager] = 1;
            });

            managers_by_region.APAC = d3.keys(managers_by_region.APAC);
            managers_by_region.CANADA = d3.keys(managers_by_region.CANADA);
            managers_by_region.EMEA = d3.keys(managers_by_region.EMEA);
            managers_by_region.LATAM = d3.keys(managers_by_region.LATAM);
            managers_by_region.USA = d3.keys(managers_by_region.USA);
            managers_by_region.TOTAL = managers_by_region.APAC.length +
            managers_by_region.CANADA.length + managers_by_region.EMEA.length + managers_by_region.LATAM.length + managers_by_region.USA.length;

            $('.managers-by-region td:nth-child(2)').html(
                getPercentage(managers_by_region.APAC.length /
                    managers_by_region.TOTAL));
            $('.managers-by-region td:nth-child(3)').html(
                getPercentage(managers_by_region.CANADA.length /
                    managers_by_region.TOTAL));
            $('.managers-by-region td:nth-child(4)').html(
                getPercentage(managers_by_region.EMEA.length /
                    managers_by_region.TOTAL));
            $('.managers-by-region td:nth-child(5)').html(
                getPercentage(managers_by_region.LATAM.length /
                    managers_by_region.TOTAL));
            $('.managers-by-region td:nth-child(6)').html(
                getPercentage(managers_by_region.USA.length /
                    managers_by_region.TOTAL));

            var size = [args.matrix_height, args.matrix_height];
            console.log(args);

            args.x = args.y = d3.scale.linear()
                .domain([1, args.employee_count])
                .range([args.padding, args.matrix_height - args.padding - 1]);

            var svg = d3.select('.dsm').append('svg')
                .attr('width', args.matrix_height)
                .attr('height', args.matrix_height)
                .attr('viewBox', "0 0 800 800")
                .attr('preserveAspectRatio', "xMinYMin meet");

            //rollover labels
            svg.append('text')
                .attr('class', 'to-employee')
                .attr('text-anchor', 'middle');

            svg.append('text')
                .attr('class', 'from-employee')
                .attr('text-anchor', 'middle');

            svg.append("rect")
                .attr("width", args.matrix_height - (args.padding * 2) + 2)
                .attr("height", args.matrix_height - (args.padding * 2) + 2)
                .attr('x', args.padding)
                .attr('y', args.padding);

            var dots = svg.append('g')
                .attr('class', 'dot');

            dots.selectAll('rect')
                .data(args.dependencies)
              .enter().append('rect')
                .attr('class', function(d) {
                    return 'm' + d.to_employee + ' e' + d.from_employee;
                })
                .attr('width', 0)
                .attr('height', 0)
                .attr('transform', function(d) {
                    return "translate(" + args.x(d.to_employee)
                        .toFixed(2) + "," + args.y(d.from_employee)
                        .toFixed(2) + ")";
                })
                .transition()
                    .delay(1000)
                    .duration(function(d, i) {
                        return i * Math.random() % 2000;
                    })        
                    .attr('width', Math.ceil(args.matrix_height / args.employee_count))
                    .attr('height', Math.ceil(args.matrix_height / args.employee_count))
                    //.attr('width', 2)
                    //.attr('height', 2);

            //add timezone labels
            svg.append('g')
                .attr('class', 'timezone-labels');
                
            //add timezone axis description
            svg.append('text')
                .attr('class', 'timezone-axis-description')
                .attr('text-anchor', 'start')
                .attr('x', args.matrix_height - 10)
                .attr('y', args.padding)
                .attr('transform', function(d) {
                    var elem = d3.select(this);
                    return 'rotate(90 ' + elem.attr('x') + ',' + elem.attr('y') + ')';
                })
                .text('Time zone→');

            // rug plots for left side
            var timezone_y = svg.append('g')
                .attr('class', 'timezone-y');

            timezone_y.selectAll("rect")
                .data(dedup(args.dependencies, 'from_employee'))
              .enter().append("rect")
                .attr("class", function(d) {
                    return args.employee_data[d.from_employee].region
                        + ' e' + d.from_employee;
                })
                .attr('width', 6)
                //.attr('height', 2)
                .attr('height', Math.ceil(args.matrix_height / args.employee_count))
                .attr('transform', function(d) {
                    return "translate(" + (args.padding - 6) +
                        "," + args.y(d.from_employee).toFixed(2) +
                        ")";
                })
                .each(function(d) {
                    // skip if we've already added a label for this timezone
                    var timezone_code = stripPunctuation(args.employee_data[d.from_employee].timezone);
                    if (document.querySelectorAll('.timezone-labels text.utc' + timezone_code).length > 0) {
                        return false;
                    }

                    // add a label for this timezone
                    d3.select('.timezone-labels').append('text')
                        .attr('class', 'utc' + timezone_code)
                        .attr('text-anchor', 'start')
                        .attr('x', args.matrix_height - args.padding + 4)
                        .attr('y', function() {
                            //push first label down a bit
                            return (args.employee_data[d.from_employee].timezone === '-8') 
                                ? args.y(d.from_employee) + 8 
                                : args.y(d.from_employee);
                        })
                        .text(function() {
                            var timezone = args.employee_data[d.from_employee].timezone;

                            return (timezone.charAt(0) === '-') 
                                ? 'UTC' + timezone
                                : 'UTC+' + timezone;
                        });
                });

            preventVerticalOverlap(d3.selectAll('svg .timezone-labels text')[0], args);

            // rug plots for top side
            var timezone_x = svg.append('g')
                .attr('class', 'timezone-x');

            timezone_x.selectAll("rect")
                .data(dedup(args.dependencies, 'to_employee'))
              .enter().append("rect")
                .attr('class', function(d) {
                    return args.employee_data[d.to_employee].region + ' m' + d.to_employee;
                })
                //.attr('width', 2)
                .attr('width', Math.ceil(args.matrix_height / args.employee_count))
                .attr('height', 6)
                .attr("transform", function(d) {
                    return "translate(" + args.x(d.to_employee)
                        .toFixed(2) + "," + (args.padding - 6).toFixed(2) + ")";
                });

            var dots_rollover = svg.append('g')
                .attr('class', 'dot-rollover');

            // add voronoi rollovers
            args.voronoi = d3.geom.voronoi()
                .x(function(d) { return args.x(d.to_employee); })
                .y(function(d) { return args.y(d.from_employee); })
                .clipExtent([[0, 0], [args.matrix_height - args.padding, args.matrix_height - args.padding]]);

            dots_rollover.selectAll("path")
                .data(args.voronoi(args.dependencies))
              .enter().append('path')
                .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
                .attr("class", function(d) {
                    return "m" + d.point.to_employee + " e" + d.point.from_employee;
                })
                .on('mouseover', dotMouseOver(args))
                .on('click', dotClick(args));

            // event listener for combo box
            $('.manager-combo-box select').change(function(d) {
                var manager = $(this).val();
                args.in_manager_view = true;
                managerViewMeBro(manager);
            });

            // get most spread-out teams
            getMostSpreadOutTeams(args);

            // sort the managers by name before adding them to the combo box
            var data_for_combo_box = MG.clone(args.managers);
            data_for_combo_box.sort(function(a, b) {
                if (args.employee_data[a.manager].name < args.employee_data[b.manager].name) {
                    return -1;
                }

                if (args.employee_data[a.manager].name > args.employee_data[b.manager].name) {
                    return 1;
                }

                return 0;
            });

            // populate the combo box
            $.each(data_for_combo_box, function(i, d) {
                $('.manager-combo-box select')
                    .append($("<option></option>")
                        .attr("value", d.manager)
                        .text(args.employee_data[d.manager].name));
            });

            // highlight the default one
            d3.select('.dot-rollover .e84.m75').on('mouseover')(d3.select('.dot-rollover .e84.m75').data()[0]);
            //$('.manager-combo-box select').val('878');
        });
    });

    function managerViewMeBro(manager) {
        // update the combo box's selection
        $('.manager-combo-box select').val(manager);

        // regenerate the voronoi
        d3.select('.dot-rollover')
            .selectAll("*")
            .remove();

        // reset all dots
        d3.selectAll('.dot rect, .timezone-x rect, .timezone-y rect')
            .style('stroke-width', '0')
            .style('display', 'inline');

        // are we resetting the dsm?
        if (manager === '-1' || !args.in_manager_view) {
            regenerateVoronoi(args.dependencies);
            return false;
        }

        // replace data with just this team's data
        var team = args.dependencies.filter(function(employee, i) {
            return employee.to_employee === manager;
        });

        regenerateVoronoi(team);

        // trigger the mouseover for this manager
        d3.select('.dot-rollover .m' + manager)
            .on('mouseover')(d3.select('.dot-rollover .m' + manager).data()[0]);

        // hide all other dots
        d3.selectAll('.dot rect')
            //.style('stroke-width', '1px')
            .filter(function(d, i) {
                return d.to_employee !== manager;
            })
            .style('display', 'none');

        // hide all other timezone-y rects
        d3.selectAll('.timezone-y rect')
            .filter(function(d, i) {
                //if this element is not on manager's team, hide them
                return args.managers_team[manager].individuals.indexOf(d.from_employee) === -1;
            })
            .style('display', 'none');

        // hide all other timezone-x rects but this manager's (min = max = 1)
        d3.selectAll('.timezone-x rect')
            .filter(function(d, i) {
                return d.to_employee !== manager;
            })
            .style('display', 'none');
    }

    // get the most spread out teams
    function getMostSpreadOutTeams(args) {
        // maintain hash of processed managers
        var manager_already_processed = {};

        // store sorted collection of manager's team spreads
        args.managers = [];
        args.managers_team = {};

        // go through all data, get team size for each manager
        // also, set team_spread_across_timezones for each manager
        args.dependencies.forEach(function(d, i) {
            //add this manager to a hashtable
            if(!args.managers_team.hasOwnProperty(d.to_employee)) {
                args.managers_team[d.to_employee] = {};
                args.managers_team[d.to_employee].individuals = [];
                args.managers_team[d.to_employee].timezones = [];
            }

            args.managers_team[d.to_employee].individuals.push(d.from_employee);

            // did we already process this manager?
            if(manager_already_processed[d.to_employee] === 1) {
                return;
            }

            // get this manager's team
            var team = args.dependencies.filter(function(d2, i) {
                return d2.to_employee === d.to_employee;
            });

            var team_by_timezone = {};
            team.map(function(d2, i) {
                var timezone = args.employee_data[d2.from_employee].timezone;
                if (team_by_timezone[timezone] == undefined) {
                    team_by_timezone[timezone] = 0;
                }

                team_by_timezone[timezone] = team_by_timezone[timezone] + 1;
            });

            var team_by_timezone_arr = d3.entries(team_by_timezone).sort(function(a, b) {
                return b.value - a.value;
            });

            // add to hash table
            var managers_timezones = [];
            for(var i = -12; i <= 12; i += 1) {
                var timezone = (i < 0) 
                ? i 
                : '+' + i;
                
                if(team_by_timezone.hasOwnProperty(i)) {
                    managers_timezones.push({'key': timezone, 'value': team_by_timezone[i]})
                } else {
                    managers_timezones.push({'key': timezone, 'value': 0})
                }
            }

            args.managers_team[d.to_employee].timezones = managers_timezones;

            // max timezone difference for this team
            var min_timezone = d3.min(team_by_timezone_arr, function(d) { return +d.key; });
            var max_timezone = d3.max(team_by_timezone_arr, function(d) { return +d.key; });        
            var timezone_spread_team = Math.abs(max_timezone - min_timezone);

             // timezone overlap between manager and team members
             var timezone_spread_manager_and_staff = d3.max(team_by_timezone_arr, function(d2) {
                var managers_timezone = Number(d2.key);
                var staff_sub_timezone = Number(args.employee_data[d.to_employee].timezone);

                return Math.abs(managers_timezone - staff_sub_timezone);
            });

            // potential lost hours for this team
            // see difference between the mode (timezone) and the max of (max timezone, min timezone)
            var managers_timezone = Number(args.employee_data[d.to_employee].timezone);
            var mode_timezone = Number(team_by_timezone_arr[0].key);

            var timezone_spread_lost_hours = d3.max([Math.abs(min_timezone - mode_timezone), Math.abs(max_timezone - mode_timezone)]);
            var timezone_spread_manager_and_staff_lost_hours = Math.abs(managers_timezone - mode_timezone);

            // add it to our collection
            args.managers.push({'manager': d.to_employee, 
                'team_size': team.length, 
                'spread_team': timezone_spread_team, 
                'spread_manager_and_staff': timezone_spread_manager_and_staff,
                'lost_hours_team': timezone_spread_lost_hours,
                'lost_hours_manager_and_staff': timezone_spread_manager_and_staff_lost_hours,
                'team_timezones': team_by_timezone_arr
                });

            manager_already_processed[d.to_employee] = 1;
        });

        args.managers.sort(function(a, b) {
            // sort by team spread
            var spread = b.spread_team - a.spread_team;
            if(spread !== 0) return spread;

            // then spread by team size
            var size = b.team_size - a.team_size;
            if(size !== 0) return size;

            // then spread by manager's name
            var managers_name = b.manager_name - a.manager_name;
            if(managers_name !== 0) return managers_name;
        });

        // populate tables
        d3.selectAll('.number-of-teams').text(args.managers.length);

        for(var i = 0; i < 20; i += 1) {
            var tr = d3.selectAll('.most-spread-out tbody').append('tr');
            tr.append('td').html((i+1) + '.');
            tr.append('td').html(args.employee_data[args.managers[i].manager].name);
            tr.append('td').html(args.managers[i].team_size);
            tr.append('td').html(args.managers[i].spread_team + ' hours');
        }

        var managers_with_actual_teams = args.managers.filter(function(d, i) {
            return d.team_size > 1;
        }).reverse();

        for(var i = 0; i < 20; i += 1) {
            var tr = d3.selectAll('.least-spread-out tbody').append('tr');
            tr.append('td').html((i+1) + '.');
            tr.append('td').html(args.employee_data[managers_with_actual_teams[i].manager].name);
            tr.append('td').html(managers_with_actual_teams[i].team_size);
            tr.append('td').html(managers_with_actual_teams[i].spread_team + ' hours');
        }

        // populate distribution of max timezones table
        MG.data_graphic({
            data: args.managers,
            y_accessor: 'manager',
            x_accessor: 'spread_team',
            width: 280,
            chart_type: 'histogram',
            x_label: 'Maximum time difference (hours)',
            y_label: 'Number of teams',
            bins: 10,
            left: 65,
            right: 20,
            bottom: 50,
            mouseover: function(d) {
                d3.select('.max-timezone-distribution svg .mg-active-datapoint')
                    .text('Maximum time difference: ' + d.x.toFixed(0) + ' to ' + (d.x + d.dx).toFixed(0) + ' hours, teams: ' + d.y);
            },
            target: '.max-timezone-distribution'
        });

        MG.data_graphic({
            data: args.managers,
            y_accessor: 'manager',
            x_accessor: 'lost_hours_team',
            width: 280,
            chart_type: 'histogram',
            x_label: 'Potential lost hours',
            y_label: 'Number of teams',
            bins: 10,
            left: 65,
            right: 20,
            bottom: 50,
            mouseover: function(d) {
                d3.select('.lost-hours-distribution svg .mg-active-datapoint')
                    .text('Potential lost hours: ' + d.x.toFixed(0) + ' to ' + (d.x + d.dx).toFixed(0) + ' hours, teams: ' + d.y);
            },
            target: '.lost-hours-distribution'
        });
    }

    function regenerateVoronoi(data) {
        d3.select('.dot-rollover').selectAll('path')
            .data(args.voronoi(data))
          .enter().append('path')
            .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
            .attr("class", function(d) {
                return "m" + d.point.to_employee + " e" + d.point.from_employee;
            })
            .on('mouseover', dotMouseOver(args))
            .on('click', dotClick(args));
    }
    
    function dotClick(args) {
        return function(d) {
            if(args.in_manager_view) {
                args.in_manager_view = false;
            } else {
                args.in_manager_view = true;
            }

            managerViewMeBro(d.point.to_employee);
        };
    }

    function dotMouseOver(args) {
        return function(d) {
            d = d.point;

            d3.selectAll('.timezone-x .active')
                .attr('height', 6)
                .attr('opacity', 1)
                .classed('active', false);

            d3.selectAll('.timezone-y .active')
                .attr('width', 6)
                .attr('opacity', 1)
                .classed('active', false);

            d3.select('.to-employee')
                .attr('x', args.x(d.to_employee))
                .attr('y', 10)
                .text(args.employee_data[d.to_employee].name)
                .attr('text-anchor', function() {
                    if (d.to_employee < 20) {
                        return 'start';
                    } else if (d.to_employee > args.employee_count - 20) {
                        return 'end';
                    } else {
                        return 'middle';
                    }
                });

            d3.select('.from-employee')
                .attr('x', 10)
                .attr('y', args.y(d.from_employee))
                .text(args.employee_data[d.from_employee].name)
                .attr('text-anchor', function() {
                    if (d.from_employee < 20) {
                        return 'end';
                    } else if (d.from_employee > args.employee_count - 20) {
                        return 'start';
                    } else {
                        return 'middle';
                    }
                })
                .attr('transform', 'rotate(-90 10 ' + args.y(d.from_employee) + ')');

            d3.select('.timezone-x .m' + d.to_employee)
                .attr('height', args.matrix_height - (args.padding * 2) + 8)
                .attr('opacity', 0.35)
                .classed('active', true);

            d3.select('.timezone-y .e' + d.from_employee)
                .attr('width', args.matrix_height - (args.padding * 2) + 8)
                .attr('opacity', 0.35)
                .classed('active', true);

            //get data about the team and the team-spread for this manager
            var team;
            args.managers.forEach(function(d2) {
                if(d2.manager == d.to_employee) {
                    team = d2;
                    return;
                }
            });

            var timezone = team.team_timezones[0].key;
            timezone = (timezone.charAt(0) === '-') 
                ? 'UTC' + timezone 
                : 'UTC+' + timezone;

            var mean_in_each_timezone = d3.mean(team.team_timezones, function(d) {
                return d.value;
            });

            var median_in_each_timezone = Math.ceil(
                d3.median(team.team_timezones, function(d) {
                    return d.value;
                })
            );

            // populate data box
            $('.data-box .manager').html(args.employee_data[d.to_employee].name);
            $('.data-box .manages').html('Manages ' + args.employee_data[d.from_employee].name);
            $('.data-box .team-size').html('Team size ' + args.managers_team[d.to_employee].individuals.length);
            $('.data-box .team-collocated').html('<b>Staff in each timezone</b><br />' + median_in_each_timezone + ' (median), ' + Math.round(mean_in_each_timezone) + ' (mean)');
            $('.data-box .lost-hours').html('<b>Potential lost hours<sup>*</sup></b><br />' + team.lost_hours_team + ' hours (between staff)<br />' + team.lost_hours_manager_and_staff + ' hours (between manager and staff)');
            $('.data-box .team-spread').html('<b>Maximum time difference</b><br/>' + team.spread_team + ' hours (between staff)<br />' + team.spread_manager_and_staff + ' hours (between manager and staff)');
            $('.data-box .time-zone').html('<b>Largest group in the same time zone</b><br />' + team.team_timezones[0].value + ' staff, ' + getPercentage(team.team_timezones[0].value / team.team_size) + ' of team are in ' + timezone);

            // show team members across timezones for this manager
            MG.data_graphic({
                data: args.managers_team[d.to_employee].timezones,
                y_accessor: 'key',
                x_accessor: 'value',
                chart_type: 'bar',
                x_label: "Team members per timezone",
                x_extended_ticks: true,
                max_x: 85,
                left: 30,
                right: 10,
                bottom: 55,
                width: 320,
                height: 310,
                mouseover: function(d) {
                    d3.select('.managers-team-across-timezones svg .mg-active-datapoint')
                        .text('UTC' + d.key + ' (' + d.value + ')');
                },
                target: '.managers-team-across-timezones'
            });
            
            d3.select('.mg-x-axis .label')
                .attr('transform', 'translate(-15,0)');
        };
    }

    function getPercentage(n) {
        return (n * 100).toFixed(0) + '%';
    }

    function preventVerticalOverlap(labels, args) {
        if (!labels || labels.length == 1) {
            return;
        }

        labels.sort(function(b, a) {
            return d3.select(a).attr('y') - d3.select(b).attr('y');
        });

        labels.reverse();

        var overlap_amount, label_i, label_j;

        //see if each of our labels overlaps any of the other labels
        for (var i = 0; i < labels.length; i += 1) {
            //if so, nudge it up a bit, if the label it intersects hasn't already been nudged
            label_i = d3.select(labels[i]).text();

            for (var j = 0; j < labels.length; j += 1) {
                label_j = d3.select(labels[j]).text();
                overlap_amount = isVerticallyOverlapping(labels[i], labels[j]);

                if (overlap_amount !== false && label_i !== label_j) {
                    var node = d3.select(labels[i]);
                    var newY = +node.attr('y');
                    newY = newY + overlap_amount;
                    node.attr('y', newY);
                }
            }
        }
    }

    function isVerticallyOverlapping(element, sibling) {
        var element_bbox = element.getBoundingClientRect();
        var sibling_bbox = sibling.getBoundingClientRect();

        if (element_bbox.top <= sibling_bbox.bottom && element_bbox.top >=
            sibling_bbox.top) {
            return sibling_bbox.bottom - element_bbox.top;
        }

        return false;
    }

    function stripPunctuation(s) {
        var punctuationless = s.replace(/[^a-zA-Z0-9 _-]+/g, '');
        var finalString = punctuationless.replace(/ +?/g, "");
        return finalString;
    }

    function dedup(arr, accessor) {
        var seen_it = {};

        return arr.filter(function(d) {
            if(!seen_it.hasOwnProperty(d[accessor])) {
                seen_it[d[accessor]] = true;
                return true;
            } else {
                return false;
            }
        });
    }
}());