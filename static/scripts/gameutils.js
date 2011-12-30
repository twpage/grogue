var fisherYates = function ( myArray ) {
  var i = myArray.length;
  if ( i == 0 ) return false;
  while ( --i ) {
     var j = Math.floor( Math.random() * ( i + 1 ) );
     var tempi = myArray[i];
     var tempj = myArray[j];
     myArray[i] = tempj;
     myArray[j] = tempi;
   }
};

var getLineBetweenPoints = function (start_xy, end_xy) {
    // Digital Differential Analyzer
    // http://www.cs.unc.edu/~mcmillan/comp136/Lecture6/Lines.html
    var x0, y0, x1, y1, dx, dy, t, m, points_lst = [];
    
    x0 = start_xy.x;
    y0 = start_xy.y;
    x1 = end_xy.x;
    y1 = end_xy.y;
        
    dy = y1 - y0;
    dx = x1 - x0;
    t = 0.5;
    
    points_lst.push({x: x0, y: y0});
    
    if (x0 === x1 && y0 === y1) {
        return points_lst;
    }
    
    if (Math.abs(dx) > Math.abs(dy)) {
        m = dy / (1.0 * dx);
        t += y0;
        dx = (dx < 0) ? -1 : 1;//-1 if dx < 0 else 1
        m *= dx;
        
        while (x0 !== x1) {
            x0 += dx;
            t += m;
            points_lst.push({x: x0, y: Math.floor(t)}); //Coordinates(x0, int(t)))
        }
    } else {
        m = dx / (1.0 * dy);
        t += x0;
        dy = (dy < 0) ? -1 : 1;//-1 if dy < 0 else 1
        m *= dy;
        
        while (y0 !== y1) {
            y0 += dy;
            t += m;
            points_lst.push({x: Math.floor(t), y: y0});//Coordinates(int(t), y0))
        }
    }
    
    return points_lst;
};
    
var constants = {
  tile_src_width: 12,
  tile_src_height: 16,
  tiles_image: 'static/images/terminalf_transparent_2.png',
  
  tile_dst_width: 24,
  tile_dst_height: 32,
  
  game_tiles_width: 15,
  game_tiles_height: 13,
  
  inventory_tiles_width: 8,
  inventory_tiles_height: 2,
  inventory_max_items: 16,
  
  equip: {
    blade: 'blade0',
    firearm: 'gun1',
    body: 'body2',
    ready_item: 'thrown3'
  },
  
  playerinfo_width: 192,
  playerinfo_height: 192,
  
  equip_width: 192,
  equip_height: 96

};

var colors = {
  normal_fore: 'rgb(255, 255, 255)',
  normal_bg: 'rgb(50, 50, 50)',
  hf_blue: '#0082FF',
  hf_orange: '#FF7E00',
  hf_grey: '#d8d6c9',
  red: 'rgb(255, 0, 0)',
  white: 'rgb(255, 255, 255)',
  pink: '#FF1493',
  steel: '#B0C4DE',
  maroon: '#800000',
  yellow: 'rgb(255, 255, 0)',
  memory: 'rgb(88, 88, 88)',
  transparent: 'transparency',
  blood: 'rgb(165, 0, 0)',
  grey: 'rgb(125, 125, 125)'
};
