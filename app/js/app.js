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
            // Check if current route need to clean factories data
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
     
    /**
     * History Factory
     * @todo remove reference to $rootScope
     * @todo replace jQuery.extend function by native js function
     */
    .factory('historyFactory', [
        '$rootScope',
        'pathFactory', 
        function($rootScope, pathFactory) {
            // Is redo function is disabled ?
            $rootScope.redoDisabled = true;
            
            // Is undo function is disabled ?
            $rootScope.undoDisabled = true;
            
            // History stack
            var history = [];
            var historyState = -1;
            
            return {
                /**
                 * Get current history stack
                 * 
                 * @returns Array
                 */
                get: function() {
                    return history;
                },
                
                /**
                 * Restore default history state (= empty history)
                 * 
                 * @returns historyFactory
                 */
                clear: function() {
                    this.setRedoDisabled(true);
                    this.setUndoDisabled(true);
                    
                    history = [];
                    historyState = -1;
                    
                    return this;
                },
                
                /**
                 * Store current path in history
                 * 
                 * @param path - The current path
                 * @returns historyFactory
                 */
                update: function(path) {
                    // Increment history state
                    this.incrementHistoryState();
                    
                    // Store path in history stack
                    this.addPathToHistory(path);
                    
                    if (this.getHistoryState() !== 0) {
                        // History is not empty => enable the undo function
                        this.setUndoDisabled(false);
                    }
                    this.setRedoDisabled(true);
                    
                    return this;
                },
                
                /**
                 * Get the last path state from history stack and set it as current path
                 * 
                 * @returns historyFactory
                 */
                undo: function() {
                    // Decrement history state
                    this.decrementHistoryState();
                    
                    var path = this.getPathFromHistory(historyState);
                    
                    // Clone object
                    var pathCopy = jQuery.extend(true, {}, path);
                    
                    this.setRedoDisabled(false);
                    if (0 === historyState) {
                        // History stack is empty => disable the undo function
                        this.setUndoDisabled(true);
                    }
                    
                    // Inject new path
                    pathFactory.setPath(pathCopy);
                    
                    return this;
                },
                
                /**
                 * Get the next history state from history stack and set it as current path
                 * 
                 * @returns historyFactory
                 */
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
                    
                    return this;
                },
                
                incrementHistoryState: function() {
                    // Increment history state
                    this.setHistoryState(this.getHistoryState() + 1);
                    return this;
                },
                
                decrementHistoryState: function() {
                    // Decrement history state
                    this.setHistoryState(this.getHistoryState() - 1);
                    return this;
                },
                
                getHistoryState: function() {
                    return historyState;
                },
                
                setHistoryState: function(data) {
                    historyState = data;
                    return this;
                },
                
                /**
                 * Get path state stored at position index in history stack
                 * 
                 * @param index
                 * @returns object
                 */
                getPathFromHistory : function(index) {
                    return history[index];
                },
                
                /**
                 * Store path state in history stack
                 * 
                 * @param data
                 * @returns historyFactory
                 */
                addPathToHistory : function(data) {
                    // Clone object
                    var pathCopy = jQuery.extend(true, {}, data);
                    history.push(pathCopy);
                    
                    return this;
                },
                
                getRedoDisabled: function() {
                    return $rootScope.redoDisabled;
                },
                
                setRedoDisabled: function(data) {
                    $rootScope.redoDisabled = data;
                    return this;
                },
                
                getUndoDisabled: function() {
                    return $rootScope.undoDisabled;
                },
                
                setUndoDisabled: function(data) {
                    $rootScope.undoDisabled = data;
                    return this;
                }
            };
        }
    ])
    
    /**
     * Clipboard Factory
     * 
     * @todo remove reference to $rootScope
     */
    .factory('clipboardFactory', [
        '$rootScope',
        'pathFactory',
        function($rootScope, pathFactory) {
            // Clipboard content
            var clipboard = null;
            
            // Current clipboard content comes from Templates ?
            var clipboardFromTemplates = false;
            
            // Enable paste buttons when clipboard is not empty
            $rootScope.pasteDisabled = true;
            
            return {
                /**
                 * Empty clipboard
                 * 
                 * @returns clipboardFactory
                 */
                clear: function() {
                    clipboard = null;
                    clipboardFromTemplates = false;
                    this.setPasteDisabled(true);
                    
                    return this;
                },
                
                /**
                 * Copy selected steps into clipboard
                 * 
                 * @param steps
                 * @param fromTemplates
                 * @returns clipboardFactory
                 */
                copy: function(steps, fromTemplates) {
                    clipboard = steps;
                    clipboardFromTemplates = fromTemplates || false;
                    this.setPasteDisabled(false);
                    
                    return this;
                },
                
                /**
                 * Paste steps form clipboards into current Path tree
                 * 
                 * @param step
                 * @returns clipboardFactory
                 * @todo modify reference to resources in array excludedResources
                 */
                paste: function(step) {
                    if (null !== clipboard) {
                        // Clone voir : http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object
                        var stepCopy = jQuery.extend(true, {}, clipboard);
                        
                        // Replace IDs before inject steps in path
                        this.replaceStepsId(stepCopy);
                        this.replaceResourcesId(stepCopy)
                        
                        if (!clipboardFromTemplates) {
                            stepCopy.name = stepCopy.name + '_copy';
                        }
                        
                        step.children.push(stepCopy);
                    }
                    
                    return this;
                },
                
                replaceResourcesId: function(step) {
                    if (step.resources.length != 0) {
                        for (var i = 0; i < step.resources.length; i++) {
                            step.resources[i].id = pathFactory.getNextResourceId();
                        }
                    }
                    
                    if (step.children.length != 0) {
                        for (var j = 0; j < step.children.length; j++) {
                            this.replaceResourcesId(step.children[j]);
                        }
                    }
                    
                    return this;
                },
                
                replaceStepsId: function(step) {
                    step.id = pathFactory.getNextStepId();
                    if (step.children.length != 0) {
                        for (var i = 0; i < step.children.length; i++) {
                            this.replaceStepsId(step.children[i]);
                        }
                    }
                    return this;
                },
                
                getPasteDisabled: function() {
                    return $rootScope.pasteDisabled;
                },
                
                setPasteDisabled: function(data) {
                    $rootScope.pasteDisabled = data;
                    return this;
                }
            };
        }
    ])
    
    /**
     * Path Factory
     */
    .factory('pathFactory', function() {
        var path = null;
        var pathInstanciated = [];
        var maxStepId = 0;
        var maxResourceId = 0;
        
        return {
            clear: function() {
                path = null;
                pathInstanciated = [];
                maxStepId = 0;
                maxResourceId = 0;
                
                return this;
            },
            
            getPath: function() {
                return path;
            },
            
            setPath: function(data) {
                // Store current path
                path = data;
                
                // Retrieve max step id
                this.getMaxStepId();
                
                // Retrieve max resource id
                this.getMaxResourceId();
                
                return this;
            },
            
            /**
             * Retrieve step in path using its ID
             * 
             * @param stepId
             * @returns object
             */
            getStepById: function(stepId) {
                function search(stepId, currentStep) {
                    var step = null;
                    if (stepId === currentStep.id) {
                        step = currentStep;
                    }
                    else {
                        for (var i = 0; i < currentStep.children.length; i++) {
                            step = search(stepId, currentStep.children[i]);
                            if (null !== step) {
                                // Step found, stop search
                                break;
                            }
                        }
                    }
                    
                    return step;
                }
                
                var step = null;
                if (null !== path && path.length !== 0) {
                    for (var i = 0; i < path.steps.length; i++) {
                        step = search(stepId, path.steps[i]);
                        if (null !== step) {
                            break;
                        }
                    }
                }
                
                return step;
            },
            
            addPathInstanciated: function(id) {
                pathInstanciated[id] = id;
                return this;
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
                
                return this;
            },
            
            getNextStepId: function() {
                if (0 === maxStepId) {
                    // Max step ID not calculated
                    this.getMaxStepId();
                }
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
                
                return this;
            },
            
            getNextResourceId: function() {
                if (0 === maxResourceId) {
                    // Max step ID not calculated
                    this.getMaxResourceId();
                }
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
                
                return this;
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
                
                return this;
            }
        };
    })
    
    /**
     * Step Factory
     */
    .factory('stepFactory', [
        'pathFactory',
        function(pathFactory) {
            // Stored step
            var step = null;
            
            // Base template used to append new step to tree
            var baseStep = {
                id                : null,
                resourceId        : null,
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
                /**
                 * Generate a new empty step
                 * 
                 * @param step
                 * @returns object
                 */
                generateNewStep: function(step) {
                    var stepId = pathFactory.getNextStepId();
                    var newStep = jQuery.extend(true, {}, baseStep);
                    
                    if (undefined != step) {
                        newStep.name = step.name + '-' + stepId;
                    }
                    
                    newStep.id = stepId;
                    
                    return newStep;
                },
                
                /**
                 * Store step in factory
                 * 
                 * @param data - The step to store
                 * @returns stepFactory
                 */
                setStep: function(data) {
                    step = data;
                    return this;
                },
                
                /**
                 * Get step stored in factory
                 * 
                 * @returns object
                 */
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
                    
                    return this;
                },
                
                updateResource: function(oldResource, newResource) {
                    for (var prop in newResource) {
                        oldResource[prop] = newResource[prop];
                    }
                    
                    return this;
                }
            };
        }
    ])
    
    /**
     * Resource Factory
     */
    .factory('resourceFactory', [
        'pathFactory', 
        function(pathFactory) {
            var resource = null;
            
            // Base template used to create new resource
            var baseResource = {
                id                  : null,
                resourceId          : null,
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
                    return this;
                },
                
                generateNewResource: function() {
                    var newResource = jQuery.extend(true, {}, baseResource);
                    newResource.id = pathFactory.getNextResourceId();
                    return newResource;
                },
                
                getInheritedResources: function(stepToFind) {
                    var stepFound = false;
                    var inheritedResources = {
                        documents: [],
                        tools: []
                    };

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
                                var stepDocuments = {
                                    stepName: currentStep.name,
                                    resources: []
                                };
                                
                                var stepTools = {
                                    stepName: currentStep.name,
                                    resources: []
                                };
                                
                                for (var j = currentStep.resources.length - 1; j >= 0; j--) {
                                    if (currentStep.resources[j].propagateToChildren) {
                                        // Current resource must be available for children
                                        var resource = currentStep.resources[j];
                                        resource.parentStep = currentStep.name;
                                        resource.isExcluded = stepToFind.excludedResources.indexOf(resource.id) != -1;
                                        
                                        if ('document' === resource.type) {
                                            stepDocuments.resources.unshift(resource);
                                        }
                                        else if ('tool' === resource.type) {
                                            stepTools.resources.unshift(resource);
                                        }
                                    }
                                }
                                
                                if (stepDocuments.resources.length !== 0)
                                    inheritedResources.documents.unshift(stepDocuments);
                                
                                if (stepTools.resources.length !== 0)
                                    inheritedResources.tools.unshift(stepTools);
                                
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
    
    /**
     * Template Factory
     */
    .factory('templateFactory', function() {
        var templates = [];
        var currentTemplate = null;
        
        return {
            addTemplate: function(template) {
                templates.push(template);
                return this;
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
                
                return this;
            },
            
            getTemplates: function() {
                return templates;
            },
            
            setTemplates: function(data) {
                templates = data;
                return this;
            },
            
            getCurrentTemplate: function() {
                return currentTemplate;
            },
            
            setCurrentTemplate: function(data) {
                currentTemplate = data;
                return this;
            }
        };
    })
    
    /**
     * Alert Factory
     */
    .factory('alertFactory', function() {
        var alerts = [];

        return {
            getAlerts: function() {
                return alerts;
            },
            
            addAlert: function(msg, type) {
                alerts.push({ type: type, msg: msg });
                return this;
            },
            
            closeAlert: function(index) {
                alerts.splice(index, 1);
                return this;
            }
        };
    });
