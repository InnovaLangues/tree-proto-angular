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
     * Step Controller
     */
    .controller('StepController', [
       '$scope',
       'pathFactory',
       'stepFactory',
       function($rootScope, $scope, pathFactory, stepFactory) {
           $scope.step = stepFactory.getStep();
           $scope.path = pathFactory.getPath();
           
           $scope.updateStep = function(step) {
               
           };
       }
    ])
    
    /**
     * Template Controller
     */
    .controller('TemplateController', [
        '$rootScope',
        '$scope',
        '$http',
        '$dialog',
        'templateFactory',
        'alertFactory',
        'clipboardFactory',
        // TODO: There has to be a better way than using rootScope
        function($rootScope, $scope, $http, $dialog, templateFactory, alertFactory, clipboardFactory) {
            $http
                .get('../api/index.php/path/templates.json')
                .then(function(response) {
                    templateFactory.setTemplates(response.data);
                    $rootScope.templates = templateFactory.getTemplates();
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
            if (!Array.prototype.last) {
                Array.prototype.last = function() {
                    return this[this.length - 1];
                };
            }
            
            $scope.templates = [];
            $scope.path = pathFactory.getPath();
            
            $scope.previewStep = null;
            
            $scope.sortableOptions = {
                update: $scope.update,
                placeholder: 'placeholder',
                connectWith: '.ui-sortable'
            };
            
            // Base template used to append new step to tree
            var baseStep = {
                name       : 'Step',
                parentId   : null,
                type       : 'seq',
                expanded   : true,
                dataType   : null,
                dataId     : null,
                templateId : null,
                children   : []
            };
            
            if ($routeParams.id) {
                if (!pathFactory.getPathInstanciated($routeParams.id)) {
                    pathFactory.addPathInstanciated($routeParams.id);
                    $http.get('../api/index.php/paths/' + $routeParams.id + '.json')
                        .success(function(data) {
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
                var post = step.children.length + 1;
                var newStep = jQuery.extend(true, {}, baseStep);
                newStep.name = step.name + '-' + post;
                
                step.children.push(newStep);
                
                historyFactory.update($scope.path);
            };
            
            $scope.addSibling = function(stepIndex) {
                historyFactory.update($scope.path);
            };
            
            $scope.save = function(path) {
                if (undefined === $routeParams.id) {
                    // Create new path
                    $http
                        .post('../api/index.php/paths.json', path)
                        .success ( function (data) {
                            $notification.success("Success", "New path saved!");
                            $location.path("/path/global/" + data);
                        });
                } 
                else {
                    // Update existing path
                    $http
                        .put('../api/index.php/paths/' + $routeParams.id + '.json', path)
                        .success ( function (data) {
                            $notification.success("Success", "Path updated!");
                        });
                }
            };
            
            var dialogOptions = {
                backdrop: true,
                keyboard: true,
                backdropClick: true
            };
            
            $scope.openTemplateModal = function(step) {
                stepFactory.setStep(step);
                var d = $dialog.dialog(dialogOptions);
                d.open('partials/modals/template-edit.html', 'TemplateModalController');
            };
            
            $scope.openStepEdit = function(step) {
                stepFactory.setStep(step);
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
            var editTemplate = false;
            
            var currentTemplate = templateFactory.getCurrentTemplate();
            if (null === currentTemplate) {
                $scope.step = stepFactory.getStep();

                $scope.formTemplate = {
                    name : 'Template ' + $scope.step.name,
                    description : '',
                    step: stepFactory.getStep()
                };
            }
            else {
                editTemplate = true;
                
                templateFactory.setCurrentTemplate(null);
                var localCurrentTemplate = jQuery.extend(true, {}, currentTemplate); // Create a copy to not affect original data before user save
                $scope.formTemplate = localCurrentTemplate;
            }
            
            $scope.close = function () {
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
                            $rootScope.templates = templateFactory.getTemplates();
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
                            $rootScope.templates = templateFactory.getTemplates();
                            dialog.close();
                        });
                }
            }
        }
    ]);