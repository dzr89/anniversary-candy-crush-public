/* ============================================================
   YOUR ANNIVERSARY GAME - CUSTOMIZATION FILE
   ============================================================

   INSTRUCTIONS:
   1. Put your photos in the "photos" folder (next to this file)
   2. Put your background music in the "music" folder
   3. (Optional) Add a start screen background image named
      "start-background.png" in the "photos" folder
   4. Edit the settings below to personalize your game

   That's it! Open index.html in a browser to play.

   ============================================================ */


// ============================================================
// STEP 1: YOUR MEMORIES
// ============================================================
// Add one entry for each photo you want to include.
// - photo: The filename of your photo (must be in the "photos" folder)
// - caption: The text that appears when this memory is revealed
//
// TIP: 10-15 memories works best. You can add or remove entries.

// Memories in CHRONOLOGICAL ORDER (earliest to latest)
const myMemories = [
    {
        photo: "photo-01.svg",
        caption: "Our first date at the coffee shop downtown"
    },
    {
        photo: "photo-02.svg",
        caption: "The day we adopted our furry friend"
    },
    {
        photo: "photo-03.svg",
        caption: "Moving into our first apartment together"
    },
    {
        photo: "photo-04.svg",
        caption: "That unforgettable road trip adventure"
    },
    {
        photo: "photo-05.svg",
        caption: "Celebrating our first anniversary"
    },
    {
        photo: "photo-06.svg",
        caption: "The surprise birthday party you planned"
    },
    {
        photo: "photo-07.svg",
        caption: "Our favorite hiking spot in the mountains"
    },
    {
        photo: "photo-08.svg",
        caption: "Dancing at your sister's wedding"
    },
    {
        photo: "photo-09.svg",
        caption: "The day we said 'I love you'"
    },
    {
        photo: "photo-10.svg",
        caption: "This year - still falling for you every day"
    }
];


// ============================================================
// STEP 2: YOUR MESSAGES
// ============================================================
// Customize the text that appears throughout the game.

const myMessages = {
    // Start screen (what they see first)
    title: "Happy Anniversary!",
    subtitle: "A game made with love, just for you",
    startButton: "Begin Our Journey",

    // Victory screen (after all memories are revealed)
    victoryTitle: "Our Love Story",
    victorySubtitle: "Every moment with you is a treasure",
    finalMessage: "Here's to many more adventures together!",
    signature: "With all my love"
};


// ============================================================
// STEP 3: YOUR MUSIC (optional)
// ============================================================
// Put your music file in the "music" folder and enter the filename here.
// Leave empty ("") if you don't want background music.
// Supported formats: .mp3, .m4a, .ogg, .wav

const myMusic = "";


// ============================================================
// STEP 4: GAME SETTINGS (optional - defaults work great!)
// ============================================================

const mySettings = {
    // How many moves the player gets (more moves = easier game)
    // Recommended: 50-80 for a relaxed experience
    moves: 75,

    // Grid size (8 is standard, 6-8 works well)
    gridSize: 8,

    // Color theme (you can change these hex colors)
    colors: {
        primary: "#FF69B4",      // Pink - buttons and accents
        secondary: "#FFD700",    // Gold - memory tile glow
        background: "#FFF5F5"    // Light pink - page background
    }
};


// ============================================================
// DON'T EDIT BELOW THIS LINE
// (This connects your config to the game)
// ============================================================

window.CustomConfig = {
    memories: myMemories,
    messages: myMessages,
    music: myMusic,
    settings: mySettings
};
