'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.controllers', 'myApp.directives', 'ui', 'pageslide-directive', 'notifications'])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/404', {templateUrl: 'partials/404.html'});
        $routeProvider.when('/', {templateUrl: 'partials/path-list.html', controller: 'PathController', clearPath: true, clearClipboard: true, clearHistory: true});
        $routeProvider.when('/path/list', {templateUrl: 'partials/path-list.html', controller: 'PathController', clearPath: true, clearClipboard: true, clearHistory: true});
        
        // Editing Steps
        $routeProvider.when('/path/global', {templateUrl: 'partials/editing-steps/global.html', controller: 'TreeController'});
        $routeProvider.when('/path/global/:id', {templateUrl: 'partials/editing-steps/global.html', controller: 'TreeController'});
        $routeProvider.when('/path/skills/:id', {templateUrl: 'partials/editing-steps/skills.html', controller: 'TreeController'});
        $routeProvider.when('/path/scenario/:id', {templateUrl: 'partials/editing-steps/scenario.html', controller: 'TreeController'});
        $routeProvider.when('/path/validation/:id', {templateUrl: 'partials/editing-steps/validation.html', controller: 'TreeController'});
        $routeProvider.when('/path/planner/:id', {templateUrl: 'partials/editing-steps/planner.html', controller: 'TreeController'});
        
        $routeProvider.otherwise({redirectTo: '/404'});
    }])
    
    .run([
        '$rootScope',
        'pathFactory',
        'clipboardFactory',
        'historyFactory',
        function($rootScope, pathFactory, clipboardFactory, historyFactory) {
            $rootScope.$on('$routeChangeSuccess', function(event, next, current) {
                if (next.clearClipboard) {
                    clipboardFactory.clear();
                }
                
                if (next.clearHistory) {
                    historyFactory.clear();
                }
                
                if (next.clearPath) {
                    pathFactory.clear();
                }
            });
        }
    ])
    
    // TODO : remove reference to $rootScope
    .factory('historyFactory', [
        '$rootScope',
        'pathFactory', 
        function($rootScope, pathFactory) {
            $rootScope.redoDisabled = true;
            $rootScope.undoDisabled = true;
            
            var history = [];
            var historyState = -1;
            
            return {
                get: function() {
                    return history;
                },
                
                clear: function() {
                    this.setRedoDisabled(true);
                    this.setUndoDisabled(true);
                    
                    history = [];
                    historyState = -1;
                },
                
                update: function(path) {
                    // Increment history state
                    this.incrementHistoryState();
                    
                    this.addPathToHistory(path);
                    
                    if (this.getHistoryState() !== 0) {
                        this.setUndoDisabled(false);
                    }
                    this.setRedoDisabled(true);
                },
                
                undo: function() {
                    // Decrement history state
                    this.decrementHistoryState();
                    
                    var path = this.getPathFromHistory(historyState);
                    
                    // Clone object
                    // TODO : replace by native js method
                    var pathCopy = jQuery.extend(true, {}, path);
                    
                    this.setRedoDisabled(false);
                    if (0 === historyState) {
                        this.setUndoDisabled(true);
                    }
                    
                    // Inject new path
                    pathFactory.setPath(pathCopy);
                },
                
                redo: function() {
                    // Increment history state
                    this.incrementHistoryState();
                    
                    var path = this.getPathFromHistory(historyState);
                    
                    // Clone object
                    var pathCopy = jQuery.extend(true, {}, path);
                    
                    this.setUndoDisabled(false);
                    if (historyState == history.length - 1) {
                        this.setRedoDisabled(true);
                    }
                    
                    // Inject new path
                    pathFactory.setPath(pathCopy);
                },
                
                incrementHistoryState: function() {
                    // Increment history state
                    this.setHistoryState(this.getHistoryState() + 1);
                },
                
                decrementHistoryState: function() {
                    // Decrement history state
                    this.setHistoryState(this.getHistoryState() - 1);
                },
                
                getHistoryState: function() {
                    return historyState;
                },
                
                setHistoryState: function(data) {
                    historyState = data;
                },
                
                getPathFromHistory : function(index) {
                    return history[index];
                },
                
                addPathToHistory : function(data) {
                    // Clone object
                    var pathCopy = jQuery.extend(true, {}, data);
                    history.push(pathCopy);
                },
                
                getRedoDisabled: function() {
                    return $rootScope.redoDisabled;
                },
                
                setRedoDisabled: function(data) {
                    $rootScope.redoDisabled = data;
                },
                
                getUndoDisabled: function() {
                    return $rootScope.undoDisabled;
                },
                
                setUndoDisabled: function(data) {
                    $rootScope.undoDisabled = data;
                }
            };
        }
    ])
    
    // TODO : remove reference to $rootScope
    .factory('clipboardFactory', function($rootScope) {
        var clipboard = null;
        var clipboardFromTemplates = false;
        
        $rootScope.pasteDisabled = true;
        
        return {
            clear: function() {
                clipboard = null;
                clipboardFromTemplates = false;
                this.setPasteDisabled(true);
            },
            
            isEmpty: function() {
                return null === clipboard;
            },
            
            copy: function(steps, fromTemplates) {
                clipboard = steps;
                clipboardFromTemplates = fromTemplates || false;
                this.setPasteDisabled(false);
            },
            
            paste: function(step) {
                if (!this.isEmpty())
                {
                    // Clone voir : http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
                    var stepCopy = jQuery.extend(true, {}, clipboard);
                    
                    if (!clipboardFromTemplates) {
                        stepCopy.name = stepCopy.name + '_copy';
                    }
                    
                    step.children.push(stepCopy);
                }
            },
            
            getPasteDisabled: function() {
                return $rootScope.pasteDisabled;
            },
            
            setPasteDisabled: function(data) {
                $rootScope.pasteDisabled = data;
            }
        };
    })
    
    .factory('pathFactory', function() {
        var path = null;
        var pathInstanciated = [];
        var maxStepId = 1;
        var maxResourceId = 1;
        
        return {
            clear: function() {
                path = null;
                pathInstanciated = [];
                maxStepId = 1;
                maxResourceId = 1;
            },
            
            getPath: function() {
                return path;
            },
            
            setPath: function(data) {
                path = data;
                
                // Retrieve max step id
                this.getMaxStepId();
                
                // Retrieve max resource id
                this.getMaxResourceId();
            },
            
            addPathInstanciated: function(id) {
                pathInstanciated[id] = id;
            },
            
            getPathInstanciated: function(id) {
                return typeof pathInstanciated[id] != 'undefined';
            },
            
            getMaxStepId: function() {
                maxStepId = 1;
                if (null !== path && path.steps.length !== 0)
                {
                    for (var i = 0; i < path.steps.length; i++) {
                        this.retrieveMaxStepId(path.steps[i]);
                    }
                }
                
               return maxStepId;
            },
            
            retrieveMaxStepId: function(step) {
                // Check current step
                if (step.id > maxStepId) {
                    maxStepId = step.id;
                }
                
                // Check step children
                if (step.children.length !== 0) {
                    for (var i = 0; i < step.children.length; i++) {
                        this.retrieveMaxStepId(step.children[i]);
                    }
                }
            },
            
            getNextStepId: function() {
                maxStepId++;
                return maxStepId;
            },
            
            getMaxResourceId: function() {
                maxResourceId = 1;
                if (null !== path && path.steps.length !== 0)
                {
                    for (var i = 0; i < path.steps.length; i++) {
                        this.retrieveMaxResourceId(path.steps[i]);
                    }
                }
                
               return maxResourceId;
            },
            
            retrieveMaxResourceId: function(step) {
                if (step.resources.length !== 0) {
                    // Check current step resources
                    for (var i = 0; i < step.resources.length; i++) {
                        if (step.resources[i].id > maxResourceId) {
                            maxResourceId = step.resources[i].id;
                        }
                    }
                }
                
                // Check step children
                if (step.children.length !== 0) {
                    for (var i = 0; i < step.children.length; i++) {
                        this.retrieveMaxResourceId(step.children[i]);
                    }
                }
            },
            
            getNextResourceId: function() {
                maxResourceId++;
                return maxResourceId;
            },
            
            replaceStep: function(newStep) {
                if (null !== path) {
                    var stepFound = false;
                    for (var i = 0; i < path.steps.length; i++) {
                        stepFound = this.searchStepToReplace(path.steps[i], newStep);
                        if (stepFound) {
                            break;
                        }
                    }
                }
            },
            
            searchStepToReplace: function(currentStep, newStep) {
                var stepFound = false;
                if (currentStep.id === newStep.id) {
                    stepFound = true;
                    this.updateStep(currentStep, newStep);
                }
                else if (currentStep.children.length !== 0) {
                    for (var i = 0; i < currentStep.children.length; i++) {
                        stepFound = this.searchStepToReplace(currentStep.children[i], newStep);
                        if (stepFound) {
                            break;
                        }
                    }
                }
                
                return stepFound;
            },
            
            updateStep: function(oldStep, newStep) {
                for (var prop in newStep) {
                    oldStep[prop] = newStep[prop];
                }
            }
        };
    })
    
    .factory('stepFactory', [
        'pathFactory',
        function(pathFactory) {
            var step = null;
            
            // Base template used to append new step to tree
            var baseStep = {
                id                : null,
                name              : 'Step',
                type              : 'seq',
                expanded          : true,
                instructions      : null,
                durationHours     : null,
                durationMinutes   : null,
                who               : null,
                where             : null,
                withTutor         : false,
                withComputer      : true,
                children          : [],
                resources         : [],
                excludedResources : []
            };
            
            return {
                generateNewStep: function(step) {
                    var stepId = pathFactory.getNextStepId();
                    var newStep = jQuery.extend(true, {}, baseStep);
                    newStep.name = step.name + '-' + stepId;
                    newStep.id = stepId;
                    
                    return newStep;
                },
                
                setStep: function(data) {
                    step = data;
                },
                
                getStep: function() {
                    return step;
                },
                
                replaceResource: function(newResource) {
                    if (null !== step) {
                        for (var i = 0; i < step.resources.length; i++) {
                            if (newResource.id === step.resources[i].id) {
                                this.updateResource(oldResource, newResource);
                                break;
                            }
                        }
                    }
                },
                
                updateResource: function(oldResource, newResource) {
                    for (var prop in newResource) {
                        oldResource[prop] = newResource[prop];
                    }
                }
            };
        }
    ])
    
    .factory('resourceFactory', [
        'pathFactory', 
        function(pathFactory) {
            var resource = null;
            
            // Base template used to create new resource
            var baseResource = {
                id                  : null,
                name                : null,
                type                : null,
                subType             : null,
                isDigital           : false,
                propagateToChildren : true
            };
            
            var resourceSubTypes = {
                document: [
                    {key: 'text',        label: 'Text'},
                    {key: 'sound',       label: 'Sound'},
                    {key: 'picture',     label: 'Picture'},
                    {key: 'video',       label: 'Video'},
                    {key: 'simulation',  label: 'Simulation'},
                    {key: 'test',        label: 'Test'},
                    {key: 'other',       label: 'Other'},
                    {key: 'indifferent', label: 'Indifferent'}
                ],
                tool: [
                    {key: 'chat',          label: 'Chat'},
                    {key: 'forum',         label: 'Forum'},
                    {key: 'deposit_files', label: 'Deposit files'},
                    {key: 'other',         label: 'Other'},
                    {key: 'indifferent',   label: 'Indifferent'}
                ]
            };
            
            return {
                getResourceSubTypes: function(resourceType) {
                    return resourceSubTypes[resourceType] || {};
                },
                getResource: function() {
                    return resource;
                },
                
                setResource: function(data) {
                    resource = data;
                },
                
                generateNewResource: function() {
                    var newResource = jQuery.extend(true, {}, baseResource);
                    newResource.id = pathFactory.getNextResourceId();
                    return newResource;
                },
                
                getInheritedResources: function(stepToFind) {
                    var stepFound = false;
                    var inheritedResources = [];

                    var path = pathFactory.getPath();
                    if (path) {
                        for (var i = 0; i < path.steps.length; i++) {
                            var currentStep = path.steps[i];
                            stepFound = this.retrieveInheritedResources(stepToFind, currentStep, inheritedResources);
                            if (stepFound) {
                                break;
                            }
                        }
                    }
                    
                    return inheritedResources;
                },
                
                retrieveInheritedResources: function(stepToFind, currentStep, inheritedResources) {
                    var stepFound = false;
                    
                    if (stepToFind.id !== currentStep.id) {
                        // Not the step we search for => search in children
                        for (var i = 0; i < currentStep.children.length; i++) {
                            stepFound =  this.retrieveInheritedResources(stepToFind, currentStep.children[i], inheritedResources);
                            if (stepFound) {
                                // Get all resources which must be sent to children
                                for (var j = currentStep.resources.length - 1; j >= 0; j--) {
                                    if (currentStep.resources[j].propagateToChildren) {
                                        // Current resource must be available for children
                                        var resource = currentStep.resources[j];
                                        resource.parentStep = currentStep.name;
                                        resource.isExcluded = stepToFind.excludedResources.indexOf(resource.id) != -1;
                                        inheritedResources.unshift(resource);
                                    }
                                }
                                break;
                            }
                        }
                    }
                    else {
                        stepFound = true;
                    }
                    
                    return stepFound;
                }
            }
        }
    ])
    
    .factory('templateFactory', function() {
        var templates = [];
        var currentTemplate = null;
        
        return {
            addTemplate: function(template) {
                templates.push(template);
            },
            
            replaceTemplate: function(template) {
                var templateFound = false;
                for (var i = 0; i < templates.length; i++) {
                    if (templates[i].id === template.id)
                    {
                        templates[i] = template;
                        templateFound = true;
                        break;
                    }
                }
                
                if (!templateFound) {
                    this.addTemplate(template);
                }
            },
            
            getTemplates: function() {
                return templates;
            },
            
            setTemplates: function(data) {
                templates = data;
            },
            
            getCurrentTemplate: function() {
                return currentTemplate;
            },
            
            setCurrentTemplate: function(data) {
                currentTemplate = data;
            }
        };
    })
    
    .factory('alertFactory', function() {
        var alerts = [];

        return {
            getAlerts: function() {
                return alerts;
            },
            
            addAlert: function(msg, type) {
                alerts.push({ type: type, msg: msg });
            },
            
            closeAlert: function(index) {
                alerts.splice(index, 1);
            }
        };
    });
