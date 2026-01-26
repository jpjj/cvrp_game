/**
 * PhaserRenderer.js
 * Phaser 3 based renderer for the CVRP game with pixel art farm aesthetic
 */

class PhaserRenderer {
    /**
     * Initialize the Phaser renderer
     * @param {HTMLElement} canvasElement - The canvas element (will be replaced by Phaser)
     * @param {GameState} gameState - Reference to the game state
     */
    constructor(canvasElement, gameState) {
        this.canvasElement = canvasElement;
        this.gameState = gameState;
        this.game = null;
        this.scene = null;
        this.isMobile = this.detectMobile();
        this.canvasRatio = this.isMobile ? 1.4 : 0.6;

        // Sprite references
        this.depotSprite = null;
        this.customerSprites = [];
        this.demandTexts = [];
        this.routeGraphics = null;
        this.tileSprites = [];

        // Tile size for grass pattern
        this.tileSize = 32;

        // Colors for grass tiles
        this.grassColors = {
            light: 0x6fb23d,
            dark: 0x5ca03f,
            accent: 0x6ab73f
        };

        // Initialize Phaser
        this.initPhaser();
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
     * Initialize the Phaser game
     */
    initPhaser() {
        const container = document.querySelector('.game-container');
        if (!container) return;

        // Calculate initial dimensions
        const containerStyle = window.getComputedStyle(container);
        const paddingLeft = parseFloat(containerStyle.paddingLeft);
        const paddingRight = parseFloat(containerStyle.paddingRight);
        const containerWidth = container.clientWidth - paddingLeft - paddingRight;
        const containerHeight = containerWidth * this.canvasRatio;

        // Store reference to this for use in scene
        const renderer = this;

        // Create the game scene
        class GameScene extends Phaser.Scene {
            constructor() {
                super({ key: 'GameScene' });
                this.renderer = renderer;
            }

            preload() {
                // Load image assets
                this.load.image('farmhouse', 'assets/images/farmhouse.png');
                this.load.image('appletree', 'assets/images/appletree.png');

                // Generate grass tile textures programmatically
                this.generateGrassTextures();
            }

            create() {
                // Store scene reference
                renderer.scene = this;

                // Create background tiles
                this.createBackground();

                // Create graphics layer for routes
                renderer.routeGraphics = this.add.graphics();

                // Create container for sprites
                this.depotContainer = this.add.container(0, 0);
                this.customerContainer = this.add.container(0, 0);

                // Enable input
                this.input.on('pointerdown', (pointer) => {
                    // Dispatch a custom event that EventHandlers can listen to
                    const event = new CustomEvent('phaserClick', {
                        detail: { x: pointer.x, y: pointer.y }
                    });
                    document.dispatchEvent(event);
                });
            }

            generateGrassTextures() {
                // Generate grass tiles programmatically during preload
                this.generateGrassTile('grass_light', renderer.grassColors.light);
                this.generateGrassTile('grass_dark', renderer.grassColors.dark);
            }

            generateGrassTile(key, color) {
                const size = renderer.tileSize;
                const graphics = this.make.graphics({ x: 0, y: 0, add: false });

                // Base color
                graphics.fillStyle(color, 1);
                graphics.fillRect(0, 0, size, size);

                // Add some texture variation
                const variation = 0x101010;
                for (let i = 0; i < 8; i++) {
                    const x = Phaser.Math.Between(2, size - 4);
                    const y = Phaser.Math.Between(2, size - 4);
                    const shade = (Math.random() > 0.5) ? color + variation : color - variation;
                    graphics.fillStyle(shade, 0.5);
                    graphics.fillRect(x, y, 2, 2);
                }

                graphics.generateTexture(key, size, size);
                graphics.destroy();
            }

            createBackground() {
                const width = this.scale.width;
                const height = this.scale.height;
                const tileSize = renderer.tileSize;

                // Clear existing tiles
                renderer.tileSprites.forEach(tile => tile.destroy());
                renderer.tileSprites = [];

                // Create checkerboard pattern
                const cols = Math.ceil(width / tileSize) + 1;
                const rows = Math.ceil(height / tileSize) + 1;

                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        const isLight = (row + col) % 2 === 0;
                        const texture = isLight ? 'grass_light' : 'grass_dark';
                        const tile = this.add.image(col * tileSize, row * tileSize, texture);
                        tile.setOrigin(0, 0);
                        tile.setDepth(-10);
                        renderer.tileSprites.push(tile);
                    }
                }
            }

            update() {
                // Animation updates if needed
            }
        }

        // Get the container for Phaser
        const phaserContainer = document.getElementById('game-canvas-container') || this.canvasElement.parentElement;

        // Phaser configuration
        const config = {
            type: Phaser.AUTO,
            parent: phaserContainer,
            width: containerWidth,
            height: containerHeight,
            backgroundColor: '#6fb23d',
            scene: GameScene,
            scale: {
                mode: Phaser.Scale.NONE,
                autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
            },
            render: {
                pixelArt: true,
                antialias: false
            }
        };

        // Hide the original canvas
        this.canvasElement.style.display = 'none';

        // Create Phaser game
        this.game = new Phaser.Game(config);
    }

    /**
     * Resize the canvas to fit the container
     */
    resizeCanvas() {
        const container = document.querySelector('.game-container');
        if (!container) return;

        // Re-detect mobile status
        this.isMobile = this.detectMobile();
        this.canvasRatio = this.isMobile ? 1.4 : 0.6;

        // Get container width
        const containerStyle = window.getComputedStyle(container);
        const paddingLeft = parseFloat(containerStyle.paddingLeft);
        const paddingRight = parseFloat(containerStyle.paddingRight);
        const containerWidth = container.clientWidth - paddingLeft - paddingRight;
        const containerHeight = containerWidth * this.canvasRatio;

        // Also update the original canvas for coordinate calculations
        this.canvasElement.width = containerWidth;
        this.canvasElement.height = containerHeight;

        // Resize Phaser game if ready
        if (this.game) {
            this.game.scale.resize(containerWidth, containerHeight);

            // Recreate background tiles
            if (this.scene) {
                this.scene.createBackground();
            }

            // Redraw the game
            if (this.gameState.gameStarted) {
                this.drawGame();
            }
        }

        console.log(`Canvas resized: ${containerWidth}x${containerHeight}, Mobile: ${this.isMobile}`);
    }

    /**
     * Draw the game state
     */
    drawGame() {
        if (!this.scene || !this.gameState.gameStarted) return;

        // Clear previous drawings
        this.clearSprites();

        // Draw routes first (lowest layer)
        this.drawAllRoutes();
        this.drawCurrentRoute();

        // Draw locations on top
        this.drawLocations();
    }

    /**
     * Clear all sprites and graphics
     */
    clearSprites() {
        // Clear route graphics
        if (this.routeGraphics) {
            this.routeGraphics.clear();
        }

        // Clear depot sprite
        if (this.depotSprite) {
            this.depotSprite.destroy();
            this.depotSprite = null;
        }

        // Clear customer sprites
        this.customerSprites.forEach(sprite => sprite.destroy());
        this.customerSprites = [];

        // Clear demand texts
        this.demandTexts.forEach(text => text.destroy());
        this.demandTexts = [];
    }

    /**
     * Draw all completed routes
     */
    drawAllRoutes() {
        for (let i = 0; i < this.gameState.routes.length; i++) {
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
        const color = Phaser.Display.Color.HexStringToColor(
            this.gameState.getRouteColor(routeIndex)
        ).color;

        const lineWidth = this.isMobile ? 4 : 3;

        this.routeGraphics.lineStyle(lineWidth, color, 1);
        this.routeGraphics.beginPath();

        // Get the first location (always depot)
        const firstLoc = this.gameState.depot;
        this.routeGraphics.moveTo(firstLoc.x, firstLoc.y);

        // Draw lines to each location
        for (let i = 1; i < route.length; i++) {
            const locId = route[i];
            const loc = locId === 0
                ? this.gameState.depot
                : this.gameState.customers.find(c => c.id === locId);

            if (loc) {
                this.routeGraphics.lineTo(loc.x, loc.y);
            }
        }

        this.routeGraphics.strokePath();
    }

    /**
     * Draw the current route being built
     */
    drawCurrentRoute() {
        if (this.gameState.currentRoute.length > 1) {
            const lineWidth = this.isMobile ? 5 : 4;

            // Bright orange/yellow for current route - stands out against green background
            this.routeGraphics.lineStyle(lineWidth, 0xff8c00, 1);
            this.routeGraphics.beginPath();

            const firstLoc = this.gameState.depot;
            this.routeGraphics.moveTo(firstLoc.x, firstLoc.y);

            for (let i = 1; i < this.gameState.currentRoute.length; i++) {
                const locId = this.gameState.currentRoute[i];
                const loc = locId === 0
                    ? this.gameState.depot
                    : this.gameState.customers.find(c => c.id === locId);

                if (loc) {
                    this.routeGraphics.lineTo(loc.x, loc.y);
                }
            }

            this.routeGraphics.strokePath();
        }
    }

    /**
     * Draw all locations (depot and customers)
     */
    drawLocations() {
        // Draw depot
        this.drawDepot();

        // Draw all customers
        for (const customer of this.gameState.customers) {
            this.drawCustomer(customer);
        }
    }

    /**
     * Draw the depot
     */
    drawDepot() {
        const depot = this.gameState.depot;

        // Check if this is the last point in current route for glow effect
        const hasGlow = this.gameState.currentRoute.length > 1 &&
            this.gameState.currentRoute[this.gameState.currentRoute.length - 1] === 0;

        // Create farmhouse sprite
        this.depotSprite = this.scene.add.image(depot.x, depot.y, 'farmhouse');
        this.depotSprite.setDepth(10);

        // Scale based on location size (farmhouse.png is 594x539, target ~60-80px display)
        const targetSize = this.gameState.locationSize * 5;
        const scale = targetSize / 594;
        this.depotSprite.setScale(scale);

        // Add glow effect if needed
        if (hasGlow) {
            this.depotSprite.setTint(0xf39c12);
            // Create a subtle pulsing effect
            this.scene.tweens.add({
                targets: this.depotSprite,
                alpha: 0.7,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
    }

    /**
     * Draw a customer location
     * @param {Object} customer - Customer object with x, y, id, and demand
     */
    drawCustomer(customer) {
        // Check if this customer is served
        let isServed = false;
        let inCurrentRoute = false;

        for (let i = 0; i < this.gameState.routes.length; i++) {
            if (this.gameState.routes[i].includes(customer.id)) {
                isServed = true;
                if (i === this.gameState.currentRouteIndex) {
                    inCurrentRoute = true;
                }
                break;
            }
        }

        // Check if this is the last customer in current route for glow
        const hasGlow = this.gameState.currentRoute.length > 0 &&
            this.gameState.currentRoute[this.gameState.currentRoute.length - 1] === customer.id;

        // Create apple tree sprite
        const sprite = this.scene.add.image(customer.x, customer.y, 'appletree');
        sprite.setDepth(10);

        // Scale based on location size (appletree.png is 243x306, target ~40-50px display)
        const targetSize = this.gameState.locationSize * 3;
        const scale = targetSize / 243;
        sprite.setScale(scale);

        // Add glow effect if needed
        if (hasGlow) {
            sprite.setTint(0xf39c12);
            this.scene.tweens.add({
                targets: sprite,
                alpha: 0.7,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }

        this.customerSprites.push(sprite);

        // Draw demand number
        let textColor;
        if (inCurrentRoute) {
            textColor = '#ff8c00'; // Orange for current route - stands out against green
        } else if (isServed) {
            textColor = '#3498db'; // Blue for served
        } else {
            textColor = '#ffffff'; // White for unserved
        }

        const fontSize = this.isMobile
            ? Math.max(10, Math.min(this.gameState.locationSize + 5, 20))
            : Math.max(10, Math.min(this.gameState.locationSize + 5, 20));

        const demandText = this.scene.add.text(customer.x, customer.y, customer.demand.toString(), {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: textColor,
            stroke: '#000000',
            strokeThickness: 2
        });
        demandText.setOrigin(0.5, 0.5);
        demandText.setDepth(20);

        this.demandTexts.push(demandText);
    }

    /**
     * Draw a specific algorithm solution
     * @param {Array} routes - Array of route arrays
     * @param {boolean} clearCanvas - Whether to clear the canvas first
     */
    drawAlgorithmSolution(routes, clearCanvas = true) {
        if (!this.scene) return;

        if (clearCanvas) {
            this.clearSprites();
        }

        // Draw each route
        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            if (route.length > 1) {
                this.drawRoute(route, i);
            }
        }

        // Draw all locations on top
        this.drawLocations();
    }

    /**
     * Convert canvas coordinates from mouse or touch event to game coordinates
     * @param {MouseEvent|TouchEvent|Object} event - Mouse, touch, or custom event
     * @returns {Object} Coordinates in game space
     */
    getCanvasCoordinates(event) {
        if (!this.game) {
            return { x: 0, y: 0 };
        }

        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        // Handle different event types
        if (event.detail && event.detail.x !== undefined) {
            // Custom Phaser click event
            return { x: event.detail.x, y: event.detail.y };
        } else if (event.touches && event.touches.length > 0) {
            // Touch event
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            // Mouse event
            clientX = event.clientX;
            clientY = event.clientY;
        }

        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    /**
     * Get the touch radius for hit detection
     * @returns {number} Touch radius in pixels
     */
    get touchRadius() {
        return Math.max(this.gameState.locationSize * 2, 30);
    }

    /**
     * Destroy the Phaser game instance
     */
    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
    }
}

export default PhaserRenderer;
