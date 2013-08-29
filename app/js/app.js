'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.controllers', 'myApp.directives', 'ui', 'pageslide-directive', 'notifications'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/404', {templateUrl: 'partials/404.html'});
        $routeProvider.when('/path/list', {templateUrl: 'partials/path-list.html', controller: 'PathContoller'});
        $routeProvider.when('/template/list', {templateUrl: 'partials/template-list.html', controller: 'TemplateController'});
        $routeProvider.when('/template/edit/:id', {templateUrl: 'partials/template-edit.html', controller: 'TemplateController'});
        $routeProvider.when('/tree', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
        $routeProvider.when('/path/global/:id', {templateUrl: 'partials/global.html', controller: 'TreeContoller'});
        $routeProvider.when('/path/skills/:id', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
        $routeProvider.when('/path/scenario/:id', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
        $routeProvider.when('/path/validation/:id', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
        $routeProvider.when('/path/planner/:id', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
        $routeProvider.when('/timeline/', {templateUrl: 'partials/tree-view2.html', controller: 'TreeContoller'});
        $routeProvider.when('/timeline/edit/:id', {templateUrl: 'partials/tree-view2.html', controller: 'TreeContoller'});
        $routeProvider.otherwise({redirectTo: '/404'});
    }])
    .factory('pathFactory', ['$rootScope', function($rootScope) {
        var path = null;
        $rootScope.rootPath = null; //Debug

        var history = [];
        $rootScope.rootHistory = []; //Debug

        var historyState = -1;
        $rootScope.rootHistoryState = -1; //Debug

        return {
            getPath : function () {
                return path;
            },
            setPath : function (data) {
                path = data;
                $rootScope.rootPath = data; //Debug
            },
            getHistory : function () {
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
            getPathFromHistory : function (key) {
                return history[key];
            },
            getLastHistoryState : function () {
                return history[history.length-1];
            },
            getHistoryState : function () {
                return historyState;
            },
            setHistoryState : function (data) {
                historyState = data;
                $rootScope.rootHistoryState = data; //Debug
            },
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
            /*removeTemplate : function(template) {
                $this->steps->removeElement($steps);
            },**/
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
