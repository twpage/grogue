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
  tiles_image: 'terminalf_transparent.png',
  
  tile_dst_width: 24,
  tile_dst_height: 32,
  
  game_tiles_width: 15,
  game_tiles_height: 13
  

};

var colors = {
  normal_fore: 'rgb(255, 255, 255)',
  normal_bg: 'rgb(50, 50, 50)',
  hf_blue: '#0082FF',
  hf_orange: '#FF7E00'
};
