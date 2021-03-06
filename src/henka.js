define(function(){

    var henka = (function (window, document, undefined) {

        'use strict';
        //IE doesn't like you to reuse the same names around these parts
        //I am lazy, so I used underscore, this is not related to underscore or lodash.
        var _ = {
            //just some things to use
            props: {
                nodes: [],
                lastWidth: 0,
                body: {},
                currentBreak: '',
                originalHenka: window['henka'] || {}
            },
            //run to initialize the library, wrapped in a documentReady checker
            init: function () {
                _.props.body = document.getElementsByTagName('body')[0];
                _.core.update();
                _.tools.attach();
            },
            core: {
                //set class on an element from the list of breakpoints
                'set': function (element) {
                    var breakPoints = JSON.parse(element.getAttribute('data-henka')),
                        match = '',
                        classes = element.className.split(' ');
                    if(breakPoints){
                        for (var i = breakPoints.length - 1; i >= 0; i--) {
                            if (_.core.check(breakPoints[i])) {
                                match = 'bp' + breakPoints[i];
                            }
                            var arrIndex = _.tools.indexOf(classes, 'bp' + breakPoints[i]);
                            if (arrIndex >= 0) {
                                classes.splice(arrIndex, 1);
                            }
                        }
                    }
                    if (match.length > 0) {
                        classes.push(match);
                        _.props.currentBreak = match;
                    } else {
                        _.props.currentBreak = undefined;
                    }
                    if (element.className != classes.join(' ')) {
                        //only update if the class actually updated
                        element.className = classes.join(' ').replace(/^\s+|\s+$/g, '');
                        //emit update event if updated
                        if(typeof(yobidashi) !== 'undefined'){yobidashi.pub('/henka/updated');}
                    }
                },
                //update function, fire resize event
                update: function () {
                    _.core.set(_.props.body);
                    if(typeof(yobidashi) !== 'undefined'){yobidashi.pub('/henka/resized');}
                },
                check: function (breakpoint) {
                    //check to see if the view-port is with in the breakpoint bounds
                    return _.tools.innerWidth() <= breakpoint;
                }
            },
            tools: {
                indexOf: function (arr, needle) {
                    //indexOf for array, and polyfill
                    if (Array.prototype.indexOf) {
                        return Array.prototype.indexOf.call(arr, needle);
                    } else {
                        for (var i = arr.length - 1; i >= 0; i--) {
                            if (needle === arr[i]) {
                                return i;
                            }
                        }
                        return -1;
                    }
                },
                innerWidth: function () {
                    //get the innerwidth, with IE fill
                    return window.innerWidth || document.documentElement.clientWidth;
                },
                isMobileDevice: function () {
                    //checke user agent for supported mobile devices
                    var i = 0,
                        device_ua = ['iPad', 'iPhone', 'iPod', 'Android', 'webOS', 'BlackBerry', 'Windows Phone'];
                    for (; i < device_ua.length; i++) {
                        if (window.navigator.platform === device_ua[i]) {
                            return true;
                        }
                    }
                    return false;
                },
                attach: function () {
                    //attach to window.resize, but do it smart. check the time between movements.
                    var rtime = new Date('2000-01-01T12:00:00.000Z'),
                        timeout = false,
                        delta = 100,
                        didRun = false,
                        update = function () {
                            if (didRun === false) {
                                didRun = true;
                                window.setTimeout(function () {
                                    _.core.update();
                                }, 0);
                            }
                        }, resizeEnd = function () {
                            if (new Date() - rtime < delta) {
                                window.setTimeout(resizeEnd, 0);
                            } else {
                                timeout = false;
                                didRun = false;
                                if (!_.tools.isMobileDevice()) {
                                    update();
                                }
                            }
                        }, resize = function () {
                            var current_width = _.tools.innerWidth();
                            if (_.props.lastWidth != current_width) {
                                if (_.tools.isMobileDevice()) {
                                    update();
                                }
                                rtime = new Date();
                                if (timeout === false) {
                                    timeout = true;
                                    window.setTimeout(resizeEnd, delta);
                                }
                            }
                            _.props.lastWidth = current_width;
                        };
                    if (window.addEventListener) {
                        window.addEventListener('resize', resize, false);
                    } else {
                        window.attachEvent('onresize', resize);
                    }
                }
            }
        };

        var readyStateCheckInterval = window.setInterval(function () {
            //attach a ready state listener to fire off our first updates when the dom is available
            if (document.readyState === 'complete') {
                window.clearInterval(readyStateCheckInterval);
                _.init();
            }
        }, 10);

        //api
        _.api = (function () {
            return {
                'noConflict': function () {
                    window['henka'] = _.props.originalHenka;
                    return _.api;
                },
                'currentBreak' : function(){
                    return _.props.currentBreak;
                }
            };
        }());

        return _.api;

    })(window, document);

    window['henka'] = henka;

    return henka;

});

