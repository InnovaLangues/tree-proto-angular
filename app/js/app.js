'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.controllers', 'myApp.directives', 'ui'])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/view', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
    $routeProvider.when('/view2', {templateUrl: 'partials/tree-view2.html', controller: 'TreeContoller'});
    $routeProvider.otherwise({redirectTo: '/view'});
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
