'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.controllers', 'myApp.directives', 'ui', 'pageslide-directive'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/404', {templateUrl: 'partials/404.html'});
        $routeProvider.when('/path/list', {templateUrl: 'partials/path-list.html', controller: 'PathContoller'});
        $routeProvider.when('/template/list', {templateUrl: 'partials/template-list.html', controller: 'TemplateController'});
        $routeProvider.when('/template/edit/:id', {templateUrl: 'partials/template-edit.html', controller: 'TemplateController'});
        $routeProvider.when('/tree', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
        $routeProvider.when('/tree/edit/:id', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
        $routeProvider.when('/timeline/', {templateUrl: 'partials/tree-view2.html', controller: 'TreeContoller'});
        $routeProvider.when('/timeline/edit/:id', {templateUrl: 'partials/tree-view2.html', controller: 'TreeContoller'});
        $routeProvider.otherwise({redirectTo: '/404'});
    }])
    .factory('pathFactory', function() {
        var path = null;

        return {
            setPath : function (data) {
                path = data;
            },
            getPath : function () {
                return path;
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
