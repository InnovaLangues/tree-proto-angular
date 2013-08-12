'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ui.bootstrap'])
    .controller('TreeContoller', ['$scope', '$http', 'pathFactory', function($scope, $http, pathFactory) {

        $scope.loader = null;
        $scope.isCollapsed = false;
        $scope.clipboard = null;
        $scope.history = null;
        $scope.redoDisabled = true;
        $scope.undoDisabled = true;
        $scope.path = pathFactory.getPath();

        $scope.histArray = [];

        $scope.update = function() {
          var e, i, _i, _len, _ref;
          _ref = $scope.path;
          for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
            e = _ref[i];
            e.pos = i;
          }
          return console.log(['Updated', $scope.path]);
        };

        $scope.sortableOptions = {
            update: $scope.update,
            axis: 'y',
            connectWith: '.ui-sortable'
        };

        $scope.init = function() {
            $http.get('../api/index.php/pathversions/init')
                .success(function() {
                    $http.get('tree.json')
                        .success(function(data) {
                            updateDB(data);
                        }
                    );
                }
            );

        };

        $scope.undo = function(id) {
            $scope.loader = 'Loading...';
            $http.get('../api/index.php/pathversions/undo/' + id) //TODO prefix path comme dans la video d'angular
                .success(function(data) {
                    if(data != 'end') {
                        pathFactory.setPath(data);
                        $scope.path = pathFactory.getPath();
                    } else {
                        $scope.undoDisabled = true;
                    }

                    $scope.redoDisabled = false;
                    $scope.loader = null; //TODO boolean
                }
            );
        };

        $scope.redo = function(id) {
            $scope.loader = 'Loading...';
            $http.get('../api/index.php/pathversions/redo/' + id) //TODO prefix path comme dans la video d'angular
                .success(function(data) {
                    if(data != 'end') {
                        pathFactory.setPath(data);
                        $scope.path = pathFactory.getPath();
                    } else {
                        $scope.redoDisabled = true;
                    }
                    $scope.undoDisabled = false;
                    $scope.loader = null; //TODO boolean
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

        $scope.removeChildren = function(step) {
            step.children = [];

            updateDB($scope.path);
        };

        $scope.copy = function(step) {
            $scope.clipboard = step;
        };

        $scope.paste = function(step) {
            $scope.loader = 'Loading...';
            // Clone voir : http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
            var stepCopy = jQuery.extend(true, {}, $scope.clipboard);

            stepCopy.name = stepCopy.name + '_copy';

            step.children.push(stepCopy);
            updateDB($scope.path);
        };

        $scope.addChild = function(step) {
            var post = step.children.length + 1;
            var newName = step.name + '-' + post;

            step.children.push(
                {
                    id         : null,
                    name       : newName,
                    parentId   : null,
                    type       : 'seq',
                    expanded   : true,
                    dataType   : null,
                    dataId     : null,
                    templateId : null,
                    children   : []
                }
            );

            updateDB($scope.path);
        };

        $scope.saveTemplate = function(step) {
            // TODO
            // $http ... etc
        };

        var updateDB = function(path) {
            $http
                .post('../api/index.php/pathversions', path) //TODO prefix path comme dans la video d'angular
                .success(
                    function(data) {
                        pathFactory.setPath(data);
                        $scope.path = pathFactory.getPath();
                        $scope.undoDisabled = false;
                        $scope.redoDisabled = true;
                        $scope.loader = null; //TODO boolean
                    }
                );

            $scope.histArray.push('toto');
        };

    }]
);