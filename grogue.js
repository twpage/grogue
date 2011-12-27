var grogue = function ($, tilecodes, level_gen) {
  var that = {};
  var ctx_game, cnv_copy, ctx_copy, cnv_inventory, ctx_inventory;
  var my_grid, my_inv_grid, my_tiles, my_tile_codes = tilecodes;
  var my_dungeon, my_player;
  var my_level_generator = level_gen;
  var my_terrain = {};
  var my_screen = {"x": 0, "y": 0, "width": 15, "height": 13};
  
  ////////////////////////////////////////////////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////////////////////////////////////////////////
  
  setScreenOffset = function ( ) {
  
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // DRAWING + GRAPHICS
  ////////////////////////////////////////////////////////////////////////////////

  drawGame = function ( ) {
  // redraw every tile on the game screen
  
    var x, y;
    
    for (x = 0; x < 15; x += 1) {
      for (y = 0; y < 13; y += 1) {
        drawGridAt({"x": x, "y": y});
      }
    }
  };
  
  drawInventory = function ( ) {
  // update the inventory box on screen
	
	var i, x, y, gx, gy, item, fore_color;
	var inventory = my_player.inventoryGet();
	
	for (i = 0; i < inventory.length; i += 1) {
	  item = inventory[i];
	  fore_color = item.getColor();
	  x = i % 5;
	  y = Math.floor(i / 5);
	  gx = x * constants.tile_dst_width;
	  gy = y * constants.tile_dst_height;
	  drawTileOn(ctx_inventory, my_tile_codes[item.getCode()], gx, gy, constants.tile_dst_width, constants.tile_dst_height, fore_color, colors.normal_bg);
	}
  };
  
  drawTileOn = function (context, tile_code, x, y, width, height, fore_color, bg_color) {
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
	context.clearRect(x, y, width, height);
	
	// fill destination canvas with BG color
	context.fillStyle = bg_color;
	context.fillRect(x, y, width, height);
	
	// draw resulting image from copy to destination
	context.drawImage(cnv_copy, x, y, width, height);
  };
  
  drawGridAt = function (grid_xy) {
    var terrain, item, mob, fore_color, bg_color, tile_code, grid_x, grid_y;
    
    is_player = compareCoords(grid_xy, my_player.getLocation());
    mob = my_dungeon.getMonsterAt(grid_xy);
    terrain = my_dungeon.getTerrainAt(grid_xy);
    item = my_dungeon.getItemAt(grid_xy);
    
    if (mob !== null) {
	  fore_color = mob.getColor();
	  bg_color = mob.getBackgroundColor();
	  tile_code = my_tile_codes[mob.getCode()];
	  
    } else if (item !== null) {
	  fore_color = item.getColor();
	  bg_color = item.getBackgroundColor();
      tile_code = my_tile_codes[item.getCode()];
	  
    } else {
	  fore_color = terrain.getColor();
	  bg_color = terrain.getBackgroundColor();
      tile_code = my_tile_codes[terrain.getCode()];
    }
	
	grid_x = grid_xy.x * constants.tile_dst_width;
	grid_y = grid_xy.y * constants.tile_dst_height;
	//context, tile_code, x, y, width, height, fore_color, bg_color) {	
	drawTileOn(ctx_game, tile_code, grid_x, grid_y, constants.tile_dst_width, constants.tile_dst_height, fore_color, bg_color);
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // player interactions
  ////////////////////////////////////////////////////////////////////////////////

  doPlayerMove = function (offset_xy) {
	var player_xy, new_xy, terrain;
	
	player_xy = my_player.getLocation();
	new_xy = {x: player_xy.x + offset_xy.x, y: player_xy.y + offset_xy.y};
	
	if (my_dungeon.isValidCoordinate(new_xy) !== true) {
	  alert("bad coord");
	  return;
	} 
	
	terrain = my_dungeon.getTerrainAt(new_xy);
	if (terrain.isWalkable() === false) {
	  alert("you can't walk there");
	  return;
	}
	
	my_dungeon.removeMonsterAt(player_xy);
	my_dungeon.setMonsterAt(new_xy, my_player);
	drawGridAt(player_xy);
	drawGridAt(new_xy);
  };
  
  doPlayerAction = function ( ) {
	var player_xy, item;
	
	player_xy = my_player.getLocation();
	item = my_dungeon.getItemAt(player_xy);
	
	if (item !== null) {
	  // move item from level to inventory
	  my_dungeon.removeItemAt(player_xy);
	  my_player.inventoryAdd(item);
	  drawInventory();
	}
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // MOUSE EVENTS
  ////////////////////////////////////////////////////////////////////////////////
  doEventMousedown = function (grid_xy) {
    $('#id_div_click').html('<p>clicked on grid tile (' + grid_xy.x + ', ' + grid_xy.y + ')</p>');
  };
  
  doEventGainFocus = function (grid_xy) {
    var html, mob, terrain, item;
    
    mob = my_dungeon.getMonsterAt(grid_xy);
    terrain = my_dungeon.getTerrainAt(grid_xy);
    item = my_dungeon.getItemAt(grid_xy);
    
    if (mob !== null) {
      html = 'a ' + mob.getName() + ' is here';
    } else if (item != null) {
      html = 'you see a ' + item.getName();
    } else {
      html = terrain.getName();
    }
    
    html += ' at (' + grid_xy.x + ', ' + grid_xy.y + ')';
    $('#id_div_hover').html(html);
    my_grid.drawBorderAt(grid_xy, "rgba(255, 255, 255, 1.0)");
  };
  
  doEventLeaveFocus = function (grid_xy) {
    drawGridAt(grid_xy);	
  };
  
    doInventoryEventMousedown = function (grid_xy) {
    //$('#id_div_click').html('<p>clicked on grid tile (' + grid_xy.x + ', ' + grid_xy.y + ')</p>');
  };
  
  doInventoryEventGainFocus = function (grid_xy) {
    my_inv_grid.drawBorderAt(grid_xy, "rgba(255, 255, 255, 1.0)");
  };
  
  doInventoryEventLeaveFocus = function (grid_xy) {
    drawInventory();
  };
  
  ////////////////////////////////////////////////////////////////////////////////  
  // GAME INIT
  ////////////////////////////////////////////////////////////////////////////////

  initGame = function ( ) {
    var result, i, locations;
    
    //my_level_generator = level_generator();
    my_player = monsterFactory({name: 'Hero', family: monsterFamily_Player});
    result = my_level_generator.createRandomCaveLevel(15, 13); //createDungeon(15, 13);  
    my_dungeon = result.level;
    my_dungeon.setMonsterAt(result.start_xy, my_player);
	
	locations = my_dungeon.getWalkableLocations().locations_xy;
	fisherYates(locations);
	
	for (i = 0; i < 5; i += 1) {
	  my_dungeon.setItemAt(locations[i], itemFactory({name: 'sword', family: itemFamily_Weapon}));
	}
	//sword = itemFactory({name: 'sword', family: itemFamily_Weapon});
	//my_dungeon.setItemAt(result.start_xy, sword);
	
    drawGame();
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
	cnv_inventory = $('#id_cnv_inventory').get()[0];
	ctx_inventory = cnv_inventory.getContext("2d");
    my_inv_grid = gridmangler(cnv_inventory, constants.tile_dst_width, constants.tile_dst_height);
    my_inv_grid.addGridEvent("mousedown", doInventoryEventMousedown);
    my_inv_grid.addGridEvent("gainfocus", doInventoryEventGainFocus);
    my_inv_grid.addGridEvent("leavefocus", doInventoryEventLeaveFocus);
    
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