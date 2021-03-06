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

var compareMonsterToFamily = function (m1, f2) {
    return compareMonsterFamily(m1.getFamily(), f2);
};

var compareMonsterFamily = function (f1, f2) {
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

    my.is_container = spec.is_container || false;

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

var mixingBarrelFactory = function (spec) {
    spec.family = lib.itemFamily.mixingbarrel;
    
    var that = itemFactory(spec);
    that.kind = 'mixingbarrel';
    that.is_container = true;
    that.inventory = [];
    
    // INVENTORY
    //////////////////////////////////////////////////
    that.inventoryAdd = function (item) {
        if (this.inventory.length === constants.container_max_items) {
            return false;
        }
        this.inventory.push(item);
        return true;
    };
    
    that.inventoryRemove = function (index) {
        this.inventory.splice(index, 1);
    };
    
    that.inventoryGet = function ( ) {
        return this.inventory;
    };
    
    return that;
};

var containerFactory = function (spec) {
    spec.family = lib.itemFamily.container;
    
    var that = itemFactory(spec);
    that.kind = 'container';
    that.is_container = true;
    that.inventory = [];
    
    // INVENTORY
    //////////////////////////////////////////////////
    that.inventoryAdd = function (item) {
        if (this.inventory.length === constants.container_max_items) {
            return false;
        }
        this.inventory.push(item);
        return true;
    };
    
    that.inventoryRemove = function (index) {
        this.inventory.splice(index, 1);
    };
    
    that.inventoryGet = function ( ) {
        return this.inventory;
    };
    
    return that;
};

var weaponFactory = function (spec) {
    var that = itemFactory(spec);
    that.kind = 'weapon';
    that.damage = spec.damage || 1;
    
    that.getDamage = function ( ) {
        return this.damage;
    };
    
    return that;
};


var bladeFactory = function (spec) {
    spec.family = lib.itemFamily.blade;
    
    var that = weaponFactory(spec);
    that.kind = 'blade';
    
    return that;
};

var firearmFactory = function (spec) {
    spec.family = lib.itemFamily.firearm;
    
    var that = weaponFactory(spec);
    that.kind = 'firearm';
    that.is_loaded = true;
    that.range = spec.range || 5;
    
    that.isLoaded = function ( ) {
        return this.is_loaded;
    };
    
    that.getColor = function ( ) {
        if (this.is_loaded === true) {
            return that.color;
        } else {
            return 'rgb(0, 255, 0)';
        }
    }
    
    return that;
};

var itemFactory = function (spec) {

    var that = {};
    that.name = spec.name;
    that.family = spec.family;
    if (spec.color === undefined) {
        that.color = that.family.getColor();
    } else {
        that.color = spec.color;
    }
    
    if (spec.bg_color === undefined) {
        that.bg_color = that.family.getBackgroundColor();
    } else {
        that.bg_color = spec.bg_color;
    }

    // some items in the same family can have different codes (bootay)
    if (spec.code === undefined) {
        that.code = that.family.getCode();
    } else {
        that.code = spec.code;
    }
    
    that.id = idGenerator.new_id();
    that.objtype = 'item';
    that.kind = 'none';
    that.getName = function ( ) { return that.name; };
    that.getFamily = function ( ) { return that.family; };
    that.getCode = function ( ) { return that.code; };
    that.getColor = function ( ) { return that.color; };
    that.getBackgroundColor = function ( ) { return that.bg_color; };
    
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
    
    my.flags = spec.flags || [];
    
    // that public
    var that = {};
    that.id = idGenerator.new_id();
    that.objtype = 'monster_family';
    that.getName = function ( ) { return my.name; };
    that.getCode = function ( ) { return my.code; };
    that.getColor = function ( ) { return my.color; };
    that.getBackgroundColor = function ( ) { return my.bg_color; };
    
    that.getFlags = function ( ) {
        return my.flags;
    };
    
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
    my.flags = spec.flags || [];
    my.flags = my.flags.concat(my.family.getFlags());
    
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
    that.health = spec.health || 10;
    that.max_health = spec.health || 10;
    that.drunk = 200;
    that.max_drunk = 200;
    that.last_hit = 0;
    
    that.getName = function ( ) { return my.name; };
    that.setName = function (new_name) { my.name = new_name; };
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
    
    that.equipRemove = function (equip_slot) {
        delete my.equip[equip_slot];
        return true;
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
    
    // FLAGS
    //////////////////////////////////////////////////
    that.getFlags = function ( ) {
        return my.flags;
    };
    
    that.addFlag = function (flag) {
        my.flags.push(flag);
        return true;
    };
    
    that.removeFlag = function (flag) {
        var index = $.inArray(flag, my.flags);
        if (index > -1) {
            my.flags.splice(index, 1);
        }
        return true;
    };
    
    that.hasFlag = function (flag) {
        var index = $.inArray(flag, my.flags);
        return index > -1;
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



////////////////////////////////////////////////////////////

