# Capacitated Vehicle Routing Problem (CVRP) Game

An interactive web game that lets you solve the Capacitated Vehicle Routing Problem - one of the most important optimization challenges in logistics and transportation.


## About The Project

The Capacitated Vehicle Routing Problem (CVRP) extends the classic Traveling Salesperson Problem by adding vehicle capacity constraints. The challenge is to find optimal routes for a fleet of vehicles to serve all customers while minimizing total distance and respecting each vehicle's capacity limit.

This project offers an engaging, educational experience where players can:
- Create routes for vehicles with limited capacity
- Serve customers with different demand values
- Balance the tradeoff between distance and number of vehicles used
- Compare their solutions to established optimization algorithms

## Features

- **Multiple Difficulty Levels:**
  - Beginner (Capacity: 25)
  - Medium (Capacity: 50)
  - Hard (Capacity: 100)
  - Expert (Capacity: 200)
  - Custom (Set your own parameters)

- **Interactive Routing:**
  - Click to build routes
  - Visual capacity indicators
  - Automatic vehicle assignment when capacity is full

- **Algorithm Comparisons:**
  - Clarke-Wright Savings Algorithm
  - Sweep Algorithm
  - Enhanced solution with multiple optimization techniques

- **Performance Analytics:**
  - Real-time distance calculation
  - Vehicle usage tracking
  - Detailed solution rankings

- **Mobile Friendly:**
  - Responsive design
  - Touch-optimized controls
  - Performance optimizations for mobile devices

## How to Play

1. **Start a New Game:**
   - Select a difficulty level (or customize capacity and customers)
   - Click "New Game" to generate a random problem instance

2. **Create Routes:**
   - Each route starts at the purple depot
   - Click on customers (circles) to add them to your route
   - The number inside each customer circle is their demand value
   - Watch your vehicle's capacity bar - don't exceed it!

3. **Complete Routes:**
   - Return to the depot when your vehicle is nearly full
   - A new vehicle will start automatically
   - Continue until all customers are served

4. **Optimize Your Solution:**
   - Try to minimize both total distance and number of vehicles
   - Compare your solution with algorithm-generated routes
   - Experiment with different routing strategies

## Optimization Algorithms

The game includes three algorithms for comparison:

1. **Clarke-Wright Savings Algorithm:**
   - A constructive heuristic that builds routes based on "savings" from combining customer visits
   - Typically produces good solutions with reasonable computational effort
   - Often used as a starting point for more complex algorithms

2. **Sweep Algorithm:**
   - A geometric approach that groups customers by angle from the depot
   - Creates clusters of customers that can be served by a single vehicle
   - Optimizes routes within each cluster using TSP techniques

3. **Enhanced Algorithm:**
   - Combines multiple optimization techniques:
   - Uses savings algorithm as a starting point
   - Applies route balancing to equalize vehicle loads
   - Implements intra-route optimization with 2-opt
   - Performs inter-route customer swaps for further improvement

## Live Demo

Try the game at: [https://jpjj.github.io/cvrp_game](https://jpjj.github.io/cvrp_game)

## Getting Started

### Prerequisites

- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No special software required - runs entirely in the browser!

## Technologies Used

- Vanilla JavaScript (ES6 modules)
- HTML5 Canvas for rendering
- CSS Grid and Flexbox for layouts
- No external libraries or frameworks

## Educational Value

This game helps players understand:
- The complexity of logistics optimization
- How vehicle routing algorithms work
- The tradeoff between computational complexity and solution quality
- Real-world applications of operations research

## Real-World Applications

The CVRP is used in:
- Last-mile delivery planning
- Waste collection routing
- Public transportation scheduling
- Food delivery optimization
- Service technician dispatching
- Humanitarian logistics