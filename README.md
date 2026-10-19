# Bug Hunt

Misión M1 · El Despertar del DOM — Web Development I.

## Usage

Press **Start Game** to play. Use the arrows to move to a different cell and **Enter** or **Space**
to catch the bug. Open `index.html` directly in a browser; no installation or build step is needed.

The grid is intentionally **keyboard only**. Mouse and touch can start or restart the game, but
cannot select cells or catch bugs. Tab moves focus out of the board normally.

Each game lasts **30 seconds**. A catch earns 1 point, a wrong box costs 1 point and 2 seconds.
Every five successful catches advances the round, even if misses have reduced your score. Bugs move
automatically every 4 seconds at first, then 400 milliseconds faster per round, down to a minimum of
1.2 seconds. Each catch resets the movement timer, and the next bug always appears in a different
cell.

Press **D** to toggle dark and light themes before, during, or after a game. reloading the page
resets the theme.

## Use of AI

I used the Codex CLI.

Prompt examples:

- In the case of hitting the wrong box, penalize the user by removing a point and 2 seconds of the
  remaining time. Ensure the time and points doing go under 0.
- Make it so that the mouse can not be used to move through the matrix, or to select the bug. It
  must however be allowed when pressing the start game button.

After each change, I tested it by playing a couple of games and checking the edge cases. Each time a
new feature or fix was finished, I made a commit to keep track of changes.

When penalizing the user for a mistake by subtracting 2 seconds from the clock, the AI used a "magic
number" which I replaced with a constant to make it more intuitive.

## Autopsy

1. I keep the position of the bug in a variable instead of checking each box to find it. This makes
   it easier to check if the user selected the right box, without having to look through the whole
   grid each time.
2. I use the keyboard to move between boxes and catch the bug instead of allowing mouse clicks.
   Clicking directly on the bug would make the game too easy. The mouse can still be used to press
   the start game button.
