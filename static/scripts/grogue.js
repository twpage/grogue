var grogue = function ($, tilecodes, level_gen) {
  var my_version = 'version 0.5: "11-day version"';
  
  var that = {};
  // canvas + contexts
  var my_game_over = false;
  var cnv_copy, cnv_container;
  var ctx_game, ctx_copy, ctx_inventory, ctx_equip, ctx_playerinfo, ctx_hoverinfo, ctx_container;
  
  // gridmanglers
  var my_grid, my_inv_grid, my_equip_grid, my_container_grid;
  
  // tiles
  var my_tiles, my_tile_codes = tilecodes;
  
  // global game consts
  var my_dungeon, my_player, my_open_container, my_container_is_open = false;
  
  // sounds
  var my_audio = document.createElement('audio');
  var my_sounds = {};
  
  var my_level_generator = level_gen;
  //var my_terrain = {};
  var my_screen = {"x": 0, "y": 0, "width": constants.game_tiles_width, "height": constants.game_tiles_height};
  
  var my_turn = 0;
  
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
  
  var updateFov = function (mob) {
  // return an array of squares that had their FOV/light value change
  
	var blocked, visit, start_xy, new_map, previous_map, a, changed = [], now_lit = [], now_unlit = [];
	
	previous_map = mob.getFov();
	mob.clearFov();
  
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
		mob.setFovAt(xy);
		var other_mob = my_dungeon.getMonsterAt(xy);
		if (other_mob !== null && other_mob.is_invisible !== true) {
		  mob.addAware(other_mob);
		} //else {
		  //var item = my_dungeon.getItemAt(xy);
		
	  }
	};
	
	// run fov caster
	start_xy = mob.getLocation();
	fieldOfView(start_xy.x, start_xy.y, 10, visit, blocked);
	new_map = mob.getFov();
	
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

  var drawGame = function ( ) {
  // redraw every tile on the game screen
  
    var x, y;
    
    for (x = 0; x < constants.game_tiles_width; x += 1) {
      for (y = 0; y < constants.game_tiles_height; y += 1) {
        drawGridAt({"x": x, "y": y});
      }
    }
  };
  
  var drawInventory = function ( ) {
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
  
  var drawHoverInfo = function (hover_thing, equipped, map_xy) {
  // updates whenever player hovers over something.. inventory items, monster, equipment, etc
	var text, half_height = constants.tile_dst_height / 2, col_2 = constants.hoverinfo_width / 2;
	
	// clear it first
	ctx_hoverinfo.fillStyle = colors.normal_bg;
	ctx_hoverinfo.fillRect(0, 0, constants.hoverinfo_width, constants.hoverinfo_height);
	
	// just clear and exit if we were intentially passed a NULL item
	if (hover_thing === null) {
	  return;
	}
	
	ctx_hoverinfo.font = '14px Verdana';	
	ctx_hoverinfo.textBaseline = 'middle';

	drawTileOn(ctx_hoverinfo, my_tile_codes[hover_thing.getCode()], 0, 0, constants.tile_dst_width, constants.tile_dst_height, hover_thing.getColor(), colors.normal_bg);
	ctx_hoverinfo.fillStyle = colors.white;
	ctx_hoverinfo.fillText(hover_thing.getName(), constants.tile_dst_width, half_height, constants.hoverinfo_width)
	
	if (hover_thing.objtype === 'item') {
	  if (equipped && hover_thing.kind === 'firearm') {
		text = "Dmg: " + hover_thing.getDamage();
		ctx_hoverinfo.fillText(text, 0, half_height*2, constants.hoverinfo_width)

		text = "Range: " + hover_thing.range;
		ctx_hoverinfo.fillText(text, col_2, half_height*2, constants.hoverinfo_width)
		
		text = hover_thing.isLoaded() ? "Loaded " : "Unloaded";
		ctx_hoverinfo.fillText(text, 0, half_height*3, constants.hoverinfo_width)

	  } else if (equipped && hover_thing.kind === 'blade') {
		text = "Dmg: " + hover_thing.getDamage();
		ctx_hoverinfo.fillText(text, 0, half_height*2, constants.hoverinfo_width)

	  } 
	} else if (hover_thing.objtype === 'mob') {
	  
	} else if (hover_thing.objtype === 'terrain' && map_xy !== undefined) {
	  ////feature = my_dungeon.getFeatureAt(map_xy);
	  
	  //if (feature_bg_color !== colors.transparent) {
		//bg_color = feature_bg_color;
	  //}
	  //if (feature_fore_color !== colors.transparent) {
	  //fore_color = feature_fore_color;
	  //}
	  
	  //if (feature_code !== 'NONE') {
	  //tile_code = my_tile_codes[feature_code];
	  //}
	}
  };
  
  var drawContainer = function ( ) {
  // shows up when you open a container
	
	// clear it first
	ctx_container.fillStyle = colors.normal_bg;
	ctx_container.fillRect(0, 0, constants.container_width, constants.container_height);
	
	var i, x, y, gx, gy, item, fore_color;
	var inventory = my_open_container.inventoryGet();
	
	for (i = 0; i < constants.container_max_items; i += 1) {
	  x = i % constants.container_tiles_width;
	  y = Math.floor(i / constants.container_tiles_width);
	  gx = x * constants.tile_dst_width;
	  gy = y * constants.tile_dst_height;
	  
	  if (i < inventory.length) {
		item = inventory[i];
		fore_color = item.getColor();
		drawTileOn(ctx_container, my_tile_codes[item.getCode()], gx, gy, constants.tile_dst_width, constants.tile_dst_height, fore_color, colors.normal_bg);
	  } else {
		drawTileOn(ctx_container, my_tile_codes['SPACE'], gx, gy, constants.tile_dst_width, constants.tile_dst_height, colors.normal_fore, colors.normal_bg);
	  }
	}
	
  }
	
  var drawPlayerInfo = function ( ) {
  // player name, health, drunkenness, etc!
  
	ctx_playerinfo.fillStyle = colors.normal_bg;
	ctx_playerinfo.fillRect(0, 0, constants.playerinfo_width, constants.playerinfo_height);
	
	// player name + class
	ctx_playerinfo.font = '20px Verdana';	
	ctx_playerinfo.textBaseline = 'top';
	ctx_playerinfo.fillStyle = colors.white;
	
	ctx_playerinfo.fillText(my_player.getName(), 0, 0, constants.playerinfo_width);
	ctx_playerinfo.font = '14px Verdana';	
	ctx_playerinfo.fillText("Level 1 Deck-swabber", 0, 20, constants.playerinfo_width);
	
	// Health
	drawHealthBar(ctx_playerinfo, 0, 40, constants.playerinfo_width - 2, 20, colors.hf_blue, colors.grey, my_player.health, my_player.max_health);
	ctx_playerinfo.strokeStyle = colors.white;
	ctx_playerinfo.strokeRect(0, 40, constants.playerinfo_width - 2, 20);
	ctx_playerinfo.fillStyle = colors.white;	
	ctx_playerinfo.fillText("Health: " + my_player.health, 2, 40, constants.playerinfo_width - 2);

	if (my_player.drunk > my_player.max_drunk) {
	  drawHealthBar(ctx_playerinfo, 0, 62, constants.playerinfo_width - 2, 20, colors.green, colors.grey, my_player.drunk, my_player.max_drunk);
	} else {
	  drawHealthBar(ctx_playerinfo, 0, 62, constants.playerinfo_width - 2, 20, colors.hf_blue, colors.grey, my_player.drunk, my_player.max_drunk);
	}
	ctx_playerinfo.strokeStyle = colors.white;
	ctx_playerinfo.strokeRect(0, 62, constants.playerinfo_width - 2, 20);
	ctx_playerinfo.fillStyle = colors.white;	
	ctx_playerinfo.fillText("Drunkenness: " + my_player.drunk, 2, 62, constants.playerinfo_width - 2);
  };
  
  var drawHealthBar = function (context, x, y, max_width, height, color_full, color_empty, health, max_health) {
  
	var width;
	
	// draw blank rectangle
	
	context.fillStyle = color_empty;
	context.fillRect(x, y, max_width, height);
	
	// figure out how healthy we are
	width = Math.round(Math.min(1.0, health / max_health) * max_width, 0);
	context.fillStyle = color_full;
	context.fillRect(x, y, width, height);
  };
  
  var drawEquipment = function ( ) {
  // update the equip canvas / box on screen
  
	var ready_item, blade, firearm, i, x, y, w, h, things, pistol_words, names;
	
	// clear existing frame
	ctx_equip.fillStyle = colors.normal_bg;
	ctx_equip.fillRect(0, 0, constants.equip_width, constants.equip_height);
	
	// see what we have equipped
	blade = my_player.equipGet(constants.equip.blade);
	firearm = my_player.equipGet(constants.equip.firearm);
	ready_item = my_player.equipGet(constants.equip.ready_item);
	
	things = [blade, firearm, ready_item];
	pistol_words = (firearm === null || firearm.isLoaded()) ? 'Pistol (click)' : 'Pistol (Space to reload)';
	names = ['Blade (bump-attack)', pistol_words, 'Throw (shift-click, Q to Use)'];
	
	ctx_equip.textBaseline = 'middle';
	ctx_equip.font = '10px Verdana';
	w = constants.tile_dst_width - 3;
	h = constants.tile_dst_height - 3;
	
	for (i = 0; i < things.length; i += 1) {
	  x = 2;
	  y = (h * i) + (i * 2) + 2;
	  
	  ctx_equip.strokeStyle = colors.white;
	  ctx_equip.strokeRect(x, y, w, h);
	  if (things[i] !== null) {
		drawTileOn(ctx_equip, my_tile_codes[things[i].getCode()], x, y, w, h, things[i].getColor(), colors.normal_bg);
	  } else {
		drawTileOn(ctx_equip, my_tile_codes['SPACE'], x, y, w, h, colors.normal_fore, colors.normal_bg);
	  }
	  
	  ctx_equip.fillStyle = colors.white;
	  ctx_equip.fillText(names[i], x + 25, y + 16, constants.equip_width - x - 25);
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
  
  var drawMapAt = function (map_xy) {
	var terrain, item, feature, mob, fore_color, bg_color, tile_code, grid_x, grid_y, can_see, memory;
	var feature_bg_color, feature_fore_color, feature_code;
	
	grid_xy = {"x": map_xy.x - my_screen.x, "y": map_xy.y - my_screen.y};

	grid_x = grid_xy.x * constants.tile_dst_width;
	grid_y = grid_xy.y * constants.tile_dst_height;
	
	can_see = my_player.getFovAt(map_xy);
	
    is_player = compareCoords(map_xy, my_player.getLocation());
    mob = my_dungeon.getMonsterAt(map_xy);
    terrain = my_dungeon.getTerrainAt(map_xy);
    item = my_dungeon.getItemAt(map_xy);
    feature = my_dungeon.getFeatureAt(map_xy);
	
    if (can_see === true) {
	  // by default, use the terrain background color
	  bg_color = terrain.getBackgroundColor();
	  // by default, remember the terrain was here
	  my_player.setMemoryAt(map_xy, terrain);	  
	  
	  // replace terrain background with feature background color if one exists
	  if (feature !== null) {
		feature_bg_color = feature.getBackgroundColor();
		if (feature_bg_color !== colors.transparent) {
		  bg_color = feature_bg_color;
		}
	  }
	  
	  if (mob !== null) {
		fore_color = mob.getColor();
		//bg_color = mob.getBackgroundColor();
		tile_code = my_tile_codes[mob.getCode()];

	  }	else  if (item !== null) {
		fore_color = item.getColor();
		tile_code = my_tile_codes[item.getCode()];
		my_player.setMemoryAt(map_xy, item); // remember items

	  } else {
		// by default, use the color + code of the terrain
		fore_color = terrain.getColor();
		tile_code = my_tile_codes[terrain.getCode()];

		if (feature !== null) {
		  feature_fore_color = feature.getColor();
		  feature_code = feature.getCode();
		  
		  if (feature_fore_color !== colors.transparent) {
			fore_color = feature_fore_color;
		  }
		  
		  if (feature_code !== 'NONE') {
			tile_code = my_tile_codes[feature_code];
		  }
		}
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

  var endPlayerTurn = function ( ) {
	my_turn += 1;
	
	// used up some alcohol
	if (my_turn % 2 === 0) {
	  my_player.drunk -= 1;
	}
	
	// heal wounds
	if (my_player.health < my_player.max_health && my_player.drunk > 1 && (my_turn - my_player.last_hit) >= 10) {
	  my_player.drunk -= 1;
	  my_player.health += 1;
	}
	
	drawPlayerInfo();
	doMonsterTurns();
  };
  
  doPlayerMove = function (offset_xy) {
	var player_xy, new_xy, terrain, mob, update_scroll, fov_updates, i;
	
	player_xy = my_player.getLocation();
	new_xy = {x: player_xy.x + offset_xy.x, y: player_xy.y + offset_xy.y};
	
	if (my_dungeon.isValidCoordinate(new_xy) !== true) {
	  //alert("bad coord");
	  return;
	} 
	
	// check terrain
	terrain = my_dungeon.getTerrainAt(new_xy);
	if (terrain.isWalkable() === false) {
	  //alert("you can't walk there");
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
	fov_updates = updateFov(my_player);
	
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
	
	endPlayerTurn();
  };
  
  var doPlayerBump = function (mob) {
  // melee attack a monster
  
	var melee_weapon, damage;
	
	my_audio.src = my_sounds['hit_' + Math.floor(Math.random()*5)];
	my_audio.play();
	
	melee_weapon = my_player.equipGet(constants.equip.blade);
	damage = (melee_weapon !== null) ? melee_weapon.getDamage() : 1;
	  
	
	doMobDamage(mob, damage);
	endPlayerTurn();
  };
  
  var calcShotAccuracy = function (fire_xy, target_xy) {
	var prob, dist2d, xdiff, ydiff;
	var max_range, min_range, min_prob, max_prob;
	
	xdiff = target_xy.x - fire_xy.x;
	ydiff = target_xy.y - fire_xy.y;
	
	dist2d = Math.sqrt(xdiff*xdiff + ydiff*ydiff);
	max_range = 5;
	min_range = 1;
	min_prob = 50;
	max_prob = 100;
	
	if (dist2d > 5) {
	  prob = 0;
	} else {
	  prob = min_prob + ((dist2d - max_range)*max_prob - (dist2d - max_range)*min_prob) / (min_range - max_range);
	}
	
	return prob / 100;
	
  };
  
  var doPlayerShoot = function (mob) {
	
	var gun = my_player.equipGet(constants.equip.firearm);
	var opp, adj, hyp, theta, player_xy, mob_xy, i, new_x, new_y, new_xy, points, impact_xy, terrain;
	
	if (gun === null) {
	  $('#id_div_info_footer').html("You don't have anything to shoot!");
	  return;
	}
	
	if (gun.is_loaded !== true) {
	  $('#id_div_info_footer').html("Press SPACE to reload!");
	  return;
	}
	var prob = calcShotAccuracy(my_player.getLocation(), mob.getLocation());
	
	if (Math.random() < prob) {
	  my_audio.src = my_sounds['bang_' + Math.floor(Math.random()*5)];
	  my_audio.play();
	  
	  // trigonometries!
	  player_xy = my_player.getLocation();
	  mob_xy = mob.getLocation(0);
	  opp = mob_xy.y - player_xy.y;
	  adj = mob_xy.x - player_xy.x;
	  hyp = Math.sqrt(opp*opp + adj*adj);
	  theta = Math.asin(opp/hyp);
	  
	  // check terrain behind
	  hyp = Math.ceil(hyp) + 2;
	  opp = Math.ceil(Math.sin(theta) * hyp);
	  adj = Math.ceil(Math.cos(theta) * hyp);
	  
	  if (player_xy.x > mob_xy.x) { 
		adj = adj * -1; 
	  }
	  
	  if (player_xy.x === mob_xy.x) {
		new_x = player_xy.x;
	  } else {
		new_x = player_xy.x + adj;
	  }
	  
	  if (player_xy.y === mob_xy.y) {
		new_y = player_xy.y;
	  } else {
		new_y = player_xy.y + opp;
	  }
	  
	  new_xy = {"x": new_x, "y": new_y};
	  points = getLineBetweenPoints(mob_xy, new_xy);
	  
	  for (i = 0; i < points.length; i += 1) {
		impact_xy = points[i];
		terrain = my_dungeon.getTerrainAt(impact_xy);
		if (terrain !== null && terrain.isWalkable() === false) {
		  my_dungeon.setFeatureAt(impact_xy, lib.feature.blood);
		  drawMapAt(impact_xy);
		  break;
		}
	  }
  
	  doMobDamage(mob, gun.getDamage());
	} else {
	  my_audio.src = my_sounds['miss_' + Math.floor(Math.random()*4)];
	  my_audio.play();
	}
	
	// grab a new gun
	gun.is_loaded = false;
	drawEquipment();
	doPlayerAutoRearm(gun);
	
	endPlayerTurn();
  };
  
  var doPlayerAutoRearm = function (current_gun) {
  // will automatically swap the existing pistol for a fresh one
  // todo: make this a player option?
  
	var i, item, grab_me = null;
	var	items = my_player.inventoryGet();
	
	for (i = 0; i < items.length; i += 1) {
	  item = items[i];
	  if (compareItemToFamily(item, lib.itemFamily.firearm) && item.isLoaded()) {
		grab_me = item;
		break;
	  }
	}
	
	if (grab_me !== null) {
	  //my_player.inventoryAdd(current_gun);
	  my_player.equipSet(constants.equip.firearm, {"item": grab_me, "index": i});
	  drawInventory();
	  drawEquipment();
	} else {
	  doPlayerYell("Out of pistols!");
	  //alert("no more loaded guns!!");
	}
  };
  
  var doMobDamage = function (mob, damage) {
	mob.health = mob.health - damage;
	mob.last_hit = my_turn;
	
	if (compareMonsterToFamily(mob, lib.monsterFamily.player)) {
	  drawPlayerInfo();
	}
	
	if (mob.health <= 0) {
	  doMobDeath(mob);
	}
  };
  
  var doMobDeath = function (mob) {
  // remove a mob from ye dungeon
  
	if (compareMonsterToFamily(mob, lib.monsterFamily.player)) {
	  // player died!
	  //alert("congratulations! You have died.");
	  gameOver();
	  
	} else {
	  var death_xy = mob.getLocation();
	  
	  my_dungeon.removeMonsterAt(death_xy);
	  my_dungeon.setFeatureAt(death_xy, lib.feature.generatePoolOfBlood());
	  drawMapAt(death_xy);
	}
	
  };
  
  var doPlayerAction = function ( ) {
	var player_xy, item, gun, i;
	
	player_xy = my_player.getLocation();
	item = my_dungeon.getItemAt(player_xy);
	gun = my_player.equipGet(constants.equip.firearm);
	
	// assume picking up item if one is on the floor
	if (gun !== null && !gun.isLoaded()) {
	  // reload!
	  gun.is_loaded = true;
	  drawEquipment();
	  endPlayerTurn();
	  
	} else if (item !== null) {
	  if (item.is_container) {
		if (!my_container_is_open) {
		  doPlayerOpenContainer(item);
		} else {
		  doPlayerCloseContainer(item);
		}
	  } else {
	   doPlayerPickupItem(item);
	  }
	} else {
	  var check_unloaded = false;
	  var items = my_player.inventoryGet();
	  for (i = 0; i < items.length; i += 1) {
		if (compareItemToFamily(items[i], lib.itemFamily.firearm) && !items[i].isLoaded()) {
		  items[i].is_loaded = true;
		  check_unloaded = true;
		  break;
		}
	  }
	  
	  if (check_unloaded) {
		doPlayerYell("Reloadin'!!");
		drawInventory();
		endPlayerTurn();
		return;
		
	  } else {
		$('#id_div_info_footer').html('');
		endPlayerTurn();
		//doPlayerYell();
	  }
	}
  };
  
  var doPlayerInvisibleDebug = function ( ) {
	if (my_player.is_invisible === true) {
	  my_player.is_invisible = false;
	  my_player.setColor(colors.hf_blue);
	} else {
	  my_player.is_invisible = true;
	  my_player.setColor(colors.white);
	}
	drawMapAt(my_player.getLocation());
  };
  
  var doPlayerYell = function (text) {
	var u, player_xy;
	
	if (text === '' || text === undefined) {
	  u = Math.random();
	  if (u < 0.334) {
		text = 'Avast!!!!!!!';
	  } else if (u < 0.667) {
		text = 'Arrrr!!!!!!!';
	  } else {
		text = 'Yarrr.......';
	  }
	}
	  
	// create a speech bubble element
	var bubble = $('<div class="triangle-border">' + text + '</div>');
	
	// position over the speaker
	player_xy = my_player.getLocation();
	bubble[0].style.position = "absolute";
	bubble[0].style.top = (((player_xy.y - my_screen.y) * constants.tile_dst_height) - 45) + 'px';
	bubble[0].style.left = (((player_xy.x - my_screen.x) * constants.tile_dst_width) - 50) + 'px';
	$('#id_div_container').append(bubble[0]);
	$(bubble[0]).fadeOut(2000)
	
  };
  
  var doPlayerPickupItem = function (item) {
  // move item from level to inventory
	
	var player_xy, success;
  
	success = my_player.inventoryAdd(item);
	
	if (success === true) {
	  player_xy = my_player.getLocation();
	  my_dungeon.removeItemAt(player_xy);

	  if (compareItemToFamily(item, lib.itemFamily.booty) === true) {
		my_audio.src = my_sounds['booty_' + Math.floor(Math.random()*4)];
		my_audio.play();
	  }
	  
	  // todo: check to see if new weapon just picked up is better than current & automatically replace if so  
	  if (compareItemToFamily(item, lib.itemFamily.blade) && my_player.equipGet(constants.equip.blade) === null) {
		my_player.equipSet(constants.equip.blade, {"item": item, "index": my_player.inventoryGet().length - 1});
		drawEquipment();
		doPlayerYell("Finally, a blade!");
		
	  } else if (compareItemToFamily(item, lib.itemFamily.firearm) && my_player.equipGet(constants.equip.firearm) === null) {
		my_player.equipSet(constants.equip.firearm, {"item": item, "index": my_player.inventoryGet().length - 1});
		drawEquipment();
		doPlayerYell("This'll come in handy.");
	  }
	  
	  endPlayerTurn();
	  drawMapAt(player_xy);
	  drawInventory();
	  
	} else {
	  alert("your inventory is full!");
	}
  
  };
  var doPlayerActivateReadyItem = function ( ) {
	var ready_item = my_player.equipGet(constants.equip.ready_item);
	
	if (ready_item !== null) {
	  doPlayerActivateItem(ready_item, null, constants.equip.ready_item);
	} else {
	  alert("no item readied");
	}
  };
  
  var doPlayerActivateItem = function (item, inv_index, equip_slot) {
	var used_up = false;
	
	if (compareItemToFamily(item, lib.itemFamily.flask) === true) {
	  used_up = doPlayerActionDrink(item);
	  
	} else {
	  alert("I don't know what to do with that");
	}
	
	if (used_up) {
	  if (inv_index !== null) {
		my_player.inventoryRemove(inv_index);
		drawInventory();
	  } else {
		my_player.equipRemove(equip_slot);
		drawEquipment();
	  }
	}
  };
  
  var doPlayerActionDrink = function (ye_flask) {
	
	my_audio.src = my_sounds['drink_' + Math.floor(Math.random()*5)];
	my_audio.play();
	  
	doPlayerYell("Mmmmmm!");
	my_player.drunk += 20;
	drawPlayerInfo();
	endPlayerTurn();
	return true;
  };

  var doPlayerThrow = function (target_xy) {
	var thrown_item;
	
	thrown_item = my_player.equipGet(constants.equip.ready_item);
	
	if (thrown_item === null) {
	  alert("nothing ready to throw");
	  return false;
	} else {
	
	  my_player.equipRemove(constants.equip.ready_item);
	  // todo: if item already exists, move to a nearby square
	  my_dungeon.setItemAt(target_xy, thrown_item);
	  drawMapAt(target_xy);
	  drawEquipment();
	  endPlayerTurn();
	  return true;
	}
  };
  
  var doPlayerOpenContainer = function (container_item) {
	if (compareItemToFamily(container_item, lib.itemFamily.mixingbarrel)) {
	  my_audio.src = my_sounds['barrel_open'];
	} else {
	  my_audio.src = my_sounds['chest_open'];
	}
	my_audio.play();
	
	my_open_container = container_item;
	my_container_is_open = true;
	var my_div = $('#id_div_open_container').get()[0];
	
	$('#id_div_open_container').show();
	my_div.style.position = 'absolute';
	my_div.style.top = 100;
	my_div.style.left = 100;
	drawContainer();
	$('#id_div_info_footer').html('Press SPACE again to close');
	
  };
  
  var doPlayerCloseContainer = function (container_item) {
	if (!compareItemToFamily(container_item, lib.itemFamily.mixingbarrel)) {
	  my_audio.src = my_sounds['chest_close'];
	  my_audio.play();
	}

	my_open_container = {};
	my_container_is_open = false;
	$('#id_div_open_container').hide();
	$('#id_div_info_footer').html('');
	
	doMixBarrel(container_item);
  };
  
  var doMixBarrel = function (barrel) {
	var i, item, inventory = barrel.inventoryGet();
	var match_recipe, ingredients = {};
	
	// calculate ingredients
	for (i = 0; i < inventory.length; i += 1) {
	  item = inventory[i];
	  if (!ingredients.hasOwnProperty(item.getName())) {
		ingredients[item.getName()] = 0;
	  }
	  ingredients[item.getName()] += 1;
	}
	
	match_recipe = getRecipeMatch(ingredients, inventory.length);
	
	if (match_recipe.success === true) {
	  my_audio.src = my_sounds['mixing_' + Math.floor(Math.random()*2)];
	  my_audio.play();
	  my_dungeon.removeItemAt(my_player.getLocation());
	  my_dungeon.setItemAt(my_player.getLocation(), match_recipe.item);
	}
  };
  
  var getRecipeMatch = function (ingredients, total_ingredients) {
	var result = {"success": false, item: null};
	
	if (ingredients['grog'] === 3 && total_ingredients === 3) {
	  result.success = true;
	  result.item = itemFactory({name: 'Firerum', color: colors.red, family: lib.itemFamily.flask});
	}
	
	return result;
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // INVENTORY
  ////////////////////////////////////////////////////////////////////////////////
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
  
  var doInventoryClick = function (inv_result) {
  // click: equip or ready an item
	
	var equip_slot, item = inv_result.item;
	
	if (compareItemToFamily(item, lib.itemFamily.blade) === true) {
	  equip_slot = constants.equip.blade;
	  doPlayerEquipItem(equip_slot, inv_result);
	  
	} else if (compareItemToFamily(item, lib.itemFamily.firearm) === true) {
	  equip_slot = constants.equip.firearm;
	  doPlayerEquipItem(equip_slot, inv_result);
	  
	} else if (compareItemToFamily(item, lib.itemFamily.flask) === true) {
	  equip_slot = constants.equip.ready_item;
	  doPlayerEquipItem(equip_slot, inv_result);
	  
	} else {
	  alert("i don't know how to ready that item");
	}
  };
  
  var doInventoryShiftClick = function (inv_result) {
  // shift-click an item from inventory: drop
	doPlayerDropItem(inv_result);
  };
  
  var doInventoryRightClick = function (inv_result) {
  // right/mid-click an item from inventory: consume right away!
	doPlayerActivateItem(inv_result.item, inv_result.index, null);
  };
  
  var doPlayerEquipItem = function (equip_slot, inv_result) {
  // move an item from inventory to equip-status
  
	my_player.equipSet(equip_slot, inv_result);
	drawInventory();
	drawEquipment();  
  };

  var doPlayerDropItem = function (inv_result) {
  // drop item onto the player's current location
	
	var item, player_xy;
	
	// see where the player is
	player_xy = my_player.getLocation();
	
	// is something there already?
	item = my_dungeon.getItemAt(player_xy);
	
	if (item === null) {
	  my_dungeon.setItemAt(player_xy, inv_result.item);
	  my_player.inventoryRemove(inv_result.index);
	  drawMapAt(player_xy);
	  drawInventory();
	  return true;
	  
	} else {
	  alert("there's something here already");
	  return false;
	}
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // GAME CLICK EVENTS
  ////////////////////////////////////////////////////////////////////////////////
  var doGameClick = function (grid_xy) {
  // click on the game: shoot something!!
  
	var map_xy = {"x": grid_xy.x + my_screen.x, "y": grid_xy.y + my_screen.y};  
	var is_player = compareCoords(map_xy, my_player.getLocation());
	var mob = my_dungeon.getMonsterAt(map_xy);
	var can_see = my_player.getFovAt(map_xy) === true;
	
	if (can_see && (mob !== null) && (!is_player)) {
	  doPlayerShoot(mob);
	}
  };

  var doGameShiftClick = function (grid_xy) {
  // shift-click on the game screen: throw something!!
	var map_xy = {"x": grid_xy.x + my_screen.x, "y": grid_xy.y + my_screen.y}; 
	var can_see = my_player.getFovAt(map_xy) === true;	
	return doPlayerThrow(map_xy);
  };

  var doGameRightClick = function (grid_xy) {
  // right-click on the game screen: nothing yet
	var map_xy = {"x": grid_xy.x + my_screen.x, "y": grid_xy.y + my_screen.y};  
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // CONTAINERS
  ////////////////////////////////////////////////////////////////////////////////

  var getContainerItemFromCoords = function (grid_xy) {
  // returns the container item and array index
  
	var inventory = my_open_container.inventoryGet();
	var i, item;
	
	i = (grid_xy.y * constants.container_tiles_width) + grid_xy.x;
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
  var doContainerEventMousedown = function (grid_xy, button, shiftKey) {
  // add to player's inventory if possible
  
	var inv_result, success;
	
	inv_result = getContainerItemFromCoords(grid_xy);
	
	if (inv_result.item !== null) {
	  success = my_player.inventoryAdd(inv_result.item);
	  
	  if (success) {
		my_open_container.inventoryRemove(inv_result.index);
		drawInventory();
		drawContainer();
	  } else {
		alert("Your inventory is full!");
	  }
	}
  };
  
  var doContainerEventGainFocus = function (grid_xy) {
    my_container_grid.drawBorderAt(grid_xy, colors.white);
	var inv_result = getContainerItemFromCoords(grid_xy);
	
	if (inv_result.item !== null) {
	  drawHoverInfo(inv_result.item, true);
	}
  };
  
  var doContainerEventLeaveFocus = function (grid_xy) {
	drawContainer();
  };
  
  var doEventMousedown = function (grid_xy, button, shiftKey) {
	
	if (shiftKey === true) {
	  doGameShiftClick(grid_xy);
	} else if (button !== 0) {
	  doGameRightClick(grid_xy);
	} else {
	  doGameClick(grid_xy);
	}
  };
  
  var doEventGainFocus = function (grid_xy) {
    var html, mob, terrain, item, memory, is_player, player_xy, border_color, map_xy;
    
	border_color = colors.white;
    map_xy = {"x": grid_xy.x + my_screen.x, "y": grid_xy.y + my_screen.y};

    player_xy = my_player.getLocation();
    mob = my_dungeon.getMonsterAt(map_xy);
	can_see = my_player.getFovAt(map_xy) === true;
	
    is_player = compareCoords(map_xy, player_xy);
    terrain = my_dungeon.getTerrainAt(map_xy);
    item = my_dungeon.getItemAt(map_xy);
	
	if (!can_see) {
	  memory = my_player.getMemoryAt(map_xy);
	  if (memory !== null) {// && memory.objtype !== 'terrain') {
		drawHoverInfo(memory);
	  }
	} else {
	  if (mob !== null && !is_player) {

		if (calcShotAccuracy(player_xy, mob.getLocation()) >= 0.5) {
		  border_color = colors.red;
		}
		drawHoverInfo(mob, null, map_xy);
	  } else if (item != null) {

		drawHoverInfo(item, false, map_xy);
	  } else {
		drawHoverInfo(terrain, null, map_xy);
	  }
	}
    
    $('#id_div_info_coords').html('(' + map_xy.x + ', ' + map_xy.y + ')');
    my_grid.drawBorderAt(grid_xy, border_color);
  };
  
  var doEventLeaveFocus = function (grid_xy) {
    drawGridAt(grid_xy);	
  };
  
  var doInventoryEventMousedown = function (grid_xy, button, shiftKey) {
    
	// figure out what inventory item we just clicked on
	var inv_result = getInventoryItemFromCoords(grid_xy);

	if (inv_result.item !== null) {
	  if (my_container_is_open) {
		// put in container
		success = my_open_container.inventoryAdd(inv_result.item);
		if (success) {
		  my_player.inventoryRemove(inv_result.index);
		  drawInventory();
		  drawContainer();
		} else {
		  alert("container is full!");
		}
		
	  } else  if (shiftKey === true) {
		// drop
		return doInventoryShiftClick(inv_result);
		
	  } else if (button !== 0) {
		return doInventoryRightClick(inv_result);
		
	  } else {
		// equip
		return doInventoryClick(inv_result);
	  }
	}
	
	return false;
  };
  
  var doInventoryEventGainFocus = function (grid_xy) {
    my_inv_grid.drawBorderAt(grid_xy, colors.white);
	var inv_result = getInventoryItemFromCoords(grid_xy);
	
	if (inv_result.item !== null) {
	  drawHoverInfo(inv_result.item, true);
	}
	
  };
  
  var doInventoryEventLeaveFocus = function (grid_xy) {
    drawInventory();
  };
  
  var doEquipEventGainFocus = function (grid_xy) {
	var item = null;
	if (grid_xy.y === 0) {
	  item = my_player.equipGet(constants.equip.blade);
	} else if (grid_xy.y === 1) {
	  item = my_player.equipGet(constants.equip.firearm);
	} else if (grid_xy.y === 2) {
	  item = my_player.equipGet(constants.equip.ready_item);
	} 
	
	if (item !== null) {
	  drawHoverInfo(item, true);
	}
  };
  
  var doEquipEventLeaveFocus = function (grid_xy) {
    //drawInventory();
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // GAME AI
  ////////////////////////////////////////////////////////////////////////////////
  
  var doMonsterTurns = function ( ) {
	var i, monsters = my_dungeon.getMonsters();
	
	for (i = 0; i < monsters.length; i += 1) {
	  if (compareMonsterToFamily(monsters[i], lib.monsterFamily.player)) {
		continue;
	  } else if (monsters[i].hasFlag(flags.immobile)) {
		continue;
	  } else {
	   doMonsterTurn(monsters[i]);
	  }
	} 
  };
  
  var doMonsterTurn = function (mob) {
	var x, y, success, can_attack, potential_xy, mob_xy = mob.getLocation(), player_xy = my_player.getLocation();
	
	// update my FOV
	updateFov(mob);
	
	if (mob.isAware(my_player) !== true) {
	  return;
	}
	
	x = (player_xy.x - mob_xy.x);
	x = (x === 0) ? 0 : x / Math.abs(x);
	y = (player_xy.y - mob_xy.y);
	y = (y === 0) ? 0 : y / Math.abs(y);
	
	potential_xy = {"x": mob_xy.x + x, "y": mob_xy.y + y};
	//alert("moving to: " + potential_xy.x + ", " + potential_xy.y);
	success = canMonsterMove(mob, potential_xy);
	can_attack = compareCoords(my_player.getLocation(), potential_xy) === true;
	
	if (can_attack) {
  	  // attack
	  //alert("hit yo");
	  doMobDamage(my_player, 1);
	  
	} else if (success === true) {
	  // move
	  my_dungeon.removeMonsterAt(mob_xy);
	  my_dungeon.setMonsterAt(potential_xy, mob);
	  drawMapAt(mob_xy);
	  drawMapAt(potential_xy);
	}
  };
  
  var canMonsterMove = function (mob, potential_xy) {
	var terrain, other_mob;
	
	if (my_dungeon.isValidCoordinate(potential_xy) === false) {
	  return false;
	}
	
	terrain = my_dungeon.getTerrainAt(potential_xy);
	if (terrain.isWalkable() === false) {
	  return false;
	}
	
	other_mob = my_dungeon.getMonsterAt(potential_xy);
	if (other_mob !== null) {
	  return false;
	}
	
	return true;
  };

  ////////////////////////////////////////////////////////////////////////////////  
  // GAME INIT
  ////////////////////////////////////////////////////////////////////////////////

  var initGame = function (player_name) {
    var result, i, u, locations, item, mob, booty;
    
    my_player = monsterFactory({name: player_name, health: 100, family: lib.monsterFamily.player});
	result = my_level_generator.createRandomCaveLevel(constants.game_tiles_width * 2, constants.game_tiles_height * 2);
    my_dungeon = result.level;
    my_dungeon.setMonsterAt(result.start_xy, my_player);
	updateScreenOffset();
	
	locations = my_dungeon.getWalkableLocations().locations_xy;
	fisherYates(locations);
	
	// add items
	for (i = 0; i < 20; i += 1) {
	  u = Math.random();
	  if (u < 0.15) {
		item = bladeFactory({name: 'Cutlass', damage: 2});
	  } else if (u < 0.40) {
		item = firearmFactory({name: 'Pistol', damage: 5});
	  } else if (u < 0.75) {
		item = itemFactory({name: 'Grog', family: lib.itemFamily.flask});
	  } else {
		
		if (Math.random() < 0.5) {
		  item = mixingBarrelFactory({name: 'pine barrel'});
		} else {
		  item = containerFactory({name: 'treasure chest'});
		}
	  }
	  my_dungeon.setItemAt(locations[i], item);
	}
	
	// add THE MONKIES
	for (; i < 25; i += 1) {
	  mob = monsterFactory({name: 'monkey', family: lib.monsterFamily.simian});
	  //mob = monsterFactory({name: "powderkeg", family: monsterFamily_Barrel});
	  my_dungeon.setMonsterAt(locations[i], mob);
	}
	
	for (; i < 30; i += 1) {
	  u = Math.random();
	  if (u < 0.25) {
		booty = itemFactory({family: lib.itemFamily.booty, name: "pieces o' eight", code: 'CENTS', color: '#DAA520'});
	  } else if (u < 0.5) {
		booty = itemFactory({family: lib.itemFamily.booty, name: "gold bars", code: 'POUND', color: '#FFD700'});
	  } else if (u < 0.75) {
		booty = itemFactory({family: lib.itemFamily.booty, name: "silver coins", code: 'DOLLAR', color: '#FFFACD'});
	  } else {
		booty = itemFactory({family: lib.itemFamily.booty, name: "doubloons", code: 'FRANC', color: colors.yellow});
	  }
	  my_dungeon.setItemAt(locations[i], booty);
	}
	
    initSounds();
    drawEquipment();
    drawInventory();
	drawPlayerInfo();
    updateFov(my_player);
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
	
	my_sounds['miss_0'] = 'static/audio/miss_0.wav';
	my_sounds['miss_1'] = 'static/audio/miss_1.wav';
	my_sounds['miss_2'] = 'static/audio/miss_2.wav';
	my_sounds['miss_3'] = 'static/audio/miss_3.wav';
	
	my_sounds['drink_0'] = 'static/audio/drink_0.wav';
	my_sounds['drink_1'] = 'static/audio/drink_1.wav';
	my_sounds['drink_2'] = 'static/audio/drink_2.wav';
	my_sounds['drink_3'] = 'static/audio/drink_3.wav';
	my_sounds['drink_4'] = 'static/audio/drink_4.wav';
	
	my_sounds['chest_open'] = 'static/audio/chest_open.wav';
	my_sounds['chest_close'] = 'static/audio/chest_close.wav';
	
	my_sounds['barrel_open'] = 'static/audio/barrel_open.wav';
	
	my_sounds['mixing_0'] = 'static/audio/mixing_0.wav';
	my_sounds['mixing_1'] = 'static/audio/mixing_1.wav';

  };
  
  var gameOver = function (cause) {
	var x, y, grid_x, grid_y, max_y;
	var death_level = levelFactory({'width': constants.game_tiles_width, 'height': constants.game_tiles_height});
	var fore_color = colors.normal_fore, bg_color = colors.normal_bg;
	
	// prevents further keyboard input
	my_game_over = true;
	
	// prevents mouseovers messing up the pretty RIP tombstone
	my_grid.removeEventListeners();
	my_inv_grid.removeEventListeners();
	my_equip_grid.removeEventListeners();
	  
	for (x = 0; x < constants.game_tiles_width; x += 1) {
      for (y = 0; y < constants.game_tiles_height; y += 1) {
		
		grid_x = x * constants.tile_dst_width;
		grid_y = y * constants.tile_dst_height;

		if (x === 0 || x === constants.game_tiles_width - 1)  {
		  tile_code = 'I';
		} else if (y === 0 || y === constants.game_tiles_height - 1) {
		  tile_code = 'DASH';
		} else {
		  tile_code = 'SPACE'
		}
		
		drawTileOn(ctx_game, my_tile_codes[tile_code], grid_x, grid_y, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	  }
	}
		
	ctx_game.font = '20px Verdana';
	ctx_game.textBaseline = 'top';
	ctx_game.fillStyle = colors.grey_border;
	//ctx_game.fillText("Congratulations!", constants.tile_dst_width, constants.tile_dst_height);
	//ctx_game.fillText("You have died.", constants.tile_dst_width, constants.tile_dst_height * 2);
	
	max_y = constants.game_tiles_height * constants.tile_dst_height;
	
	ctx_game.font = '20px Verdana';
	var name_length = ctx_game.measureText(my_player.getName()).width;
	var total_length = 5 * constants.tile_dst_width;
	var start_name_x = 5 * constants.tile_dst_width;
	
	if (name_length > total_length) {
	  ctx_game.fillText(my_player.getName(), start_name_x, 6 * constants.tile_dst_height, total_length);
	} else {
	  ctx_game.fillText(my_player.getName(), start_name_x + Math.floor((total_length - name_length) / 2), 6 * constants.tile_dst_height, total_length);
	}
	
	//ctx_game.textAlign = 'left';
	ctx_game.fillText("Killed by a grue.", constants.tile_dst_width, max_y - constants.tile_dst_height * 4);
	ctx_game.fillText("Total worth: &e0", constants.tile_dst_width, max_y - constants.tile_dst_height * 3);
	ctx_game.fillText("Press SPACE to play again!", constants.tile_dst_width, max_y - constants.tile_dst_height * 2);
	
	//$('#id_div_info_footer').html('Press SPACE to restart');
	
	// tombstone sides
	for (y = 5; y < 9; y += 1) {
	  x = 4;
	  grid_x = x * constants.tile_dst_width;
	  grid_y = y * constants.tile_dst_height;
	  drawTileOn(ctx_game, my_tile_codes['I'], grid_x, grid_y, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	  
	  x = 10;
	  grid_x = x * constants.tile_dst_width;
	  drawTileOn(ctx_game, my_tile_codes['I'], grid_x, grid_y, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	}

	// corners
	drawTileOn(ctx_game, my_tile_codes['ASTERISK'], 0 * constants.tile_dst_width, 0 * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	drawTileOn(ctx_game, my_tile_codes['ASTERISK'], (constants.game_tiles_width - 1) * constants.tile_dst_width, 0 * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	drawTileOn(ctx_game, my_tile_codes['ASTERISK'], 0 * constants.tile_dst_width, (constants.game_tiles_height  - 1) * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	drawTileOn(ctx_game, my_tile_codes['ASTERISK'], (constants.game_tiles_width - 1) * constants.tile_dst_width, (constants.game_tiles_height - 1) * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	

	// rest of the tombstone
	drawTileOn(ctx_game, my_tile_codes['SLASH'], 5 * constants.tile_dst_width, 4 * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	drawTileOn(ctx_game, my_tile_codes['BACK_SLASH'], 9 * constants.tile_dst_width, 4 * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	
	drawTileOn(ctx_game, my_tile_codes['DASH'], 6 * constants.tile_dst_width, 3 * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	drawTileOn(ctx_game, my_tile_codes['DASH'], 7 * constants.tile_dst_width, 3 * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	drawTileOn(ctx_game, my_tile_codes['DASH'], 8 * constants.tile_dst_width, 3 * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	
	drawTileOn(ctx_game, my_tile_codes['R'], 6 * constants.tile_dst_width, 5 * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	drawTileOn(ctx_game, my_tile_codes['I'], 7 * constants.tile_dst_width, 5 * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	drawTileOn(ctx_game, my_tile_codes['P'], 8 * constants.tile_dst_width, 5 * constants.tile_dst_height, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color, true);	
	
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // PUBLIC FUNCTIONS
  ////////////////////////////////////////////////////////////////////////////////
  
  that.init = function (player_name) {
  // initalize canvas elements and load game elements
	player_name = player_name || 'Jack';
	my_game_over = false;
	
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
	my_equip_grid = gridmangler(cnv_equip, constants.equip_width, constants.tile_dst_height);
    my_equip_grid.addGridEvent("gainfocus", doEquipEventGainFocus);
    my_equip_grid.addGridEvent("leavefocus", doEquipEventLeaveFocus);
	
	// player info
	var cnv_playerinfo = $('#id_cnv_playerinfo').get()[0];
	ctx_playerinfo = cnv_playerinfo.getContext("2d");
	ctx_playerinfo.fillStyle = colors.normal_bg;
	ctx_playerinfo.fillRect(0, 0, constants.playerinfo_width, constants.playerinfo_height);
	
	// hover info
	var cnv_hoverinfo = $('#id_cnv_hoverinfo').get()[0];
	ctx_hoverinfo = cnv_hoverinfo.getContext("2d");
	ctx_hoverinfo.fillStyle = colors.normal_bg;
	ctx_hoverinfo.fillRect(0, 0, constants.hoverinfo_width, constants.hoverinfo_height);
	
	// container floater
	cnv_container = $('#id_cnv_container').get()[0];
	ctx_container = cnv_container.getContext("2d");
	my_container_grid = gridmangler(cnv_container, constants.tile_dst_width , constants.tile_dst_height);
	my_container_grid.addGridEvent("mousedown", doContainerEventMousedown);
	my_container_grid.addGridEvent("gainfocus", doContainerEventGainFocus);
	my_container_grid.addGridEvent("leavefocus", doContainerEventLeaveFocus);
	
    initGame(player_name);
  };

  // keyboard
  ////////////////////////////////////////////////////////////////////////////////
  that.keypress = function (e) {
	var offset_xy;
	
	if (my_game_over) {
	  if (e.keyCode === 32) {
	  	var old_name = my_player.getName();
		this.init(old_name);
	  }
	  return;
	  
	};
	
	if (!my_container_is_open) {
	  if ((e.keyCode === 37) || (e.keyCode == 65) || (e.keyCode == 72)) {
		// left + a + h
		offset_xy = {x: -1, y: 0};
		doPlayerMove(offset_xy);
  
	  } else if ((e.keyCode === 39) || (e.keyCode == 68) || (e.keyCode == 76)) {
		// right + d + l
		offset_xy = {x: 1, y: 0};
		doPlayerMove(offset_xy);
  
	  } else if ((e.keyCode === 38) || (e.keyCode == 87) || (e.keyCode == 75)) {
		// up + w + k
		offset_xy = {x: 0, y: -1};
		doPlayerMove(offset_xy);
  
	  } else if ((e.keyCode === 40) || (e.keyCode == 83) || (e.keyCode == 74)) {
		// down + s + j
		offset_xy = {x: 0, y: 1};
		doPlayerMove(offset_xy);
		
	  } else if (e.keyCode === 32) {
		// space
		doPlayerAction();
		
	  } else if (e.keyCode === 70) {
		// f
		doPlayerInvisibleDebug();
		
	  } else if (e.keyCode === 81) {
		// q
		doPlayerActivateReadyItem();
	  }
	} else {
	  if (e.keyCode === 32) {
		// space
		doPlayerAction();
	  }
	}
	  
  };
  
  that.playerChangeName = function (new_name) {
	
	my_player.setName(new_name);
	drawPlayerInfo();
  };
  
  that.getVersion = function ( ) {
	return my_version;
  };

  return that;
};
