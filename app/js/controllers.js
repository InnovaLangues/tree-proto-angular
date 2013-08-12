'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ui.bootstrap'])
    .controller('TreeContoller', ['$scope', '$http', 'pathFactory', function($scope, $http, pathFactory) {


        if (!Array.prototype.last){
            Array.prototype.last = function(){
                return this[this.length - 1];
            };
        }

        $scope.loader = null;
        $scope.isCollapsed = false;
        $scope.clipboard = null;
        $scope.history = null;
        $scope.redoDisabled = true;
        $scope.undoDisabled = true;
        $scope.path = pathFactory.getPath();
        $scope.historyState = null;
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
            $scope.histArray = [];
            $http.get('../api/index.php/pathversions/init')
                .success(function() {
                    $http.get('tree.json')
                        .success(function(data) {
                            updateHistory(data);
                        }
                    );
                }
            );


        };

        $scope.undo = function(id) {

            /*$scope.loader = 'Loading...';
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
            );*/

            //console.log("array: " + $scope.histArray[0]);

            console.log("id: " + id);

            $scope.historyState = id - 1;

            console.log("historyState: " + $scope.historyState);


            $scope.path = $scope.histArray[$scope.historyState];

            console.log("path: " + $scope.path);


            //alert(historyState);
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

            //updateDB($scope.path);
            updateHistory($scope.path);
            //$scope.histArray.push($scope.path);
        };

        $scope.saveTemplate = function(path) {
            // TODO
            // $http ... etc
            $http
                .post('../api/index.php/pathtemplates', path)
                .success ( function (data) {
                    alert(data);
                });
        };

        var updateDB = function(path) {
            /*$http
                .post('../api/index.php/pathversions', path) //TODO prefix path comme dans la video d'angular
                .success(
                    function(data) {
                        pathFactory.setPath(data);
                        $scope.path = pathFactory.getPath();
                        $scope.undoDisabled = false;
                        $scope.redoDisabled = true;
                        $scope.loader = null; //TODO boolean
                    }
                );*/

                updateHistory(path);

        };

        var updateHistory = function(path) {
            // Clone
            var pathCopy = jQuery.extend(true, {}, path);

            if( $scope.historyState === null) {
                $scope.histArray.push(pathCopy);
                $scope.historyState = 0;

                console.log("HistoryState: " + $scope.historyState);
                console.log("HistoryArray length:" + $scope.histArray.length);
            } else if($scope.historyState === $scope.histArray.length - 1) {
                //console.log("push");
                $scope.histArray.push(pathCopy);
                $scope.historyState = $scope.histArray.length - 1;

                console.log("HistoryState: " + $scope.historyState);
                console.log("HistoryArray length:" + $scope.histArray.length);
            }

            else {
                console.log("HistoryState: "+$scope.historyState);
                console.log("HistoryArray length:"+$scope.histArray.length);
                console.log("XXXXXXXXXX");
                //$scope.histArray.splice($scope.historyState, $scope.histArray.length);
            }


            //Get last item of the array
            $scope.path = $scope.histArray.last();

            $scope.undoDisabled = false;
            $scope.redoDisabled = true;
        }

    }]
);