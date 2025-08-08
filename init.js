// INITIALIZATION - Ensure all modules load properly

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}

function initializeGame() {
    // Update canvas references for all modules
    const gameCanvas = document.getElementById('gameCanvas');
    
    // Canvas is already set in each module, no need to reassign
    // Just verify it exists
    if (!gameCanvas) {
        console.error('Game canvas not found!');
        return;
    }
    
    // Update canvas in each module's scope
    if (typeof progression !== 'undefined' && progression) {
        // Canvas is already referenced in progression
    }
    
    if (typeof effects !== 'undefined' && effects) {
        // Canvas is already referenced in effects
    }
    
    if (typeof aiPersonality !== 'undefined' && aiPersonality) {
        // Canvas is already referenced in ai-personality
    }
    
    if (typeof impossibleAI !== 'undefined' && impossibleAI) {
        // Canvas is already referenced in impossible-ai
    }
    
    console.log('Game initialized successfully');
}