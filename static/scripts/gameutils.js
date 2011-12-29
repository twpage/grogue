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

var constants = {
  tile_src_width: 12,
  tile_src_height: 16,
  tiles_image: 'static/images/terminalf_transparent.png',
  
  tile_dst_width: 24,
  tile_dst_height: 32,
  
  game_tiles_width: 15,
  game_tiles_height: 13,
  
  inventory_tiles_width: 5,
  inventory_tiles_height: 2,
  inventory_max_items: 10,
  
  equip: {
    blade: 'blade0',
    firearm: 'gun1',
    body: 'body2',
    thrown: 'thrown3'
  }

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
  memory: 'rgb(88, 88, 88)'
};
