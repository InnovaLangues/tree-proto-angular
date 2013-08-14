'use strict';

/* Controllers */



angular.module('myApp.controllers', ['ui.bootstrap'])
    .controller('TemplateController', [
        '$scope',
        '$http',
        function($scope, $http) {
            $scope.templates = null;

            var getTemplates = function() {
                $http
                    .get('../api/index.php/pathtemplates.json')
                    .success ( function (data) {
                        $scope.templates = data;
                    });
            };

            $scope.delete = function(template) {
                $http.delete('../api/index.php/templates/' + id + '.json')
                    .success(function() {
                        getTemplates();
                    }
                );
            };

            getTemplates();
        }
    ])
    .controller('PathContoller', [
        '$scope',
        '$http',
        function($scope, $http) {
            $scope.paths = null;

            $scope.getPaths = function(id) {
                $http.get('../api/index.php/paths.json')
                    .success(function(data) {
                        $scope.paths = data;
                    }
                );
            };

            $scope.getPaths();

            $scope.delete = function(id) {
                $http.delete('../api/index.php/paths/' + id + '.json')
                    .success(function(data) {
                        $scope.getPaths();
                    }
                );
            };
        }
    ])
    .controller('TreeContoller', [
        '$scope',
        '$http',
        '$dialog',
        '$routeParams',
        'pathFactory',
        function($scope, $http, $dialog, $routeParams, pathFactory) {

        if (!Array.prototype.last){
            Array.prototype.last = function(){
                return this[this.length - 1];
            };
        }

        $scope.loader = null;
        $scope.isCollapsed = false;
        $scope.clipboard = null;
        $scope.history = null;
        $scope.templates = [];
        $scope.redoDisabled = true;
        $scope.undoDisabled = true;
        $scope.pasteDisabled = true;
        $scope.isTemplateSaved = false;
        $scope.path = pathFactory.getPath();
        $scope.historyState = -1;
        $scope.histArray = [];

        $(".sidebar").pageslide({ direction: "right", modal: true });

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

        if ($routeParams.id) {
            $http.get('../api/index.php/paths/' + $routeParams.id + '.json')
                .success(function(data) {
                    updateHistory(data);
                }
            );
        } else {
            $http.get('tree.json')
                .success(function(data) {
                    updateHistory(data);
                }
            );
        }

        $scope.undo = function() {
            $scope.historyState = $scope.historyState -1;
            $scope.path = $scope.histArray[$scope.historyState];
            $scope.redoDisabled = false;
            if ($scope.historyState == -1) {
                $scope.undoDisabled = true;
            }
        };

        $scope.redo = function() {
            $scope.historyState = $scope.historyState + 1;
            $scope.path = $scope.histArray[$scope.historyState];
            $scope.undoDisabled = false;
            if ($scope.historyState == $scope.histArray.length - 1) {
                $scope.redoDisabled = true;
            }
        };

        $scope.rename = function() {
            updateHistory($scope.path);
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

            updateHistory($scope.path);
        };

        $scope.removeChildren = function(step) {
            step.children = [];

            updateHistory($scope.path);
        };

        $scope.copy = function(step) {
            $scope.clipboard = step;
            $scope.pasteDisabled = false;
        };

        $scope.paste = function(step) {
            // Clone voir : http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
            var stepCopy = jQuery.extend(true, {}, $scope.clipboard);

            stepCopy.name = stepCopy.name + '_copy';

            step.children.push(stepCopy);
            updateHistory($scope.path);
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

            updateHistory($scope.path);
        };

        $scope.saveTemplate = function(step) {
            // TODO
            // $http ... etc
            $http
                .post('../api/index.php/pathtemplates.json', step)
                .success ( function (data) {
                    step.templateId = data;
                });
        };

        $scope.save = function(path) {
            if (path.id === null ) {

                //Create new path
                $http
                    .post('../api/index.php/paths.json', path)
                    .success ( function (data) {
                        path.id = data;
                    });
            } else {

                //Update existing path
                $http
                    .put('../api/index.php/paths/' + path.id + '.json', path)
                    .success ( function (data) {
                        alert('updated');
                    });
            }
        };

        $scope.removeTemplate = function(step) {
            $http
                .delete('../api/index.php/pathtemplates/' + step.templateId + '.json')
                .success ( function (data) {
                    step.templateId = null;
                });
        };

        var updateHistory = function(path) {
            //TODO:  CA NE MARCHE PAS!
            if ($scope.historyState !== $scope.histArray.length - 1) {
                $scope.histArray.splice($scope.historyState + 1, $scope.histArray.length - $scope.historyState);
            }

            var pathCopy = jQuery.extend(true, {}, path);
            $scope.histArray.push(pathCopy);

            $scope.historyState = $scope.historyState + 1;

            var pathCopy = jQuery.extend(true, {}, $scope.histArray.last());
            $scope.path = pathCopy;

            $scope.undoDisabled = false;
            $scope.redoDisabled = true;
        };

        $scope.opts = {
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl:  'partials/activity-list.html', // OR: templateUrl: 'path/to/view.html',
            controller: 'DialogController'
        };

        $scope.openDialog = function(){
            var d = $dialog.dialog($scope.opts);
            d.open().then(function(result){
                if (result)
                {
                    alert('dialog closed with result: ' + result);
                }
            });
        };
    }
    ])
    .controller('DialogController', [
        '$scope',
        '$dialog',
        function($scope, $dialog) {
            $scope.close = function(result){
                dialog.close(result);
            };
        }
    ]);
