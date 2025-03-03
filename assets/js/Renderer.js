/**
 * Enhanced Renderer.js with mobile support
 * Handles rendering the CVRP game on the canvas
 */

class Renderer {
    /**
     * Initialize the renderer
     * @param {HTMLCanvasElement} canvas - The canvas element to draw on
     * @param {GameState} gameState - Reference to the game state
     */
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = gameState;
        this.canvasRatio = 0.6; // Height to width ratio

        // Use a consistent touch radius based on fixed location size
        this.touchRadius = Math.max(gameState.locationSize * 2, 30);
        this.isMobile = this.detectMobile();

        // For touch devices, handle both touch and click events
        if (this.isMobile) {
            this.setupTouchHandling();
        }
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
 * Set up improved touch handling for mobile devices
 */
    setupTouchHandling() {
        // Always use a fixed touch radius based on the constant location size
        this.touchRadius = Math.max(this.gameState.locationSize * 2, 30);
    }

    /**
     * Resize the canvas to fit the container
     */
    resizeCanvas() {
        const container = document.querySelector('.game-container');
        if (!container) return;

        // Get container width accounting for padding
        const containerStyle = window.getComputedStyle(container);
        const paddingLeft = parseFloat(containerStyle.paddingLeft);
        const paddingRight = parseFloat(containerStyle.paddingRight);
        const containerWidth = container.clientWidth - paddingLeft - paddingRight;

        // Mobile-first approach - always make canvas full width of container
        this.canvas.width = containerWidth;

        // Maintain aspect ratio
        this.canvas.height = containerWidth * this.canvasRatio;

        // No need to adjust location size as it's now fixed

        // When resizing, redraw the game
        if (this.gameState.gameStarted) {
            this.drawGame();
        }

        // For debugging
        console.log(`Canvas resized: ${this.canvas.width}x${this.canvas.height}, Mobile: ${this.isMobile}`);
    }

    /**
     * Draw the game state on the canvas
     */
    drawGame() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // CHANGED ORDER: First draw all routes, then draw all locations on top

        // Draw all completed routes
        this.drawAllRoutes();

        // Draw current route being built
        this.drawCurrentRoute();

        // Draw all locations (depot and customers) on top of the routes
        this.drawLocations();
    }

    /**
     * Draw all completed routes
     */
    drawAllRoutes() {
        for (let i = 0; i < this.gameState.routes.length; i++) {
            // Skip current route as it will be drawn separately
            if (i === this.gameState.currentRouteIndex) continue;

            const route = this.gameState.routes[i];
            if (route.length > 1) {
                this.drawRoute(route, i);
            }
        }
    }

    /**
     * Draw a specific route
     * @param {Array} route - Array of location IDs
     * @param {number} routeIndex - Index of the route
     */
    drawRoute(route, routeIndex) {
        // Use a different color for each route
        const routeColor = this.gameState.getRouteColor(routeIndex);
        this.ctx.strokeStyle = routeColor;
        this.ctx.lineWidth = this.isMobile ? 4 : 3; // Thicker lines on mobile

        this.ctx.beginPath();

        // Get the first location (always depot)
        const firstLoc = this.gameState.depot; // route[0] is always 0 (depot)
        this.ctx.moveTo(firstLoc.x, firstLoc.y);

        // Draw lines to each location in the route
        for (let i = 1; i < route.length; i++) {
            const locId = route[i];
            const loc = locId === 0 ?
                this.gameState.depot :
                this.gameState.customers.find(c => c.id === locId);

            if (loc) {
                this.ctx.lineTo(loc.x, loc.y);
            }
        }

        this.ctx.stroke();
    }

    /**
     * Draw the current route being built
     */
    drawCurrentRoute() {
        if (this.gameState.currentRoute.length > 1) {
            // Draw with a more prominent color
            this.ctx.strokeStyle = '#27ae60'; // Green for current route
            this.ctx.lineWidth = this.isMobile ? 5 : 4; // Thicker than completed routes

            this.ctx.beginPath();

            // Get the first location (always depot)
            const firstLoc = this.gameState.depot;
            this.ctx.moveTo(firstLoc.x, firstLoc.y);

            // Draw lines to each location in the route
            for (let i = 1; i < this.gameState.currentRoute.length; i++) {
                const locId = this.gameState.currentRoute[i];
                const loc = locId === 0 ?
                    this.gameState.depot :
                    this.gameState.customers.find(c => c.id === locId);

                if (loc) {
                    this.ctx.lineTo(loc.x, loc.y);
                }
            }

            this.ctx.stroke();
        }
    }

    /**
     * Draw all locations (depot and customers)
     */
    drawLocations() {
        // First draw the depot
        this.drawDepot();

        // Then draw all customers
        for (const customer of this.gameState.customers) {
            this.drawCustomer(customer);
        }
    }

    /**
     * Draw the depot
     */
    drawDepot() {
        const depot = this.gameState.depot;

        // Depot is drawn as a purple square
        this.ctx.fillStyle = '#7209b7'; // Purple for depot

        // Add glow if this is the last point in current route
        if (this.gameState.currentRoute.length > 1 &&
            this.gameState.currentRoute[this.gameState.currentRoute.length - 1] === 0) {
            this.ctx.shadowColor = '#f39c12';
            this.ctx.shadowBlur = this.isMobile ? 15 : 20;
        } else {
            this.ctx.shadowBlur = 0;
        }

        // Slightly larger than customer locations
        const depotSize = this.gameState.locationSize * 1.2;

        // Draw rotated square (diamond shape)
        this.ctx.save();
        this.ctx.translate(depot.x, depot.y);
        this.ctx.rotate(Math.PI / 4); // 45 degrees
        this.ctx.fillRect(-depotSize / 2, -depotSize / 2, depotSize, depotSize);
        this.ctx.restore();

        // Reset shadow
        this.ctx.shadowBlur = 0;

        // Add "D" label
        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${this.isMobile ? 14 : 12}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('D', depot.x, depot.y);
    }

    /**
     * Draw a customer location
     * @param {Object} customer - Customer object with x, y, id, and demand
     */
    drawCustomer(customer) {
        // Check if this customer is in any route
        let isServed = false;
        let inCurrentRoute = false;

        // Check all routes
        for (let i = 0; i < this.gameState.routes.length; i++) {
            if (this.gameState.routes[i].includes(customer.id)) {
                isServed = true;
                if (i === this.gameState.currentRouteIndex) {
                    inCurrentRoute = true;
                }
                break;
            }
        }

        // Set color based on status
        if (inCurrentRoute) {
            this.ctx.fillStyle = '#27ae60'; // Green for current route
        } else if (isServed) {
            this.ctx.fillStyle = '#3498db'; // Blue for served
        } else {
            this.ctx.fillStyle = '#e74c3c'; // Red for unserved
        }

        // Add glow if this is the last customer in current route
        if (this.gameState.currentRoute.length > 0 &&
            this.gameState.currentRoute[this.gameState.currentRoute.length - 1] === customer.id) {
            this.ctx.shadowColor = '#f39c12';
            this.ctx.shadowBlur = this.isMobile ? 15 : 20;
        } else {
            this.ctx.shadowBlur = 0;
        }

        // Draw customer circle
        const size = this.gameState.locationSize;
        this.ctx.beginPath();
        this.ctx.arc(customer.x, customer.y, size, 0, Math.PI * 2);
        this.ctx.fill();

        // Reset shadow
        this.ctx.shadowBlur = 0;

        // Draw customer demand as number inside circle
        this.ctx.fillStyle = 'white';
        const fontSize = this.isMobile ?
            Math.max(10, Math.min(size - 2, 16)) :
            Math.max(10, Math.min(size - 1, 14));
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(customer.demand.toString(), customer.x, customer.y);
    }

    /**
  * Draw a specific algorithm solution
  * @param {Array} routes - Array of route arrays
  * @param {boolean} clearCanvas - Whether to clear the canvas first
  */
    drawAlgorithmSolution(routes, clearCanvas = true) {
        if (clearCanvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // CHANGED ORDER: First draw routes, then locations on top

        // Draw each route with a unique color
        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            if (route.length > 1) {
                const routeColor = this.gameState.getRouteColor(i);
                this.ctx.strokeStyle = routeColor;
                this.ctx.lineWidth = this.isMobile ? 4 : 3;

                this.ctx.beginPath();

                // Get the first location (always depot)
                const firstLoc = this.gameState.depot;
                this.ctx.moveTo(firstLoc.x, firstLoc.y);

                // Draw lines to each location in the route
                for (let j = 1; j < route.length; j++) {
                    const locId = route[j];
                    const loc = locId === 0 ?
                        this.gameState.depot :
                        this.gameState.customers.find(c => c.id === locId);

                    if (loc) {
                        this.ctx.lineTo(loc.x, loc.y);
                    }
                }

                this.ctx.stroke();
            }
        }

        // Draw all locations on top of the routes
        this.drawLocations();
    }

    /**
     * Convert canvas coordinates from mouse or touch event to game coordinates
     * @param {MouseEvent|TouchEvent} event - Mouse or touch event
     * @returns {Object} Coordinates in game space
     */
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        let clientX, clientY;

        // Handle both mouse and touch events
        if (event.touches && event.touches.length > 0) {
            // Touch event
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            // Mouse event
            clientX = event.clientX;
            clientY = event.clientY;
        }

        return {
            x: (clientX - rect.left) * (this.canvas.width / rect.width),
            y: (clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }
}

export default Renderer;