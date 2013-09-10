'use strict';

/* Controllers */
angular.module('myApp.controllers', ['ui.bootstrap'])
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
     * Template Controller
     */
    .controller('TemplateController', [
        '$scope',
        '$http',
        '$dialog',
        'templateFactory',
        'alertFactory',
        'clipboardFactory',
        function($scope, $http, $dialog, templateFactory, alertFactory, clipboardFactory) {
            $scope.templates = [];
            
            $http
                .get('../api/index.php/path/templates.json')
                .then(function(response) {
                    templateFactory.setTemplates(response.data);
                    $scope.templates = templateFactory.getTemplates();
                });

            $scope.copyToClipboard = function(template) {
                clipboardFactory.copy(template, true);
            };
            
            $scope.edit = function(template) {
                templateFactory.setCurrentTemplate(template);
                
                var dialogOptions = {
                    backdrop: true,
                    keyboard: true,
                    backdropClick: true
                };
                
                var d = $dialog.dialog(dialogOptions);
                d.open('partials/modals/template-edit.html', 'TemplateModalController');
            };
            
            $scope.delete = function(template, id) {
                $http
                    .delete('../api/index.php/path/templates/' + template.id + '.json')
                    .then( function(response) {
                        $scope.templates.splice(id, 1);
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
        'historyFactory',
        function($scope, $http, $notification, $dialog, $routeParams, $location, pathFactory, stepFactory, templateFactory, alertFactory, clipboardFactory, historyFactory) {
            $scope.path = pathFactory.getPath();
            
            $scope.previewStep = null;
            
            $scope.sortableOptions = {
                update: $scope.update,
                placeholder: 'placeholder',
                connectWith: '.ui-sortable'
            };
            
            if ($routeParams.id) {
                // Edit existing path
                if (!pathFactory.getPathInstanciated($routeParams.id)) {
                    pathFactory.addPathInstanciated($routeParams.id);
                    $http.get('../api/index.php/paths/' + $routeParams.id + '.json')
                        .success(function(data) {
                            // Store Path ID
                            data.id = $routeParams.id;
                            
                            // Update History if needed
                            if (-1 === historyFactory.getHistoryState()) {
                                historyFactory.update(data);
                            }

                            pathFactory.setPath(data);
                            $scope.path = data;
                            $scope.setPreviewStep();
                        }
                    );
                }
            }
            else if (null === $scope.path) {
                // Create new path
                $http.get('tree.json')
                    .success(function(data) {
                        pathFactory.setPath(data);
                        $scope.path = data;
                        
                        historyFactory.update(data);
                        $scope.setPreviewStep();
                    }
                );
            }
            
            $scope.setPreviewStep = function(step) {
                if (step) {
                    $scope.previewStep = step;
                }
                else if (null !== $scope.path && undefined !== $scope.path.steps[0]) {
                    $scope.previewStep = $scope.path.steps[0];
                }
            };
            
            $scope.setPreviewStep();
            
            $scope.update = function() {
                var e, i, _i, _len, _ref;
                _ref = $scope.path;
                for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
                    e = _ref[i];
                    e.pos = i;
                }
                historyFactory.update(_ref);
            };
            
            $scope.undo = function() {
                historyFactory.undo();
                $scope.path = pathFactory.getPath();
            };
            
            $scope.redo = function() {
                historyFactory.redo();
                $scope.path = pathFactory.getPath();
            };
            
            $scope.rename = function() {
                historyFactory.update($scope.path);
            };
            
            $scope.remove = function(step, fromPreview) {
                function walk(path) {
                    var children = path.children;
                    var i;
                    
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
                
                if (fromPreview) {
                    $scope.previewStep = null;
                }
                
                walk($scope.path.steps[0]);
                
                historyFactory.update($scope.path);
            };
            
            $scope.removeChildren = function(step) {
                step.children = [];
                historyFactory.update($scope.path);

            };
            
            $scope.copyToClipboard = function(step) {
                clipboardFactory.copy(step);
            };
            
            $scope.paste = function(step) {
                clipboardFactory.paste(step);
                historyFactory.update($scope.path);
            };
            
            $scope.addChild = function(step) {
                var newStep = stepFactory.generateNewStep(step);
                step.children.push(newStep);
                historyFactory.update($scope.path);
            };
            
            $scope.addSibling = function(step) {
                var newStep = stepFactory.generateNewStep(step);
                
                function insertStep(steps) {
                    var stepInserted = false;
                    for (var i = 0; i < steps.length; i++) {
                        if (steps[i].id === step.id) {
                            steps.splice(i+1, 0, newStep);
                            stepInserted = true;
                        }
                        else {
                            stepInserted = insertStep(steps[i].children);
                        }
                        
                        if (stepInserted) {
                            break;
                        }
                    }
                    return stepInserted;
                }
                
                insertStep($scope.path.steps);
                
                historyFactory.update($scope.path);
            };
            
            $scope.save = function(path) {
                if (undefined != $routeParams.id) {
                    // Update existing path
                    $http
                        .put('../api/index.php/paths/' + $routeParams.id + '.json', path)
                        .success ( function (data) {
                            $notification.success('Success', 'Path updated!');
                        });
                } 
                else {
                    // Create new path
                    $http
                        .post('../api/index.php/paths.json', path)
                        .success ( function (data) {
                            // Store generated ID in Path
                            path.id = data;
                            pathFactory.setPath(path);
                            $scope.path = pathFactory.getPath();
                            
                            $notification.success('Success', 'New path saved!');
                            $location.path('/path/global/' + data);
                        });
                }
                
                // Clear history to avoid possibility to get a history state without path ID
                historyFactory.clear();
            };
            
            var dialogOptions = {
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                windowClass: 'span12'
            };
            
            $scope.openTemplateEdit = function(step) {
                stepFactory.setStep(step);
                var d = $dialog.dialog(dialogOptions);
                d.open('partials/modals/template-edit.html', 'TemplateModalController');
            };
            
            $scope.openStepEdit = function(step) {
                stepFactory.setStep(step);
                var d = $dialog.dialog(dialogOptions);
                d.open('partials/modals/step-edit.html', 'StepModalController');
            };
        }
    ])
    
    /**
     * Step Modal Controller
     */
    .controller('StepModalController', [
       '$scope',
       'dialog',
       'pathFactory',
       'stepFactory',
       'historyFactory',
       function($scope, dialog, pathFactory, stepFactory, historyFactory) {
           var localStep = jQuery.extend(true, {}, stepFactory.getStep()); // Create a copy to not affect original data before user save
           
           $scope.formStep = localStep;
           
           $scope.close = function() {
               dialog.close();
           };
           
           $scope.save = function(formStep) {
               // Inject edited step in path
               pathFactory.replaceStep(formStep);
               
               $scope.path = pathFactory.getPath();
               historyFactory.update($scope.path);
               
               dialog.close();
           };
       }
    ])
    
    /**
     * Template Modal Controller
     */
    .controller('TemplateModalController', [
        '$scope',
        '$http',
        '$notification',
        'dialog',
        'stepFactory',
        'templateFactory',
        'alertFactory',
        function($scope, $http, $notification, dialog, stepFactory, templateFactory, alertFactory) {
            var editTemplate = false;
            
            var currentTemplate = templateFactory.getCurrentTemplate();
            if (null === currentTemplate) {
                // Create new Template
                $scope.step = stepFactory.getStep();

                $scope.formTemplate = {
                    name : 'Template ' + $scope.step.name,
                    description : '',
                    step: stepFactory.getStep()
                };
            }
            else {
                // Edit existing template
                editTemplate = true;
                
                templateFactory.setCurrentTemplate(null);
                var localCurrentTemplate = jQuery.extend(true, {}, currentTemplate); // Create a copy to not affect original data before user save
                $scope.formTemplate = localCurrentTemplate;
            }
            
            $scope.close = function() {
                dialog.close();
            };
            
            $scope.save = function (formTemplate) {
                if (!editTemplate) {
                    // Create new template
                    $http
                        .post('../api/index.php/path/templates.json', formTemplate)
                        .success(function(response) {
                            $notification.success("Success!", "Template saved!");
                            templateFactory.addTemplate(response);
                            dialog.close();
                        });
                }
                else {
                    // Update existing template
                    $http
                        .put('../api/index.php/path/templates/' + formTemplate.id + '.json', formTemplate)
                        .success ( function (response) {
                            $notification.success("Success", "Template updated!");
                            templateFactory.replaceTemplate(formTemplate);
                            dialog.close();
                        });
                }
            }
        }
    ]);