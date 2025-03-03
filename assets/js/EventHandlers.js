/**
 * EventHandlers.js
 * Handles user interactions for the CVRP game
 */

import CompletionModal from './CompletionModal.js';

/**
 * Class to handle game UI events
 * @exports EventHandlers
 */
class EventHandlers {
    /**
     * Initialize the event handlers
     * @param {GameState} gameState - Reference to the game state
     * @param {Renderer} renderer - Reference to the renderer
     * @param {CvrpAlgorithms} algorithms - Reference to the algorithms
     * @param {Object} domElements - Object containing DOM element references
     */
    constructor(gameState, renderer, algorithms, domElements) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.algorithms = algorithms;
        this.dom = domElements;
        this.isMobile = this.detectMobile();
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchMoved = false;
        this.clickDelay = 300; // ms to wait to distinguish between tap and scroll

        // Initialize completion modal
        this.completionModal = new CompletionModal(gameState, algorithms, this);

        // Bind event handlers to maintain 'this' context
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.handleCanvasTouchStart = this.handleCanvasTouchStart.bind(this);
        this.handleCanvasTouchMove = this.handleCanvasTouchMove.bind(this);
        this.handleCanvasTouchEnd = this.handleCanvasTouchEnd.bind(this);
        this.handleUndoClick = this.handleUndoClick.bind(this);
        this.handleResetRouteClick = this.handleResetRouteClick.bind(this);
        this.handleFinishRouteClick = this.handleFinishRouteClick.bind(this);
        this.handleClearAllClick = this.handleClearAllClick.bind(this);
        this.handleSavingsClick = this.handleSavingsClick.bind(this);
        this.handleSweepClick = this.handleSweepClick.bind(this);
        this.handleEnhancedClick = this.handleEnhancedClick.bind(this);
        this.handleNewGameClick = this.handleNewGameClick.bind(this);
        this.handleDifficultyChange = this.handleDifficultyChange.bind(this);
        this.handleCustomSettingsChange = this.handleCustomSettingsChange.bind(this);
        this.handleLocationSizeChange = this.handleLocationSizeChange.bind(this);
        this.handleWindowResize = this.handleWindowResize.bind(this);
    }

    /**
     * Detect if the device is mobile
     * @returns {boolean} True if the device is likely mobile
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || window.innerWidth <= 768;
    }

    /**
 * Set up all event listeners
 */
    setupEventListeners() {
        // Canvas events - different handling for mobile vs desktop
        if (this.isMobile) {
            this.dom.canvas.addEventListener('touchstart', this.handleCanvasTouchStart, { passive: false });
            this.dom.canvas.addEventListener('touchmove', this.handleCanvasTouchMove, { passive: true });
            this.dom.canvas.addEventListener('touchend', this.handleCanvasTouchEnd);
        } else {
            this.dom.canvas.addEventListener('click', this.handleCanvasClick);
        }

        // Button events
        this.dom.undoButton.addEventListener('click', this.handleUndoClick);
        this.dom.resetRouteButton.addEventListener('click', this.handleResetRouteClick);
        this.dom.finishRouteButton.addEventListener('click', this.handleFinishRouteClick);
        this.dom.clearAllButton.addEventListener('click', this.handleClearAllClick);
        this.dom.savingsButton.addEventListener('click', this.handleSavingsClick);
        this.dom.sweepButton.addEventListener('click', this.handleSweepClick);
        this.dom.enhancedButton.addEventListener('click', this.handleEnhancedClick);
        this.dom.newGameButton.addEventListener('click', this.handleNewGameClick);

        // Select and input events
        this.dom.difficultySelect.addEventListener('change', this.handleDifficultyChange);
        this.dom.customCapacityInput.addEventListener('change', this.handleCustomSettingsChange);
        this.dom.customLocationsInput.addEventListener('change', this.handleCustomSettingsChange);

        // Window events
        window.addEventListener('resize', this.handleWindowResize);
    }

    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        if (this.isMobile) {
            this.dom.canvas.removeEventListener('touchstart', this.handleCanvasTouchStart);
            this.dom.canvas.removeEventListener('touchmove', this.handleCanvasTouchMove);
            this.dom.canvas.removeEventListener('touchend', this.handleCanvasTouchEnd);
        } else {
            this.dom.canvas.removeEventListener('click', this.handleCanvasClick);
        }

        this.dom.undoButton.removeEventListener('click', this.handleUndoClick);
        this.dom.resetRouteButton.removeEventListener('click', this.handleResetRouteClick);
        this.dom.finishRouteButton.removeEventListener('click', this.handleFinishRouteClick);
        this.dom.clearAllButton.removeEventListener('click', this.handleClearAllClick);
        this.dom.savingsButton.removeEventListener('click', this.handleSavingsClick);
        this.dom.sweepButton.removeEventListener('click', this.handleSweepClick);
        this.dom.enhancedButton.removeEventListener('click', this.handleEnhancedClick);
        this.dom.newGameButton.removeEventListener('click', this.handleNewGameClick);
        this.dom.difficultySelect.removeEventListener('change', this.handleDifficultyChange);
        this.dom.customCapacityInput.removeEventListener('change', this.handleCustomSettingsChange);
        this.dom.customLocationsInput.removeEventListener('change', this.handleCustomSettingsChange);
        window.removeEventListener('resize', this.handleWindowResize);
    }

    /**
     * Handle canvas touchstart event
     * @param {TouchEvent} event - The touchstart event
     */
    handleCanvasTouchStart(event) {
        // Prevent default to avoid page scrolling when interacting with the canvas
        if (event.cancelable) {
            event.preventDefault();
        }

        if (!this.gameState.gameStarted || event.touches.length !== 1) return;

        const touch = event.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchMoved = false;
    }

    /**
     * Handle canvas touchmove event
     * @param {TouchEvent} event - The touchmove event
     */
    handleCanvasTouchMove(event) {
        if (!this.gameState.gameStarted || event.touches.length !== 1) return;

        const touch = event.touches[0];
        const moveThreshold = 10; // pixels

        // Check if touch has moved significantly
        if (Math.abs(touch.clientX - this.touchStartX) > moveThreshold ||
            Math.abs(touch.clientY - this.touchStartY) > moveThreshold) {
            this.touchMoved = true;
        }
    }

    /**
     * Handle canvas touchend event
     * @param {TouchEvent} event - The touchend event
     */
    handleCanvasTouchEnd(event) {
        if (!this.gameState.gameStarted) return;

        // Only handle the touch if it wasn't a scroll attempt
        if (!this.touchMoved) {
            // Create a synthetic event to pass to the click handler
            const syntheticEvent = {
                clientX: this.touchStartX,
                clientY: this.touchStartY
            };

            // Use a small delay to ensure it wasn't the start of a scroll
            setTimeout(() => {
                this.handleCanvasClick(syntheticEvent);
            }, 10);
        }
    }

    /**
 * Handle canvas click event
 * @param {MouseEvent|Object} event - The click event or synthetic event from touch
 */
    handleCanvasClick(event) {
        if (!this.gameState.gameStarted) return;

        const coords = this.renderer.getCanvasCoordinates(event);
        const result = this.gameState.handleLocationClick(coords.x, coords.y);

        if (result) {
            switch (result.action) {
                case 'add-customer':
                    // Update customers visited count and capacity display
                    this.updateCustomersServedCount();
                    this.updateCapacityDisplay(result.currentLoad, result.capacity, result.percentFull);

                    // Enable buttons
                    this.dom.undoButton.disabled = false;
                    this.dom.finishRouteButton.disabled = false;
                    break;

                case 'complete-route':
                    // Update route info
                    this.updateCustomersServedCount();
                    this.updateTotalDistance();
                    this.updateRoutesList();

                    // Reset capacity display for new route
                    this.updateCapacityDisplay(0, this.gameState.capacity, 0);

                    // Update vehicle number
                    this.dom.vehicleNumber.textContent = this.gameState.currentRouteIndex + 1;

                    // Disable finish button until we add customers
                    this.dom.finishRouteButton.disabled = true;
                    break;

                case 'complete-all-routes':
                    // Update all stats
                    this.updateCustomersServedCount();
                    this.updateTotalDistance();
                    this.updateRoutesList();

                    // Update vehicle count - count only routes with at least one customer
                    const vehiclesUsed = this.gameState.routes.filter(route => route.length > 2).length;
                    this.dom.vehiclesUsed.textContent = vehiclesUsed;

                    // Update best solution if new
                    if (result.newBest) {
                        this.dom.bestDistance.textContent = result.totalDistance.toFixed(2);
                    }

                    // Show completion modal
                    this.showCompletionModal(result);
                    break;
                case 'capacity-exceeded':
                    // Show alert for exceeded capacity
                    alert(`Cannot add this customer with demand ${result.demandValue}. Current load: ${result.currentLoad}/${result.capacity}. Return to depot to start a new vehicle.`);
                    break;

                case 'already-served':
                    // Optionally show a message
                    // alert('This customer has already been served.');
                    break;

                case 'empty-route':
                    // Do nothing when clicking depot with empty route
                    // No need for alert or other feedback
                    break;
            }

            // Redraw the game
            this.renderer.drawGame();
        }
    }

    /**
 * Show completion modal with results
 * @param {Object} result - The completion result
 */
    showCompletionModal(result) {
        // First ensure all algorithm solutions are calculated
        if (this.gameState.savingsRoutes.length === 0) {
            this.algorithms.calculateSavingsSolution();
        }
        if (this.gameState.sweepRoutes.length === 0) {
            this.algorithms.calculateSweepSolution();
        }
        if (this.gameState.enhancedRoutes.length === 0) {
            this.algorithms.calculateEnhancedSolution();
        }

        // Get the distances and vehicle counts
        const userDistance = result.totalDistance;

        // FIX: Count actual non-empty routes (with at least one customer)
        // A valid route must have at least 3 elements: depot → customer → depot
        const userVehicles = this.gameState.routes.filter(route => route.length > 2).length;

        const savingsDistance = this.gameState.calculateTotalDistance(this.gameState.savingsRoutes);
        const savingsVehicles = this.gameState.savingsRoutes.length;

        const sweepDistance = this.gameState.calculateTotalDistance(this.gameState.sweepRoutes);
        const sweepVehicles = this.gameState.sweepRoutes.length;

        const enhancedDistance = this.gameState.calculateTotalDistance(this.gameState.enhancedRoutes);
        const enhancedVehicles = this.gameState.enhancedRoutes.length;

        // Calculate scores (distance + vehicle cost)
        const userScore = userDistance + (userVehicles * this.gameState.vehicleCost);
        const savingsScore = savingsDistance + (savingsVehicles * this.gameState.vehicleCost);
        const sweepScore = sweepDistance + (sweepVehicles * this.gameState.vehicleCost);
        const enhancedScore = enhancedDistance + (enhancedVehicles * this.gameState.vehicleCost);

        // Show the modal
        this.completionModal.show({
            userDistance: userDistance,
            userVehicles: userVehicles,
            userScore: userScore,
            savingsDistance: savingsDistance,
            savingsVehicles: savingsVehicles,
            savingsScore: savingsScore,
            sweepDistance: sweepDistance,
            sweepVehicles: sweepVehicles,
            sweepScore: sweepScore,
            enhancedDistance: enhancedDistance,
            enhancedVehicles: enhancedVehicles,
            enhancedScore: enhancedScore
        });
    }

    /**
     * Update the capacity display
     * @param {number} currentLoad - Current vehicle load
     * @param {number} capacity - Maximum capacity
     * @param {number} percentFull - Percentage full (0-100)
     */
    updateCapacityDisplay(currentLoad, capacity, percentFull) {
        this.dom.currentLoad.textContent = currentLoad;
        this.dom.maxCapacity.textContent = capacity;
        this.dom.capacityFill.style.width = `${percentFull}%`;

        // Change color as it gets fuller
        if (percentFull > 90) {
            this.dom.capacityFill.style.background = 'linear-gradient(to right, #f72585, #b5179e)';
        } else if (percentFull > 75) {
            this.dom.capacityFill.style.background = 'linear-gradient(to right, #f8961e, #f72585)';
        } else if (percentFull > 50) {
            this.dom.capacityFill.style.background = 'linear-gradient(to right, #90be6d, #f8961e)';
        } else {
            this.dom.capacityFill.style.background = 'linear-gradient(to right, #4cc9f0, #4361ee)';
        }
    }

    /**
     * Update the customers served count
     */
    updateCustomersServedCount() {
        const served = this.gameState.countServedCustomers();
        this.dom.customersServed.textContent = served;
        this.dom.customersVisited.textContent = served;
    }

    /**
     * Update the total distance display
     */
    updateTotalDistance() {
        const totalDistance = this.gameState.calculateTotalDistance(this.gameState.routes);
        this.dom.totalDistance.textContent = totalDistance.toFixed(2);
    }

    /**
 * Update the routes list in the UI
 */
    updateRoutesList() {
        // Clear current route cards
        this.dom.routeInfo.innerHTML = '';

        // Count non-empty routes (for vehicle count display)
        const vehiclesUsed = this.gameState.routes.filter(route => route.length > 2).length;
        this.dom.vehiclesUsed.textContent = vehiclesUsed;

        // Add a card for each non-empty route
        for (let i = 0; i < this.gameState.routes.length; i++) {
            const route = this.gameState.routes[i];

            // Skip empty routes or routes with just depot
            if (route.length <= 2) continue;

            // Calculate route distance
            const distance = this.gameState.calculateRouteDistance(route);

            // Create route card
            const card = document.createElement('div');
            card.className = 'route-card';

            // Get route color
            const color = this.gameState.getRouteColor(i);

            // Create color indicator
            const colorIndicator = document.createElement('span');
            colorIndicator.className = 'route-color';
            colorIndicator.style.backgroundColor = color;

            // Create route text
            card.appendChild(colorIndicator);
            card.appendChild(document.createTextNode(`Route ${i + 1}: ${distance.toFixed(1)} units`));

            // Add to container
            this.dom.routeInfo.appendChild(card);
        }
    }

    /**
     * Handle undo button click
     */
    handleUndoClick() {
        const result = this.gameState.undoLastLocation();

        if (result.action === 'undo-location') {
            // Update capacity display
            this.updateCapacityDisplay(result.currentLoad, result.capacity, result.percentFull);

            // Update customers count
            this.updateCustomersServedCount();

            // Update total distance
            this.updateTotalDistance();

            // Disable undo button if route is empty
            this.dom.undoButton.disabled = result.isEmpty;

            // Disable finish button if route is empty
            this.dom.finishRouteButton.disabled = result.isEmpty;
        }

        this.renderer.drawGame();
    }

    /**
     * Handle reset route button click
     */
    handleResetRouteClick() {
        const result = this.gameState.resetCurrentRoute();

        // Update capacity display
        this.updateCapacityDisplay(0, this.gameState.capacity, 0);

        // Update customers count
        this.updateCustomersServedCount();

        // Disable buttons
        this.dom.undoButton.disabled = true;
        this.dom.finishRouteButton.disabled = true;

        this.renderer.drawGame();
    }

    /**
     * Handle finish route button click
     */
    handleFinishRouteClick() {
        const result = this.gameState.completeCurrentRoute();

        if (result.action === 'complete-route') {
            // Update route info
            this.updateCustomersServedCount();
            this.updateTotalDistance();
            this.updateRoutesList();

            // Reset capacity display for new route
            this.updateCapacityDisplay(0, this.gameState.capacity, 0);

            // Update vehicle number and count
            this.dom.vehicleNumber.textContent = this.gameState.currentRouteIndex + 1;

            // Count non-empty routes
            const vehiclesUsed = this.gameState.routes.filter(route => route.length > 2).length;
            this.dom.vehiclesUsed.textContent = vehiclesUsed;

            // Disable finish button until we add customers
            this.dom.finishRouteButton.disabled = true;

            // Disable undo button for empty route
            this.dom.undoButton.disabled = true;
        } else if (result.action === 'no-customers') {
            alert('Add at least one customer to the route before finishing.');
        }

        this.renderer.drawGame();
    }

    /**
     * Handle clear all routes button click
     */
    handleClearAllClick() {
        if (confirm('Are you sure you want to clear all routes and start over?')) {
            const result = this.gameState.clearAllRoutes();

            // Reset all UI elements
            this.updateCapacityDisplay(0, this.gameState.capacity, 0);
            this.updateCustomersServedCount();
            this.updateTotalDistance();
            this.dom.routeInfo.innerHTML = '';
            this.dom.vehicleNumber.textContent = 1;
            this.dom.vehiclesUsed.textContent = 0;

            // Disable buttons
            this.dom.undoButton.disabled = true;
            this.dom.finishRouteButton.disabled = true;

            this.renderer.drawGame();
        }
    }

    /**
 * Handle savings algorithm button click
 */
    handleSavingsClick() {
        // Show calculating indicator
        const originalText = this.dom.savingsButton.textContent;
        this.dom.savingsButton.textContent = "Calculating...";
        this.dom.savingsButton.disabled = true;

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            // Calculate the savings solution
            const result = this.algorithms.applySavingsSolution();

            // Update UI
            this.updateCustomersServedCount();
            this.updateTotalDistance();
            this.updateRoutesList();
            this.dom.savingsDistance.textContent = result.totalDistance.toFixed(2);
            this.dom.savingsVehicles.textContent = result.routesCount;
            this.dom.vehicleNumber.textContent = this.gameState.currentRouteIndex + 1;

            // Count non-empty routes for vehicle count
            const vehiclesUsed = this.gameState.routes.filter(route => route.length > 2).length;
            this.dom.vehiclesUsed.textContent = vehiclesUsed;

            // Reset capacity for new route
            this.updateCapacityDisplay(0, this.gameState.capacity, 0);

            // Update best distance if this is better
            if (result.totalDistance < this.gameState.bestTotalDistance) {
                this.dom.bestDistance.textContent = result.totalDistance.toFixed(2);
            }

            // Reset button
            this.dom.savingsButton.textContent = originalText;
            this.dom.savingsButton.disabled = false;

            // Disable route editing buttons
            this.dom.undoButton.disabled = true;
            this.dom.finishRouteButton.disabled = true;

            // Draw the solution
            this.renderer.drawGame();
        }, 50);
    }


    /**
 * Handle sweep algorithm button click
 */
    handleSweepClick() {
        // Show calculating indicator
        const originalText = this.dom.sweepButton.textContent;
        this.dom.sweepButton.textContent = "Calculating...";
        this.dom.sweepButton.disabled = true;

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            // Calculate the sweep solution
            const result = this.algorithms.applySweepSolution();

            // Update UI
            this.updateCustomersServedCount();
            this.updateTotalDistance();
            this.updateRoutesList();
            this.dom.sweepDistance.textContent = result.totalDistance.toFixed(2);
            this.dom.sweepVehicles.textContent = result.routesCount;
            this.dom.vehicleNumber.textContent = this.gameState.currentRouteIndex + 1;

            // Count non-empty routes for vehicle count
            const vehiclesUsed = this.gameState.routes.filter(route => route.length > 2).length;
            this.dom.vehiclesUsed.textContent = vehiclesUsed;

            // Reset capacity for new route
            this.updateCapacityDisplay(0, this.gameState.capacity, 0);

            // Update best distance if this is better
            if (result.totalDistance < this.gameState.bestTotalDistance) {
                this.dom.bestDistance.textContent = result.totalDistance.toFixed(2);
            }

            // Reset button
            this.dom.sweepButton.textContent = originalText;
            this.dom.sweepButton.disabled = false;

            // Disable route editing buttons
            this.dom.undoButton.disabled = true;
            this.dom.finishRouteButton.disabled = true;

            // Draw the solution
            this.renderer.drawGame();
        }, 50);
    }

    /**
 * Handle enhanced algorithm button click
 */
    handleEnhancedClick() {
        // Show calculating indicator
        const originalText = this.dom.enhancedButton.textContent;
        this.dom.enhancedButton.textContent = "Calculating...";
        this.dom.enhancedButton.disabled = true;

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            // Calculate the enhanced solution
            const result = this.algorithms.applyEnhancedSolution();

            // Update UI
            this.updateCustomersServedCount();
            this.updateTotalDistance();
            this.updateRoutesList();
            this.dom.enhancedDistance.textContent = result.totalDistance.toFixed(2);
            this.dom.enhancedVehicles.textContent = result.routesCount;
            this.dom.vehicleNumber.textContent = this.gameState.currentRouteIndex + 1;

            // Count non-empty routes for vehicle count
            const vehiclesUsed = this.gameState.routes.filter(route => route.length > 2).length;
            this.dom.vehiclesUsed.textContent = vehiclesUsed;

            // Reset capacity for new route
            this.updateCapacityDisplay(0, this.gameState.capacity, 0);

            // Update best distance if this is better
            if (result.totalDistance < this.gameState.bestTotalDistance) {
                this.dom.bestDistance.textContent = result.totalDistance.toFixed(2);
            }

            // Reset button
            this.dom.enhancedButton.textContent = originalText;
            this.dom.enhancedButton.disabled = false;

            // Disable route editing buttons
            this.dom.undoButton.disabled = true;
            this.dom.finishRouteButton.disabled = true;

            // Draw the solution
            this.renderer.drawGame();
        }, 50);
    }
    /**
     * Handle new game button click
     */
    handleNewGameClick() {
        const difficultyValue = this.dom.difficultySelect.value;
        const customCapacity = parseInt(this.dom.customCapacityInput.value);
        const customLocations = parseInt(this.dom.customLocationsInput.value);

        // Validate custom inputs
        let adjustedCustomCapacity = customCapacity;
        let adjustedCustomLocations = customLocations;

        // For mobile, limit the maximum number of locations
        if (this.isMobile && customLocations > 30) {
            adjustedCustomLocations = 30;
            this.dom.customLocationsInput.value = 30;
            alert("On mobile devices, the maximum number of customers is limited to 30 for performance reasons.");
        }

        // Show loading indicator
        this.showLoadingIndicator();

        // Use setTimeout to allow the UI to update before intensive operations
        setTimeout(() => {
            try {
                const result = this.gameState.resetGame(
                    difficultyValue,
                    adjustedCustomCapacity,
                    adjustedCustomLocations,
                    this.dom.canvas.width,
                    this.dom.canvas.height
                );

                // Update DOM elements
                this.dom.totalCustomers.textContent = result.numCustomers;
                this.dom.totalCustomersStat.textContent = result.numCustomers;
                this.dom.customersServed.textContent = 0;
                this.dom.customersVisited.textContent = 0;
                this.dom.totalDistance.textContent = "0";
                this.dom.vehiclesUsed.textContent = 0;
                this.dom.routeInfo.innerHTML = '';
                this.dom.vehicleNumber.textContent = 1;

                // Update capacity display
                this.dom.maxCapacity.textContent = result.capacity;
                this.dom.currentLoad.textContent = 0;
                this.dom.capacityFill.style.width = '0%';

                // Reset algorithm solution displays
                this.dom.savingsDistance.textContent = "N/A";
                this.dom.savingsVehicles.textContent = "0";
                this.dom.sweepDistance.textContent = "N/A";
                this.dom.sweepVehicles.textContent = "0";
                this.dom.enhancedDistance.textContent = "N/A";
                this.dom.enhancedVehicles.textContent = "0";

                if (this.gameState.bestTotalDistance !== Infinity) {
                    this.dom.bestDistance.textContent = this.gameState.bestTotalDistance.toFixed(2);
                } else {
                    this.dom.bestDistance.textContent = "N/A";
                }

                // Disable buttons
                this.dom.undoButton.disabled = true;
                this.dom.finishRouteButton.disabled = true;

                // Calculate algorithm solutions in the background
                this.calculateSolutionsAsync();
            } catch (error) {
                console.error("Error initializing game:", error);
                alert("There was a problem starting the game. Please try with fewer locations or a larger capacity.");
            } finally {
                this.hideLoadingIndicator();
                this.renderer.drawGame();
            }
        }, 50);
    }

    /**
     * Calculate algorithm solutions asynchronously
     */
    calculateSolutionsAsync() {
        // First calculate savings algorithm (usually faster)
        setTimeout(() => {
            try {
                this.algorithms.calculateSavingsSolution();
                const savingsDistance = this.gameState.calculateTotalDistance(this.gameState.savingsRoutes);
                this.dom.savingsDistance.textContent = savingsDistance.toFixed(2);
                this.dom.savingsVehicles.textContent = this.gameState.savingsRoutes.length;

                // Then calculate sweep algorithm
                setTimeout(() => {
                    try {
                        this.algorithms.calculateSweepSolution();
                        const sweepDistance = this.gameState.calculateTotalDistance(this.gameState.sweepRoutes);
                        this.dom.sweepDistance.textContent = sweepDistance.toFixed(2);
                        this.dom.sweepVehicles.textContent = this.gameState.sweepRoutes.length;

                        // Enhanced solution is calculated on demand to save time
                    } catch (error) {
                        console.error("Error calculating sweep solution:", error);
                        this.dom.sweepDistance.textContent = "Error";
                        this.dom.sweepVehicles.textContent = "0";
                    }
                }, 50);
            } catch (error) {
                console.error("Error calculating savings solution:", error);
                this.dom.savingsDistance.textContent = "Error";
                this.dom.savingsVehicles.textContent = "0";
            }
        }, 50);
    }

    /**
     * Show loading indicator
     */
    showLoadingIndicator() {
        // Create loading indicator if it doesn't exist
        if (!this.loadingIndicator) {
            this.loadingIndicator = document.createElement('div');
            this.loadingIndicator.className = 'loading-indicator';
            this.loadingIndicator.textContent = 'Generating customers...';
            this.loadingIndicator.style.position = 'absolute';
            this.loadingIndicator.style.top = '50%';
            this.loadingIndicator.style.left = '50%';
            this.loadingIndicator.style.transform = 'translate(-50%, -50%)';
            this.loadingIndicator.style.padding = '1rem 2rem';
            this.loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            this.loadingIndicator.style.color = 'white';
            this.loadingIndicator.style.borderRadius = 'var(--border-radius)';
            this.loadingIndicator.style.zIndex = '100';
        }

        // Add to DOM
        const canvasContainer = this.dom.canvas.parentElement;
        canvasContainer.style.position = 'relative';
        canvasContainer.appendChild(this.loadingIndicator);

        // Disable buttons during loading
        this.dom.newGameButton.disabled = true;
        this.dom.savingsButton.disabled = true;
        this.dom.sweepButton.disabled = true;
        this.dom.enhancedButton.disabled = true;
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        if (this.loadingIndicator && this.loadingIndicator.parentElement) {
            this.loadingIndicator.parentElement.removeChild(this.loadingIndicator);
        }

        // Re-enable buttons
        this.dom.newGameButton.disabled = false;
        this.dom.savingsButton.disabled = false;
        this.dom.sweepButton.disabled = false;
        this.dom.enhancedButton.disabled = false;
    }

    /**
     * Handle difficulty selection change
     */
    handleDifficultyChange() {
        const selectedDifficulty = this.dom.difficultySelect.value;
        if (selectedDifficulty === 'custom') {
            this.dom.customSettingsContainer.style.display = 'flex';
            this.gameState.capacity = parseInt(this.dom.customCapacityInput.value);
            this.gameState.difficulty.custom = this.gameState.capacity;
        } else {
            this.dom.customSettingsContainer.style.display = 'none';
            this.gameState.capacity = this.gameState.difficulty[selectedDifficulty];
        }

        // Update capacity display
        this.dom.maxCapacity.textContent = this.gameState.capacity;
    }

    /**
     * Handle custom settings input change
     */
    handleCustomSettingsChange() {
        let capacity = parseInt(this.dom.customCapacityInput.value);
        let locations = parseInt(this.dom.customLocationsInput.value);

        // Validate capacity (between 10 and 500)
        capacity = Math.max(10, Math.min(500, capacity));
        this.dom.customCapacityInput.value = capacity;

        // Validate locations (between 5 and 100)
        const maxLocations = this.isMobile ? 30 : 50;
        locations = Math.max(5, Math.min(maxLocations, locations));
        this.dom.customLocationsInput.value = locations;

        // Update gameState
        this.gameState.capacity = capacity;
        this.gameState.difficulty.custom = capacity;

        // Update capacity display
        this.dom.maxCapacity.textContent = capacity;
    }

    /**
     * Handle location size slider change
     * @param {Event} e - Input event
     */
    handleLocationSizeChange(e) {
        // For mobile, enforce a minimum location size for better touch targets
        const minSize = this.isMobile ? 10 : 6;
        const newSize = Math.max(minSize, parseInt(e.target.value));
        this.gameState.updateLocationSize(newSize);
        this.dom.locationSizeValue.textContent = newSize;
        this.dom.locationSizeInput.value = newSize;
        if (this.gameState.gameStarted) {
            this.renderer.drawGame();
        }
    }

    /**
     * Handle window resize event
     */
    handleWindowResize() {
        // Check if mobile status has changed
        const wasMobile = this.isMobile;
        this.isMobile = this.detectMobile();

        // If mobile status changed, we need to update event listeners
        if (wasMobile !== this.isMobile) {
            this.removeEventListeners();
            this.setupEventListeners();
        }

        this.renderer.resizeCanvas();
    }
}

export default EventHandlers;