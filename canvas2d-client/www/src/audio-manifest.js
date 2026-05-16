// canvas2d-client/www/src/audio-manifest.js
// All paths must match files that actually exist in assets/audio/.
export const AUDIO_MANIFEST = {
  bgm: {
    bgm_menu:                'assets/audio/bgm_menu.mp3',
    bgm_chapter1_seaside:    'assets/audio/bgm_chapter1_seaside.mp3',
    bgm_chapter2_pottery:    'assets/audio/bgm_chapter2_pottery.mp3',
    bgm_chapter3_flower:     'assets/audio/bgm_chapter3_flower.mp3',
    bgm_chapter4_forest:     'assets/audio/bgm_chapter4_forest.mp3',
    bgm_chapter5_hotspring:  'assets/audio/bgm_chapter5_hotspring.mp3',
    bgm_chapter6_lighthouse: 'assets/audio/bgm_chapter6_lighthouse.mp3',
    bgm_zen_ambient:         'assets/audio/bgm_zen_ambient.mp3',
  },
  sfx: {
    // Core gameplay
    sfx_connect:             'assets/audio/sfx_connect.mp3',
    sfx_disappear:           'assets/audio/sfx_disappear.mp3',
    sfx_combo1:              'assets/audio/sfx_combo1.mp3',
    sfx_combo2:              'assets/audio/sfx_combo2.mp3',
    sfx_combo3:              'assets/audio/sfx_combo3.mp3',
    sfx_level_complete:      'assets/audio/sfx_level_complete.mp3',
    sfx_lighthouse_on:       'assets/audio/sfx_lighthouse_on.mp3',
    sfx_area_restore:        'assets/audio/sfx_area_restore.mp3',
    sfx_ui_button:           'assets/audio/sfx_ui_button.mp3',
    sfx_zen_complete:        'assets/audio/sfx_zen_complete.mp3',
    // Specials
    sfx_special_bomb:        'assets/audio/sfx_special_bomb.mp3',
    sfx_special_windmill:    'assets/audio/sfx_special_windmill.mp3',
    sfx_special_light:       'assets/audio/sfx_special_light.mp3',
    sfx_special_wave:        'assets/audio/sfx_special_wave.mp3',
    sfx_special_cascade:     'assets/audio/sfx_special_cascade.mp3',
    sfx_special_light_chain: 'assets/audio/sfx_special_light_chain.mp3',
    sfx_special_pierce:      'assets/audio/sfx_special_pierce.mp3',
    sfx_special_swap:        'assets/audio/sfx_special_swap.mp3',
    // Obstacle hits — mapped to closest available real files
    sfx_ice_crack:           'assets/audio/sfx_special_pierce.mp3',
    sfx_chain_break:         'assets/audio/sfx_special_light_chain.mp3',
    sfx_crate_hit:           'assets/audio/sfx_special_bomb.mp3',
    sfx_water_flow:          'assets/audio/sfx_special_wave.mp3',
  },
};
