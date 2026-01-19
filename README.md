# Anniversary Candy Crush

A romantic match-3 puzzle game that reveals your photos and memories as you play. Perfect for anniversaries, birthdays, or any special occasion.

## Quick Start

1. Open the `customize` folder
2. Add your photos to `customize/photos/`
3. Add your music to `customize/music/` (optional)
4. Edit `customize/my-config.js` to add your captions and messages
5. Open `index.html` in a web browser to play

## How to Customize

All your personalization happens in the **`customize/`** folder:

```
customize/
├── my-config.js    <-- Edit this file!
├── photos/         <-- Put your photos here
└── music/          <-- Put your background music here
```

### Step 1: Add Your Photos

Copy your photos (JPG, PNG) into the `customize/photos/` folder.

**Tips:**
- Use 10-15 photos for the best experience
- Any image size works, but square photos look best
- Name them something simple (photo1.jpg, beach.jpg, etc.)

**Optional: Custom Start Screen Background**
- Add an image named `start-background.png` to the `photos` folder
- This will appear as the background behind the "Begin" button
- A colorful, personalized image works great here!

### Step 2: Add Your Music (Optional)

Copy your romantic song into the `customize/music/` folder.

**Supported formats:** .mp3, .m4a, .ogg, .wav

### Step 3: Edit the Config File

Open `customize/my-config.js` in any text editor (Notepad, TextEdit, VS Code, etc.)

**Add your memories:**
```javascript
const myMemories = [
    {
        photo: "beach-trip.jpg",
        caption: "Our first trip to the beach together"
    },
    {
        photo: "wedding.jpg",
        caption: "The happiest day of my life"
    },
    // Add more...
];
```

**Customize your messages:**
```javascript
const myMessages = {
    title: "Happy Anniversary Sarah!",
    subtitle: "5 years of adventures",
    startButton: "Begin Our Story",
    victoryTitle: "Our Love Story",
    victorySubtitle: "Here's to forever",
    finalMessage: "I love you more every day. Happy Anniversary!",
    signature: "Love, Michael"
};
```

**Set your music filename:**
```javascript
const myMusic = "our-song.mp3";
```

### Step 4: Play the Game

Open `index.html` in any web browser. That's it!

**To share online:**
- Upload the entire folder to a web hosting service
- GitHub Pages, Netlify, or Vercel all work great (free!)

## Game Features

- Match-3 puzzle gameplay
- Golden "memory tiles" reveal your photos when matched
- Striped candies (match 4) clear entire rows/columns
- Wrapped candies (match 5 in L/T shape) clear surrounding tiles
- Romantic music plays throughout
- Victory screen shows all your photos together

## Advanced Options

### Change the Color Theme

In `my-config.js`, edit the colors:
```javascript
const mySettings = {
    colors: {
        primary: "#FF69B4",      // Pink
        secondary: "#FFD700",    // Gold
        background: "#FFF5F5"    // Light pink
    }
};
```

### Adjust Difficulty

```javascript
const mySettings = {
    moves: 75,     // More moves = easier game
    gridSize: 8    // 6-8 works well
};
```

### Add Password Protection

Uncomment and edit in `my-config.js`:
```javascript
const myPassword = {
    password: "ourdate2015",
    hint: "The year we met"
};
```

## Troubleshooting

**Photos not showing?**
- Make sure the filename in my-config.js exactly matches your photo filename
- Check that photos are in the `customize/photos/` folder

**Music not playing?**
- Browsers require a user click before playing audio
- Click "Begin" to start - music will play automatically

**Game not loading?**
- Open the browser console (F12) to check for errors
- Make sure you didn't accidentally delete a comma in my-config.js

## Helper Tools

### Caption Editor

Open `caption-editor.html` in your browser for a visual interface to:
- Preview your photos with their captions
- Edit all game messages in one place
- Generate configuration that you can copy into `my-config.js`

This is especially useful when you have many photos and want to see them while writing captions.

### Victory Screen Preview

Open `preview-victory.html` to see exactly how the final victory screen will look:
- Shows your photo gallery layout with animations
- Click any photo to see it full-size with its caption
- Tests the celebration particle effects
- Reads directly from your `my-config.js` settings

Use this to preview the ending without playing through the entire game.

## File Structure

```
anniversary-candy-crush/
├── index.html          # Main game file - open this to play
├── caption-editor.html # Helper tool for editing captions
├── preview-victory.html # Preview the victory screen
├── customize/          # YOUR CONTENT GOES HERE
│   ├── my-config.js    # Your settings and captions
│   ├── photos/         # Your photos
│   └── music/          # Your background music
├── css/                # Game styling (don't edit)
├── js/                 # Game code (don't edit)
├── assets/             # Default sounds (don't edit)
└── content.js          # Loads your config (don't edit)
```

## Credits

Made with love for anniversaries everywhere.

---

Enjoy your special game!
