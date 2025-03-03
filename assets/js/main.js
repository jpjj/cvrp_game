/**
 * main.js
 * Main entry point for the CVRP game
 * 
 * This file initializes the game, creating instances of all required classes
 * and starting the game.
 */

import GameState from './GameState.js';
import Renderer from './Renderer.js';
import CvrpAlgorithms from './Algorithms.js';
import EventHandlers from './EventHandlers.js';
import { getDomElements } from './Utils.js';

/**
 * Initialize the game when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const domElements = getDomElements();

    // Create game state
    const gameState = new GameState();

    // Create renderer
    const renderer = new Renderer(domElements.canvas, gameState);

    // IMPORTANT: Ensure canvas is properly sized before drawing anything
    // This fixes mobile display issues
    renderer.resizeCanvas();

    // Create algorithms
    const algorithms = new CvrpAlgorithms(gameState);

    // Create event handlers
    const eventHandlers = new EventHandlers(gameState, renderer, algorithms, domElements);

    // Set up event listeners
    eventHandlers.setupEventListeners();

    // Initialize first game
    const difficultyValue = domElements.difficultySelect.value;
    const customCapacity = parseInt(domElements.customCapacityInput.value || 50);
    const customLocations = parseInt(domElements.customLocationsInput.value || 15);

    // Wait for the canvas to be fully sized before generating locations
    setTimeout(() => {
        // Reset the game
        const result = gameState.resetGame(
            difficultyValue,
            customCapacity,
            customLocations,
            domElements.canvas.width,
            domElements.canvas.height
        );

        // Update DOM elements
        domElements.totalCustomers.textContent = result.numCustomers;
        domElements.totalCustomersStat.textContent = result.numCustomers;
        domElements.customersServed.textContent = 0;
        domElements.customersVisited.textContent = 0;
        domElements.totalDistance.textContent = "0";
        domElements.vehiclesUsed.textContent = 0;
        domElements.maxCapacity.textContent = result.capacity;
        domElements.bestDistance.textContent = "N/A";
        domElements.vehicleNumber.textContent = 1;

        // Disable buttons
        domElements.undoButton.disabled = true;
        domElements.finishRouteButton.disabled = true;

        // Precalculate solutions in the background for better initial loading
        setTimeout(() => {
            // Calculate savings algorithm solution
            algorithms.calculateSavingsSolution();
            domElements.savingsDistance.textContent =
                gameState.calculateTotalDistance(gameState.savingsRoutes).toFixed(2);
            domElements.savingsVehicles.textContent = gameState.savingsRoutes.length;

            // Calculate sweep algorithm solution
            algorithms.calculateSweepSolution();
            domElements.sweepDistance.textContent =
                gameState.calculateTotalDistance(gameState.sweepRoutes).toFixed(2);
            domElements.sweepVehicles.textContent = gameState.sweepRoutes.length;

            // Enhanced solution is calculated on-demand to save time
        }, 100);

        // Draw the initial game
        renderer.drawGame();
    }, 100); // Small delay to ensure the canvas is fully sized

    console.log('CVRP Game initialized!');
});