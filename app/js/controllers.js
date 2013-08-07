'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
    controller('TreeContoller', ['$scope', '$http', function($scope, $http) {

        $scope.history = null;

        $scope.init = function () {
            $http.get('tree.json')
                .success(function(json) {
                    $scope.path = json.path;
                }
            );
        };

        $scope.undo = function (id) {
            $http.get('../api/index.php/pathversions/undo/' + id) //TODO prefix path comme dans la video d'angular
                .success(function(path) {
                    $scope.path = path;
                }
            );
        };

        $scope.redo = function (id) {
            $http.get('../api/index.php/pathversions/redo/' + id) //TODO prefix path comme dans la video d'angular
                .success(function(path) {
                    $scope.path = path;
                }
            );
        };

        /*$scope.remove = function (activity) {
            // TODO
            //activity = null;
        };*/

        $scope.removeChildren = function(activity) {
            activity.children = [];

            updateDB($scope.path);
        };

        $scope.addChild = function(activity) {
            var post = activity.children.length + 1;
            var newName = activity.name + '-' + post;

            activity.children.push(
                {
                    name: newName,
                    children: []
                }
            );

            updateDB($scope.path);
        };

        var updateDB = function(path) {
            $http
                .post('../api/index.php/pathversions', path) //TODO prefix path comme dans la video d'angular
                .success(function(path) {
                    $scope.path = path;
                });
        };
    }]
);