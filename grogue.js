var grogue = function ($) {
    var that = {};
    var ctx_game;
    
    that.init = function ( ) {
    // initalize canvas elements and load game elements
        var canvas = $('#id_cnv_game').get()[0];
        var grid = gridmangler(canvas, 32, 32);
        grid.addGridEvent("mousedown", 
            function (grid_xy) {
                // simple grid click event
                grid.drawFillAt(grid_xy, "#99CCFF");
                grid.drawBorderAt(grid_xy, "rgba(255, 0, 0, 1)");
                
                $('#id_div_click').html('<p>clicked on grid tile (' + grid_xy.x + ', ' + grid_xy.y + ')</p>');
            }
        );
        ctx_game = canvas.getContext("2d");
        ctx_game.strokeStyle = "rgb(200, 0, 0)";
        ctx_game.strokeRect(0, 0, 32, 32);
    };

    return that;
};