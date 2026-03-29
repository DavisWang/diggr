# Diggr

## Overview

- Diggr is a single player, browser based, 2d side view RPG/simulation game where you play as a digging machine and your goal is to dig underground for gems/gold/valuables. These loot can then be sold to upgrade your digging machine which makes digging more efficient, dig deeper, and protect you from the dangers that lurk underground.  
- Project Guidance  
  - Add regression tests, especially for UI/visual bugs, tests must be added and [lessons.md](http://lessons.md) updated if the game dev corrects you. Before passing back to the user, you must confirm to the best of your ability that the issue has been resolved.  
  - Add docs as you build, encoding context on decisions, design choices, iteration feedback, etc.

## Game Mechanics

- Controls  
  - The user uses arrow keys on the keyboard to move the digger. The digger movement should be smooth and subject to moon like gravity. The gravity should be tunable.  
  - Repair nanobots are triggered with ‘z’  
  - Repair microbots are triggered with ‘a’  
  - Small Fuel tanks are triggered with ‘x’  
  - Large fuel tanks are triggered with ‘s’  
  - Small TNT is triggered with ‘c’  
  - Large TNT is triggered with ‘d’  
  - Matter transporter is triggered with ‘f’  
  - Quantum Fissuriser is triggered with ‘v’  
  -   
- Map  
  - The map is a large vertical rectangle as the primary game play direction is down. The surface level contains all amenities and shops, above is the sky and the player is capped from flying too far into the sky. Below is underground and where the gameplay occurs. The underground is divided into 13 wide by N deep blocks where each block represents a mineable block. The digger takes up slightly less than the dimensions of a single block.  
  - The map is procedurally generated as the user progresses down. The deeper the player digs, the higher the likelihood of finding more and more valuable gems/ores. There may be cavities and caverns underground, the underground need not be completely occupied by solid blocks.  
- Digger  
  - The digger is equipped with a thruster for flying and a drill for digging  
  - Digger can dig in all 4 cardinal directions except up provided the digger is on solid ground  
  - The exception is the top layer of ground. There is a predug block in the center of the map from which the digger can begin digging. The digger cannot dig sideways on the top layer of ground.  
  - The digger has health and if the health bar is depleted then the player loses the game. The digger loses health when:  
    - The player digs a molten lava block  
    - The player sustains fall damage proportional to the height of the fall.  
    - The player is hurt by an enemy (todo: to implement later)  
  - The digger has a fuel gauge and if the fuel gauge is depleted then the player loses the game. Fuel is expended when the digger digs/moves/flies. Moving requires a very small amount of fuel (and increases if the cargo hold is heavy), flying requires more fuel (and increases if the cargo hold is heavy), digging requires the most fuel, the fuel required to dig a block is proportional to the value of the block.  
  - The digger has a cargo hold for storing mined ores/gems. A fuller cargo hold increases the weight of the digger and makes it harder for the digger to take off and fly without superior thruster upgrades. The digger will not be able to store more mined blocks if the cargo hold is full.  
- Block types  
  - Dirt \- basic block, produces no value, occupies no space in cargo.  
  - Rock \- cannot be drilled by any drill, must be blasted with TNT. Appears more often the deeper the player digs.  
  - Molten lava \- digger incurs a large \> 30% of damage to health, higher if radiator upgrade is low. Appears more often the deeper the player digs.  
  - Gems/Ores (in order of value)  
    - Tinnite   
    - Bronzium  
    - Silverium  
    - Goldium  
    - Mithrium   
    - Adamantium  
    - Runite \- rarest block in the game, only found in the deepest underground.  
  - Treasure \- random rare blocks that grants the player immediate cash if mined (in order of value)  
    - Alien Skeleton \- roughly equivalent to mithrium value  
    - Alien Artifact \- roughly equivalent to adamantium value  
  - Hidden lava blocks \- Blocks that look like dirt but have the effect of molten lava rocks, these only start appearing on the deeper parts of the map.  
  -   
- Shops  
  - Each shop’s dedicated shop pop up window is overlaid in the center of the game panel when the player moves the digger to the center of the shop’s sprite/location. Each shop’s pop up window has an X on the top right to dismiss.  
  - Upgrades Shop  
    - The player can buy upgrades for their digger here. The interface for the shop window is:  
      - Left hand side (\~30% of window), show the 5 types of upgrades, with hull selected as default, right hand side (\~70% of window), shows the 5 upgrades for that type.  
      - Clicking on the specific upgrade shows the price on the right side of the window alongside a description of the upgrade, with a buy button in the bottom right hand corner.  
      - Buying replaces the digger part with the superior part and deduces the cost from the player’s current money. Buy button is greyed out if insufficient funds.  
    - The player starts with bronzium grade parts for everything.

| upgrade type x quality x cost | Silverium grade | Goldium Grade | Mithrium Grade | Adamantium Grade | Runite Grade |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Drill \- allows for drilling higher grade ores/gems, makes drilling a block faster. |  |  |  |  |  |
| Hull \- Increases health pool |  |  |  |  |  |
| Cargo Hold \- increases cargo hold capacity |  |  |  |  |  |
| Thrusters \- increases liftoff weight |  |  |  |  |  |
| Fuel Tank \- increases fuel tank size |  |  |  |  |  |
| Radiator \-  enables mining at deeper depths and reduces damage from laval blocks |  |  |  |  |  |

    -   
  - Consumables Shop  
    - The player can buy consumables to use while underground to sustain and protect themselves. All consumables are one use. A player may buy up to 99 of each item. Items do not take up space in the cargo hold nor increase the weight of the digger.  
    - The interface for the shop window is: shows the consumable items in a grid layout with the right hand side preserved for showing details of an item if the user clicks on it (make consistent with other shop interfaces), with cost and a buy button.  
    - Buying adds 1 unit to the player’s inventory and deducts the money from player’s current cash on hand. Buy button greyed out if insufficient funds.  
    - Repair nanobot \- restores a small amount of health  
    - Repair microbot \- restores a larger amount of health  
    - Small portable fuel tank \- refuels a small fixed amount of fuel  
    - Large portable fule tank \- refuels a larger fixed amount of fuel.  
    - Small TNT \- creates a 3x3 explosion around the digger, required to blast through rocks. 	  
    - Large TNT \- creates a 5x5 explosion around the digger, required to blast through rocks.   
    - Matter teleporter \- Transports the digger to right beside the refuel station.  
    - Quantum Fissurizer \- transports the digger to a random location above ground with a random high speed in any direction.  
  - Ore Refinery  
    - The player can sell the contents of their cargo hold here.  
    - The shop interface is a list of ores/gems in the cargo hold available to sell, in the following format: \<Gem/Ore\> x Amount …… $Y. For each distinct type of gem/ore, final row is a grand total.  
    - The right hand side is a single button: sell all. Button greyed out if nothing in cargo hold.  
  - Refuelling/Repair Station  
    - The player can repair and refuel their digger here at a cost.  
    - There is only a single button, repair and refuel. A nominal amount is changed. If insufficient funds, button is greyed out.

## UI/Look and feel

* The look of the game is retro/8bit.

## Screens

- Title Screen  
  - New game button  
  - Load game button  
  - How to play button  
  - “By Pwner Studios” label at the bottom.  
- Gameplay screen  
  - The game panel takes up the entire browser window.  
  - Top left corner overlaid on the map  
    - Cash on hand  
    - Total earnings  
  - Top right corner overlaid on the map  
    - Health bar  
    - Fuel gauge  
    - Depth (in meters). One block represents 1 meter in depth  
    - Cargo capacity %  
  - Rest of the panel is used to show the map.

## Physics

- Care must be put into the following interactions from a physics perspective to make the interaction feel realistic:  
  - Flying, weighed down by cargo  
  - Moving, weight down by cargo  
  - Digging, slower if lower quality drill.

## Sprites (TODO later)

* Shops  
* Digger  
* Blocks  
* Items  
  * Item use animations

## Level Generation Logic

- TODO later

## Enemies

- TODO later

## Music/FX

- TODO later

