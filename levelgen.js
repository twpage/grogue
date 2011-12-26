//var connected_lst = [];

var level_generator = function ( ) {
    var that = {};
    var FILL_PROB=0.40;
    
    // private 
	var flood_fill_fn = function (xy, max_x, max_y, walkable_key_lst, connected_lst) {
	// Fills a walkable_lst in-params by recursively crawling the tiles
		var key = xy.x + "+" + xy.y;
		var offset_lst = [], i, new_x, new_y, new_xy;
		
		// stop condition: out of bounds
		if (xy.x < 0 || xy.y < 0 || xy.x >= max_x || xy.y >= max_y) {
			return;
		}
		 
		// stop condition: we've been here before
		if ($.inArray(key, connected_lst) !== -1) {
		//if (connected_lst.indexOf(xy) !== -1) {
			return;
		}
		
		// stop condition: area is not walkable
		//if (walkable_lst.indexOf(xy) === -1) {
		if ($.inArray(key, walkable_key_lst) === -1) {
			return;
		}
		 
		// we got here so add it to the connected group
		connected_lst.push(key);
		
		// find all valid neighbors
		// removing DIAGONAL
		offset_lst = [
			{"x": 0, "y": 1},
			{"x": -1, "y": 0},
			{"x": 1, "y": 0},
			{"y": 0, "x": -1}
		];
		
		for (i = 0; i < offset_lst.length; i += 1) {
			new_x = xy.x + offset_lst[i].x;
			new_y = xy.y + offset_lst[i].y;
			new_xy = {"x": new_x, "y": new_y};
			flood_fill_fn(new_xy, max_x, max_y, walkable_key_lst, connected_lst);
		}
	};
	
    var doFillLevelRandomly = function (lvl) {
        var x, y, u;
		var top_xy, bottom_xy, right_xy, left_xy;
		
        for (x = 0; x < lvl.width; x+= 1) {
            for (y  = 0; u < lvl.height; y += 1) {
                xy = {"x": x, "y": y};
                u = Math.random();
                if (u <= FILL_PROB) {
                    lvl.setTerrainAt(xy, terrain_Wall);
                } else {
                    lvl.setTerrainAt(xy, terrain_Floor);
                }
            }
        }
                    
        
        for (x = 0; x < lvl.width; x += 1) {
            for (y = 0; y < lvl.height; y += 1) {
                xy = {"x": x, "y": y};
                u = Math.random();
                if (u <= FILL_PROB) {
                    lvl.setTerrainAt(xy, terrain_Wall);
                } else {
                    lvl.setTerrainAt(xy, terrain_Floor);
                }
            }
        }
		
		//// borders
		//for (x = 0; x < lvl.width; x += 1) {
			//top_xy = {"x": x, "y": 0};
			//bottom_xy = {"x": x, "y": lvl.height - 1};
			//lvl.setTerrainAt(top_xy, terrain_Wall)
			//lvl.setTerrainAt(bottom_xy, terrain_Wall)
		//}
	
		//for (y = 0; y < lvl.height; y += 1) {
			//left_xy = {"x": 0, "y": y};
			//right_xy = {"x": lvl.width - 1, "y": y};
			//lvl.setTerrainAt(left_xy, terrain_Wall)
			//lvl.setTerrainAt(right_xy, terrain_Wall)
		//}
        
        return true;
    };
	
    var doRandomizeBorders = function (lvl) {
		var x, y, u;
		var top_xy, bottom_xy, right_xy, left_xy;
		
		// top border
		for (x = 0; x < lvl.width; x += 1) {
			top_xy = {"x": x, "y": 0};
			bottom_xy = {"x": x, "y": lvl.height - 1};
			
			u = Math.random();
			if (u < 0.5) {
				lvl.setTerrainAt(top_xy, terrain_Floor);
			} else {
				lvl.setTerrainAt(top_xy, terrain_Wall);
			}
				
			u = Math.random();
			if (u < 0.5) {
				lvl.setTerrainAt(bottom_xy, terrain_Floor);
			} else {
				lvl.setTerrainAt(bottom_xy, terrain_Wall);
			}
		}
		
		// left border
		for (y = 0; y < lvl.height; y += 1) {
			left_xy = {"x": 0, "y": y};
			right_xy = {"x": lvl.width - 1, "y": y};
			
			u = Math.random();
			if (u < 0.5) {
				lvl.setTerrainAt(left_xy, terrain_Floor);
			} else {
				lvl.setTerrainAt(left_xy, terrain_Wall);
			}
				
			u = Math.random();
			if (u < 0.5) {
				lvl.setTerrainAt(right_xy, terrain_Floor);
			} else {
				lvl.setTerrainAt(right_xy, terrain_Wall);
			}
		}
	};
		
    var getSurroundingTerrainTypes = function (xy_loc, lvl, match_type) {
    // grab a list of all surrounding coordinates
        var offset_tiles = [
			{"x": -1, "y": -1}, {"x": -1, "y": 0},
			{"x": -1, "y": 1}, {"x": 0, "y": -1},
			{"x": 0, "y": 1}, {"x": 1, "y": -1}, 
			{"x": 1, "y": 0}, {"x": 1, "y": 1}
		];
		
		var i, terrain, xy;
        
        // keep track of all neighbors that match our specified terrain type
        var matching_xy_lst = [];
        
        for (i = 0; i < offset_tiles.length; i += 1) {
			xy = {"x": xy_loc.x + offset_tiles[i].x, "y": xy_loc.y + offset_tiles[i].y};
			
			// skip "out of bounds"
			if (lvl.isValidCoordinate(xy) === false) {
				continue;
			}

			terrain = lvl.getTerrainAt(xy);
			
            if (compareTerrain(terrain, match_type) === true) {
                matching_xy_lst.push(xy);
			}
		}
        
        return matching_xy_lst;
    };
    
    var doRunCaveAlgorithm = function (lvl) {
    // does 1 pass of the cave gen algorithm
        var terrain, xy_loc, x, y, wall_count, i;
        var match_lst = [];
        // keep track of changes to do AFTER we have a first pass of the algorithm
        var wall_updates_lst = [];
        var floor_updates_lst = [];
        
        for (x = 0; x < lvl.width - 1; x += 1) {
            for (y = 0; y < lvl.height - 1; y += 1) {
                xy_loc = {"x": x, "y": y};
                terrain = lvl.getTerrainAt(xy_loc);
                
                // figure out how many surrounding neighbors are WALLS
                match_lst = getSurroundingTerrainTypes(xy_loc, lvl, terrain_Wall);
                wall_count = match_lst.length;
                
                if (compareTerrain(terrain, terrain_Floor) === true) {
                    if (wall_count >= 5) {
                        wall_updates_lst.push(xy_loc)
                    }
                } else if (wall_count < 4) {
                    floor_updates_lst.push(xy_loc)
                }
            }
        }
        
        // go through our updates and apply them after we're done with a complete pass!!
        for (i = 0; i < wall_updates_lst.length; i += 1) {
            lvl.setTerrainAt(wall_updates_lst[i], terrain_Wall);
        }
        
        for (i = 0; i < floor_updates_lst.length; i += 1) {
            lvl.setTerrainAt(floor_updates_lst[i], terrain_Floor);
        }
        
        return true;
    };
    
    var doGenerateCave = function (dungeon, N) {
        var x;
        
        for (x = 0; x < N; x += 1) {
            doRunCaveAlgorithm(dungeon);
        }
    };
    
    var checkForConnectedness = function (lvl) {
		var is_connected = true;
	
		// first get a list of all walkable tiles in this level
		var walkable = lvl.getWalkableLocations();
		var walkable_xy_lst = walkable.walkable_xy;
		var walkable_key_lst = walkable.walkable_key;
		
		// now start at the first walking square and flood fill
		var connected_lst = [];
		var start_xy = walkable_xy_lst[0];
		flood_fill_fn(start_xy, lvl.width, lvl.height, walkable_key_lst, connected_lst);
		
		// if we didn't flood fill to all walkable points we have some disconnected areas
		if (walkable_xy_lst.length !== connected_lst.length) {
			is_connected = false;
		}
		
		return {"is_connected": is_connected, "start_xy": start_xy};
	};
	
    // public
    that.createRandomCaveLevel = function (width, height) {
        // return a (mostly) connected random cave level
        var attempt = 1;
        var result, dungeon, start_xy;
        
        while (1 === 1) {
            dungeon = levelFactory({'width': width, 'height': height});
            doFillLevelRandomly(dungeon);
            doGenerateCave(dungeon, 2);
            result = checkForConnectedness(dungeon);
			
            // check passing criteria
            if (result.is_connected === true) {
                start_xy = result.start_xy;
                break;
            }
            
            attempt += 1;
			//if (attempt > 100) {
				//break;
			//}
        }
		alert("attempts: " + attempt);
		
		//doRandomizeBorders(dungeon);
		
		//dungeon = levelFactory({'width': width, 'height': height});
		//doFillLevelRandomly(dungeon);
		//doGenerateCave(dungeon, 2);
		//start_xy = {x: 0, y: 0};
		
        return {"level": dungeon, "start_xy": start_xy};
    };
    
    return that;
};