'use strict';

/* Controllers */
angular.module('myApp.controllers', ['ui.bootstrap'])
    /** 
     * Editing Steps Controller
     */
//    .controller('EditingStepsController', [
//       '$rootScope',
//       '$scope',
//       function($rootScope, $scope) {
//           $scope.editingSteps = [
//              { title: 'Global', status: 'not_started', route: '/path/global/', active: true },
//              { title: 'Skills', status: 'not_started', route: '/path/skills/', active: false },
//              { title: 'Scenario', status: 'not_started', route: '/path/scenario/', active: false },
//              { title: 'Validation', status: 'not_started', route: '/path/validation/', active: false },
//              { title: 'Planner', status: 'not_started',  route: '/path/planner/', active: false }
//           ];
//           
//           $scope.setActive = function(index) {
//               for (var i = 0; i < $scope.editingSteps.length; i++)
//               {
//                   $scope.editingSteps[i].active = false;
//               }
//               
//               $scope.editingSteps[index].active = true;
//           }
//           
//           $scope.updateStatus = function(index, status) {
//               
//           };
//       }
//    ])
    
    /**
     * Alert Controller
     */
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
    
    /**
     * Step Controller
     */
    .controller('StepController', [
       '$rootScope',
       '$scope',
       function($rootScope, $scope) {
           
       }
    ])
    
    /**
     * Template Controller
     */
    .controller('TemplateController', [
        '$rootScope',
        '$scope',
        '$http',
        'templateFactory',
        'alertFactory',
        'clipboardFactory',
        // TODO: There has to be a better way than using rootScope
        function($rootScope, $scope, $http, templateFactory, alertFactory, clipboardFactory) {
            $http
                .get('../api/index.php/path/templates.json')
                .then(function(response) {
                    templateFactory.setTemplates(response.data);
                    $rootScope.templates = templateFactory.getTemplates();
                });

            $scope.copyToClipboard = function(template) {
                clipboardFactory.copy(template, true);
            };
            
            $scope.delete = function(template, id) {
                $http
                    .delete('../api/index.php/path/templates/' + template.id + '.json')
                    .then( function(response) {
                        $rootScope.templates.splice(id, 1);
                    });
            };
        }
    ])
    
    /**
     * Path Controller
     */
    .controller('PathController', [
        '$scope',
        '$http',
        function($scope, $http, pathFactory) {
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
    
    /**
     * Tree Controller
     */
    .controller('TreeController', [
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
        'clipboardFactory',
        function($rootScope, $scope, $http, $notification, $dialog, $routeParams, $location, pathFactory, stepFactory, templateFactory, alertFactory, clipboardFactory) {
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
            $scope.isTemplateSaved = false;
            $scope.path = pathFactory.getPath();

            $scope.previewStep = null;
            
            $scope.sortableOptions = {
                update: $scope.update,
                placeholder: 'placeholder',
                connectWith: '.ui-sortable'
            };
            
            if ($routeParams.id) {
                if (!pathFactory.getPathInstanciated($routeParams.id)) {
                    pathFactory.addPathInstanciated($routeParams.id);
                    $http.get('../api/index.php/paths/' + $routeParams.id + '.json')
                        .success(function(data) {
                            if (-1 === pathFactory.getHistoryState()) {
                                updateHistory(data);
                            }

                            pathFactory.setPath(data);
                            $scope.path = data;
                            $scope.path.id = $routeParams.id; //TODO : remove
                        }
                    );
                }
            } else if (null === $scope.path) {
                $http.get('tree.json')
                    .success(function(data) {
                        updateHistory(data);
                    }
                );
            }

            if (null !== $scope.path && undefined !== $scope.path.steps[0]) {
                $scope.previewStep = $scope.path.steps[0];
            }
            
            $scope.setPreviewStep = function(step) {
                $scope.previewStep = step;
            };
            
            $scope.update = function() {
                var e, i, _i, _len, _ref;
                _ref = $scope.path;
                for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                    e = _ref[i];
                    e.pos = i;
                }
                updateHistory(_ref);
            };
            
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

            $scope.copyToClipboard = function(step) {
                clipboardFactory.copy(step);
            };

            $scope.paste = function(step) {
                clipboardFactory.paste(step);
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

            $scope.addSibling = function(step) {
                
            };
            
            $scope.save = function(path) {
                if ($routeParams.id === undefined) {
                    //Create new path
                    $http
                        .post('../api/index.php/paths.json', path)
                        .success ( function (data) {
                            $notification.success("Success", "New path saved!");
                            $location.path("/path/global/" + data);
                        });
                } else {
                    //Update existing path
                    $http
                        .put('../api/index.php/paths/' + $routeParams.id + '.json', path)
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
    
    /**
     * Dialog Controller
     */
    .controller('DialogController', [
        '$scope',
        'dialog',
        function($scope, dialog) {
            $scope.close = function(){
                dialog.close();
            };
        }
    ])
    
    /**
     * Template Modal Controller
     */
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