
var lib = {
    terrain: {
        floor: terrainFactory({name: 'floor', code: 'PERIOD'}),
        wall: terrainFactory({name: 'wall', code: 'HASH', is_walkable: false, is_opaque: true}),
        chasm: terrainFactory({name: 'chasm', code: 'COLON', is_walkable: false})
    },
    
    feature: {
        blood: featureFactory({name: 'blood', bg_color: colors.blood}),
        pool_of_blood: featureFactory({name: 'blood', code: 'BLOOD_0', color: colors.blood}),
        generatePoolOfBlood: function ( ) {
            return featureFactory({name: 'blood', code: 'BLOOD_' + Math.floor(Math.random()*6), color: colors.blood})
        }
    },
    
    monsterFamily: {
        player: monsterFamilyFactory({name: 'player', code: 'AT', color: colors.hf_blue}),
        simian: monsterFamilyFactory({name: 'monkey', code: 'm', color: colors.maroon}),
        barrel: monsterFamilyFactory({name: 'barrel', code: '0', color: '#CD853F', flags: [flags.immobile, flags.explodes]})
    },
    
    itemFamily: {
        blade: itemFamilyFactory({name: 'blade', code: 'SLASH', color: colors.steel}),
        firearm: itemFamilyFactory({name: 'firearm', code: 'GUN_RIGHT', color: colors.hf_orange}),
        flask: itemFamilyFactory({name: 'flask', code: 'BANG', color: colors.pink}),
        booty: itemFamilyFactory({name: 'booty', code: 'DOLLAR', color: colors.yellow}),
        container: itemFamilyFactory({name: 'container', code: 'OPEN_PAREN', color: colors.yellow, is_container: true}),
        mixingbarrel: itemFamilyFactory({name: 'mixing barrel', code: '0', color: '#CD853F', is_container: true}),
        food: itemFamilyFactory({name: 'consumable', code: 'PERCENT'})
    }
        
};
    
