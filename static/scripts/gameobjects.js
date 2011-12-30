var idGenerator = (function ( ) {
    var counter = Math.floor(Math.random() * 1000000);
    
    return {
        new_id: function ( ) {
            counter += 1;
            return counter;
        }
    }
})();

var getId = function ( ) {

};

var compareCoords = function (grid1_xy, grid2_xy) {
    return grid1_xy.x === grid2_xy.x && grid1_xy.y === grid2_xy.y;
};

var compareTerrain = function (t1, t2) {
    return t1.getName() === t2.getName();
};

var compareItemToFamily = function (i1, f2) {
    return compareItemFamily(i1.getFamily(), f2);
};

var compareItemFamily = function (f1, f2) {
    return f1.getName() === f2.getName();
};

var xyKey = function (grid_xy) {
    return grid_xy.x + "+" + grid_xy.y;
};

var keyXY = function (key) {
    var arr = key.split("+");
    return {"x": arr[0], "y": arr[1]};
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
    that.id = idGenerator.new_id();
    that.objtype = 'terrain';
    that.getName = function ( ) { return my.name; };
    that.isWalkable = function ( ) { return my.is_walkable; };
    that.isOpaque = function ( ) { return my.is_opaque; };
    that.getCode = function ( ) { return my.code; };
    that.getColor = function ( ) { return my.color; };
    that.getBackgroundColor = function ( ) { return my.bg_color; };

    return that;
};

var featureFactory = function (spec) {
    // other private instance variables
    
    // my private
    var my = {};
    my.name = spec.name;
    my.code = spec.code || 'NONE';
    my.color = spec.color || colors.transparent;
    my.bg_color = spec.bg_color || colors.transparent;
    
    // that public
    var that = {};
    that.id = idGenerator.new_id();
    that.objtype = 'feature';
    that.getName = function ( ) { return my.name; };
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
    that.id = idGenerator.new_id();
    that.objtype = 'item_family';
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

    // some items in the same family can have different codes (bootay)
    if (spec.code === undefined) {
        my.code = my.family.getCode();
    } else {
        my.code = spec.code;
    }
    
    // that public
    var that = {};
    that.id = idGenerator.new_id();
    that.objtype = 'item';
    that.getName = function ( ) { return my.name; };
    that.getFamily = function ( ) { return my.family; };
    that.getCode = function ( ) { return my.code; };
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
    that.id = idGenerator.new_id();
    that.objtype = 'monster_family';
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
    my.equip = {};
    my.fov = {};
    my.aware = [];
    my.memory = {};
    
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
    that.objtype = 'monster';
    that.id = idGenerator.new_id();
    that.health = 10;
    
    that.getName = function ( ) { return my.name; };
    that.getFamily = function ( ) { return my.family; };
    that.getColor = function ( ) { return my.color; };
    that.setColor = function (new_color) { my.color = new_color; };
    that.getBackgroundColor = function ( ) { return my.bg_color; };
    that.getCode = function ( ) { return my.family.getCode(); };
    that.getLocation = function ( ) { return my.location; };
    
    that.setLocation = function (grid_xy) {
        my.location = grid_xy;
        return true;
    };
    
    // INVENTORY
    //////////////////////////////////////////////////
    that.inventoryAdd = function (item) {
        if (my.inventory.length === constants.inventory_max_items) {
            return false;
        }
        my.inventory.push(item);
        return true;
    };
    
    that.inventoryRemove = function (index) {
        my.inventory.splice(index, 1);
    };
    
    that.inventoryGet = function ( ) {
        return my.inventory;
    };
    
    // EQUIPMENT
    //////////////////////////////////////////////////
    that.equipGet = function (equip_slot) {
        var e = my.equip[equip_slot];
        
        if (e === undefined) {
            return null;
        } else {
            return e;
        }
    };
    
    that.equipSet = function (equip_slot, inv_result) {
        // see what's already there
        var current = that.equipGet(equip_slot);
        
        my.equip[equip_slot] = inv_result.item;
        

        if (current === null) {
            my.inventory.splice(inv_result.index, 1);
        } else {
            // replace the old one back to inventory
            my.inventory[inv_result.index] = current;
        }
    };
    
    // F. O. V.
    //////////////////////////////////////////////////
    that.getFovAt = function (grid_xy) {
        var key = xyKey(grid_xy);
        var fov = my.fov[key];
        
        if (fov === undefined) {
            return null;
        } else {
            return fov;
        }
    };
    
    that.setFovAt = function (grid_xy) {
        var key = xyKey(grid_xy);
        my.fov[key] = true;
        
        return true;
    };
    
    that.clearFov = function ( ) {
        my.fov = {};
        my.aware = [];
    };
    
    that.getFov = function ( ) { return my.fov; };
    
    that.addAware = function (thing) {
        my.aware.push(thing.id);
    };
    
    that.isAware = function (thing) {
        return $.inArray(thing.id, my.aware) > -1;
    };
    
    // MEMORY
    //////////////////////////////////////////////////
    that.getMemoryAt = function (grid_xy) {
        var key = xyKey(grid_xy);
        var memory = my.memory[key];
        
        if (memory === undefined) {
            return null;
        } else {
            return memory;
        }
    };
    
    that.setMemoryAt = function (grid_xy, mem_obj) {
        var key = xyKey(grid_xy);
        my.memory[key] = mem_obj;
        
        return true;
    };
    
    that.clearMemory = function ( ) {
        my.memory = {};
    };
    
    //that.getMemory = function ( ) { return my.memory; };
    
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
    my.features = {};
    
    // that public
    var that = {};
    that.id = idGenerator.new_id();
    that.width = my.width;
    that.height = my.height;
    that.depth = my.depth;
    
    that.getTerrainAt = function (grid_xy) {
        var key = xyKey(grid_xy);
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
        
        var key = xyKey(grid_xy);
        my.terrain[key] = terrain;
        
        return true;
    };
    
    that.getFeatureAt = function (grid_xy) {
        var key = xyKey(grid_xy);
        var feat = my.features[key];
        
        if (feat === undefined) {
            return null;
        } else {
            return feat;
        }
    };
    
    that.setFeatureAt = function (grid_xy, feat) {
        if (that.isValidCoordinate(grid_xy) === false) {
            return false;
        }
        
        var key = xyKey(grid_xy);
        my.features[key] = feat;
        
        return true;
    };
    
    that.getItemAt = function (grid_xy) {
        var key = xyKey(grid_xy);
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
        
        var key = xyKey(grid_xy);
        my.items[key] = item;
        
        return true;
    };
    
    that.removeItemAt = function (grid_xy) {
        if (that.isValidCoordinate(grid_xy) === false) {
            return false;
        }
        
        var key = xyKey(grid_xy);
        
        delete my.items[key];
        return true;
    };
   
    that.getMonsterAt = function (grid_xy) {
        var key = xyKey(grid_xy);
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
        
        var key = xyKey(grid_xy);
        my.monsters[key] = mob;
        mob.setLocation(grid_xy);
        return true;
    };
    
    that.removeMonsterAt = function (grid_xy) {
        if (that.isValidCoordinate(grid_xy) === false) {
            return false;
        }
        
        var key = xyKey(grid_xy);
        
        delete my.monsters[key];
        return true;
    };
    
    that.getMonsters = function ( ) {
        var m, monsters = [];
        for (m in my.monsters) {
            if (my.monsters.hasOwnProperty(m)) {
                monsters.push(my.monsters[m]);
            }
        }
        
        return monsters;
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

var itemFamily_Blade = itemFamilyFactory({name: 'blade', code: 'SLASH', color: colors.steel});
var itemFamily_Firearm = itemFamilyFactory({name: 'firearm', code: 'GUN_RIGHT', color: colors.hf_orange});
var itemFamily_Flask = itemFamilyFactory({name: 'flask', code: 'BANG', color: colors.pink});
var itemFamily_Booty = itemFamilyFactory({name: 'booty', code: 'DOLLAR', color: colors.yellow});

var terrain_Floor = terrainFactory({name: 'floor', code: 'PERIOD'});
var terrain_Wall = terrainFactory({name: 'wall', code: 'HASH', is_walkable: false, is_opaque: true});
var terrain_Chasm = terrainFactory({name: 'chasm', code: 'COLON', is_walkable: false});

var feature_Blood = featureFactory({name: 'blood', color: colors.blood}); //code: 'APPROX', 
//var feature_PoolOfBlood = featureFactory({name: 'blood', bg_color: colors.red}); //code: 'APPROX', 
var feature_PoolOfBlood = featureFactory({name: 'blood', code: 'BLOOD_0', color: colors.blood}); //code: 'APPROX', 

var monsterFamily_Player = monsterFamilyFactory({name: 'player', code: 'AT', color: colors.hf_blue});
var monsterFamily_Monkey = monsterFamilyFactory({name: 'monkey', code: 'm', color: colors.maroon});

////////////////////////////////////////////////////////////

