/**
 * GameState.js
 * Manages the state of the CVRP game with mobile improvements
 */

/**
 * Game state object and methods for CVRP game
 */
class GameState {
    /**
 * Initialize the game state
 */
    constructor() {
        // Locations (customers + depot)
        this.depot = { x: 0, y: 0, id: 0 }; // Depot is always ID 0
        this.customers = []; // Customer locations with demand values

        // Routes information
        this.routes = []; // Array of route arrays
        this.currentRoute = []; // Current route being built
        this.currentRouteIndex = 0; // Index of the current route
        this.bestRoutes = []; // Best solution found
        this.bestTotalDistance = Infinity;

        // Algorithm solutions
        this.savingsRoutes = []; // Clarke-Wright savings algorithm routes
        this.sweepRoutes = []; // Sweep algorithm routes
        this.enhancedRoutes = []; // Enhanced solution routes

        // Capacity information
        this.capacity = 25; // Default capacity for beginner level
        this.currentLoad = 0; // Current vehicle load

        // Visualization
        this.locationSize = 15; // Set to maximum size (15 instead of default 10)
        this.touchRadius = 30; // Larger click/touch detection radius for mobile
        this.isMobile = this.detectMobile();
        this.gameStarted = false;

        // Difficulty settings
        this.difficulty = {
            beginner: 25,
            medium: 50,
            hard: 100,
            expert: 200,
            custom: 50
        };

        // Route colors
        this.routeColors = [
            '#3498db', '#e67e22', '#9b59b6', '#27ae60', '#f1c40f',
            '#e74c3c', '#1abc9c', '#34495e', '#d35400', '#8e44ad'
        ];

        // Vehicle cost - used in scoring
        this.vehicleCost = 100; // Base cost per vehicle used

        // No need to adjust location size for mobile as we're using max size for all
        // (Original conditional adjustment removed)
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
     * Reset the game state for a new game
     * @param {string} difficultyLevel - The selected difficulty level
     * @param {number} customCapacity - Custom capacity (if applicable)
     * @param {number} customLocations - Custom number of customer locations
     * @param {number} canvasWidth - Canvas width for location placement
     * @param {number} canvasHeight - Canvas height for location placement
     */
    resetGame(difficultyLevel, customCapacity, customLocations, canvasWidth, canvasHeight) {
        this.gameStarted = false;
        this.depot = { x: 0, y: 0, id: 0 };
        this.customers = [];
        this.routes = [];
        this.currentRoute = [];
        this.currentRouteIndex = 0;
        this.currentLoad = 0;
        this.bestRoutes = [];
        this.bestTotalDistance = Infinity;
        this.savingsRoutes = [];
        this.sweepRoutes = [];
        this.enhancedRoutes = [];

        // Set capacity based on difficulty
        if (difficultyLevel === 'custom') {
            this.capacity = customCapacity;
            this.difficulty.custom = customCapacity;
        } else {
            this.capacity = this.difficulty[difficultyLevel];
        }

        // Determine number of customer locations
        let numCustomers;
        if (difficultyLevel === 'custom') {
            numCustomers = customLocations;
        } else {
            // Default number of customers based on difficulty
            switch (difficultyLevel) {
                case 'beginner':
                    numCustomers = 10;
                    break;
                case 'medium':
                    numCustomers = 15;
                    break;
                case 'hard':
                    numCustomers = 20;
                    break;
                case 'expert':
                    numCustomers = 30;
                    break;
                default:
                    numCustomers = 15;
            }
        }

        // Generate the depot and customer locations
        this.generateLocations(numCustomers, canvasWidth, canvasHeight);

        // Initialize with empty first route
        this.routes.push([0]); // Start at depot
        this.currentRoute = this.routes[0];

        this.gameStarted = true;
        return { numCustomers, capacity: this.capacity };
    }

    /**
     * Generate depot and customer locations
     * @param {number} numCustomers - Number of customers to generate
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height 
     */
    generateLocations(numCustomers, canvasWidth, canvasHeight) {
        // Calculate minimum distance between locations
        const minimumDistance = this.isMobile ? this.locationSize * 2.5 : this.locationSize * 3;
        const maxRetries = 50;

        // Place depot in the center
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        this.depot = { x: centerX, y: centerY, id: 0, demand: 0 };

        // Generate customer locations with demand values
        for (let i = 0; i < numCustomers; i++) {
            const margin = Math.max(30, this.locationSize * 2);
            let retryCount = 0;
            let validPositionFound = false;

            while (!validPositionFound && retryCount < maxRetries) {
                retryCount++;

                // Generate a random position
                const x = Math.random() * (canvasWidth - 2 * margin) + margin;
                const y = Math.random() * (canvasHeight - 2 * margin) + margin;

                // Ensure locations aren't too close to depot or other customers
                let tooClose = false;

                // Check distance to depot
                const distToDepot = this.calculateDistance(x, y, this.depot.x, this.depot.y);
                if (distToDepot < minimumDistance) {
                    tooClose = true;
                    continue;
                }

                // When we have many customers, only check against nearby customers
                const locationsToCheck = this.customers.length > 15 ?
                    this.getNearestCustomers(x, y, 15) : this.customers;

                for (const customer of locationsToCheck) {
                    const distance = this.calculateDistance(x, y, customer.x, customer.y);
                    if (distance < minimumDistance) {
                        tooClose = true;
                        break;
                    }
                }

                if (!tooClose) {
                    // Generate demand value based on capacity
                    // Mean demand is sqrt of capacity
                    const meanDemand = Math.sqrt(this.capacity);

                    // Truncated normal distribution between 1 and 2*meanDemand
                    let demand;
                    do {
                        // Box-Muller transform for normal distribution
                        const u1 = Math.random();
                        const u2 = Math.random();
                        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

                        // Normal distribution with mean = meanDemand and stddev = meanDemand/3
                        demand = Math.round(meanDemand + (meanDemand / 3) * z);
                    } while (demand < 1 || demand > 2 * meanDemand);

                    // Cap demand to ensure it doesn't exceed capacity
                    demand = Math.min(demand, this.capacity);

                    this.customers.push({ x, y, id: i + 1, demand: demand });
                    validPositionFound = true;
                }
            }

            // If we couldn't find a valid position after maxRetries,
            // place the customer anyway with less strict distance requirements
            if (!validPositionFound) {
                const x = Math.random() * (canvasWidth - 2 * margin) + margin;
                const y = Math.random() * (canvasHeight - 2 * margin) + margin;

                // Generate demand value
                const meanDemand = Math.sqrt(this.capacity);
                const demand = Math.max(1, Math.min(Math.round(meanDemand * (0.5 + Math.random())), 2 * meanDemand));

                this.customers.push({ x, y, id: i + 1, demand: demand });
            }
        }
    }

    /**
     * Get the nearest customers to a point for collision checking
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} count - Number of customers to return
     * @returns {Array} Array of nearest customers
     */
    getNearestCustomers(x, y, count) {
        if (this.customers.length <= count) return this.customers;

        // Calculate distances to all customers
        const withDistances = this.customers.map(customer => ({
            customer: customer,
            distance: this.calculateDistance(x, y, customer.x, customer.y)
        }));

        // Sort by distance and take the closest 'count' customers
        withDistances.sort((a, b) => a.distance - b.distance);

        return withDistances.slice(0, count).map(item => item.customer);
    }

    /**
     * Start a new route from the depot
     */
    startNewRoute() {
        this.currentRouteIndex = this.routes.length;
        this.routes.push([0]); // Start at depot
        this.currentRoute = this.routes[this.currentRouteIndex];
        this.currentLoad = 0;
    }

    /**
     * Add a location to the current route
     * @param {number} locationId - The ID of the location to add
     * @returns {Object} Result with action, updated route info, and capacity status
     */
    addLocationToRoute(locationId) {
        // Check if this is the depot
        if (locationId === 0) {
            // Return to depot - complete the route
            this.currentRoute.push(0);

            // Check if all customers are served
            const allServed = this.areAllCustomersServed();

            if (allServed) {
                // Calculate total distance for all routes
                const totalDistance = this.calculateTotalDistance(this.routes);

                // Check if this is the best solution
                let newBest = false;
                if (totalDistance < this.bestTotalDistance) {
                    this.bestTotalDistance = totalDistance;
                    this.bestRoutes = this.routes.map(route => [...route]);
                    newBest = true;
                }

                return {
                    action: 'complete-all-routes',
                    totalDistance: totalDistance,
                    routesCount: this.routes.length,
                    newBest: newBest
                };
            } else {
                // Start a new route
                this.startNewRoute();

                return {
                    action: 'complete-route',
                    routeIndex: this.currentRouteIndex - 1,
                    routeDistance: this.calculateRouteDistance(this.routes[this.currentRouteIndex - 1]),
                    newRouteIndex: this.currentRouteIndex
                };
            }
        }

        // It's a customer - find the customer object
        const customer = this.customers.find(c => c.id === locationId);
        if (!customer) return null;

        // Check if customer is already served in any route
        for (const route of this.routes) {
            if (route.includes(locationId)) {
                return {
                    action: 'already-served'
                };
            }
        }

        // Check if adding this customer exceeds capacity
        if (this.currentLoad + customer.demand > this.capacity) {
            return {
                action: 'capacity-exceeded',
                currentLoad: this.currentLoad,
                demandValue: customer.demand,
                capacity: this.capacity
            };
        }

        // Add customer to route and update load
        this.currentRoute.push(locationId);
        this.currentLoad += customer.demand;

        return {
            action: 'add-customer',
            routeIndex: this.currentRouteIndex,
            locationId: locationId,
            currentLoad: this.currentLoad,
            capacity: this.capacity,
            percentFull: (this.currentLoad / this.capacity) * 100
        };
    }

    /**
  * Add a location to the current route
  * @param {number} locationId - The ID of the location to add
  * @returns {Object} Result with action, updated route info, and capacity status
  */
    addLocationToRoute(locationId) {
        // Check if this is the depot
        if (locationId === 0) {
            // If current route is empty (just depot), do nothing
            if (this.currentRoute.length <= 1) {
                return {
                    action: 'empty-route'
                };
            }

            // Return to depot - complete the route
            this.currentRoute.push(0);

            // Check if all customers are served
            const allServed = this.areAllCustomersServed();

            if (allServed) {
                // Calculate total distance for all routes
                const totalDistance = this.calculateTotalDistance(this.routes);

                // Check if this is the best solution
                let newBest = false;
                if (totalDistance < this.bestTotalDistance) {
                    this.bestTotalDistance = totalDistance;
                    this.bestRoutes = this.routes.map(route => [...route]);
                    newBest = true;
                }

                return {
                    action: 'complete-all-routes',
                    totalDistance: totalDistance,
                    routesCount: this.routes.length,
                    newBest: newBest
                };
            } else {
                // Start a new route
                this.startNewRoute();

                return {
                    action: 'complete-route',
                    routeIndex: this.currentRouteIndex - 1,
                    routeDistance: this.calculateRouteDistance(this.routes[this.currentRouteIndex - 1]),
                    newRouteIndex: this.currentRouteIndex
                };
            }
        }

        // It's a customer - find the customer object
        const customer = this.customers.find(c => c.id === locationId);
        if (!customer) return null;

        // Check if customer is already served in any route
        for (const route of this.routes) {
            if (route.includes(locationId)) {
                return {
                    action: 'already-served'
                };
            }
        }

        // Check if current route is empty and start new route if needed
        if (this.currentRoute.length <= 1 && this.currentRoute[0] === 0) {
            // Current route is empty, we'll add the customer to it
        } else {
            // Check if adding this customer exceeds capacity
            if (this.currentLoad + customer.demand > this.capacity) {
                return {
                    action: 'capacity-exceeded',
                    currentLoad: this.currentLoad,
                    demandValue: customer.demand,
                    capacity: this.capacity
                };
            }
        }

        // Add customer to route and update load
        this.currentRoute.push(locationId);
        this.currentLoad += customer.demand;

        return {
            action: 'add-customer',
            routeIndex: this.currentRouteIndex,
            locationId: locationId,
            currentLoad: this.currentLoad,
            capacity: this.capacity,
            percentFull: (this.currentLoad / this.capacity) * 100
        };
    }

    /**
     * Check if a location was clicked and handle the interaction
     * @param {number} x - X coordinate of click
     * @param {number} y - Y coordinate of click
     * @returns {Object|null} Result of the click action or null if no location clicked
     */
    handleLocationClick(x, y) {
        // Find if a location was clicked - use a larger touch radius on mobile
        const hitRadius = this.isMobile ? this.touchRadius : this.locationSize + 5;

        // Check if clicking on unserved customer and we need to create a new route
        let clickedCustomerId = null;
        let isCustomerServed = false;

        // First, let's check if we're clicking on a customer
        for (const customer of this.customers) {
            const distance = this.calculateDistance(x, y, customer.x, customer.y);
            if (distance < hitRadius) {
                clickedCustomerId = customer.id;

                // Check if this customer is already served
                for (const route of this.routes) {
                    if (route.includes(clickedCustomerId)) {
                        isCustomerServed = true;
                        break;
                    }
                }
                break;
            }
        }

        // If clicking on an unserved customer and we don't have an active route
        if (clickedCustomerId !== null && !isCustomerServed &&
            this.currentRoute.length === 1 &&
            this.routes.length > 0 &&
            this.routes[this.routes.length - 1].length > 1) {
            // The last route is complete (has more than just depot)
            // and current route is empty (just has depot)
            // So we're starting a new route with this customer
            return this.addLocationToRoute(clickedCustomerId);
        }

        // Check the depot
        const depotDist = this.calculateDistance(x, y, this.depot.x, this.depot.y);
        if (depotDist < hitRadius) {
            return this.addLocationToRoute(0);
        }

        // Find the closest customer within the hit radius
        let closestCustomer = null;
        let minDistance = hitRadius;

        for (const customer of this.customers) {
            const distance = this.calculateDistance(x, y, customer.x, customer.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestCustomer = customer;
            }
        }

        // If we found a customer within the hit radius
        if (closestCustomer) {
            return this.addLocationToRoute(closestCustomer.id);
        }

        return null; // No location clicked
    }

    /**
     * Check if all customers have been served
     * @returns {boolean} True if all customers are in at least one route
     */
    areAllCustomersServed() {
        // Flatten all routes into a single array of visited location IDs
        const visitedIds = new Set();
        for (const route of this.routes) {
            for (const id of route) {
                if (id !== 0) { // Ignore depot
                    visitedIds.add(id);
                }
            }
        }

        // Check if every customer ID is in the visited set
        return this.customers.every(customer => visitedIds.has(customer.id));
    }

    /**
     * Count the number of customers served
     * @returns {number} Number of unique customers served across all routes
     */
    countServedCustomers() {
        const served = new Set();
        for (const route of this.routes) {
            for (const id of route) {
                if (id !== 0) { // Ignore depot
                    served.add(id);
                }
            }
        }
        return served.size;
    }

    /**
     * Remove the last location from the current route
     * @returns {Object} Object containing updated route info and capacity status
     */
    undoLastLocation() {
        // Can't undo if at depot with empty route
        if (this.currentRoute.length <= 1) {
            return {
                action: 'no-undo',
                isEmpty: true
            };
        }

        // Remove the last location
        const removedId = this.currentRoute.pop();

        // If it was a customer, decrease the load
        if (removedId !== 0) {
            const customer = this.customers.find(c => c.id === removedId);
            if (customer) {
                this.currentLoad -= customer.demand;
            }
        }
        // If we removed the depot and route is now empty, then we're undoing a route completion
        else if (this.currentRoute.length === 1 && this.currentRoute[0] === 0 && this.routes.length > 1) {
            // We're undoing a route completion - revert to previous route
            this.routes.pop();
            this.currentRouteIndex = this.routes.length - 1;
            this.currentRoute = this.routes[this.currentRouteIndex];

            // Recalculate current load from customers in route
            this.recalculateCurrentLoad();
        }

        return {
            action: 'undo-location',
            routeIndex: this.currentRouteIndex,
            currentLoad: this.currentLoad,
            capacity: this.capacity,
            percentFull: (this.currentLoad / this.capacity) * 100,
            isEmpty: this.currentRoute.length <= 1
        };
    }

    /**
     * Recalculate the current load based on customers in current route
     */
    recalculateCurrentLoad() {
        this.currentLoad = 0;
        for (const locId of this.currentRoute) {
            if (locId !== 0) { // Skip depot
                const customer = this.customers.find(c => c.id === locId);
                if (customer) {
                    this.currentLoad += customer.demand;
                }
            }
        }
    }

    /**
     * Reset the current route
     * @returns {Object} Result with reset status
     */
    resetCurrentRoute() {
        // Keep only the depot
        this.currentRoute.length = 1;
        this.currentLoad = 0;

        return {
            action: 'reset-route',
            routeIndex: this.currentRouteIndex,
            currentLoad: 0,
            capacity: this.capacity,
            percentFull: 0
        };
    }

    /**
     * Clear all routes
     */
    clearAllRoutes() {
        this.routes = [[0]]; // Just the depot
        this.currentRouteIndex = 0;
        this.currentRoute = this.routes[0];
        this.currentLoad = 0;

        return {
            action: 'clear-all',
            totalDistance: 0
        };
    }

    /**
     * Return to depot to complete the current route
     */
    completeCurrentRoute() {
        // Only allow completion if route has at least one customer
        if (this.currentRoute.length > 1) {
            // Add depot to end if not already there
            if (this.currentRoute[this.currentRoute.length - 1] !== 0) {
                this.currentRoute.push(0);
            }

            // Calculate route distance
            const routeDistance = this.calculateRouteDistance(this.currentRoute);

            // Start a new route
            this.startNewRoute();

            return {
                action: 'complete-route',
                routeIndex: this.currentRouteIndex - 1,
                routeDistance: routeDistance,
                newRouteIndex: this.currentRouteIndex
            };
        }

        return {
            action: 'no-customers'
        };
    }

    /**
     * Get customer by ID
     * @param {number} id - Customer ID
     * @returns {Object|null} Customer object or null if not found
     */
    getCustomerById(id) {
        if (id === 0) return this.depot;
        return this.customers.find(c => c.id === id) || null;
    }

    /**
     * Calculate distance between two points
     * @param {number} x1 - X coordinate of first point
     * @param {number} y1 - Y coordinate of first point
     * @param {number} x2 - X coordinate of second point
     * @param {number} y2 - Y coordinate of second point
     * @returns {number} Distance between points
     */
    calculateDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate distance between two locations
     * @param {number} id1 - ID of first location
     * @param {number} id2 - ID of second location
     * @returns {number} Distance between locations
     */
    calculateLocationDistance(id1, id2) {
        const loc1 = id1 === 0 ? this.depot : this.customers.find(c => c.id === id1);
        const loc2 = id2 === 0 ? this.depot : this.customers.find(c => c.id === id2);

        if (!loc1 || !loc2) return Infinity;

        return this.calculateDistance(loc1.x, loc1.y, loc2.x, loc2.y);
    }

    /**
     * Calculate total distance for a single route
     * @param {Array} route - Array of location IDs representing the route
     * @returns {number} Total route distance
     */
    calculateRouteDistance(route) {
        if (!route || route.length <= 1) return 0;

        let distance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            distance += this.calculateLocationDistance(route[i], route[i + 1]);
        }

        return distance;
    }

    /**
     * Calculate total distance for all routes
     * @param {Array} routes - Array of route arrays
     * @returns {number} Total distance across all routes
     */
    calculateTotalDistance(routes) {
        let totalDistance = 0;
        for (const route of routes) {
            totalDistance += this.calculateRouteDistance(route);
        }
        return totalDistance;
    }

    /**
     * Calculate total score (distance + vehicle cost)
     * @param {Array} routes - Array of route arrays
     * @returns {number} Total score
     */
    calculateTotalScore(routes) {
        // Count only routes that actually visit customers
        const activeRoutes = routes.filter(route => route.length > 2); // More than just depot-depot
        const distance = this.calculateTotalDistance(routes);
        const vehicleCost = activeRoutes.length * this.vehicleCost;

        return distance + vehicleCost;
    }

    /**
     * Updates the location size
     * @param {number} size - New location size
     */
    updateLocationSize(size) {
        // Enforce minimum size for mobile
        if (this.isMobile) {
            this.locationSize = Math.max(8, size);
        } else {
            this.locationSize = size;
        }

        // Update touch radius based on location size
        this.touchRadius = Math.max(this.locationSize * 2, 20);
    }

    /**
     * Get route color by index
     * @param {number} index - Route index
     * @returns {string} Color hex code
     */
    getRouteColor(index) {
        return this.routeColors[index % this.routeColors.length];
    }
}

// Export the GameState class
export default GameState;