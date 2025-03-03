/**
 * CompletionModal.js
 * Handles the solution completion modal functionality
 */

class CompletionModal {
    /**
     * Initialize the completion modal
     * @param {GameState} gameState - Reference to the game state
     * @param {CvrpAlgorithms} algorithms - Reference to the algorithms
     * @param {EventHandlers} eventHandlers - Reference to the event handlers
     */
    constructor(gameState, algorithms, eventHandlers) {
        this.gameState = gameState;
        this.algorithms = algorithms;
        this.eventHandlers = eventHandlers;
        this.modal = document.getElementById('completion-modal');
        this.closeBtn = this.modal.querySelector('.modal-close');
        this.tryAgainBtn = document.getElementById('try-again-btn');
        this.newLocationsBtn = document.getElementById('new-locations-btn');
        this.rankingsList = document.getElementById('rankings-list');
        this.finalDistance = document.getElementById('final-distance');
        this.finalVehicles = document.getElementById('final-vehicles');
        this.completionMessage = document.getElementById('completion-message');

        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the modal
     */
    setupEventListeners() {
        // Close modal when clicking X button
        this.closeBtn.addEventListener('click', () => this.close());

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Try again button clears routes but keeps same locations
        this.tryAgainBtn.addEventListener('click', () => {
            this.close();
            this.eventHandlers.handleClearAllClick();
        });

        // New locations button starts a new game
        this.newLocationsBtn.addEventListener('click', () => {
            this.close();
            this.eventHandlers.handleNewGameClick();
        });
    }

    /**
     * Show the completion modal with solution results
     * @param {Object} result - Solution result object
     */
    show(result) {
        // Ensure the enhanced solution is calculated if not already
        if (!result.enhancedDistance) {
            // Show calculating indicator for enhanced solution
            const enhancedElement = document.getElementById('enhanced-distance');
            const originalText = enhancedElement.textContent;
            enhancedElement.textContent = "Calculating...";

            // Use setTimeout to allow the UI to update before the calculation
            setTimeout(() => {
                this.algorithms.calculateEnhancedSolution();
                const enhancedDistance = this.gameState.calculateTotalDistance(this.gameState.enhancedRoutes);
                const enhancedVehicles = this.gameState.enhancedRoutes.length;

                result.enhancedDistance = enhancedDistance;
                result.enhancedVehicles = enhancedVehicles;
                result.enhancedScore = enhancedDistance + (enhancedVehicles * this.gameState.vehicleCost);

                enhancedElement.textContent = enhancedDistance.toFixed(2);
                document.getElementById('enhanced-vehicles').textContent = enhancedVehicles;

                this.updateModalContent(result);
            }, 10);
        } else {
            this.updateModalContent(result);
        }
    }

    /**
     * Update the modal content with solution results
     * @param {Object} result - Solution result object
     */
    updateModalContent(result) {
        // Set user's solution details
        this.finalDistance.textContent = result.userDistance.toFixed(2);
        this.finalVehicles.textContent = result.userVehicles;

        // Create array of all solutions for ranking
        const solutions = [
            { name: 'You', distance: result.userDistance, vehicles: result.userVehicles, score: result.userScore, isUser: true },
            { name: 'Savings Algorithm', distance: result.savingsDistance, vehicles: result.savingsVehicles, score: result.savingsScore, isUser: false },
            { name: 'Sweep Algorithm', distance: result.sweepDistance, vehicles: result.sweepVehicles, score: result.sweepScore, isUser: false },
            { name: 'Enhanced Solution', distance: result.enhancedDistance, vehicles: result.enhancedVehicles, score: result.enhancedScore, isUser: false }
        ];

        // Sort solutions by score (lowest first)
        solutions.sort((a, b) => a.score - b.score);

        // Create rankings HTML
        this.rankingsList.innerHTML = '';

        solutions.forEach((solution, index) => {
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item rank-${index + 1}`;

            // Medal emoji based on rank
            let medalEmoji = '';
            if (index === 0) medalEmoji = '🥇';
            else if (index === 1) medalEmoji = '🥈';
            else if (index === 2) medalEmoji = '🥉';
            else medalEmoji = '🏅';

            const nameClass = solution.isUser ? 'you' : '';

            rankingItem.innerHTML = `
                <div class="ranking-name ${nameClass}">
                    <span class="medal">${medalEmoji}</span>
                    ${solution.name}
                </div>
                <div class="ranking-value">
                    ${solution.distance.toFixed(2)} units, ${solution.vehicles} vehicles
                </div>
            `;

            this.rankingsList.appendChild(rankingItem);
        });

        // Determine user's rank and create appropriate message
        const userRank = solutions.findIndex(s => s.isUser) + 1;
        let message = '';

        switch (userRank) {
            case 1:
                message = "🏆 Outstanding! Your solution outperformed all algorithms. Excellent balance of distance and vehicle usage!";
                break;
            case 2:
                if (solutions[0].name === 'Enhanced Solution') {
                    message = "🎯 Impressive! Only the Enhanced algorithm found a better solution. Great work!";
                } else {
                    message = "🎯 Amazing! You outperformed most algorithms. Your logistics skills are excellent!";
                }
                break;
            case 3:
                message = "👍 Good job! Your solution is competitive with established algorithms. Keep refining your approach!";
                break;
            case 4:
                message = "🔄 Nice effort! Routing problems are complex. Try studying the algorithm solutions for ideas to improve your approach.";
                break;
        }

        this.completionMessage.textContent = message;

        // Show the modal
        this.modal.style.display = 'flex';
    }

    /**
     * Close the completion modal
     */
    close() {
        this.modal.style.display = 'none';
    }
}

export default CompletionModal;