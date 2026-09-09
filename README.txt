JPPC SINGLE FILE v4.2
=====================
UPDATES
1. THE GAMES
   - Admin > Games
   - Edit section heading, title, description
   - Replace image separately for Pingpong / Padel / Mahjong
   - Uses existing Firestore site + assets collections, so no new Firestore rules needed.

2. MEMBERS
   - Separate level for Pingpong, Padel, Mahjong.
   - Levels: Newbie, Bronze, Silver, Gold, Platinum, Diamond, Master,
     Grandmaster, Legend, Mythic.
   - Member cards show all 3 levels.

3. RANKINGS
   - 3 independent boxes in one row: Pingpong, Padel, Mahjong.
   - Each box has its own vertical scroll.
   - Mobile uses horizontal swipe between boxes.
   - Admin ranking editor includes Game, Rank, Level, Played, Wins, Losses.

DEPLOY
- Replace the current root index.html in GitHub with this file.
- Commit changes and wait for GitHub Pages deployment to turn green.
- Hard refresh: Ctrl+F5.
- Admin header should say: build 4.2 games-member-rankings

FIREBASE
- Connected to existing Firebase project: jppc-cea43
- Existing Firestore rules remain compatible because no new collection is introduced.
