var grogue = function ($, tilecodes, level_gen) {
  var that = {};
  var ctx_game;
  var my_grid, my_tiles, my_tile_codes = tilecodes;
  var my_dungeon, my_player;
  var my_level_generator = level_gen;
  var my_terrain = {};
  var my_screen = {"x": 0, "y": 0, "width": 15, "height": 13};
  
  // PRIVATE
  
  drawGridAt = function (grid_xy) {
    var terrain, item, mob;
    
    my_grid.clearAt(grid_xy);
    
    is_player = compareCoords(grid_xy, my_player.getLocation());
    mob = my_dungeon.getMonsterAt(grid_xy);
    terrain = my_dungeon.getTerrainAt(grid_xy);
    item = my_dungeon.getItemAt(grid_xy);
    
    if (mob !== null) {
      my_tiles.drawTileImage(ctx_game, my_tile_codes[mob.getCode()], grid_xy.x * 24, grid_xy.y * 32, 24, 32);
    } else if (item !== null) {
      my_tiles.drawTileImage(ctx_game, my_tile_codes[item.getCode()], grid_xy.x * 24, grid_xy.y * 32, 24, 32);
    } else {
      my_tiles.drawTileImage(ctx_game, my_tile_codes[terrain.getCode()], grid_xy.x * 24, grid_xy.y * 32, 24, 32);
    }
  };
  
  setScreenOffset = function ( ) {
  
  };
  
  drawGame = function ( ) {
    var x, y;
    
    for (x = 0; x < 15; x += 1) {
      for (y = 0; y < 13; y += 1) {
        drawGridAt({"x": x, "y": y});
      }
    }
  };
  
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
  
  doMovePlayer = function (offset_xy) {
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
  
  initGame = function ( ) {
    var result;
    
    //my_level_generator = level_generator();
    my_player = monsterFactory({name: 'Hero', family: monsterFamily_Player});
    result = my_level_generator.createRandomCaveLevel(15, 13); //createDungeon(15, 13);  
    my_dungeon = result.level;
    my_dungeon.setMonsterAt(result.start_xy, my_player);
    drawGame();
  };
  
  // PUBLIC
  
  that.init = function ( ) {
  // initalize canvas elements and load game elements
    var canvas = $('#id_cnv_game').get()[0];
    my_grid = gridmangler(canvas, 24, 32);
    ctx_game = canvas.getContext("2d");
    
    var tiles_img = new Image(192, 224);
    tiles_img.src = 'terminalf_transparent.png';
    my_tiles = eyeofthetiler(tiles_img, 12, 16);

    my_grid.addGridEvent("mousedown", doEventMousedown);
    my_grid.addGridEvent("gainfocus", doEventGainFocus);
    my_grid.addGridEvent("leavefocus", doEventLeaveFocus);
    
    initGame();
  };

  that.keypress = function (e) {
	var offset_xy;
	if (e.keyCode === 37) {
	  // left
	  offset_xy = {x: -1, y: 0};
	  doMovePlayer(offset_xy);

	} else if (e.keyCode === 39) {
	  // right
	  offset_xy = {x: 1, y: 0};
	  doMovePlayer(offset_xy);

	} else if (e.keyCode === 38) {
	  // up
	  offset_xy = {x: 0, y: -1};
	  doMovePlayer(offset_xy);

	} else if (e.keyCode === 40) {
	  // down
	  offset_xy = {x: 0, y: 1};
	  doMovePlayer(offset_xy);
	} 
  };

  return that;
};