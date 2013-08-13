'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.controllers', 'myApp.directives', 'ui'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/path/list', {templateUrl: 'partials/path-list.html', controller: 'PathContoller'});
    $routeProvider.when('/view', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
    $routeProvider.when('/view/:id', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
    $routeProvider.when('/view2/:id', {templateUrl: 'partials/tree-view2.html', controller: 'TreeContoller'});
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
