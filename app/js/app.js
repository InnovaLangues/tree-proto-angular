'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.controllers', 'myApp.directives', 'ui', 'pageslide-directive', 'notifications'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/404', {templateUrl: 'partials/404.html'});
        $routeProvider.when('/path/list', {templateUrl: 'partials/path-list.html', controller: 'PathController'});
        $routeProvider.when('/template/list', {templateUrl: 'partials/template-list.html', controller: 'TemplateController'});
        $routeProvider.when('/template/edit/:id', {templateUrl: 'partials/template-edit.html', controller: 'TemplateController'});
        
        // Editing Steps
        $routeProvider.when('/path/global', {templateUrl: 'partials/editing-steps/global.html', controller: 'TreeController'});
        $routeProvider.when('/path/global/:id', {templateUrl: 'partials/editing-steps/global.html', controller: 'TreeController'});
        $routeProvider.when('/path/skills/:id', {templateUrl: 'partials/editing-steps/skills.html', controller: 'TreeController'});
        $routeProvider.when('/path/scenario/:id', {templateUrl: 'partials/editing-steps/scenario.html', controller: 'TreeController'});
        $routeProvider.when('/path/validation/:id', {templateUrl: 'partials/editing-steps/validation.html', controller: 'TreeController'});
        $routeProvider.when('/path/planner/:id', {templateUrl: 'partials/editing-steps/planner.html', controller: 'TreeController'});
        
        $routeProvider.when('/step/edit/:id', {templateUrl: 'partials/step-edit.html', controller: 'StepController'});
        
        $routeProvider.otherwise({redirectTo: '/404'});
    }])
    
    .factory('clipboardFactory', ['$rootScope', function($rootScope) {
        var clipboardContent = null;
        var clipboardContentFromTemplates = false;
        
        $rootScope.pasteDisabled = true;
        
        return {
            clearClipboard: function() {
                clipboardContent = null;
                clipboardContentFromTemplates = false;
                $rootScope.pasteDisabled = true;
            },
            
            isEmpty: function() {
                return null === clipboardContent;
            },
            
            copy: function(steps, fromTemplates) {
                clipboardContent = steps;
                clipboardContentFromTemplates = fromTemplates || false;
                $rootScope.pasteDisabled = false;
            },
            
            paste: function(step) {
                if (!this.isEmpty())
                {
                    // Clone voir : http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
                    var stepCopy = jQuery.extend(true, {}, clipboardContent);
                    
                    if (!clipboardContentFromTemplates) {
                        stepCopy.name = stepCopy.name + '_copy';
                    }
                    
                    step.children.push(stepCopy);
                }
            }
        }
    }])
    
    .factory('pathFactory', ['$rootScope', function($rootScope) {
        var path = null;
        $rootScope.rootPath = null; //Debug

        var history = [];
        $rootScope.rootHistory = []; //Debug

        var historyState = -1;
        $rootScope.rootHistoryState = -1; //Debug

        var pathInstanciated = [];
        $rootScope.rootPathInstanciated  = [];

        return {
            clearHistory: function() {
                path = null;
                $rootScope.rootPath = null; //Debug

                var history = [];
                $rootScope.rootHistory = []; //Debug

                var historyState = -1;
                $rootScope.rootHistoryState = -1; //Debug

                var pathInstanciated = [];
                $rootScope.rootPathInstanciated  = [];
            },
            
            getPath : function() {
                return path;
            },
            
            setPath : function(data) {
                path = data;
                $rootScope.rootPath = data; //Debug
            },
            
            getHistory : function() {
                return history;
            },
            
            addPathToHistory : function(data) {
                // Clone object
                var pathCopy = jQuery.extend(true, {}, data);

                history.push(pathCopy);
                $rootScope.rootHistory.push(pathCopy); //Debug
            },
            
            removeLastPathsFromHistory : function(index) {
                history.splice(index,history.length-index);
                $rootScope.rootHistory.splice(index,$rootScope.rootHistory.length-index); //Debug
            },
            
            getPathFromHistory : function(key) {
                return history[key];
            },
            
            getLastHistoryState : function() {
                return history[history.length-1];
            },
            
            getHistoryState : function() {
                return historyState;
            },
            
            setHistoryState : function(data) {
                historyState = data;
                $rootScope.rootHistoryState = data; //Debug
            },
            
            addPathInstanciated : function(id) {
                pathInstanciated[id] = id;
                $rootScope.rootPathInstanciated[id] = id;
            },
            
            getPathInstanciated : function(id) {
                return typeof pathInstanciated[id] != 'undefined';
            }
        };
    }])
    
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
