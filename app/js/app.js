'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.controllers', 'myApp.directives', 'ui', 'pageslide-directive', 'notifications'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/404', {templateUrl: 'partials/404.html'});
        $routeProvider.when('/path/list', {templateUrl: 'partials/path-list.html', controller: 'PathController', clearPath: true, clearClipboard: true, clearHistory: true});
        $routeProvider.when('/template/list', {templateUrl: 'partials/template-list.html', controller: 'TemplateController', clearPath: true, clearClipboard: true, clearHistory: true});
        $routeProvider.when('/template/edit', {templateUrl: 'partials/template-edit.html', controller: 'TemplateController'});
        $routeProvider.when('/template/edit/:id', {templateUrl: 'partials/template-edit.html', controller: 'TemplateController'});
        
        // Editing Steps
        $routeProvider.when('/path/global', {templateUrl: 'partials/editing-steps/global.html', controller: 'TreeController'});
        $routeProvider.when('/path/global/:id', {templateUrl: 'partials/editing-steps/global.html', controller: 'TreeController'});
        $routeProvider.when('/path/skills/:id', {templateUrl: 'partials/editing-steps/skills.html', controller: 'TreeController'});
        $routeProvider.when('/path/scenario/:id', {templateUrl: 'partials/editing-steps/scenario.html', controller: 'TreeController'});
        $routeProvider.when('/path/validation/:id', {templateUrl: 'partials/editing-steps/validation.html', controller: 'TreeController'});
        $routeProvider.when('/path/planner/:id', {templateUrl: 'partials/editing-steps/planner.html', controller: 'TreeController'});
        
        $routeProvider.when('/step/edit', {templateUrl: 'partials/step-edit.html', controller: 'StepController'});
        $routeProvider.when('/step/edit/:id', {templateUrl: 'partials/step-edit.html', controller: 'StepController'});
        
        $routeProvider.otherwise({redirectTo: '/404'});
    }])
    
    .run([
        '$location',
        '$route',
        'pathFactory',
        'clipboardFactory',
        'historyFactory',
        function($location, $route, pathFactory, clipboardFactory, historyFactory) {
            $rootScope.$on('$routeChangeSuccess', function(event, next, current) {
                if (next.clearClipboard) {
                    clipboardFactory.clear();
                }
                
                if (next.clearHistory) {
                    historyFactory.clear();
                }
                
                if (next.clearPath) {
                    pathFactory.clear();
                }
            });
        }
    ])
    
    .factory('historyFactory', [
        'pathFactory', 
        function(pathFactory) {
            var redoDisabled = true;
            var undoDisabled = true;
            
            var history = [];
            var historyState = -1;
            
            return {
                get: function() {
                    return history;
                },
                
                clear: function() {
                    this.setRedoDisabled(true);
                    this.setUndoDisabled(true);
                    
                    history = [];
                    historyState = -1;
                },
                
                update: function(path) {
                    // Increment history state
                    this.incrementHistoryState();
                    
                    this.addPathToHistory(path);
                    
                    if (this.getHistoryState() !== 0) {
                        this.setUndoDisabled(false);
                    }
                    this.setRedoDisabled(true);
                },
                
                undo: function() {
                    // Decrement history state
                    this.decrementHistoryState();
                    
                    var path = this.getPathFromHistory(historyState);
                    
                    // Clone object
                    var pathCopy = jQuery.extend(true, {}, path);
                    
                    this.setRedoDisabled(false);
                    if (0 === historyState) {
                        this.setUndoDisabled(true);
                    }
                    
                    // Inject new path
                    pathFactory.setPath(pathCopy);
                },
                
                redo: function() {
                    // Increment history state
                    this.incrementHistoryState();
                    
                    var path = this.getPathFromHistory(historyState);
                    
                    // Clone object
                    var pathCopy = jQuery.extend(true, {}, path);
                    
                    this.setUndoDisabled(false);
                    if (historyState == history.length - 1) {
                        this.setRedoDisabled(true);
                    }
                    
                    // Inject new path
                    pathFactory.setPath(pathCopy);
                },
                
                incrementHistoryState: function() {
                    // Increment history state
                    this.setHistoryState(this.getHistoryState() + 1);
                },
                
                decrementHistoryState: function() {
                    // Decrement history state
                    this.setHistoryState(this.getHistoryState() - 1);
                },
                
                getHistoryState: function() {
                    return historyState;
                },
                
                setHistoryState: function(data) {
                    historyState = data;
                },
                
                getPathFromHistory : function(index) {
                    return history[index];
                },
                
                addPathToHistory : function(data) {
                    // Clone object
                    var pathCopy = jQuery.extend(true, {}, data);
                    history.push(pathCopy);
                },
                
                getRedoDisabled: function() {
                    return redoDisabled;
                },
                
                setRedoDisabled: function(data) {
                    redoDisabled = data;
                },
                
                getUndoDisabled: function() {
                    return undoDisabled;
                },
                
                setUndoDisabled: function(data) {
                    undoDisabled = data;
                }
            }
        }
    ])
    
    .factory('clipboardFactory', function($rootScope) {
        var clipboard = null;
        var clipboardFromTemplates = false;
        
        var pasteDisabled = true;
        
        return {
            clear: function() {
                clipboard = null;
                clipboardFromTemplates = false;
                this.setPasteDisabled(true);
            },
            
            isEmpty: function() {
                return null === clipboard;
            },
            
            copy: function(steps, fromTemplates) {
                clipboard = steps;
                clipboardFromTemplates = fromTemplates || false;
                this.setPasteDisabled(false);
            },
            
            paste: function(step) {
                if (!this.isEmpty())
                {
                    // Clone voir : http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
                    var stepCopy = jQuery.extend(true, {}, clipboard);
                    
                    if (!clipboardFromTemplates) {
                        stepCopy.name = stepCopy.name + '_copy';
                    }
                    
                    step.children.push(stepCopy);
                }
            },
            
            getPasteDisabled: function() {
                return pasteDisabled;
            },
            
            setPasteDisabled: function(data) {
                pasteDisabled = data;
            }
        }
    })
    
    .factory('pathFactory', function() {
        var path = null;
        var pathInstanciated = [];

        return {
            clear: function() {
                path = null;
                pathInstanciated = [];
            },
            
            getPath : function() {
                return path;
            },
            
            setPath : function(data) {
                path = data;
            },
            
            addPathInstanciated : function(id) {
                pathInstanciated[id] = id;
            },
            
            getPathInstanciated : function(id) {
                return typeof pathInstanciated[id] != 'undefined';
            }
        };
    })
    
    .factory('stepFactory', function() {
        var step = null;

        return {
            setStep : function (data) {
                step = data;
            },
            
            getStep : function () {
                return step;
            }
        };
    })
    
    .factory('templateFactory', function() {
        var templates = {};

        return {
            addTemplate : function(template) {
                templates.push(template);
            },
            
            getTemplates : function() {
                return templates;
            },
            
            setTemplates : function(data) {
                templates = data;
            }
        };
    })
    
    .factory('alertFactory', function() {
        var alerts = [];

        return {
            getAlerts : function() {
                return alerts;
            },
            
            addAlert : function(msg, type) {
                alerts.push({ type: type, msg: msg });
            },
            
            closeAlert : function(index) {
                alerts.splice(index, 1);
            }
        };
    });
