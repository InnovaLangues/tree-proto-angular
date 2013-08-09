'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ui.bootstrap'])
    .controller('TreeContoller', ['$scope', '$http', 'pathFactory', function($scope, $http, pathFactory) {

        $scope.isCollapsed = false;
        $scope.clipboard = null;

        $scope.update = function() {
          var e, i, _i, _len, _ref;
          _ref = $scope.path;
          for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            e = _ref[i];
            e.pos = i;
          }
          return console.log(["Updated", $scope.path]);
        };

        $scope.sortableOptions = {
            update: $scope.update,
            axis: 'y',
            connectWith: '.ui-sortable'
        };


        $scope.path = pathFactory.getPath();

        $scope.init = function() {
            $http.get('../api/index.php/pathversions/init')
                .success(function() {
                    $http.get('tree.json')
                        .success(function(json) {
                            $scope.history = null;
                            $scope.path = json.path;

                            updateDB($scope.path);

                            $scope.redoDisabled = true;
                            $scope.undoDisabled = true;
                        }
                    );
                }
            );

        };

        $scope.undo = function(id) {
            $http.get('../api/index.php/pathversions/undo/' + id) //TODO prefix path comme dans la video d'angular
                .success(function(data) {
                    if(data != 'end') {
                        pathFactory.setPath(data);
                        $scope.path = pathFactory.getPath();
                    } else {
                        $scope.undoDisabled = true;
                    }

                    $scope.redoDisabled = false;
                }
            );
        };

        $scope.redo = function(id) {
            $http.get('../api/index.php/pathversions/redo/' + id) //TODO prefix path comme dans la video d'angular
                .success(function(data) {
                    if(data != 'end') {
                        pathFactory.setPath(data);
                        $scope.path = pathFactory.getPath();
                    } else {
                        $scope.redoDisabled = true;
                    }
                    $scope.undoDisabled = false;
                }
            );
        };

        $scope.rename = function() {
            updateDB($scope.path);
        };

        $scope.remove = function(step) {
            function walk(path) {
                var children = path.children,
                    i;

                if (children) {
                    i = children.length;
                    while (i--) {
                        if (children[i] === step) {
                            return children.splice(i, 1);
                        } else {
                            walk(children[i]);
                        }
                    }
                }
            }

            walk($scope.path.steps[0]);

            updateDB($scope.path);
        };

        $scope.removeChildren = function(activity) {
            activity.children = [];

            updateDB($scope.path);
        };

        $scope.copy = function(activity) {
            $scope.clipboard = activity;
        };

        $scope.paste = function(activity) {
            // Clone voir : http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
            var activityCopy = jQuery.extend(true, {}, $scope.clipboard);

            activityCopy.name = activityCopy.name + '_copy';

            activity.children.push(activityCopy);
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
                    pathFactory.setPath(path);
                    $scope.path = pathFactory.getPath();
                    $scope.undoDisabled = false;
                    $scope.redoDisabled = true;
                });
        };

    }]
);