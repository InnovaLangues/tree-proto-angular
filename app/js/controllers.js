'use strict';

/* Controllers */
angular.module('myApp.controllers', ['ui.bootstrap'])
    .controller('AlertController', [
        '$scope',
        'alertFactory',
        function($scope, alertFactory) {
            $scope.alerts = alertFactory.getAlerts();

            $scope.closeAlert  = function() {
                alertFactory.closeAlert();
            };
        }
    ])
    .controller('TemplateController', [
        '$rootScope',
        '$scope',
        '$http',
        'templateFactory',
        'alertFactory',
        // TODO: There has to be a better way than using rootScope
        function($rootScope, $scope, $http, templateFactory, alertFactory) {
            $http
                .get('../api/index.php/path/templates.json')
                .then(function(response) {
                    templateFactory.setTemplates(response.data);
                    $rootScope.templates = templateFactory.getTemplates();
                });

            $scope.delete = function(template, id) {
                $http
                    .delete('../api/index.php/path/templates/' + template.id + '.json')
                    .then( function(response) {
                        $rootScope.templates.splice(id, 1);
                    });
            };
        }
    ])
    .controller('PathContoller', [
        '$scope',
        '$http',
        function($scope, $http) {
            $scope.paths = null;

            $scope.getPaths = function() {
                $http
                    .get('../api/index.php/paths.json')
                    .success(function(data) {
                        $scope.paths = data;
                    }
                );
            };

            $scope.getPaths();

            $scope.delete = function(id) {
                $http
                    .delete('../api/index.php/paths/' + id + '.json')
                    .success(function(data) {
                        $scope.getPaths();
                    }
                );
            };
        }
    ])
    .controller('TreeContoller', [
        '$rootScope',
        '$scope',
        '$http',
        '$notification',
        '$dialog',
        '$routeParams',
        '$location',
        'pathFactory',
        'stepFactory',
        'templateFactory',
        'alertFactory',
        function($rootScope, $scope, $http, $notification, $dialog, $routeParams, $location, pathFactory, stepFactory, templateFactory, alertFactory) {

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
            //$scope.historyState = -1;
            //$scope.histArray = [];

            $scope.update = function() {
              var e, i, _i, _len, _ref;
              _ref = $scope.path;
              for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                e = _ref[i];
                e.pos = i;
              }
              updateHistory(_ref);
            };

            $scope.sortableOptions = {
                update: $scope.update,
                placeholder: 'placeholder',
                connectWith: '.ui-sortable'
            };

            if ($routeParams.id) {
                $http.get('../api/index.php/paths/' + $routeParams.id + '.json')
                    .success(function(data) {
                        updateHistory(data);
                        pathFactory.setPath(data);
                        // $rootScope.path = pathFactory.getPath();
                        $rootScope.path = data; //TODO : remove
                        $rootScope.path.id = $routeParams.id; //TODO : remove
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
                // Decrement history state
                pathFactory.setHistoryState(
                    pathFactory.getHistoryState() - 1
                );

                var historyState = pathFactory.getHistoryState();

                var path = pathFactory.getPathFromHistory(historyState);

                // Clone object
                var pathCopy = jQuery.extend(true, {}, path);

                pathFactory.setPath(pathCopy);

                $scope.path = pathFactory.getPath();

                $scope.redoDisabled = false;
                if (historyState === 0) {
                    $scope.undoDisabled = true;
                }
            };

            $scope.redo = function() {
                // Increment history state
                pathFactory.setHistoryState(
                    pathFactory.getHistoryState() + 1
                );

                var historyState = pathFactory.getHistoryState();

                var path = pathFactory.getPathFromHistory(historyState);

                // Clone object
                var pathCopy = jQuery.extend(true, {}, path);

                pathFactory.setPath(pathCopy);

                $scope.path = pathFactory.getPath();

                $scope.undoDisabled = false;
                if (historyState == pathFactory.getHistory().length - 1) {
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

            $scope.save = function(path) {
                if ($routeParams.id === undefined) {
                    //Create new path
                    $http
                        .post('../api/index.php/paths.json', path)
                        .success ( function (data) {
                            $notification.success("Success", "New path saved!");
                            $location.path("/tree/edit/" + data);
                        });
                } else {
                    //Update existing path
                    $http
                        .put('../api/index.php/paths/' + path.id + '.json', path)
                        .success ( function (data) {
                            $notification.success("Success", "Path updated!");
                        });
                }
            };


            var updateHistory = function(path) {
                // Increment history state
                pathFactory.setHistoryState(
                    pathFactory.getHistoryState() + 1
                );

                pathFactory.addPathToHistory(path);

                pathFactory.setPath(path);
                $scope.path = pathFactory.getPath();
                if (pathFactory.getHistoryState() !== 0) {
                    $scope.undoDisabled = false;
                }
                $scope.redoDisabled = true;
            };

            var dialogOptions = {
                backdrop: true,
                keyboard: true,
                backdropClick: true
            };

            $scope.openDialog = function(){
                var d = $dialog.dialog(dialogOptions);
                d.open('partials/activity-list.html', 'DialogController');
            };

            $scope.openTemplateModal = function(step){
                stepFactory.setStep(step);
                var d = $dialog.dialog(dialogOptions);
                d.open('partials/modal-template.html', 'TemplateModalController');
            };
        }
    ])
    .controller('DialogController', [
        '$scope',
        'dialog',
        function($scope, dialog) {
            $scope.close = function(){
                dialog.close();
            };
        }
    ])
    .controller('TemplateModalController', [
        '$rootScope',
        '$scope',
        '$http',
        '$notification',
        'dialog',
        'stepFactory',
        'templateFactory',
        'alertFactory',
        function($rootScope, $scope, $http, $notification, dialog, stepFactory, templateFactory, alertFactory) {
            $scope.step = stepFactory.getStep();

            $scope.formTemplate = {
                name : "",
                description : "",
                step: stepFactory.getStep()
            };
            $scope.close = function () {
                dialog.close();
            };

            $scope.save = function (formTemplate) {
                $http
                    .post('../api/index.php/path/templates.json', formTemplate)
                    .success(function(response) {
                        $notification.success("Success!", "Template saved!");
                        templateFactory.addTemplate(response);
                        $rootScope.templates = templateFactory.getTemplates();
                        dialog.close();
                    });
            }
        }
    ]);
