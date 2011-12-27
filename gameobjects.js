var compareCoords = function (grid1_xy, grid2_xy) {
    return grid1_xy.x === grid2_xy.x && grid1_xy.y === grid2_xy.y;
};

var compareTerrain = function (t1, t2) {
    return t1.getName() === t2.getName();
};

var terrainFactory = function (spec) {
    // other private instance variables
    
    // my private
    var my = {};
    my.name = spec.name;
    my.code = spec.code || 'SPACE';
    my.color = spec.color || colors.normal_fore;
    my.bg_color = spec.bg_color || colors.normal_bg;
    
    if (spec.is_walkable === undefined) {
        my.is_walkable = true;
    } else {
        my.is_walkable = spec.is_walkable;
    }
    
    if (spec.is_opaque === undefined) {
        my.is_opaque = false;
    } else {
        my.is_opaque = spec.is_opaque;
    }
    
    // that public
    var that = {};
    that.getName = function ( ) { return my.name; };
    that.isWalkable = function ( ) { return my.is_walkable; };
    that.isOpaque = function ( ) { return my.is_opaque; };
    that.getCode = function ( ) { return my.code; };
    that.getColor = function ( ) { return my.color; };
    that.getBackgroundColor = function ( ) { return my.bg_color; };

    return that;
};

var itemFamilyFactory = function (spec) {
    // other private instance variables
    
    // my private
    var my = {};
    my.name = spec.name;
    my.code = spec.code;
    if (spec.color === undefined) {
        my.color = colors.normal_fore;
    } else {
        my.color = spec.color;
    }

    if (spec.bg_color === undefined) {
        my.bg_color = colors.normal_bg;
    } else {
        my.bg_color = spec.bg_color;
    }
    
    // that public
    var that = {};
    that.getName = function ( ) { return my.name; };
    that.getCode = function ( ) { return my.code; };
    that.getColor = function ( ) { return my.color; };
    that.getBackgroundColor = function ( ) { return my.bg_color; };
    
    return that;
};

var itemFactory = function (spec) {
    // other private instance variables
    
    // my private
    var my = {};
    my.name = spec.name;
    my.family = spec.family;
    if (spec.color === undefined) {
        my.color = my.family.getColor();
    } else {
        my.color = spec.color;
    }
    
    if (spec.bg_color === undefined) {
        my.bg_color = my.family.getBackgroundColor();
    } else {
        my.bg_color = spec.bg_color;
    }

    // that public
    var that = {};
    that.getName = function ( ) { return my.name; };
    that.getFamily = function ( ) { return my.family; };
    that.getCode = function ( ) { return my.family.getCode(); };
    that.getColor = function ( ) { return my.color; };
    that.getBackgroundColor = function ( ) { return my.bg_color; };

    return that;
};

var monsterFamilyFactory = function (spec) {
    // other private instance variables
    
    // my private
    var my = {};
    my.name = spec.name;
    my.code = spec.code;
    if (spec.color === undefined) {
        my.color = colors.normal_fore;
    } else {
        my.color = spec.color;
    }
    
    if (spec.bg_color === undefined) {
        my.bg_color = colors.normal_bg;
    } else {
        my.bg_color = spec.bg_color;
    }
    
    // that public
    var that = {};
    that.getName = function ( ) { return my.name; };
    that.getCode = function ( ) { return my.code; };
    that.getColor = function ( ) { return my.color; };
    that.getBackgroundColor = function ( ) { return my.bg_color; };
    
    return that;
};

var monsterFactory = function (spec) {
    // other private instance variables
    
    // my private
    var my = {};
    my.name = spec.name;
    my.family = spec.family;
    my.location = {};
    my.inventory = [];
    
    if (spec.color === undefined) {
        my.color = my.family.getColor();
    } else {
        my.color = spec.color;
    }
    
    if (spec.bg_color === undefined) {
        my.bg_color = my.family.getBackgroundColor();
    } else {
        my.bg_color = spec.bg_color;
    }
    
    // that public
    var that = {};
    
    that.getName = function ( ) { return my.name; };
    that.getFamily = function ( ) { return my.family; };
    that.getColor = function ( ) { return my.color; };
    that.getBackgroundColor = function ( ) { return my.bg_color; };
    that.getCode = function ( ) { return my.family.getCode(); };
    that.getLocation = function ( ) { return my.location; };
    
    that.setLocation = function (grid_xy) {
        my.location = grid_xy;
        return true;
    }
    
    that.inventoryAdd = function (item) {
        my.inventory.push(item);
    }
    
    that.inventoryGet = function ( ) {
        return my.inventory;
    };
    
    return that;
};

var levelFactory = function (spec) {
    // other private instance variables
    
    // my private
    var my = {};
    my.width = spec.width;
    my.height = spec.height;
    my.depth = spec.depth || 0;
    my.terrain = {};
    my.items = {};
    my.monsters = {};
    
    my.xyKey = function (grid_xy) {
        return grid_xy.x + "+" + grid_xy.y;
    };
    
    my.keyXY = function (key) {
        var arr = key.split("+");
        return {"x": arr[0], "y": arr[1]};
    };
    
    // that public
    var that = {};
    that.width = my.width;
    that.height = my.height;
    that.depth = my.depth;
    
    that.getTerrainAt = function (grid_xy) {
        var key = my.xyKey(grid_xy);
        var terr = my.terrain[key];
        
        if (terr === undefined) {
            return null;
        } else {
            return terr;
        }
    };
    
    that.setTerrainAt = function (grid_xy, terrain) {
        if (that.isValidCoordinate(grid_xy) === false) {
            return false;
        }
        
        var key = my.xyKey(grid_xy);
        my.terrain[key] = terrain;
        
        return true;
    };
    
    that.getItemAt = function (grid_xy) {
        var key = my.xyKey(grid_xy);
        var item = my.items[key];
        
        if (item === undefined) {
            return null;
        } else {
            return item;
        }
    };
    
    that.setItemAt = function (grid_xy, item) {
        if (that.isValidCoordinate(grid_xy) === false) {
            return false;
        }
        
        var key = my.xyKey(grid_xy);
        my.items[key] = item;
        
        return true;
    };
    
    that.removeItemAt = function (grid_xy) {
        if (that.isValidCoordinate(grid_xy) === false) {
            return false;
        }
        
        var key = my.xyKey(grid_xy);
        
        delete my.items[key];
        return true;
    };
   
    that.getMonsterAt = function (grid_xy) {
        var key = my.xyKey(grid_xy);
        var mob = my.monsters[key];
        
        if (mob === undefined) {
            return null;
        } else {
            return mob;
        }
    };
    
    that.setMonsterAt = function (grid_xy, mob) {
        if (that.isValidCoordinate(grid_xy) === false) {
            return false;
        }
        
        var key = my.xyKey(grid_xy);
        my.monsters[key] = mob;
        mob.setLocation(grid_xy);
        return true;
    };
    
    that.removeMonsterAt = function (grid_xy) {
        if (that.isValidCoordinate(grid_xy) === false) {
            return false;
        }
        
        var key = my.xyKey(grid_xy);
        
        delete my.monsters[key];
        return true;
   };
    
    that.isValidCoordinate = function (grid_xy) {
        if (grid_xy === undefined) {
            alert("arg");
            return false;
        }
        
        if (grid_xy.x < 0 || grid_xy.y < 0) {
            return false;
        } else if (grid_xy.x >= my.width || grid_xy.y >= my.height) {
            return false;
        } else {
            return true;
        }
    };
    
    that.getWalkableLocations = function ( ) {
    // return an array of walkable coordinates for this level
        var walkable = [], walkable_str = [];
        var terrain, x, y, xy, key;
        
        for (x = 0; x < this.width; x += 1) {
            for (y = 0; y < this.height; y += 1) {
                xy = {"x": x, "y": y};
                key = x + "+" + y;
                terrain = this.getTerrainAt(xy);
                if (terrain.isWalkable() === true) {
                    walkable.push(xy);
                    walkable_str.push(key);
                }
            }
        }
        
        return {"locations_xy": walkable, "locations_key": walkable_str};
    };
    
    return that;
};

////////////////////////////////////////////////////////////

var monsterFamily_Player = monsterFamilyFactory({name: 'player', code: 'AT', color: colors.hf_blue});
var itemFamily_Weapon = itemFamilyFactory({name: 'weapon', code: 'SLASH', color: colors.hf_orange});
var terrain_Floor = terrainFactory({name: 'floor', code: 'PERIOD'});
var terrain_Wall = terrainFactory({name: 'wall', code: 'HASH', is_walkable: false});

////////////////////////////////////////////////////////////

//var createDungeon = function (width, height) {
    //var x, y;
    //var dungeon = levelFactory({'width': width, 'height': height});

    //var weapon = itemFamilyFactory({'name': 'weapon', 'code': 'SLASH'});
    //var sword = itemFactory({'name': 'sword', 'family': weapon});
    
    //var crabs = monsterFamilyFactory({'name': 'crabs', 'code': 'C'});
    //var giant_crab = monsterFactory({name: 'giant crab', family: crabs});

    //for (x = 0; x < dungeon.width; x += 1) {
        //for (y = 0; y < dungeon.height; y += 1) {
            //dungeon.setTerrainAt({"x": x, "y": y}, terrain_Floor);
        //}
    //};
    
    //dungeon.setItemAt({"x": 2, "y": 2}, sword);
    //dungeon.setMonsterAt({"x": 4, "y": 3}, giant_crab);
    //return dungeon;
//};
