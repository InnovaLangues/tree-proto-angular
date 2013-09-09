'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.controllers', 'myApp.directives', 'ui', 'pageslide-directive', 'notifications'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/404', {templateUrl: 'partials/404.html'});
        $routeProvider.when('/', {templateUrl: 'partials/path-list.html', controller: 'PathController', clearPath: true, clearClipboard: true, clearHistory: true});
        $routeProvider.when('/path/list', {templateUrl: 'partials/path-list.html', controller: 'PathController', clearPath: true, clearClipboard: true, clearHistory: true});
        
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
        '$rootScope',
        '$location',
        '$route',
        'pathFactory',
        'clipboardFactory',
        'historyFactory',
        function($rootScope, $location, $route, pathFactory, clipboardFactory, historyFactory) {
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
    
    // TODO : remove reference to $rootScope
    .factory('historyFactory', [
        '$rootScope',
        'pathFactory', 
        function($rootScope, pathFactory) {
            $rootScope.redoDisabled = true;
            $rootScope.undoDisabled = true;
            
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
                    return $rootScope.redoDisabled;
                },
                
                setRedoDisabled: function(data) {
                    $rootScope.redoDisabled = data;
                },
                
                getUndoDisabled: function() {
                    return $rootScope.undoDisabled;
                },
                
                setUndoDisabled: function(data) {
                    $rootScope.undoDisabled = data;
                }
            }
        }
    ])
    
    // TODO : remove reference to $rootScope
    .factory('clipboardFactory', function($rootScope) {
        var clipboard = null;
        var clipboardFromTemplates = false;
        
        $rootScope.pasteDisabled = true;
        
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
                return $rootScope.pasteDisabled;
            },
            
            setPasteDisabled: function(data) {
                $rootScope.pasteDisabled = data;
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
            
            getPath: function() {
                return path;
            },
            
            setPath: function(data) {
                path = data;
            },
            
            addPathInstanciated: function(id) {
                pathInstanciated[id] = id;
            },
            
            getPathInstanciated: function(id) {
                return typeof pathInstanciated[id] != 'undefined';
            }
        };
    })
    
    .factory('stepFactory', function() {
        var step = null;

        return {
            setStep: function (data) {
                step = data;
            },
            
            getStep: function () {
                return step;
            }
        };
    })
    
    .factory('templateFactory', function() {
        var templates = [];
        var currentTemplate = null;
        
        return {
            addTemplate: function(template) {
                templates.push(template);
            },
            
            replaceTemplate: function(template) {
                var templateFound = false;
                for (var i = 0; i < templates.length; i++) {
                    if (templates[i].id === template.id)
                    {
                        templates[i] = template;
                        templateFound = true;
                        break;
                    }
                }
                
                if (!templateFound) {
                    this.addTemplate(template)
                }
            },
            
            getTemplates: function() {
                return templates;
            },
            
            setTemplates: function(data) {
                templates = data;
            },
            
            getCurrentTemplate: function() {
                return currentTemplate;
            },
            
            setCurrentTemplate: function(data) {
                currentTemplate = data;
            }
        };
    })
    
    .factory('alertFactory', function() {
        var alerts = [];

        return {
            getAlerts: function() {
                return alerts;
            },
            
            addAlert: function(msg, type) {
                alerts.push({ type: type, msg: msg });
            },
            
            closeAlert: function(index) {
                alerts.splice(index, 1);
            }
        };
    });
