'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.controllers']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/tree', {templateUrl: 'partials/tree-view.html', controller: 'TreeContoller'});
    $routeProvider.otherwise({redirectTo: '/tree'});
  }]);
