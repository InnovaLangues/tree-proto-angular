'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ui.bootstrap']).
    controller('TreeContoller', ['$scope', '$http', function($scope, $http) {


        $scope.dynamicTooltip = "Hello, World!";
        $scope.dynamicTooltipText = "dynamic";
        $scope.htmlTooltip = "I've been made <b>bold</b>!";
        $scope.isCollapsed = false;
    $scope.update = function() {
      var e, i, _i, _len, _ref;
      _ref = $scope.items;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        e = _ref[i];
        e.pos = i;
      }
      return console.log(["Updated", $scope.items]);
    };

        $scope.history = null;

        $scope.init = function() {
            $http.get('../api/index.php/pathversions/init')
                .success(function() {
                    $http.get('tree.json')
                        .success(function(json) {
                            $scope.path = json.path;
                        }
                    );
                }
            );
        };

        $scope.init();

        $scope.undo = function(id) {
            $http.get('../api/index.php/pathversions/undo/' + id) //TODO prefix path comme dans la video d'angular
                .success(function(path) {
                    $scope.path = path;
                }
            );
        };

        $scope.redo = function(id) {
            $http.get('../api/index.php/pathversions/redo/' + id) //TODO prefix path comme dans la video d'angular
                .success(function(path) {
                    $scope.path = path;
                }
            );
        };

        $scope.rename = function() {
            updateDB($scope.path);
        };

        $scope.remove = function(activity) {
            function walk(target) {
                var children = target.children,
                    i;

                if (children) {
                    i = children.length;
                    while (i--) {
                        if (children[i] === activity) {
                            return children.splice(i, 1);
                        } else {
                            walk(children[i]);
                        }
                    }
                }
            }

            walk($scope.path.activities[0]);

            updateDB($scope.path);
        };

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