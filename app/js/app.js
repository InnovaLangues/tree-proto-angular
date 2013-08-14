'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.controllers', 'myApp.directives', 'ui', 'pageslide-directive'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/path/list', {templateUrl: 'partials/path-list.html', controller: 'PathContoller'});
    $routeProvider.when('/template/list', {templateUrl: 'partials/template-list.html', controller: 'TemplateContoller'});
    $routeProvider.when('/tree', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
    $routeProvider.when('/tree/edit/:id', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
    $routeProvider.when('/timeline/', {templateUrl: 'partials/tree-view2.html', controller: 'TreeContoller'});
    $routeProvider.when('/timeline/edit/:id', {templateUrl: 'partials/tree-view2.html', controller: 'TreeContoller'});
    $routeProvider.otherwise({redirectTo: '/path/list'});
  }])
  .factory('pathFactory', function() {
    var path = null;

    return {
            setPath:function (data) {
                path = data;
            },
            getPath:function () {
                return path;
            }
        };
  });
