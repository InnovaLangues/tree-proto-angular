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
        'pathFactory',
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
        'resourceFactory',
        function($scope, $http, $notification, $dialog, $routeParams, $location, pathFactory, stepFactory, templateFactory, alertFactory, clipboardFactory, historyFactory, resourceFactory) {
            $scope.path = pathFactory.getPath();
            $scope.previewStep = null;
            
            $scope.sortableOptions = {
                update: $scope.update,
                placeholder: 'placeholder',
                connectWith: '.ui-sortable'
            };
            
            $scope.setPreviewStep = function(step) {
                if (step) {
                    $scope.previewStep = step;
                }
                else if (null !== $scope.path && undefined !== $scope.path.steps[0]) {
                    $scope.previewStep = $scope.path.steps[0];
                }
                
                $scope.inheritedResources = resourceFactory.getInheritedResources($scope.previewStep);
            };
            
            // Load current path
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
            
            // Display Root node as default preview step
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
                if ($routeParams.id) {
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
                keyboard: false,
                backdropClick: false,
            };
            
            $scope.openTemplateEdit = function(step) {
                stepFactory.setStep(step);
                var d = $dialog.dialog(dialogOptions);
                d.open('partials/modals/template-edit.html', 'TemplateModalController');
            };
            
            $scope.editStep = function(step) {
                stepFactory.setStep(step);
                
                // Create modal form
                var options = jQuery.extend(true, {}, dialogOptions);
                options.dialogClass = 'step-edit';
                
                var d = $dialog.dialog(options);
                d.open('partials/modals/step-edit.html', 'StepModalController')
                 .then(function(step) {
                     if (step) {
                         // Inject edited step in path
                         pathFactory.replaceStep(step);
                         
                         // Update history
                         historyFactory.update($scope.path);
                     }
                 });
            };
            
            $scope.openHelp = function() {
                var d = $dialog.dialog(dialogOptions);
                d.open('partials/modals/help.html', 'HelpModalController');
            };
            
            // Resources management
            $scope.editResource = function(resourceType, resource) {
                var editResource = false;
                
                if (resource) {
                    editResource = true;
                    // Edit existing document
                    resourceFactory.setResource(resource);
                }
                
                var options = jQuery.extend(true, {}, dialogOptions);
                
                // Send resource type to form
                options.resolve = {
                    resourceType: function() {
                        return resourceType;
                    }
                };
                
                var d = $dialog.dialog(options);
                d.open('partials/modals/resource-edit.html', 'ResourceModalController')
                 .then(function(resource) {
                     if (resource) {
                         // Save resource
                         if (editResource) {
                             // Edit existing resource
                             // Replace old resource by the new one
                             for (var i = 0; i < $scope.previewStep.resources.length; i++) {
                                 if ($scope.previewStep.resources[i].id === resource.id) {
                                     $scope.previewStep.resources[i] = resource;
                                     break;
                                 }
                             }
                         }
                         else {
                             // Create new resource
                             $scope.previewStep.resources.push(resource);
                         }
                         
                         // Update history
                         historyFactory.update($scope.path);
                     }
                 });
            };
            
            $scope.removeResource = function(resource) {
                // Search resource to remove
                for (var i = 0; i < $scope.previewStep.resources.length; i++) {
                    if (resource.id === $scope.previewStep.resources[i].id) {
                        $scope.previewStep.resources.splice(i, 1);
                        
                        // Update history
                        historyFactory.update($scope.path);
                        break;
                    }
                }
            };
            
            $scope.excludeParentResource= function(resource) {
                resource.isExcluded = true;
                $scope.previewStep.excludedResources.push(resource.id);
                
                // Update history
                historyFactory.update($scope.path);
            };
            
            $scope.includeParentResource= function(resource) {
                resource.isExcluded = false;
                for (var i = 0; i < $scope.previewStep.excludedResources.length; i++) {
                    if (resource.id == $scope.previewStep.excludedResources[i]) {
                        $scope.previewStep.excludedResources.splice(i, 1);
                    }
                }
                
                // Update history
                historyFactory.update($scope.path);
            };
        }
    ])
    
    /**
     * Help Modal Controller
     */
    .controller('HelpModalController', [
        '$scope',
        'dialog',
        function($scope, dialog) {
            $scope.close = function() {
                dialog.close();
            };
        }
    ])
    
    /**
     * Step Modal Controller
     */
    .controller('StepModalController', [
       '$scope',
       'dialog',
       '$dialog',
       'stepFactory',
       'historyFactory',
       'resourceFactory',
       function($scope, dialog, $dialog, stepFactory, historyFactory, resourceFactory) {
           $scope.buttonsDisabled = false;
           
           var localStep = jQuery.extend(true, {}, stepFactory.getStep()); // Create a copy to not affect original data before user save
           
           $scope.formStep = localStep;
           $scope.inheritedResources = resourceFactory.getInheritedResources(localStep);
           
           $scope.close = function() {
               dialog.close();
           };
           
           $scope.save = function(formStep) {
               // Send back edited step to path
               dialog.close(formStep);
           };
           
           var dialogOptions = {
               backdrop: true,
               keyboard: false,
               backdropClick: false,
           };
           
           // Resources Management
           $scope.editResource = function(resourceType, resource) {
               var editResource = false;
               
               // Disable current modal button to prevent close step modal before close document/tool modal
               $scope.buttonsDisabled = true;
               
               if (undefined != resource && null != resource) {
                   editResource = true;
                   // Edit existing document
                   resourceFactory.setResource(resource);
               }
               
               var options = jQuery.extend(true, {}, dialogOptions);
               
               // Send resource type to form
               options.resolve = {
                   resourceType: function() {
                       return resourceType;
                   }
               };
               
               var d = $dialog.dialog(options);
               d.open('partials/modals/resource-edit.html', 'ResourceModalController')
                .then(function(resource) {
                    if (resource) {
                        // Save resource
                        if (editResource) {
                            // Edit existing resource
                            // Replace old resource by the new one
                            for (var i = 0; i < $scope.formStep.resources.length; i++) {
                                if ($scope.formStep.resources[i].id === resource.id) {
                                    $scope.formStep.resources[i] = resource;
                                    break;
                                }
                            }
                        }
                        else {
                            // Create new resource
                            $scope.formStep.resources.push(resource);
                        }
                    }
                    
                    // Modal is now close, enable buttons
                    $scope.buttonsDisabled = false; 
                });
           };
           
           $scope.removeResource = function(resource) {
               // Search resource to remove
               for (var i = 0; i < $scope.formStep.resources.length; i++) {
                   if (resource.id === $scope.formStep.resources[i].id) {
                       $scope.formStep.resources.splice(i, 1);
                       break;
                   }
               }
           };
           
           $scope.excludeParentResource= function(resource) {
               resource.isExcluded = true;
               $scope.formStep.excludedResources.push(resource.id);
               
               // Update history
               historyFactory.update($scope.path);
           };
           
           $scope.includeParentResource= function(resource) {
               resource.isExcluded = false;
               for (var i = 0; i < $scope.previewStep.excludedResources.length; i++) {
                   if (resource.id == $scope.previewStep.excludedResources[i]) {
                       $scope.formStep.excludedResources.splice(i, 1);
                   }
               }
               
               // Update history
               historyFactory.update($scope.path);
           };
           
           $scope.selectImage = function() {
               
           };
       }
    ])
    
    /**
     * Document Modal Controller
     */
    .controller('ResourceModalController', [
        '$scope',
        'dialog',
        'pathFactory',
        'resourceFactory',
        'resourceType',
        function($scope, dialog, pathFactory, resourceFactory, resourceType) {
            $scope.resourceType = resourceType;
            $scope.resourceSubTypes = resourceFactory.getResourceSubTypes(resourceType);
            
            var currentResource = resourceFactory.getResource();
            if (null === currentResource) {
                // Create new document
                var newResource = resourceFactory.generateNewResource();
                newResource.type = resourceType;
                
                $scope.formResource = newResource;
            }
            else {
                // Edit exiting document
                resourceFactory.setResource(null);
                
                // Create a clone of current document to not affect original data (in case of user click on 'Cancel')
                $scope.formResource = jQuery.extend(true, {}, currentResource);
            }
            
            $scope.close = function() {
                dialog.close();
            };
            
            $scope.save = function(formResource) {
                // Send back edited document to step
                dialog.close(formResource);
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
                $scope.formTemplate = jQuery.extend(true, {}, currentTemplate); // Create a copy to not affect original data before user save
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
                            $notification.success("Success", "Template saved!");
                            formTemplate.id = response;
                            templateFactory.addTemplate(formTemplate);
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