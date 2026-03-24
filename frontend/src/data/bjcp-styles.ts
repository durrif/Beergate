// src/data/bjcp-styles.ts — BJCP 2021 Style Guide for Beergate Recipe Validator
// Comprehensive style database with OG/FG/IBU/SRM/ABV ranges

export interface BJCPStyle {
  id: string            // e.g. '1A'
  category: number      // e.g. 1
  subcategory: string   // e.g. 'A'
  name: string
  categoryName: string
  og_min: number
  og_max: number
  fg_min: number
  fg_max: number
  ibu_min: number
  ibu_max: number
  srm_min: number
  srm_max: number
  abv_min: number
  abv_max: number
  /** Brief style description */
  description: string
  /** Example commercial beers */
  examples: string[]
  /** Recommended water profile (famous city name) */
  waterProfile?: string
}

export const BJCP_STYLES: BJCPStyle[] = [
  // ── 1. STANDARD AMERICAN BEER ──────────────────────────
  { id: '1A', category: 1, subcategory: 'A', name: 'American Light Lager', categoryName: 'Standard American Beer', og_min: 1.028, og_max: 1.040, fg_min: 0.998, fg_max: 1.008, ibu_min: 8, ibu_max: 12, srm_min: 2, srm_max: 3, abv_min: 2.8, abv_max: 4.2, description: 'Very light body, highly carbonated, very little flavor', examples: ['Bud Light', 'Miller Lite', 'Coors Light'], waterProfile: 'Pilsen' },
  { id: '1B', category: 1, subcategory: 'B', name: 'American Lager', categoryName: 'Standard American Beer', og_min: 1.040, og_max: 1.050, fg_min: 1.004, fg_max: 1.010, ibu_min: 8, ibu_max: 18, srm_min: 2, srm_max: 4, abv_min: 4.2, abv_max: 5.3, description: 'Light-bodied, well-carbonated, neutral flavor', examples: ['Budweiser', 'Coors Original', 'Miller High Life'], waterProfile: 'Pilsen' },
  { id: '1C', category: 1, subcategory: 'C', name: 'Cream Ale', categoryName: 'Standard American Beer', og_min: 1.042, og_max: 1.055, fg_min: 1.006, fg_max: 1.012, ibu_min: 8, ibu_max: 20, srm_min: 2, srm_max: 5, abv_min: 4.2, abv_max: 5.6, description: 'Clean, crisp, well-attenuated American ale', examples: ['Genesee Cream Ale', 'New Glarus Spotted Cow'] },
  { id: '1D', category: 1, subcategory: 'D', name: 'American Wheat Beer', categoryName: 'Standard American Beer', og_min: 1.040, og_max: 1.055, fg_min: 1.008, fg_max: 1.013, ibu_min: 15, ibu_max: 30, srm_min: 3, srm_max: 6, abv_min: 4.0, abv_max: 5.5, description: 'Refreshing wheat beer without banana/clove', examples: ['Boulevard Unfiltered Wheat', 'Widmer Hefeweizen'] },

  // ── 2. INTERNATIONAL LAGER ─────────────────────────────
  { id: '2A', category: 2, subcategory: 'A', name: 'International Pale Lager', categoryName: 'International Lager', og_min: 1.042, og_max: 1.050, fg_min: 1.008, fg_max: 1.012, ibu_min: 18, ibu_max: 25, srm_min: 2, srm_max: 6, abv_min: 4.6, abv_max: 6.0, description: 'Highly-attenuated pale lager with more flavor than American', examples: ['Stella Artois', 'Corona Extra', 'Heineken'] },
  { id: '2B', category: 2, subcategory: 'B', name: 'International Amber Lager', categoryName: 'International Lager', og_min: 1.042, og_max: 1.055, fg_min: 1.008, fg_max: 1.014, ibu_min: 8, ibu_max: 25, srm_min: 7, srm_max: 14, abv_min: 4.6, abv_max: 6.0, description: 'Smoothly malty amber lager, moderate richness', examples: ['Dos Equis Amber', 'Victoria', 'Yuengling Lager'] },
  { id: '2C', category: 2, subcategory: 'C', name: 'International Dark Lager', categoryName: 'International Lager', og_min: 1.044, og_max: 1.056, fg_min: 1.008, fg_max: 1.012, ibu_min: 8, ibu_max: 20, srm_min: 14, srm_max: 30, abv_min: 4.2, abv_max: 6.0, description: 'Darker, sweeter, lighter-bodied dark lager', examples: ['Negra Modelo', 'Shiner Bock'] },

  // ── 3. CZECH LAGER ─────────────────────────────────────
  { id: '3A', category: 3, subcategory: 'A', name: 'Czech Pale Lager', categoryName: 'Czech Lager', og_min: 1.028, og_max: 1.044, fg_min: 1.008, fg_max: 1.014, ibu_min: 20, ibu_max: 35, srm_min: 3, srm_max: 6, abv_min: 3.0, abv_max: 4.1, description: 'Light, crisp, delicately balanced Czech lager', examples: ['Únětický 10°', 'Březňák Světlé'], waterProfile: 'Prague' },
  { id: '3B', category: 3, subcategory: 'B', name: 'Czech Premium Pale Lager', categoryName: 'Czech Lager', og_min: 1.044, og_max: 1.060, fg_min: 1.013, fg_max: 1.017, ibu_min: 30, ibu_max: 45, srm_min: 3.5, srm_max: 6, abv_min: 4.2, abv_max: 5.8, description: 'Rich, complex, bready Czech Pilsner', examples: ['Pilsner Urquell', 'Budvar', 'Gambrinus Premium'], waterProfile: 'Pilsen' },
  { id: '3C', category: 3, subcategory: 'C', name: 'Czech Amber Lager', categoryName: 'Czech Lager', og_min: 1.044, og_max: 1.060, fg_min: 1.013, fg_max: 1.017, ibu_min: 20, ibu_max: 35, srm_min: 10, srm_max: 16, abv_min: 4.4, abv_max: 5.8, description: 'Malt-forward Czech amber with clean hop bitterness', examples: ['Staropramen Granát', 'Kozel Polotmavý'], waterProfile: 'Prague' },
  { id: '3D', category: 3, subcategory: 'D', name: 'Czech Dark Lager', categoryName: 'Czech Lager', og_min: 1.044, og_max: 1.060, fg_min: 1.013, fg_max: 1.017, ibu_min: 18, ibu_max: 34, srm_min: 14, srm_max: 35, abv_min: 4.4, abv_max: 5.8, description: 'Rich dark Czech lager with roast character', examples: ['Kozel Dark', 'U Fleků Flekovský Tmavý'], waterProfile: 'Prague' },

  // ── 4. PALE MALTY EUROPEAN LAGER ───────────────────────
  { id: '4A', category: 4, subcategory: 'A', name: 'Munich Helles', categoryName: 'Pale Malty European Lager', og_min: 1.044, og_max: 1.048, fg_min: 1.006, fg_max: 1.012, ibu_min: 16, ibu_max: 22, srm_min: 3, srm_max: 5, abv_min: 4.7, abv_max: 5.4, description: 'Clean, malty, gold German lager', examples: ['Augustiner Lagerbier Hell', 'Spaten Premium', 'Paulaner Premium Lager'], waterProfile: 'Munich' },
  { id: '4B', category: 4, subcategory: 'B', name: 'Festbier', categoryName: 'Pale Malty European Lager', og_min: 1.054, og_max: 1.057, fg_min: 1.010, fg_max: 1.012, ibu_min: 18, ibu_max: 25, srm_min: 4, srm_max: 7, abv_min: 5.8, abv_max: 6.3, description: 'Smooth, clean, pale Oktoberfest beer', examples: ['Paulaner Oktoberfest Bier', 'Hacker-Pschorr Superior Festbier'], waterProfile: 'Munich' },
  { id: '4C', category: 4, subcategory: 'C', name: 'Helles Bock', categoryName: 'Pale Malty European Lager', og_min: 1.064, og_max: 1.072, fg_min: 1.011, fg_max: 1.018, ibu_min: 23, ibu_max: 35, srm_min: 6, srm_max: 11, abv_min: 6.3, abv_max: 7.4, description: 'Strong, malty, clean pale German bock', examples: ['Einbecker Mai-Ur-Bock', 'Ayinger Maibock'], waterProfile: 'Munich' },

  // ── 5. PALE BITTER EUROPEAN BEER ───────────────────────
  { id: '5A', category: 5, subcategory: 'A', name: 'German Leichtbier', categoryName: 'Pale Bitter European Beer', og_min: 1.026, og_max: 1.034, fg_min: 1.006, fg_max: 1.010, ibu_min: 15, ibu_max: 28, srm_min: 1.5, srm_max: 4, abv_min: 2.4, abv_max: 3.6, description: 'German low-calorie lager', examples: ['Bitburger Light', 'Paulaner Münchner Hell Leicht'] },
  { id: '5B', category: 5, subcategory: 'B', name: 'Kölsch', categoryName: 'Pale Bitter European Beer', og_min: 1.044, og_max: 1.050, fg_min: 1.007, fg_max: 1.011, ibu_min: 18, ibu_max: 30, srm_min: 3.5, srm_max: 5, abv_min: 4.4, abv_max: 5.2, description: 'Clean, crisp, delicate balanced Cologne ale', examples: ['Früh Kölsch', 'Reissdorf Kölsch', 'Gaffel Kölsch'], waterProfile: 'Cologne' },
  { id: '5C', category: 5, subcategory: 'C', name: 'German Helles Exportbier', categoryName: 'Pale Bitter European Beer', og_min: 1.048, og_max: 1.056, fg_min: 1.010, fg_max: 1.015, ibu_min: 20, ibu_max: 30, srm_min: 4, srm_max: 7, abv_min: 4.8, abv_max: 6.0, description: 'Golden German export-style lager', examples: ['DAB Original', 'Dortmunder Union Export'], waterProfile: 'Dortmund' },
  { id: '5D', category: 5, subcategory: 'D', name: 'German Pils', categoryName: 'Pale Bitter European Beer', og_min: 1.044, og_max: 1.050, fg_min: 1.008, fg_max: 1.013, ibu_min: 22, ibu_max: 40, srm_min: 2, srm_max: 5, abv_min: 4.4, abv_max: 5.2, description: 'Crisp, clean, refreshingly bitter German Pilsner', examples: ['Bitburger', 'Jever', 'König Pilsener', 'Radeberger'], waterProfile: 'Pilsen' },

  // ── 6. AMBER MALTY EUROPEAN LAGER ──────────────────────
  { id: '6A', category: 6, subcategory: 'A', name: 'Märzen', categoryName: 'Amber Malty European Lager', og_min: 1.054, og_max: 1.060, fg_min: 1.010, fg_max: 1.014, ibu_min: 18, ibu_max: 24, srm_min: 8, srm_max: 17, abv_min: 5.6, abv_max: 6.3, description: 'Elegant, malty German amber lager', examples: ['Paulaner Oktoberfest Märzen', 'Hacker-Pschorr Märzen'], waterProfile: 'Vienna' },
  { id: '6B', category: 6, subcategory: 'B', name: 'Rauchbier', categoryName: 'Amber Malty European Lager', og_min: 1.050, og_max: 1.057, fg_min: 1.012, fg_max: 1.016, ibu_min: 20, ibu_max: 30, srm_min: 12, srm_max: 22, abv_min: 4.8, abv_max: 6.0, description: 'Beechwood-smoked Bamberg amber lager', examples: ['Schlenkerla Märzen', 'Schlenkerla Urbock'] },
  { id: '6C', category: 6, subcategory: 'C', name: 'Dunkles Bock', categoryName: 'Amber Malty European Lager', og_min: 1.064, og_max: 1.072, fg_min: 1.013, fg_max: 1.019, ibu_min: 20, ibu_max: 27, srm_min: 14, srm_max: 22, abv_min: 6.3, abv_max: 7.2, description: 'Dark, strong, malty German lager', examples: ['Einbecker Ur-Bock Dunkel', 'Aass Bock'], waterProfile: 'Munich' },

  // ── 7. AMBER BITTER EUROPEAN BEER ──────────────────────
  { id: '7A', category: 7, subcategory: 'A', name: 'Vienna Lager', categoryName: 'Amber Bitter European Beer', og_min: 1.048, og_max: 1.055, fg_min: 1.010, fg_max: 1.014, ibu_min: 18, ibu_max: 30, srm_min: 9, srm_max: 15, abv_min: 4.7, abv_max: 5.5, description: 'Moderate-strength amber lager with malty sweetness', examples: ['Negra Modelo', 'Samuel Adams Boston Lager'], waterProfile: 'Vienna' },
  { id: '7B', category: 7, subcategory: 'B', name: 'Altbier', categoryName: 'Amber Bitter European Beer', og_min: 1.044, og_max: 1.052, fg_min: 1.008, fg_max: 1.014, ibu_min: 25, ibu_max: 50, srm_min: 11, srm_max: 17, abv_min: 4.3, abv_max: 5.5, description: 'Bitter, well-balanced German amber ale', examples: ['Uerige', 'Füchschen Alt', 'Schumacher Alt'] },

  // ── 8. DARK EUROPEAN LAGER ─────────────────────────────
  { id: '8A', category: 8, subcategory: 'A', name: 'Munich Dunkel', categoryName: 'Dark European Lager', og_min: 1.048, og_max: 1.056, fg_min: 1.010, fg_max: 1.016, ibu_min: 18, ibu_max: 28, srm_min: 17, srm_max: 28, abv_min: 4.5, abv_max: 5.6, description: 'Characterful dark German lager', examples: ['Ayinger Altbairisch Dunkel', 'Hacker-Pschorr Alt Munich Dark', 'Weltenburger Kloster Barock-Dunkel'], waterProfile: 'Munich' },
  { id: '8B', category: 8, subcategory: 'B', name: 'Schwarzbier', categoryName: 'Dark European Lager', og_min: 1.046, og_max: 1.052, fg_min: 1.010, fg_max: 1.016, ibu_min: 20, ibu_max: 35, srm_min: 19, srm_max: 30, abv_min: 4.4, abv_max: 5.4, description: 'Dark but not heavy German lager', examples: ['Köstritzer Schwarzbier', 'Kulmbacher Mönchshof Premium Schwarzbier'] },

  // ── 9. STRONG EUROPEAN BEER ────────────────────────────
  { id: '9A', category: 9, subcategory: 'A', name: 'Doppelbock', categoryName: 'Strong European Beer', og_min: 1.072, og_max: 1.112, fg_min: 1.016, fg_max: 1.024, ibu_min: 16, ibu_max: 26, srm_min: 6, srm_max: 25, abv_min: 7.0, abv_max: 10.0, description: 'Very strong, rich, malty German lager', examples: ['Paulaner Salvator', 'Ayinger Celebrator', 'Spaten Optimator'], waterProfile: 'Munich' },
  { id: '9B', category: 9, subcategory: 'B', name: 'Eisbock', categoryName: 'Strong European Beer', og_min: 1.078, og_max: 1.120, fg_min: 1.020, fg_max: 1.035, ibu_min: 25, ibu_max: 35, srm_min: 18, srm_max: 30, abv_min: 9.0, abv_max: 14.0, description: 'Very strong, concentrated, heavy bock', examples: ['Kulmbacher Eisbock'] },
  { id: '9C', category: 9, subcategory: 'C', name: 'Baltic Porter', categoryName: 'Strong European Beer', og_min: 1.060, og_max: 1.090, fg_min: 1.016, fg_max: 1.024, ibu_min: 20, ibu_max: 40, srm_min: 17, srm_max: 30, abv_min: 6.5, abv_max: 9.5, description: 'Rich, malty, smooth strong dark lager', examples: ['Sinebrychoff Porter', 'Okocim Porter'] },

  // ── 10. GERMAN WHEAT BEER ──────────────────────────────
  { id: '10A', category: 10, subcategory: 'A', name: 'Weissbier', categoryName: 'German Wheat Beer', og_min: 1.044, og_max: 1.053, fg_min: 1.008, fg_max: 1.014, ibu_min: 8, ibu_max: 15, srm_min: 2, srm_max: 6, abv_min: 4.3, abv_max: 5.6, description: 'Refreshing wheat beer with banana and clove', examples: ['Weihenstephaner Hefeweissbier', 'Schneider Weisse Tap 7'], waterProfile: 'Munich' },
  { id: '10B', category: 10, subcategory: 'B', name: 'Dunkles Weissbier', categoryName: 'German Wheat Beer', og_min: 1.044, og_max: 1.056, fg_min: 1.008, fg_max: 1.014, ibu_min: 10, ibu_max: 18, srm_min: 14, srm_max: 23, abv_min: 4.3, abv_max: 5.6, description: 'Moderately dark German wheat beer', examples: ['Franziskaner Hefe-Weisse Dunkel', 'Schneider Weisse Tap 7 Unser Original'] },
  { id: '10C', category: 10, subcategory: 'C', name: 'Weizenbock', categoryName: 'German Wheat Beer', og_min: 1.064, og_max: 1.090, fg_min: 1.015, fg_max: 1.022, ibu_min: 15, ibu_max: 30, srm_min: 6, srm_max: 25, abv_min: 6.5, abv_max: 9.0, description: 'Strong, malty, fruity wheat beer', examples: ['Schneider Aventinus', 'Plank Bavarian Dunkler Weizenbock'] },

  // ── 11. BRITISH BITTER ─────────────────────────────────
  { id: '11A', category: 11, subcategory: 'A', name: 'Ordinary Bitter', categoryName: 'British Bitter', og_min: 1.030, og_max: 1.039, fg_min: 1.007, fg_max: 1.011, ibu_min: 25, ibu_max: 35, srm_min: 8, srm_max: 14, abv_min: 3.2, abv_max: 3.8, description: 'Low-gravity session bitter', examples: ['Fuller\'s Chiswick Bitter', 'Adnams Southwold Bitter'], waterProfile: 'London' },
  { id: '11B', category: 11, subcategory: 'B', name: 'Best Bitter', categoryName: 'British Bitter', og_min: 1.040, og_max: 1.048, fg_min: 1.008, fg_max: 1.012, ibu_min: 25, ibu_max: 40, srm_min: 8, srm_max: 16, abv_min: 3.8, abv_max: 4.6, description: 'Flavorful yet refreshing session beer', examples: ['Timothy Taylor Landlord', 'Fuller\'s London Pride'], waterProfile: 'London' },
  { id: '11C', category: 11, subcategory: 'C', name: 'Strong Bitter', categoryName: 'British Bitter', og_min: 1.048, og_max: 1.060, fg_min: 1.010, fg_max: 1.016, ibu_min: 30, ibu_max: 50, srm_min: 8, srm_max: 18, abv_min: 4.6, abv_max: 6.2, description: 'Moderate to strong British ale', examples: ['Fuller\'s ESB', 'Bass Ale'] },

  // ── 12. PALE COMMONWEALTH BEER ─────────────────────────
  { id: '12A', category: 12, subcategory: 'A', name: 'British Golden Ale', categoryName: 'Pale Commonwealth Beer', og_min: 1.038, og_max: 1.053, fg_min: 1.006, fg_max: 1.012, ibu_min: 20, ibu_max: 45, srm_min: 2, srm_max: 5, abv_min: 3.8, abv_max: 5.0, description: 'British pale ale style, moderately hoppy', examples: ['Hop Back Summer Lightning', 'Oakham JHB'] },
  { id: '12B', category: 12, subcategory: 'B', name: 'Australian Sparkling Ale', categoryName: 'Pale Commonwealth Beer', og_min: 1.038, og_max: 1.050, fg_min: 1.004, fg_max: 1.006, ibu_min: 20, ibu_max: 35, srm_min: 4, srm_max: 7, abv_min: 4.5, abv_max: 6.0, description: 'Clean, highly attenuated Australian ale', examples: ['Coopers Sparkling Ale'] },
  { id: '12C', category: 12, subcategory: 'C', name: 'English IPA', categoryName: 'Pale Commonwealth Beer', og_min: 1.050, og_max: 1.070, fg_min: 1.010, fg_max: 1.015, ibu_min: 40, ibu_max: 60, srm_min: 6, srm_max: 14, abv_min: 5.0, abv_max: 7.5, description: 'Hoppy, moderately strong pale English ale', examples: ['Meantime IPA', 'Worthington White Shield'], waterProfile: 'Burton-on-Trent' },

  // ── 13. BROWN BRITISH BEER ─────────────────────────────
  { id: '13A', category: 13, subcategory: 'A', name: 'Dark Mild', categoryName: 'Brown British Beer', og_min: 1.030, og_max: 1.038, fg_min: 1.008, fg_max: 1.013, ibu_min: 10, ibu_max: 25, srm_min: 12, srm_max: 25, abv_min: 3.0, abv_max: 3.8, description: 'Low-gravity session dark ale', examples: ['Moorhouse\'s Black Cat', 'Brain\'s Dark'] },
  { id: '13B', category: 13, subcategory: 'B', name: 'British Brown Ale', categoryName: 'Brown British Beer', og_min: 1.040, og_max: 1.052, fg_min: 1.008, fg_max: 1.013, ibu_min: 20, ibu_max: 30, srm_min: 12, srm_max: 22, abv_min: 4.2, abv_max: 5.9, description: 'Malty, toasty English brown ale', examples: ['Newcastle Brown Ale', 'Samuel Smith\'s Nut Brown Ale'], waterProfile: 'London' },
  { id: '13C', category: 13, subcategory: 'C', name: 'English Porter', categoryName: 'Brown British Beer', og_min: 1.040, og_max: 1.052, fg_min: 1.008, fg_max: 1.014, ibu_min: 18, ibu_max: 35, srm_min: 20, srm_max: 30, abv_min: 4.0, abv_max: 5.4, description: 'Moderate-strength dark ale with chocolate and caramel', examples: ['Fuller\'s London Porter', 'Samuel Smith\'s Taddy Porter'], waterProfile: 'London' },

  // ── 14. SCOTTISH ALE ───────────────────────────────────
  { id: '14A', category: 14, subcategory: 'A', name: 'Scottish Light', categoryName: 'Scottish Ale', og_min: 1.030, og_max: 1.035, fg_min: 1.010, fg_max: 1.013, ibu_min: 10, ibu_max: 20, srm_min: 17, srm_max: 22, abv_min: 2.5, abv_max: 3.2, description: 'Very low-gravity malty Scottish session ale', examples: ['McEwan\'s 60/-'], waterProfile: 'Edinburgh' },
  { id: '14B', category: 14, subcategory: 'B', name: 'Scottish Heavy', categoryName: 'Scottish Ale', og_min: 1.035, og_max: 1.040, fg_min: 1.010, fg_max: 1.015, ibu_min: 10, ibu_max: 20, srm_min: 13, srm_max: 22, abv_min: 3.2, abv_max: 3.9, description: 'Low-gravity malt-focused Scottish ale', examples: ['Caledonian 70/-'], waterProfile: 'Edinburgh' },
  { id: '14C', category: 14, subcategory: 'C', name: 'Scottish Export', categoryName: 'Scottish Ale', og_min: 1.040, og_max: 1.060, fg_min: 1.010, fg_max: 1.016, ibu_min: 15, ibu_max: 30, srm_min: 13, srm_max: 22, abv_min: 3.9, abv_max: 6.0, description: 'Moderate-strength malty ale', examples: ['Belhaven Scottish Ale', 'McEwan\'s 80/-'], waterProfile: 'Edinburgh' },

  // ── 15. IRISH BEER ─────────────────────────────────────
  { id: '15A', category: 15, subcategory: 'A', name: 'Irish Red Ale', categoryName: 'Irish Beer', og_min: 1.036, og_max: 1.046, fg_min: 1.010, fg_max: 1.014, ibu_min: 18, ibu_max: 28, srm_min: 9, srm_max: 14, abv_min: 3.8, abv_max: 5.0, description: 'Easy-drinking malty amber ale', examples: ['Smithwick\'s Irish Ale', 'Kilkenny Irish Cream Ale'] },
  { id: '15B', category: 15, subcategory: 'B', name: 'Irish Stout', categoryName: 'Irish Beer', og_min: 1.036, og_max: 1.044, fg_min: 1.007, fg_max: 1.011, ibu_min: 25, ibu_max: 45, srm_min: 25, srm_max: 40, abv_min: 4.0, abv_max: 4.5, description: 'Black, creamy, roasty, dry stout', examples: ['Guinness Draught', 'Murphy\'s Irish Stout', 'Beamish'], waterProfile: 'Dublin' },
  { id: '15C', category: 15, subcategory: 'C', name: 'Irish Extra Stout', categoryName: 'Irish Beer', og_min: 1.052, og_max: 1.062, fg_min: 1.010, fg_max: 1.014, ibu_min: 35, ibu_max: 50, srm_min: 30, srm_max: 40, abv_min: 5.5, abv_max: 6.5, description: 'Moderate-strong roasty dry stout', examples: ['Guinness Extra Stout', 'Belhaven Black Stout'], waterProfile: 'Dublin' },

  // ── 16. DARK BRITISH BEER ──────────────────────────────
  { id: '16A', category: 16, subcategory: 'A', name: 'Sweet Stout', categoryName: 'Dark British Beer', og_min: 1.044, og_max: 1.060, fg_min: 1.012, fg_max: 1.024, ibu_min: 20, ibu_max: 40, srm_min: 30, srm_max: 40, abv_min: 4.0, abv_max: 6.0, description: 'Dark ale with residual sweetness', examples: ['Mackeson XXX Stout', 'Left Hand Milk Stout'] },
  { id: '16B', category: 16, subcategory: 'B', name: 'Oatmeal Stout', categoryName: 'Dark British Beer', og_min: 1.045, og_max: 1.065, fg_min: 1.010, fg_max: 1.018, ibu_min: 25, ibu_max: 40, srm_min: 22, srm_max: 40, abv_min: 4.2, abv_max: 5.9, description: 'Dark, smooth ale with oatmeal added for body', examples: ['Samuel Smith Oatmeal Stout', 'Firestone Walker Velvet Merlin'] },
  { id: '16C', category: 16, subcategory: 'C', name: 'Tropical Stout', categoryName: 'Dark British Beer', og_min: 1.056, og_max: 1.075, fg_min: 1.010, fg_max: 1.018, ibu_min: 30, ibu_max: 50, srm_min: 30, srm_max: 40, abv_min: 5.5, abv_max: 8.0, description: 'Moderately strong, roasty, somewhat sweet stout', examples: ['Dragon Stout', 'Lion Stout'] },
  { id: '16D', category: 16, subcategory: 'D', name: 'Foreign Extra Stout', categoryName: 'Dark British Beer', og_min: 1.056, og_max: 1.075, fg_min: 1.010, fg_max: 1.018, ibu_min: 50, ibu_max: 70, srm_min: 30, srm_max: 40, abv_min: 6.3, abv_max: 8.0, description: 'Very dark, moderately strong, dry stout', examples: ['Guinness Foreign Extra Stout', 'Coopers Best Extra Stout'] },

  // ── 17. STRONG BRITISH ALE ─────────────────────────────
  { id: '17A', category: 17, subcategory: 'A', name: 'British Strong Ale', categoryName: 'Strong British Ale', og_min: 1.055, og_max: 1.080, fg_min: 1.015, fg_max: 1.022, ibu_min: 30, ibu_max: 60, srm_min: 8, srm_max: 22, abv_min: 5.5, abv_max: 8.0, description: 'Mature, strong, malty ale with complexity', examples: ['Fuller\'s 1845', 'Samuel Smith\'s Imperial Stout'] },
  { id: '17B', category: 17, subcategory: 'B', name: 'Old Ale', categoryName: 'Strong British Ale', og_min: 1.055, og_max: 1.088, fg_min: 1.015, fg_max: 1.022, ibu_min: 30, ibu_max: 60, srm_min: 10, srm_max: 22, abv_min: 5.5, abv_max: 9.0, description: 'Aged, malty, dark, complex strong ale', examples: ['Theakston Old Peculier', 'Greene King Strong Suffolk'] },
  { id: '17C', category: 17, subcategory: 'C', name: 'Wee Heavy', categoryName: 'Strong British Ale', og_min: 1.070, og_max: 1.130, fg_min: 1.018, fg_max: 1.040, ibu_min: 17, ibu_max: 35, srm_min: 14, srm_max: 25, abv_min: 6.5, abv_max: 10.0, description: 'Rich, malty, intense Scottish strong ale', examples: ['Traquair House Ale', 'Belhaven Wee Heavy'], waterProfile: 'Edinburgh' },
  { id: '17D', category: 17, subcategory: 'D', name: 'English Barleywine', categoryName: 'Strong British Ale', og_min: 1.080, og_max: 1.120, fg_min: 1.018, fg_max: 1.030, ibu_min: 35, ibu_max: 70, srm_min: 8, srm_max: 22, abv_min: 8.0, abv_max: 12.0, description: 'Rich, strong, complex aged ale', examples: ['Fuller\'s Golden Pride', 'J.W. Lee\'s Vintage Harvest Ale'] },

  // ── 18. PALE AMERICAN ALE ──────────────────────────────
  { id: '18A', category: 18, subcategory: 'A', name: 'Blonde Ale', categoryName: 'Pale American Ale', og_min: 1.038, og_max: 1.054, fg_min: 1.008, fg_max: 1.013, ibu_min: 15, ibu_max: 28, srm_min: 3, srm_max: 6, abv_min: 3.8, abv_max: 5.5, description: 'Easy-drinking, approachable, malt-accented', examples: ['Firestone Walker 805', 'Kona Big Wave Golden Ale'] },
  { id: '18B', category: 18, subcategory: 'B', name: 'American Pale Ale', categoryName: 'Pale American Ale', og_min: 1.045, og_max: 1.060, fg_min: 1.010, fg_max: 1.015, ibu_min: 30, ibu_max: 50, srm_min: 5, srm_max: 10, abv_min: 4.5, abv_max: 6.2, description: 'Moderately strong, hop-forward pale ale', examples: ['Sierra Nevada Pale Ale', 'Deschutes Mirror Pond', 'Oskar Blues Dale\'s Pale Ale'] },

  // ── 19. AMBER AND BROWN AMERICAN BEER ──────────────────
  { id: '19A', category: 19, subcategory: 'A', name: 'American Amber Ale', categoryName: 'Amber and Brown American Beer', og_min: 1.045, og_max: 1.060, fg_min: 1.010, fg_max: 1.015, ibu_min: 25, ibu_max: 40, srm_min: 10, srm_max: 17, abv_min: 4.5, abv_max: 6.2, description: 'Amber colored, hop & malt balanced', examples: ['Fat Tire Amber Ale', 'Tröegs HopBack Amber Ale'] },
  { id: '19B', category: 19, subcategory: 'B', name: 'California Common', categoryName: 'Amber and Brown American Beer', og_min: 1.048, og_max: 1.054, fg_min: 1.011, fg_max: 1.014, ibu_min: 30, ibu_max: 45, srm_min: 9, srm_max: 14, abv_min: 4.5, abv_max: 5.5, description: 'Toasty, caramel malty lager brewed warm', examples: ['Anchor Steam'] },
  { id: '19C', category: 19, subcategory: 'C', name: 'American Brown Ale', categoryName: 'Amber and Brown American Beer', og_min: 1.045, og_max: 1.060, fg_min: 1.010, fg_max: 1.016, ibu_min: 20, ibu_max: 30, srm_min: 18, srm_max: 35, abv_min: 4.3, abv_max: 6.2, description: 'Hoppy, dark amber to brown American ale', examples: ['Big Sky Moose Drool', 'Brooklyn Brown Ale'] },

  // ── 20. AMERICAN PORTER AND STOUT ──────────────────────
  { id: '20A', category: 20, subcategory: 'A', name: 'American Porter', categoryName: 'American Porter and Stout', og_min: 1.050, og_max: 1.070, fg_min: 1.012, fg_max: 1.018, ibu_min: 25, ibu_max: 50, srm_min: 22, srm_max: 40, abv_min: 4.8, abv_max: 6.5, description: 'Substantial, malty dark ale with assertive hop character', examples: ['Anchor Porter', 'Deschutes Black Butte Porter'] },
  { id: '20B', category: 20, subcategory: 'B', name: 'American Stout', categoryName: 'American Porter and Stout', og_min: 1.050, og_max: 1.075, fg_min: 1.010, fg_max: 1.022, ibu_min: 35, ibu_max: 75, srm_min: 30, srm_max: 40, abv_min: 5.0, abv_max: 7.0, description: 'Dark, roasty, hoppy American stout', examples: ['Sierra Nevada Stout', 'North Coast Old No. 38'] },
  { id: '20C', category: 20, subcategory: 'C', name: 'Imperial Stout', categoryName: 'American Porter and Stout', og_min: 1.075, og_max: 1.115, fg_min: 1.018, fg_max: 1.030, ibu_min: 50, ibu_max: 90, srm_min: 30, srm_max: 40, abv_min: 8.0, abv_max: 12.0, description: 'Intensely flavored, big, dark ale', examples: ['North Coast Old Rasputin', 'Founders Breakfast Stout'] },

  // ── 21. IPA ────────────────────────────────────────────
  { id: '21A', category: 21, subcategory: 'A', name: 'American IPA', categoryName: 'IPA', og_min: 1.056, og_max: 1.070, fg_min: 1.008, fg_max: 1.014, ibu_min: 40, ibu_max: 70, srm_min: 6, srm_max: 14, abv_min: 5.5, abv_max: 7.5, description: 'Decidedly hoppy and bitter, moderately strong', examples: ['Bell\'s Two Hearted', 'Lagunitas IPA', 'Russian River Blind Pig IPA'], waterProfile: 'Burton-on-Trent' },
  { id: '21B1', category: 21, subcategory: 'B1', name: 'Belgian IPA', categoryName: 'IPA', og_min: 1.058, og_max: 1.080, fg_min: 1.008, fg_max: 1.016, ibu_min: 50, ibu_max: 100, srm_min: 5, srm_max: 8, abv_min: 6.2, abv_max: 9.5, description: 'IPA with Belgian yeast character', examples: ['Brasserie d\'Achouffe Houblon Chouffe'] },
  { id: '21B2', category: 21, subcategory: 'B2', name: 'Black IPA', categoryName: 'IPA', og_min: 1.050, og_max: 1.085, fg_min: 1.010, fg_max: 1.018, ibu_min: 50, ibu_max: 90, srm_min: 25, srm_max: 40, abv_min: 5.0, abv_max: 9.0, description: 'Black hopped ale without heavy roast', examples: ['21st Amendment Back in Black'] },
  { id: '21B3', category: 21, subcategory: 'B3', name: 'Brown IPA', categoryName: 'IPA', og_min: 1.056, og_max: 1.070, fg_min: 1.008, fg_max: 1.016, ibu_min: 40, ibu_max: 70, srm_min: 11, srm_max: 19, abv_min: 5.5, abv_max: 7.5, description: 'Hoppy malt-forward brownish IPA', examples: ['Dogfish Head Indian Brown Ale'] },
  { id: '21B4', category: 21, subcategory: 'B4', name: 'Brut IPA', categoryName: 'IPA', og_min: 1.046, og_max: 1.060, fg_min: 0.990, fg_max: 1.004, ibu_min: 20, ibu_max: 30, srm_min: 2, srm_max: 4, abv_min: 6.0, abv_max: 7.5, description: 'Very dry, highly carbonated, effervescent IPA', examples: ['Drake\'s Brightside', 'Fieldwork Brut IPA'] },
  { id: '21B5', category: 21, subcategory: 'B5', name: 'Hazy IPA / NEIPA', categoryName: 'IPA', og_min: 1.060, og_max: 1.085, fg_min: 1.010, fg_max: 1.020, ibu_min: 25, ibu_max: 60, srm_min: 3, srm_max: 7, abv_min: 6.0, abv_max: 9.0, description: 'Hazy, juicy, fruity, soft IPA', examples: ['Treehouse Julius', 'Other Half DDH All Green Everything', 'Trillium Congress Street'] },
  { id: '21B6', category: 21, subcategory: 'B6', name: 'Red IPA', categoryName: 'IPA', og_min: 1.056, og_max: 1.070, fg_min: 1.008, fg_max: 1.016, ibu_min: 40, ibu_max: 70, srm_min: 11, srm_max: 19, abv_min: 5.5, abv_max: 7.5, description: 'Hoppy amber-red ale with malt backbone', examples: ['Green Flash Hop Head Red', 'Tröegs Nugget Nectar'] },
  { id: '21B7', category: 21, subcategory: 'B7', name: 'White IPA', categoryName: 'IPA', og_min: 1.056, og_max: 1.065, fg_min: 1.010, fg_max: 1.016, ibu_min: 40, ibu_max: 70, srm_min: 5, srm_max: 6, abv_min: 5.5, abv_max: 7.0, description: 'IPA with Belgian witbier character', examples: ['Blue Moon White IPA'] },

  // ── 22. STRONG AMERICAN ALE ────────────────────────────
  { id: '22A', category: 22, subcategory: 'A', name: 'Double IPA', categoryName: 'Strong American Ale', og_min: 1.065, og_max: 1.085, fg_min: 1.008, fg_max: 1.018, ibu_min: 60, ibu_max: 120, srm_min: 6, srm_max: 14, abv_min: 7.5, abv_max: 10.0, description: 'Intensely hoppy, bitter, strong pale ale', examples: ['Russian River Pliny the Elder', 'Bell\'s Hopslam', 'Dogfish Head 90 Minute IPA'] },
  { id: '22B', category: 22, subcategory: 'B', name: 'American Strong Ale', categoryName: 'Strong American Ale', og_min: 1.062, og_max: 1.090, fg_min: 1.014, fg_max: 1.024, ibu_min: 50, ibu_max: 100, srm_min: 7, srm_max: 19, abv_min: 6.3, abv_max: 10.0, description: 'Strong, hoppy, malty American ale', examples: ['Stone Arrogant Bastard', 'Bear Republic Red Rocket Ale'] },
  { id: '22C', category: 22, subcategory: 'C', name: 'American Barleywine', categoryName: 'Strong American Ale', og_min: 1.080, og_max: 1.120, fg_min: 1.016, fg_max: 1.030, ibu_min: 50, ibu_max: 100, srm_min: 9, srm_max: 18, abv_min: 8.0, abv_max: 12.0, description: 'Very strong, intensely hoppy amber-copper ale', examples: ['Sierra Nevada Bigfoot', 'Anchor Old Foghorn'] },
  { id: '22D', category: 22, subcategory: 'D', name: 'Wheatwine', categoryName: 'Strong American Ale', og_min: 1.080, og_max: 1.120, fg_min: 1.016, fg_max: 1.030, ibu_min: 30, ibu_max: 60, srm_min: 6, srm_max: 14, abv_min: 8.0, abv_max: 12.0, description: 'Strong, wheat-based ale with complexity', examples: ['Smuttynose Wheat Wine Ale', 'Lagunitas Olde GnarlyWine'] },

  // ── 23. EUROPEAN SOUR ALE ──────────────────────────────
  { id: '23A', category: 23, subcategory: 'A', name: 'Berliner Weisse', categoryName: 'European Sour Ale', og_min: 1.028, og_max: 1.032, fg_min: 1.003, fg_max: 1.006, ibu_min: 3, ibu_max: 8, srm_min: 2, srm_max: 3, abv_min: 2.8, abv_max: 3.8, description: 'Very pale, sour, refreshing wheat ale', examples: ['Bayerischer Bahnhof Berliner Style Weisse'] },
  { id: '23B', category: 23, subcategory: 'B', name: 'Flanders Red Ale', categoryName: 'European Sour Ale', og_min: 1.048, og_max: 1.057, fg_min: 1.002, fg_max: 1.012, ibu_min: 10, ibu_max: 25, srm_min: 10, srm_max: 17, abv_min: 4.6, abv_max: 6.5, description: 'Complex, sour, red-wine-like Belgian ale', examples: ['Rodenbach Grand Cru', 'Duchesse de Bourgogne'] },
  { id: '23C', category: 23, subcategory: 'C', name: 'Oud Bruin', categoryName: 'European Sour Ale', og_min: 1.040, og_max: 1.074, fg_min: 1.008, fg_max: 1.012, ibu_min: 20, ibu_max: 25, srm_min: 17, srm_max: 22, abv_min: 4.0, abv_max: 8.0, description: 'Malty, fruity, aged sour brown ale', examples: ['Liefmans Goudenband'] },
  { id: '23D', category: 23, subcategory: 'D', name: 'Lambic', categoryName: 'European Sour Ale', og_min: 1.040, og_max: 1.054, fg_min: 1.001, fg_max: 1.010, ibu_min: 0, ibu_max: 10, srm_min: 3, srm_max: 6, abv_min: 5.0, abv_max: 6.5, description: 'Wild-fermented, complex, sour Belgian wheat beer', examples: ['Cantillon Grand Cru Bruocsella', 'Boon Oude Lambiek'] },
  { id: '23E', category: 23, subcategory: 'E', name: 'Gueuze', categoryName: 'European Sour Ale', og_min: 1.040, og_max: 1.060, fg_min: 1.000, fg_max: 1.006, ibu_min: 0, ibu_max: 10, srm_min: 5, srm_max: 6, abv_min: 5.0, abv_max: 8.0, description: 'Blended spontaneously-fermented beers', examples: ['Cantillon Gueuze', 'Boon Oude Geuze', '3 Fonteinen Oude Geuze'] },
  { id: '23F', category: 23, subcategory: 'F', name: 'Fruit Lambic', categoryName: 'European Sour Ale', og_min: 1.040, og_max: 1.060, fg_min: 1.000, fg_max: 1.010, ibu_min: 0, ibu_max: 10, srm_min: 3, srm_max: 7, abv_min: 5.0, abv_max: 7.0, description: 'Complex fruit lambic', examples: ['Cantillon Kriek', 'Boon Kriek Mariage Parfait', '3 Fonteinen Oude Kriek'] },

  // ── 24. BELGIAN ALE ────────────────────────────────────
  { id: '24A', category: 24, subcategory: 'A', name: 'Witbier', categoryName: 'Belgian Ale', og_min: 1.044, og_max: 1.052, fg_min: 1.008, fg_max: 1.012, ibu_min: 8, ibu_max: 20, srm_min: 2, srm_max: 4, abv_min: 4.5, abv_max: 5.5, description: 'Refreshing, spiced Belgian wheat beer', examples: ['Hoegaarden Wit', 'St. Bernardus Wit', 'Celis White'] },
  { id: '24B', category: 24, subcategory: 'B', name: 'Belgian Pale Ale', categoryName: 'Belgian Ale', og_min: 1.048, og_max: 1.054, fg_min: 1.010, fg_max: 1.014, ibu_min: 20, ibu_max: 30, srm_min: 8, srm_max: 14, abv_min: 4.8, abv_max: 5.5, description: 'Moderate malty Belgian ale with fruit/spice', examples: ['De Koninck', 'Palm Speciale'] },
  { id: '24C', category: 24, subcategory: 'C', name: 'Bière de Garde', categoryName: 'Belgian Ale', og_min: 1.060, og_max: 1.080, fg_min: 1.008, fg_max: 1.016, ibu_min: 18, ibu_max: 28, srm_min: 6, srm_max: 19, abv_min: 6.0, abv_max: 8.5, description: 'Strong, malty Northern French ale', examples: ['Ch\'Ti Blonde', 'Jenlain Blonde', '3 Monts'] },

  // ── 25. STRONG BELGIAN ALE ─────────────────────────────
  { id: '25A', category: 25, subcategory: 'A', name: 'Belgian Blond Ale', categoryName: 'Strong Belgian Ale', og_min: 1.062, og_max: 1.075, fg_min: 1.008, fg_max: 1.018, ibu_min: 15, ibu_max: 30, srm_min: 4, srm_max: 6, abv_min: 6.0, abv_max: 7.5, description: 'Moderate-strength golden ale', examples: ['Leffe Blond', 'Affligem Blond', 'Grimbergen Blond'] },
  { id: '25B', category: 25, subcategory: 'B', name: 'Saison', categoryName: 'Strong Belgian Ale', og_min: 1.048, og_max: 1.065, fg_min: 1.002, fg_max: 1.008, ibu_min: 20, ibu_max: 35, srm_min: 5, srm_max: 14, abv_min: 5.0, abv_max: 7.0, description: 'Fruity, spicy, refreshing Belgian farmhouse ale', examples: ['Saison Dupont', 'Fantôme Saison', 'Blaugies Saison d\'Epeautre'] },
  { id: '25C', category: 25, subcategory: 'C', name: 'Belgian Golden Strong Ale', categoryName: 'Strong Belgian Ale', og_min: 1.070, og_max: 1.095, fg_min: 1.005, fg_max: 1.016, ibu_min: 22, ibu_max: 35, srm_min: 3, srm_max: 6, abv_min: 7.5, abv_max: 10.5, description: 'Very strong golden Belgian ale', examples: ['Duvel', 'Delirium Tremens', 'Piraat'] },

  // ── 26. TRAPPIST ALE ───────────────────────────────────
  { id: '26A', category: 26, subcategory: 'A', name: 'Trappist Single', categoryName: 'Trappist Ale', og_min: 1.044, og_max: 1.054, fg_min: 1.004, fg_max: 1.010, ibu_min: 25, ibu_max: 45, srm_min: 3, srm_max: 5, abv_min: 4.8, abv_max: 6.0, description: 'Bitter, hoppy, refreshing Trappist table beer', examples: ['Westmalle Extra', 'Chimay Gold', 'Achel 5° Blond'] },
  { id: '26B', category: 26, subcategory: 'B', name: 'Belgian Dubbel', categoryName: 'Trappist Ale', og_min: 1.062, og_max: 1.075, fg_min: 1.008, fg_max: 1.018, ibu_min: 15, ibu_max: 25, srm_min: 10, srm_max: 17, abv_min: 6.0, abv_max: 7.6, description: 'Complex, dark, malty Belgian abbey ale', examples: ['Westmalle Dubbel', 'Chimay Première (Red)', 'St. Bernardus Pater 6'] },
  { id: '26C', category: 26, subcategory: 'C', name: 'Belgian Tripel', categoryName: 'Trappist Ale', og_min: 1.075, og_max: 1.085, fg_min: 1.008, fg_max: 1.014, ibu_min: 20, ibu_max: 40, srm_min: 4.5, srm_max: 7, abv_min: 7.5, abv_max: 9.5, description: 'Strong, pale, complex Belgian abbey ale', examples: ['Westmalle Tripel', 'Chimay Cinq Cents (White)', 'La Trappe Tripel'] },
  { id: '26D', category: 26, subcategory: 'D', name: 'Belgian Dark Strong Ale', categoryName: 'Trappist Ale', og_min: 1.075, og_max: 1.110, fg_min: 1.010, fg_max: 1.024, ibu_min: 20, ibu_max: 35, srm_min: 12, srm_max: 22, abv_min: 8.0, abv_max: 12.0, description: 'Dark, complex, strong Belgian abbey ale', examples: ['Westvleteren 12', 'Rochefort 10', 'St. Bernardus Abt 12', 'Chimay Grande Réserve (Blue)'] },

  // ── 28. AMERICAN WILD ALE ──────────────────────────────
  { id: '28A', category: 28, subcategory: 'A', name: 'Brett Beer', categoryName: 'American Wild Ale', og_min: 1.040, og_max: 1.070, fg_min: 1.000, fg_max: 1.010, ibu_min: 0, ibu_max: 30, srm_min: 2, srm_max: 30, abv_min: 4.5, abv_max: 7.5, description: 'Clean beer with Brettanomyces character', examples: ['Boulevard Saison Brett', 'Logsdon Seizoen Bretta'] },
  { id: '28B', category: 28, subcategory: 'B', name: 'Mixed-Fermentation Sour Beer', categoryName: 'American Wild Ale', og_min: 1.040, og_max: 1.070, fg_min: 1.000, fg_max: 1.010, ibu_min: 0, ibu_max: 30, srm_min: 2, srm_max: 30, abv_min: 4.5, abv_max: 7.5, description: 'American interpretation of traditional sour', examples: ['Jester King Le Petit Prince', 'Jolly Pumpkin Oro de Calabaza'] },
  { id: '28C', category: 28, subcategory: 'C', name: 'Wild Specialty Beer', categoryName: 'American Wild Ale', og_min: 1.040, og_max: 1.100, fg_min: 1.000, fg_max: 1.020, ibu_min: 0, ibu_max: 30, srm_min: 2, srm_max: 30, abv_min: 4.5, abv_max: 10.0, description: 'Specialty ingredients with wild/sour character', examples: ['Cascade Apricot Sour'] },
]

/* ── Lookup helpers ────────────────────────────────────────────── */
export const BJCP_MAP = Object.fromEntries(BJCP_STYLES.map(s => [s.id, s])) as Record<string, BJCPStyle>

/** Unique category names in order */
export const BJCP_CATEGORIES = [...new Set(BJCP_STYLES.map(s => s.categoryName))]

/** Find styles matching a given recipe's stats */
export function findMatchingStyles(og: number, fg: number, ibu: number, srm: number, abv: number): BJCPStyle[] {
  return BJCP_STYLES.filter(s =>
    og >= s.og_min && og <= s.og_max &&
    fg >= s.fg_min && fg <= s.fg_max &&
    ibu >= s.ibu_min && ibu <= s.ibu_max &&
    srm >= s.srm_min && srm <= s.srm_max &&
    abv >= s.abv_min && abv <= s.abv_max
  )
}

/** Check if recipe stats fall within a specific style */
export function checkStyleConformance(styleId: string, og: number, fg: number, ibu: number, srm: number, abv: number) {
  const style = BJCP_MAP[styleId]
  if (!style) return null

  type ParamKey = 'og' | 'fg' | 'ibu' | 'srm' | 'abv'
  const params: { name: ParamKey; value: number; min: number; max: number; unit: string }[] = [
    { name: 'og', value: og, min: style.og_min, max: style.og_max, unit: '' },
    { name: 'fg', value: fg, min: style.fg_min, max: style.fg_max, unit: '' },
    { name: 'ibu', value: ibu, min: style.ibu_min, max: style.ibu_max, unit: '' },
    { name: 'srm', value: srm, min: style.srm_min, max: style.srm_max, unit: '' },
    { name: 'abv', value: abv, min: style.abv_min, max: style.abv_max, unit: '%' },
  ]

  const outOfRange = params.filter(p => p.value < p.min || p.value > p.max)
  const withinRange = params.filter(p => p.value >= p.min && p.value <= p.max)

  return {
    style,
    inRange: outOfRange.length === 0,
    withinRange,
    outOfRange,
    score: withinRange.length / params.length, // 0..1
  }
}

/** Search styles by name or category */
export function searchStyles(query: string): BJCPStyle[] {
  const q = query.toLowerCase()
  return BJCP_STYLES.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.categoryName.toLowerCase().includes(q) ||
    s.id.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q)
  )
}
