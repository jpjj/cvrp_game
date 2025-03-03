/**
 * Algorithms.js
 * Implementation of CVRP algorithms
 */

/**
 * Class containing CVRP algorithm implementations
 */
class CvrpAlgorithms {
    /**
     * Constructor takes a gameState reference to access location data
     * @param {GameState} gameState - Reference to the game state
     */
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Calculate Clarke-Wright Savings Algorithm solution
     * @returns {Array} Array of routes (each route is array of location IDs)
     */
    calculateSavingsSolution() {
        const depot = 0; // Depot ID is always 0
        const customers = this.gameState.customers.map(c => c.id);
        const capacity = this.gameState.capacity;

        // Initialize distance matrix
        const distances = {};
        for (const i of [depot, ...customers]) {
            distances[i] = {};
            for (const j of [depot, ...customers]) {
                if (i !== j) {
                    distances[i][j] = this.gameState.calculateLocationDistance(i, j);
                }
            }
        }

        // Step 1: Initialize one route per customer
        const routes = customers.map(cId => [depot, cId, depot]);

        // Calculate demands map for easy access
        const demands = {};
        for (const customer of this.gameState.customers) {
            demands[customer.id] = customer.demand;
        }

        // Calculate route loads
        const routeLoads = routes.map((route, index) =>
            route.filter(id => id !== depot)
                .reduce((sum, id) => sum + demands[id], 0)
        );

        // Step 2: Calculate savings for all possible route merges
        const savings = [];
        for (let i = 0; i < routes.length; i++) {
            const routeI = routes[i];
            for (let j = i + 1; j < routes.length; j++) {
                const routeJ = routes[j];

                // Calculate savings: d(0,i) + d(0,j) - d(i,j)
                // Where i is the last customer in route I and j is the first customer in route J
                const customerI = routeI[routeI.length - 2]; // Last customer before depot
                const customerJ = routeJ[1]; // First customer after depot

                const savingValue =
                    distances[depot][customerI] +
                    distances[depot][customerJ] -
                    distances[customerI][customerJ];

                savings.push({
                    routeI: i,
                    routeJ: j,
                    customerI,
                    customerJ,
                    saving: savingValue
                });
            }
        }

        // Sort savings in descending order
        savings.sort((a, b) => b.saving - a.saving);

        // Step 3: Merge routes based on savings
        const mergedRoutes = new Set(); // Keep track of merged routes

        for (const saving of savings) {
            // Skip if either route has already been merged
            if (mergedRoutes.has(saving.routeI) || mergedRoutes.has(saving.routeJ)) {
                continue;
            }

            const routeI = routes[saving.routeI];
            const routeJ = routes[saving.routeJ];

            // Check if merge would exceed capacity
            const mergedLoad = routeLoads[saving.routeI] + routeLoads[saving.routeJ];
            if (mergedLoad > capacity) {
                continue;
            }

            // Merge routes: remove depot from the end of route I and from the start of route J
            const mergedRoute = [...routeI.slice(0, -1), ...routeJ.slice(1)];

            // Update route I with merged route
            routes[saving.routeI] = mergedRoute;
            routeLoads[saving.routeI] = mergedLoad;

            // Mark route J as merged
            mergedRoutes.add(saving.routeJ);
        }

        // Remove merged routes
        const finalRoutes = routes.filter((_, index) => !mergedRoutes.has(index));

        // Store the solution in gameState
        this.gameState.savingsRoutes = finalRoutes;

        return finalRoutes;
    }

    /**
     * Calculate Sweep Algorithm solution
     * @returns {Array} Array of routes (each route is array of location IDs)
     */
    calculateSweepSolution() {
        const depot = this.gameState.depot;
        const customers = [...this.gameState.customers];
        const capacity = this.gameState.capacity;

        // Calculate the angle of each customer relative to depot
        for (const customer of customers) {
            const dx = customer.x - depot.x;
            const dy = customer.y - depot.y;
            customer.angle = Math.atan2(dy, dx);
        }

        // Sort customers by angle (sweep around depot)
        customers.sort((a, b) => a.angle - b.angle);

        // Group customers into routes based on capacity
        const routes = [];
        let currentRoute = [0]; // Start at depot
        let currentLoad = 0;

        for (const customer of customers) {
            // If adding this customer would exceed capacity, close the route and start a new one
            if (currentLoad + customer.demand > capacity) {
                currentRoute.push(0); // Return to depot
                routes.push([...currentRoute]);
                currentRoute = [0]; // Start new route
                currentLoad = 0;
            }

            // Add the customer to the current route
            currentRoute.push(customer.id);
            currentLoad += customer.demand;
        }

        // Close the last route if it has any customers
        if (currentRoute.length > 1) {
            currentRoute.push(0); // Return to depot
            routes.push(currentRoute);
        }

        // Step 2: Optimize each route individually using 2-opt
        const optimizedRoutes = routes.map(route => this.optimizeRouteWith2Opt(route));

        // Store the solution in gameState
        this.gameState.sweepRoutes = optimizedRoutes;

        return optimizedRoutes;
    }

    /**
     * Optimize a route using 2-opt algorithm
     * @param {Array} route - Array of location IDs
     * @returns {Array} Optimized route
     */
    optimizeRouteWith2Opt(route) {
        // Only optimize routes with at least 4 nodes (depot + 2 customers + depot)
        if (route.length < 4) return route;

        const newRoute = [...route];
        let improvement = true;
        let iterations = 0;
        const maxIterations = 100; // Limit iterations to prevent infinite loop

        while (improvement && iterations < maxIterations) {
            improvement = false;
            iterations++;

            // Try all possible 2-opt swaps
            for (let i = 1; i < newRoute.length - 2; i++) {
                for (let j = i + 1; j < newRoute.length - 1; j++) {
                    // Calculate current distance
                    const d1 = this.gameState.calculateLocationDistance(newRoute[i - 1], newRoute[i]) +
                        this.gameState.calculateLocationDistance(newRoute[j], newRoute[j + 1]);

                    // Calculate distance if segments are swapped
                    const d2 = this.gameState.calculateLocationDistance(newRoute[i - 1], newRoute[j]) +
                        this.gameState.calculateLocationDistance(newRoute[i], newRoute[j + 1]);

                    // If swap improves the distance, perform it
                    if (d2 < d1) {
                        // Reverse the segment between i and j
                        const reversed = newRoute.slice(i, j + 1).reverse();
                        newRoute.splice(i, j - i + 1, ...reversed);
                        improvement = true;
                        break;
                    }
                }
                if (improvement) break;
            }
        }

        return newRoute;
    }

    /**
     * Calculate an enhanced solution using multiple techniques
     * @returns {Array} Array of routes (each route is array of location IDs)
     */
    calculateEnhancedSolution() {
        // First get the savings solution if not already calculated
        if (this.gameState.savingsRoutes.length === 0) {
            this.calculateSavingsSolution();
        }

        // Start with the savings solution
        let routes = this.gameState.savingsRoutes.map(route => [...route]);

        // Apply a series of enhancements:

        // 1. Try to balance routes by moving customers between routes
        routes = this.balanceRoutes(routes);

        // 2. Apply 2-opt to each route
        routes = routes.map(route => this.optimizeRouteWith2Opt(route));

        // 3. Try route-swap optimization
        routes = this.routeSwapOptimization(routes);

        // Store the enhanced solution
        this.gameState.enhancedRoutes = routes;

        return routes;
    }

    /**
     * Balance routes by moving customers between routes
     * @param {Array} routes - Array of route arrays
     * @returns {Array} Balanced routes
     */
    balanceRoutes(routes) {
        // Skip if there's only one route
        if (routes.length <= 1) return routes;

        const newRoutes = routes.map(route => [...route]);
        const capacity = this.gameState.capacity;

        // Calculate demands map for easy access
        const demands = {};
        for (const customer of this.gameState.customers) {
            demands[customer.id] = customer.demand;
        }

        // Calculate initial route loads
        const routeLoads = newRoutes.map(route =>
            route.filter(id => id !== 0)
                .reduce((sum, id) => sum + demands[id], 0)
        );

        let improvement = true;
        let iterations = 0;
        const maxIterations = 50;

        while (improvement && iterations < maxIterations) {
            improvement = false;
            iterations++;

            // Try to move customers from most loaded to least loaded routes
            const routeIndices = Array.from({ length: newRoutes.length }, (_, i) => i)
                .sort((a, b) => routeLoads[b] - routeLoads[a]);

            for (let i = 0; i < routeIndices.length - 1; i++) {
                const sourceIdx = routeIndices[i];
                const targetIdx = routeIndices[routeIndices.length - 1 - i];

                // Skip if loads are already balanced
                if (routeLoads[sourceIdx] <= routeLoads[targetIdx]) continue;

                const sourceRoute = newRoutes[sourceIdx];
                const targetRoute = newRoutes[targetIdx];

                // Try to move each customer from source to target
                for (let j = 1; j < sourceRoute.length - 1; j++) {
                    const customerId = sourceRoute[j];
                    const customerDemand = demands[customerId];

                    // Check if moving would exceed capacity of target route
                    if (routeLoads[targetIdx] + customerDemand > capacity) {
                        continue;
                    }

                    // Try inserting customer at each position in target route
                    for (let k = 1; k < targetRoute.length; k++) {
                        // Calculate current cost
                        const currentCost =
                            this.gameState.calculateLocationDistance(sourceRoute[j - 1], customerId) +
                            this.gameState.calculateLocationDistance(customerId, sourceRoute[j + 1]) +
                            this.gameState.calculateLocationDistance(targetRoute[k - 1], targetRoute[k]);

                        // Calculate cost after move
                        const newCost =
                            this.gameState.calculateLocationDistance(sourceRoute[j - 1], sourceRoute[j + 1]) +
                            this.gameState.calculateLocationDistance(targetRoute[k - 1], customerId) +
                            this.gameState.calculateLocationDistance(customerId, targetRoute[k]);

                        // If move improves cost, perform it
                        if (newCost < currentCost) {
                            // Remove from source route
                            sourceRoute.splice(j, 1);

                            // Insert into target route
                            targetRoute.splice(k, 0, customerId);

                            // Update loads
                            routeLoads[sourceIdx] -= customerDemand;
                            routeLoads[targetIdx] += customerDemand;

                            improvement = true;
                            break;
                        }
                    }

                    if (improvement) break;
                }

                if (improvement) break;
            }
        }

        return newRoutes;
    }

    /**
     * Swap customers between routes if it improves total distance
     * @param {Array} routes - Array of route arrays
     * @returns {Array} Optimized routes
     */
    routeSwapOptimization(routes) {
        // Skip if there's only one route
        if (routes.length <= 1) return routes;

        const newRoutes = routes.map(route => [...route]);
        const capacity = this.gameState.capacity;

        // Calculate demands map for easy access
        const demands = {};
        for (const customer of this.gameState.customers) {
            demands[customer.id] = customer.demand;
        }

        // Calculate initial route loads
        const routeLoads = newRoutes.map(route =>
            route.filter(id => id !== 0)
                .reduce((sum, id) => sum + demands[id], 0)
        );

        let improvement = true;
        let iterations = 0;
        const maxIterations = 50;

        while (improvement && iterations < maxIterations) {
            improvement = false;
            iterations++;

            // Try swapping customers between each pair of routes
            for (let i = 0; i < newRoutes.length - 1; i++) {
                for (let j = i + 1; j < newRoutes.length; j++) {
                    // Try swapping each customer from route i with each from route j
                    for (let ci = 1; ci < newRoutes[i].length - 1; ci++) {
                        for (let cj = 1; cj < newRoutes[j].length - 1; cj++) {
                            const customerId1 = newRoutes[i][ci];
                            const customerId2 = newRoutes[j][cj];

                            // Check if swap would exceed capacities
                            const newLoad1 = routeLoads[i] - demands[customerId1] + demands[customerId2];
                            const newLoad2 = routeLoads[j] - demands[customerId2] + demands[customerId1];

                            if (newLoad1 > capacity || newLoad2 > capacity) {
                                continue;
                            }

                            // Calculate cost before swap
                            const costBefore =
                                this.gameState.calculateLocationDistance(newRoutes[i][ci - 1], customerId1) +
                                this.gameState.calculateLocationDistance(customerId1, newRoutes[i][ci + 1]) +
                                this.gameState.calculateLocationDistance(newRoutes[j][cj - 1], customerId2) +
                                this.gameState.calculateLocationDistance(customerId2, newRoutes[j][cj + 1]);

                            // Calculate cost after swap
                            const costAfter =
                                this.gameState.calculateLocationDistance(newRoutes[i][ci - 1], customerId2) +
                                this.gameState.calculateLocationDistance(customerId2, newRoutes[i][ci + 1]) +
                                this.gameState.calculateLocationDistance(newRoutes[j][cj - 1], customerId1) +
                                this.gameState.calculateLocationDistance(customerId1, newRoutes[j][cj + 1]);

                            // If swap improves cost, perform it
                            if (costAfter < costBefore) {
                                // Swap customers
                                newRoutes[i][ci] = customerId2;
                                newRoutes[j][cj] = customerId1;

                                // Update loads
                                routeLoads[i] = newLoad1;
                                routeLoads[j] = newLoad2;

                                improvement = true;
                                break;
                            }
                        }
                        if (improvement) break;
                    }
                    if (improvement) break;
                }
                if (improvement) break;
            }
        }

        return newRoutes;
    }

    /**
     * Apply the savings algorithm solution to the game state
     */
    applySavingsSolution() {
        if (this.gameState.savingsRoutes.length === 0) {
            this.calculateSavingsSolution();
        }

        // Reset game state
        this.gameState.routes = this.gameState.savingsRoutes.map(route => [...route]);
        this.gameState.currentRouteIndex = this.gameState.routes.length - 1;
        this.gameState.currentRoute = this.gameState.routes[this.gameState.currentRouteIndex];

        // Start a new empty route
        this.gameState.startNewRoute();

        // Update best solution if this is better
        const totalDistance = this.gameState.calculateTotalDistance(this.gameState.savingsRoutes);
        if (totalDistance < this.gameState.bestTotalDistance) {
            this.gameState.bestTotalDistance = totalDistance;
            this.gameState.bestRoutes = this.gameState.savingsRoutes.map(route => [...route]);
        }

        return {
            totalDistance: totalDistance,
            routesCount: this.gameState.savingsRoutes.length
        };
    }

    /**
     * Apply the sweep algorithm solution to the game state
     */
    applySweepSolution() {
        if (this.gameState.sweepRoutes.length === 0) {
            this.calculateSweepSolution();
        }

        // Reset game state
        this.gameState.routes = this.gameState.sweepRoutes.map(route => [...route]);
        this.gameState.currentRouteIndex = this.gameState.routes.length - 1;
        this.gameState.currentRoute = this.gameState.routes[this.gameState.currentRouteIndex];

        // Start a new empty route
        this.gameState.startNewRoute();

        // Update best solution if this is better
        const totalDistance = this.gameState.calculateTotalDistance(this.gameState.sweepRoutes);
        if (totalDistance < this.gameState.bestTotalDistance) {
            this.gameState.bestTotalDistance = totalDistance;
            this.gameState.bestRoutes = this.gameState.sweepRoutes.map(route => [...route]);
        }

        return {
            totalDistance: totalDistance,
            routesCount: this.gameState.sweepRoutes.length
        };
    }

    /**
     * Apply the enhanced solution to the game state
     */
    applyEnhancedSolution() {
        if (this.gameState.enhancedRoutes.length === 0) {
            this.calculateEnhancedSolution();
        }

        // Reset game state
        this.gameState.routes = this.gameState.enhancedRoutes.map(route => [...route]);
        this.gameState.currentRouteIndex = this.gameState.routes.length - 1;
        this.gameState.currentRoute = this.gameState.routes[this.gameState.currentRouteIndex];

        // Start a new empty route
        this.gameState.startNewRoute();

        // Update best solution if this is better
        const totalDistance = this.gameState.calculateTotalDistance(this.gameState.enhancedRoutes);
        if (totalDistance < this.gameState.bestTotalDistance) {
            this.gameState.bestTotalDistance = totalDistance;
            this.gameState.bestRoutes = this.gameState.enhancedRoutes.map(route => [...route]);
        }

        return {
            totalDistance: totalDistance,
            routesCount: this.gameState.enhancedRoutes.length
        };
    }
}

export default CvrpAlgorithms;