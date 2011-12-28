var grogue = function ($, tilecodes, level_gen) {
  var that = {};
  // canvas + contexts
  var ctx_game, cnv_copy, ctx_copy, ctx_inventory, ctx_equip;
  
  // gridmanglers
  var my_grid, my_inv_grid, my_equip_grid;
  
  // tiles
  var my_tiles, my_tile_codes = tilecodes;
  
  // global game consts
  var my_dungeon, my_player;
  
  // sounds
  var my_audio = document.createElement('audio');
  var my_sounds = {};
  
  var my_level_generator = level_gen;
  //var my_terrain = {};
  var my_screen = {"x": 0, "y": 0, "width": constants.game_tiles_width, "height": constants.game_tiles_height};
  
  ////////////////////////////////////////////////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////////////////////////////////////////////////
  
  updateScreenOffset = function ( ) {
	var orig_screen = {"x": my_screen.x, "y": my_screen.y};
	var x, y, w2, h2;
	
	// center on player coords
	var player_xy = my_player.getLocation();
	w2 = Math.floor(my_screen.width / 2);
	h2 = Math.floor(my_screen.height / 2);
	
	x = Math.min(my_dungeon.width - my_screen.width, Math.max(0, player_xy.x - w2));
	y = Math.min(my_dungeon.height - my_screen.height, Math.max(0, player_xy.y - h2));
	
	my_screen.x = x;
	my_screen.y = y;
	
	return ((my_screen.x !== orig_screen.x) || (my_screen.y !== orig_screen.y));
  };
  
  var updatePlayerFov = function ( ) {
  // return an array of squares that had their FOV/light value change
  
	var blocked, visit, player_xy, new_map, previous_map, a, changed = [], now_lit = [], now_unlit = [];
	
	previous_map = my_player.getFov();
	my_player.clearFov();
  
	blocked = function (x, y) {
	  var t = my_dungeon.getTerrainAt({"x": x, "y": y});
	  if (t !== null) {
		return (t.isOpaque());
	  } else {
		return true;
	  }
	};
	
	visit = function (x, y) {
	  var xy = {"x": x, "y": y};
	  if (my_dungeon.isValidCoordinate(xy) === true) {
		my_player.setFovAt(xy);
	  }
	};
	
	// run fov caster
	player_xy = my_player.getLocation();
	fieldOfView(player_xy.x, player_xy.y, 10, visit, blocked);
	new_map = my_player.getFov();
	
	// see what squares are new appearances
	for (a in new_map) {
	  if (new_map.hasOwnProperty(a)) {
		if ((new_map[a] === true) && (previous_map[a] === undefined)) {
		  now_lit.push(a);
		} 
	  }
	}
	
	// see what squares have disappeared
	for (a in previous_map) {
	  if (previous_map.hasOwnProperty(a)) {
		if ((new_map[a] === undefined) && (previous_map[a] === true)) {
		  now_unlit.push(a);
		}
	  }
	}

	changed = now_lit.concat(now_unlit);
	return changed;
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // DRAWING + GRAPHICS
  ////////////////////////////////////////////////////////////////////////////////

  drawGame = function ( ) {
  // redraw every tile on the game screen
  
    var x, y;
    
    for (x = 0; x < constants.game_tiles_width; x += 1) {
      for (y = 0; y < constants.game_tiles_height; y += 1) {
        drawGridAt({"x": x, "y": y});
      }
    }
  };
  
  drawInventory = function ( ) {
  // update the inventory box on screen
	
	var i, x, y, gx, gy, item, fore_color;
	var inventory = my_player.inventoryGet();
	
	for (i = 0; i < constants.inventory_max_items; i += 1) {
	  x = i % constants.inventory_tiles_width;
	  y = Math.floor(i / constants.inventory_tiles_width);
	  gx = x * constants.tile_dst_width;
	  gy = y * constants.tile_dst_height;
	  
	  if (i < inventory.length) {
		item = inventory[i];
		fore_color = item.getColor();
		drawTileOn(ctx_inventory, my_tile_codes[item.getCode()], gx, gy, constants.tile_dst_width, constants.tile_dst_height, fore_color, colors.normal_bg);
	  } else {
		drawTileOn(ctx_inventory, my_tile_codes['SPACE'], gx, gy, constants.tile_dst_width, constants.tile_dst_height, colors.normal_fore, colors.normal_bg);
	  }
	}
  };
  
  var drawEquipment = function ( ) {
  // update the equip canvas / box on screen
  
	var blade, firearm, i;
	
	blade = my_player.equipGet(constants.equip.blade);
	firearm = my_player.equipGet(constants.equip.firearm);
	
	if (blade !== null) {
	  drawTileOn(ctx_equip, my_tile_codes[blade.getCode()], 0, 0, constants.tile_dst_width, constants.tile_dst_height, blade.getColor(), colors.normal_bg);
	} else {
	  drawTileOn(ctx_equip, my_tile_codes['SPACE'], 0, 0, constants.tile_dst_width, constants.tile_dst_height, colors.normal_fore, colors.normal_bg);
	}
	
	if (firearm !== null) {
	  drawTileOn(ctx_equip, my_tile_codes[firearm.getCode()], constants.tile_dst_width, 0, constants.tile_dst_width, constants.tile_dst_height, firearm.getColor(), colors.normal_bg);
	} else {
	  drawTileOn(ctx_equip, my_tile_codes['SPACE'], constants.tile_dst_width, 0, constants.tile_dst_width, constants.tile_dst_height, colors.normal_fore, colors.normal_bg);
	}
  };
  
  drawTileOn = function (context, tile_code, x, y, width, height, fore_color, bg_color, clear_first) {
    // prep copy canvas
    ctx_copy.clearRect(0, 0, constants.tile_dst_width, constants.tile_dst_height);
	ctx_copy.globalCompositeOperation = "source-over";
	
	// draw onto copy
	my_tiles.drawTileImage(ctx_copy, tile_code, 0, 0, constants.tile_dst_width, constants.tile_dst_height);
	
	// recolor copy canvas using transparent overlay
	ctx_copy.globalCompositeOperation = "source-in";
	ctx_copy.fillStyle = fore_color;
	ctx_copy.fillRect(0, 0, constants.tile_dst_width, constants.tile_dst_height);
	ctx_copy.fill();
	
	// prep destination canvas
	if (clear_first === undefined || clear_first === true) {
	  context.clearRect(x, y, width, height);
	  
	  // fill destination canvas with BG color
	  context.fillStyle = bg_color;
	  context.fillRect(x, y, width, height);
	}
	
	// draw resulting image from copy to destination
	context.drawImage(cnv_copy, x, y, width, height);
  };
  
  drawMapAt = function (map_xy) {
	var terrain, item, mob, fore_color, bg_color, tile_code, grid_x, grid_y, can_see, memory;
	
	grid_xy = {"x": map_xy.x - my_screen.x, "y": map_xy.y - my_screen.y};

	grid_x = grid_xy.x * constants.tile_dst_width;
	grid_y = grid_xy.y * constants.tile_dst_height;
	
	can_see = my_player.getFovAt(map_xy);
    is_player = compareCoords(map_xy, my_player.getLocation());
    mob = my_dungeon.getMonsterAt(map_xy);
    terrain = my_dungeon.getTerrainAt(map_xy);
    item = my_dungeon.getItemAt(map_xy);
    
    if (can_see === true) {
	  bg_color = terrain.getBackgroundColor();
	  my_player.setMemoryAt(map_xy, terrain);	  
	  
	  if (mob !== null) {
		fore_color = mob.getColor();
		//bg_color = mob.getBackgroundColor();
		tile_code = my_tile_codes[mob.getCode()];
		//drawTileOn(ctx_game, tile_code, grid_x, grid_y, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, false);	
	  }	else  if (item !== null) {
		fore_color = item.getColor();
		//bg_color = item.getBackgroundColor();
		tile_code = my_tile_codes[item.getCode()];
		my_player.setMemoryAt(map_xy, item);	  
		//drawTileOn(ctx_game, tile_code, grid_x, grid_y, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, false);	
	  } else {
		fore_color = terrain.getColor();
		//bg_color = terrain.getBackgroundColor();
		tile_code = my_tile_codes[terrain.getCode()];
	  }
	  
	  drawTileOn(ctx_game, tile_code, grid_x, grid_y, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	  
	} else {
	  memory = my_player.getMemoryAt(map_xy);
	  
	  if (memory === null) {
		drawTileOn(ctx_game, 'SPACE', grid_x, grid_y, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	  } else {
		drawTileOn(ctx_game, my_tile_codes[memory.getCode()], grid_x, grid_y, constants.tile_dst_width, constants.tile_dst_height, colors.memory, colors.normal_bg, true);	
	  }
	}
	
	//context, tile_code, x, y, width, height, fore_color, bg_color) {	
	//drawTileOn(ctx_game, tile_code, grid_x, grid_y, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, false);	
  };
  
  drawGridAt = function (grid_xy) {
    var map_xy;
	
    map_xy = {"x": grid_xy.x + my_screen.x, "y": grid_xy.y + my_screen.y};
	drawMapAt(map_xy);
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // player interactions
  ////////////////////////////////////////////////////////////////////////////////

  doPlayerMove = function (offset_xy) {
	var player_xy, new_xy, terrain, mob, update_scroll, fov_updates, i;
	
	player_xy = my_player.getLocation();
	new_xy = {x: player_xy.x + offset_xy.x, y: player_xy.y + offset_xy.y};
	
	if (my_dungeon.isValidCoordinate(new_xy) !== true) {
	  alert("bad coord");
	  return;
	} 
	
	// check terrain
	terrain = my_dungeon.getTerrainAt(new_xy);
	if (terrain.isWalkable() === false) {
	  alert("you can't walk there");
	  return;
	}
	
	// check other monsters
	mob = my_dungeon.getMonsterAt(new_xy);
	if (mob !== null) {
	  // bumpattack
	  doPlayerBump(mob);
	  return;
	} 
	
	my_dungeon.removeMonsterAt(player_xy);
	my_dungeon.setMonsterAt(new_xy, my_player);
	
	update_scroll = updateScreenOffset();
	fov_updates = updatePlayerFov();
	
	if (update_scroll === true) {
	  // scrolled the screen, so we need to redraw everything anyways
	  drawGame();
	} else {
	  // we can be picky about what to draw
	  drawMapAt(player_xy);
	  drawMapAt(new_xy);
	  
	  for (i = 0; i < fov_updates.length; i += 1) {
		drawMapAt(keyXY(fov_updates[i]));
	  }
	}
  };
  
  var doPlayerBump = function (mob) {
	//alert("POW!");
	my_audio.src = my_sounds['hit_' + Math.floor(Math.random()*5)];
	my_audio.play();
  };
  
  var doPlayerShoot = function (mob) {
	//alert("BANG!");
	my_audio.src = my_sounds['bang_' + Math.floor(Math.random()*5)];
	my_audio.play();
  };
  
  var doPlayerAction = function ( ) {
	var player_xy, item;
	
	player_xy = my_player.getLocation();
	item = my_dungeon.getItemAt(player_xy);
	
	// assume picking up item if one is on the floor
	if (item !== null) {
	  doPlayerPickupItem(item);
	} else {
	  doPlayerYell();
	}
  };
  
  var doPlayerYell = function ( ) {
	var u, text, player_xy;
	
	u = Math.random();
	if (u < 0.334) {
	  text = 'Avast!!';
	} else if (u < 0.667) {
	  text = 'Arrrr!';
	} else {
	  text = 'Yarrr';
	}
	
	// create a speech bubble element
	var bubble = $('<div class="triangle-border">' + text + '</div>');
	
	// position over the speaker
	player_xy = my_player.getLocation();
	bubble[0].style.position = "absolute";
	bubble[0].style.top = ((player_xy.y - my_screen.y) * constants.tile_dst_height) + 'px';
	bubble[0].style.left = ((player_xy.x - my_screen.x) * constants.tile_dst_width) + 'px';
	$('#id_div_container').append(bubble[0]);
	//$(bubble[0]).slideUp(3000);	
	$(bubble[0]).fadeOut(3000)
	
  };
  
  var doPlayerPickupItem = function (item) {
  // move item from level to inventory
	
	var player_xy, success;
  
	success = my_player.inventoryAdd(item);
	
	if (success === true) {
	  player_xy = my_player.getLocation();
	  my_dungeon.removeItemAt(player_xy);

	  if (compareItemToFamily(item, itemFamily_Booty) === true) {
		my_audio.src = my_sounds['booty_' + Math.floor(Math.random()*4)];
		my_audio.play();
	  }
	  
	  drawMapAt(player_xy);
	  drawInventory();
	  
	} else {
	  alert("your inventory is full!");
	}
  
  };
  
  var doPlayerDropItem = function (inv_result) {
  // drop item onto the player's current location
	
	var item, player_xy;
	
	// see where the player is
	player_xy = my_player.getLocation();
	
	// is something there already?
	item = my_dungeon.getItemAt(player_xy);
	
	if (item == null) {
	  my_dungeon.setItemAt(player_xy, inv_result.item);
	  my_player.inventoryRemove(inv_result.index);
	  drawMapAt(player_xy);
	  drawInventory();
	  return true;
	  
	} else {
	  return false;
	}
  };
  
  var doPlayerUseItem = function (inv_result) {
  // use/activate/equip an item from inventory
	
	var equip_slot, item = inv_result.item;
	
	if (compareItemToFamily(item, itemFamily_Blade) === true) {
	  equip_slot = constants.equip.blade;
	} else if (compareItemToFamily(item, itemFamily_Firearm) === true) {
	  equip_slot = constants.equip.firearm;
	} else {
	  // use in some other way.. throwable slot??
	  return;
	}
	
	my_player.equipSet(equip_slot, inv_result);
	
	drawInventory();
	drawEquipment();
  };

  var getInventoryItemFromCoords = function (grid_xy) {
  // returns the inventory item and array index
  
	var inventory = my_player.inventoryGet();
	var i, item;
	
	i = (grid_xy.y * constants.inventory_tiles_width) + grid_xy.x;
	if (i >= inventory.length) {
	  item = null;
	} else {
	  item = inventory[i];
	}
	
	return {"item": item, "index": i};
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // MOUSE EVENTS
  ////////////////////////////////////////////////////////////////////////////////
  var doEventMousedown = function (grid_xy) {
    //$('#id_div_click').html('<p>clicked on grid tile (' + grid_xy.x + ', ' + grid_xy.y + ')</p>');
	var map_xy = {"x": grid_xy.x + my_screen.x, "y": grid_xy.y + my_screen.y};
	var mob = my_dungeon.getMonsterAt(map_xy);
	var is_player = compareCoords(map_xy, my_player.getLocation());
	
	if ((mob !== null) && (!is_player)) {
	  doPlayerShoot(mob);
	}
	
  };
  
  var doEventGainFocus = function (grid_xy) {
    var html, mob, terrain, item, border_color, map_xy;
    
	border_color = colors.white;
    map_xy = {"x": grid_xy.x + my_screen.x, "y": grid_xy.y + my_screen.y};

    mob = my_dungeon.getMonsterAt(map_xy);
    terrain = my_dungeon.getTerrainAt(map_xy);
    item = my_dungeon.getItemAt(map_xy);
	
    if (mob !== null) {
      html = 'a ' + mob.getName() + ' is here';
	  border_color = colors.red;
    } else if (item != null) {
      html = 'you see a ' + item.getName();
    } else {
      html = terrain.getName();
    }
    
    html += ' at (' + map_xy.x + ', ' + map_xy.y + ')';
    $('#id_div_hover').html(html);
    my_grid.drawBorderAt(grid_xy, border_color);
  };
  
  var doEventLeaveFocus = function (grid_xy) {
    drawGridAt(grid_xy);	
  };
  
  var doInventoryEventMousedown = function (grid_xy, shiftKey) {
    
	// figure out what inventory item we just clicked on
	var inv_result = getInventoryItemFromCoords(grid_xy);
	
	if (inv_result.item !== null) {
	  if (shiftKey === true) {
		// drop
		return doPlayerDropItem(inv_result);
	  } else {
		// equip
		return doPlayerUseItem(inv_result);
	  }
	}
	
	return false;
  };
  
  var doInventoryEventGainFocus = function (grid_xy) {
    my_inv_grid.drawBorderAt(grid_xy, "rgba(255, 255, 255, 1.0)");
  };
  
  var doInventoryEventLeaveFocus = function (grid_xy) {
    drawInventory();
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // GAME INIT
  ////////////////////////////////////////////////////////////////////////////////

  initGame = function ( ) {
    var result, i, u, locations, item, mob, booty;
    
    //my_level_generator = level_generator();
    my_player = monsterFactory({name: 'Hero', family: monsterFamily_Player});
    //result = my_level_generator.createRandomCaveLevel(constants.game_tiles_width, constants.game_tiles_height);
	result = my_level_generator.createRandomCaveLevel(constants.game_tiles_width * 2, constants.game_tiles_height * 2);
    my_dungeon = result.level;
    my_dungeon.setMonsterAt(result.start_xy, my_player);
	
	locations = my_dungeon.getWalkableLocations().locations_xy;
	fisherYates(locations);
	
	// add items
	for (i = 0; i < 20; i += 1) {
	  u = Math.random();
	  if (u < 0.33) {
		item = itemFactory({name: 'sword', family: itemFamily_Blade});
	  } else if (u < 0.66) {
		item = itemFactory({name: 'pistol', family: itemFamily_Firearm});
	  } else {
		item = itemFactory({name: 'grog', family: itemFamily_Flask});
	  }
	  my_dungeon.setItemAt(locations[i], item);
	}
	
	// add THE MONKIES
	for (; i < 25; i += 1) {
	  mob = monsterFactory({name: 'monkey', family: monsterFamily_Monkey});
	  my_dungeon.setMonsterAt(locations[i], mob);
	}
	
	for (; i < 30; i += 1) {
	  u = Math.random();
	  if (u < 0.25) {
		booty = itemFactory({family: itemFamily_Booty, name: "pieces o' eight", code: 'CENTS', color: '#DAA520'});
	  } else if (u < 0.5) {
		booty = itemFactory({family: itemFamily_Booty, name: "gold bars", code: 'POUND', color: '#FFD700'});
	  } else if (u < 0.75) {
		booty = itemFactory({family: itemFamily_Booty, name: "silver coins", code: 'DOLLAR', color: '#FFFACD'});
	  } else {
		booty = itemFactory({family: itemFamily_Booty, name: "doubloons", code: 'FRANC', color: colors.yellow});
	  }
	  my_dungeon.setItemAt(locations[i], booty);
	}
	
    initSounds();
    drawEquipment();
    drawInventory();
    updatePlayerFov()
    drawGame();
  };
  
  var initSounds = function ( ) {
	my_sounds['bang_0'] = 'static/audio/bang_0.wav';
	my_sounds['bang_1'] = 'static/audio/bang_1.wav';
	my_sounds['bang_2'] = 'static/audio/bang_2.wav';
	my_sounds['bang_3'] = 'static/audio/bang_3.wav';
	my_sounds['bang_4'] = 'static/audio/bang_4.wav';
	
	my_sounds['hit_0'] = 'static/audio/hit_0.wav';
	my_sounds['hit_1'] = 'static/audio/hit_1.wav';
	my_sounds['hit_2'] = 'static/audio/hit_2.wav';
	my_sounds['hit_3'] = 'static/audio/hit_3.wav';
	my_sounds['hit_4'] = 'static/audio/hit_4.wav';
	
	my_sounds['booty_0'] = 'static/audio/booty_0.wav';
	my_sounds['booty_1'] = 'static/audio/booty_1.wav';
	my_sounds['booty_2'] = 'static/audio/booty_2.wav';
	my_sounds['booty_3'] = 'static/audio/booty_3.wav';
	
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // PUBLIC FUNCTIONS
  ////////////////////////////////////////////////////////////////////////////////
  
  that.init = function ( ) {
  // initalize canvas elements and load game elements
  
	// main canvas display -- game grid
    var canvas = $('#id_cnv_game').get()[0];
    my_grid = gridmangler(canvas, constants.tile_dst_width, constants.tile_dst_height);
    ctx_game = canvas.getContext("2d");
    
    // backup/copy canvas for transparent PNG color conversion
    cnv_copy = document.createElement('canvas');
	cnv_copy.width = constants.tile_dst_width;
	cnv_copy.height = constants.tile_dst_height;
	ctx_copy = cnv_copy.getContext("2d");
    
    // tiles image
	var tiles_img = $("img[src$='"+constants.tiles_image+"']").get()[0];
	my_tiles = eyeofthetiler(tiles_img, constants.tile_src_width, constants.tile_src_height);

    // game grid -- events triggered by gridmangler
    my_grid.addGridEvent("mousedown", doEventMousedown);
    my_grid.addGridEvent("gainfocus", doEventGainFocus);
    my_grid.addGridEvent("leavefocus", doEventLeaveFocus);

	// inventory grid box
	var cnv_inventory = $('#id_cnv_inventory').get()[0];
	ctx_inventory = cnv_inventory.getContext("2d");
    my_inv_grid = gridmangler(cnv_inventory, constants.tile_dst_width, constants.tile_dst_height);
    my_inv_grid.addGridEvent("mousedown", doInventoryEventMousedown);
    my_inv_grid.addGridEvent("gainfocus", doInventoryEventGainFocus);
    my_inv_grid.addGridEvent("leavefocus", doInventoryEventLeaveFocus);
    
    // equip box
	var cnv_equip = $('#id_cnv_equip').get()[0];
	ctx_equip = cnv_equip.getContext("2d");
	my_equip_grid = gridmangler(cnv_equip, constants.tile_dst_width, constants.tile_dst_height);
	
    initGame();
  };

  // keyboard
  ////////////////////////////////////////////////////////////////////////////////
  that.keypress = function (e) {
	var offset_xy;
	if ((e.keyCode === 37) || (e.keyCode == 65)) {
	  // left + a
	  offset_xy = {x: -1, y: 0};
	  doPlayerMove(offset_xy);

	} else if ((e.keyCode === 39) || (e.keyCode == 68)) {
	  // right + d
	  offset_xy = {x: 1, y: 0};
	  doPlayerMove(offset_xy);

	} else if ((e.keyCode === 38) || (e.keyCode == 87)) {
	  // up + w
	  offset_xy = {x: 0, y: -1};
	  doPlayerMove(offset_xy);

	} else if ((e.keyCode === 40) || (e.keyCode == 83)) {
	  // down + s
	  offset_xy = {x: 0, y: 1};
	  doPlayerMove(offset_xy);
	  
	} else if (e.keyCode === 32) {
	  // space
	  doPlayerAction();
	}
  };

  return that;
};