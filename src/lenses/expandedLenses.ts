import { Lens, LensCategory, LensConfig } from '../types/lens';

type LensSeed = [string, string];

const COLORS = [
  '#f43f5e', '#fb7185', '#f97316', '#f59e0b', '#facc15', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#38bdf8', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#e11d48',
];

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const funnySeeds: LensSeed[] = [
  ['Giggle Face', 'Laughing cheeks and a playful face wobble.'],
  ['Wobble Nose', 'A bouncy cartoon nose that follows every expression.'],
  ['Button Face', 'Shrinks your features into an irresistibly tiny button face.'],
  ['Long Face', 'Stretches your face into a dramatic comedy portrait.'],
  ['Wide Smile', 'Expands your smile for an over-the-top reaction shot.'],
  ['Chipmunk Cheeks', 'Puffs both cheeks like you are hiding a snack.'],
  ['Tiny Mouth', 'Turns every word into an adorable silent-movie expression.'],
  ['Bubble Head', 'Rounds your head into a glossy cartoon bubble.'],
  ['Silly Chin', 'Gives your chin a soft, exaggerated cartoon bounce.'],
  ['Surprised Eyes', 'Makes your eyes huge for maximum shock reactions.'],
  ['Sleepy Face', 'Droopy eyes and a relaxed sleepy expression.'],
  ['Fish Lips', 'A playful pout with a soft face pinch.'],
  ['Noodle Neck', 'Adds a gentle vertical stretch for a noodle-like look.'],
  ['Melted Face', 'A wavy melting effect for strange selfie comedy.'],
  ['Mirror Flip', 'Playful horizontal stretch for a funhouse reflection.'],
  ['Cartoon Hero', 'Bright punchy contrast with a confident jaw sculpt.'],
  ['Clown Cheeks', 'Round rosy cheeks with an animated cheerful glow.'],
  ['Dizzy Swirl', 'A dizzying swirl around your face for comic chaos.'],
  ['Robot Smile', 'Sharp contrast and a playful geometric mouth stretch.'],
  ['Pancake Face', 'Flattens the face into a silly pancake portrait.'],
  ['Marshmallow Head', 'Softens and inflates the face like a marshmallow.'],
  ['Alien Smile', 'A cheeky extraterrestrial smile with neon color.'],
  ['Raccoon Mask', 'A mischievous dark eye-mask style with a warm tint.'],
  ['Goofy Glasses', 'Oversized comic glasses with a bright playful filter.'],
  ['Rainy Tears', 'A dramatic blue-toned reaction face for fake crying.'],
  ['Hot Sauce', 'Fiery red contrast for spicy reaction videos.'],
  ['Ice Shock', 'Cool blue freeze-frame energy for surprised faces.'],
  ['Pixel Giggle', 'Retro color blocks and a light cartoon face pinch.'],
  ['Rubber Face', 'Stretchy elastic features that bounce with your movement.'],
  ['Comedy Spotlight', 'Bright stage lighting with a bold funny-face sculpt.'],
  ['Squeaky Face', 'Tiny eyes, round cheeks, and a playful squeaky look.'],
];

const animalSeeds: LensSeed[] = [
  ['Fox Friend', 'Warm fox colors with pointed ears and a bright muzzle.'],
  ['Kitten Wink', 'Soft cat styling with a playful wink-ready glow.'],
  ['Panda Pop', 'Black-and-white panda styling with soft round cheeks.'],
  ['Tiger Roar', 'Golden tiger stripes and a bold wild color grade.'],
  ['Lion Mane', 'Warm lion colors and a confident royal glow.'],
  ['Koala Cuddle', 'Soft grey koala styling with a gentle sleepy tint.'],
  ['Bunny Hop', 'Pastel bunny styling with springtime color.'],
  ['Deer Eyes', 'Large luminous eyes with a woodland color palette.'],
  ['Bear Hug', 'Warm brown tones and a cozy rounded face.'],
  ['Puppy Love', 'Golden puppy warmth with a soft heart-like glow.'],
  ['Leopard Lounge', 'Golden spotted style with a confident contrast boost.'],
  ['Zebra Zoom', 'High-contrast monochrome stripes for a graphic animal look.'],
  ['Giraffe Glow', 'Golden sunset tones and a tall, elegant face stretch.'],
  ['Penguin Party', 'Cool black-and-white styling with a cheerful glow.'],
  ['Frog Fresh', 'Bright green fresh tones for a playful amphibian look.'],
  ['Owl Wisdom', 'Deep night colors with luminous, focused eyes.'],
  ['Wolf Moon', 'Silver-blue moonlight styling with a mysterious glow.'],
  ['Horse Ride', 'Warm stable tones with an energetic face stretch.'],
  ['Hedgehog Cozy', 'Soft brown cozy styling with rounded cheeks.'],
  ['Otter Splash', 'Cool watery colors and a bright playful expression.'],
  ['Flamingo Pink', 'Vivid pink tropical tones with a graceful face glow.'],
  ['Peacock Prism', 'Iridescent jewel colors for a glamorous bird look.'],
  ['Parrot Pop', 'Bright tropical colors with animated sparkle.'],
  ['Eagle Vision', 'High-contrast sky colors with a sharp focused look.'],
  ['Butterfly Bloom', 'Pastel floral color with a soft radiant face.'],
  ['Bee Sweet', 'Golden honey tones with bright yellow sparkle.'],
  ['Ladybug Lucky', 'Red-and-black contrast with a cheerful glow.'],
  ['Dolphin Dive', 'Ocean blue tones with a smooth aquatic shine.'],
  ['Shark Week', 'Cool steel-blue tones with dramatic contrast.'],
  ['Turtle Time', 'Relaxed green tones for a calm, cozy look.'],
];

const creatureSeeds: LensSeed[] = [
  ['Dragon Fire', 'Fiery fantasy colors with a powerful creature glow.'],
  ['Ice Dragon', 'Frosty blue energy with crystalline contrast.'],
  ['Unicorn Dream', 'Pastel rainbow glow with magical sparkle.'],
  ['Mermaid Mist', 'Seafoam colors with a dreamy underwater shimmer.'],
  ['Vampire Velvet', 'Deep crimson shadows and elegant night contrast.'],
  ['Witchy Wink', 'Purple spellbook tones with a mischievous glow.'],
  ['Ghost Story', 'Pale moonlight styling with a soft spectral haze.'],
  ['Zombie Shuffle', 'Muted green tones with a funny undead color grade.'],
  ['Demon Ember', 'Red-hot ember colors and dramatic shadow contrast.'],
  ['Fairy Dust', 'Tiny sparkling highlights with a magical pastel tint.'],
  ['Goblin Green', 'Playful green shadows with a cheeky face sculpt.'],
  ['Troll Stone', 'Rocky grey tones with a broad fantasy jaw.'],
  ['Phoenix Rise', 'Orange-gold firelight with a bright rising glow.'],
  ['Kraken Deep', 'Dark ocean colors with a mysterious blue shimmer.'],
  ['Sphinx Gold', 'Desert gold tones with a regal sculpted look.'],
  ['Centaur Charge', 'Warm earth tones with an energetic vertical stretch.'],
  ['Griffin Guard', 'Royal bronze color with a strong heroic contrast.'],
  ['Sea Serpent', 'Teal ocean shadows with a smooth aquatic glow.'],
  ['Moon Werewolf', 'Silver moonlight tones with a wild face sculpt.'],
  ['Crystal Golem', 'Cool crystal colors with a hard graphic contrast.'],
  ['Cosmic Sprite', 'Deep space purple with twinkling magical color.'],
  ['Shadow Imp', 'Dark violet shadows with bright mischievous eyes.'],
  ['Cloud Giant', 'Soft sky colors with a broad dreamy face.'],
  ['Mushroom Pixie', 'Forest reds and greens with a whimsical glow.'],
  ['Swamp Monster', 'Mossy green tones with a playful rough texture.'],
  ['Star Beast', 'Midnight blue and gold for a cosmic creature look.'],
  ['Lava Lizard', 'Volcanic red and orange with hot contrast.'],
  ['Coral Spirit', 'Coral pink and turquoise for an ocean fantasy style.'],
  ['Thunder Beast', 'Electric blue highlights with stormy contrast.'],
  ['Aurora Yeti', 'Icy teal and violet colors with a snowy glow.'],
];

const beautySeeds: LensSeed[] = [
  ['Soft Focus', 'Gentle portrait smoothing with a warm natural glow.'],
  ['Rose Blush', 'Soft rose cheeks with a polished romantic tint.'],
  ['Golden Hour', 'Warm golden light for a flattering sunset portrait.'],
  ['Glass Skin', 'Bright clean glow with a glossy beauty finish.'],
  ['Peach Glow', 'Fresh peach color and a soft radiant complexion.'],
  ['Berry Lips', 'Rich berry tint with a glamorous contrast boost.'],
  ['Sun Kissed', 'Warm bronzed color with a subtle luminous highlight.'],
  ['Lavender Beauty', 'Cool lavender tint with a dreamy soft finish.'],
  ['Cherry Pop', 'Vivid cherry color with a playful beauty sparkle.'],
  ['Pearl Shine', 'Pearlescent highlights for an elegant portrait look.'],
  ['Honey Glow', 'Honey-gold warmth with smooth skin luminosity.'],
  ['Coral Crush', 'Bright coral tint for a lively fresh style.'],
  ['Midnight Glam', 'Deep evening contrast with a polished glow.'],
  ['Blossom Face', 'Spring pink tones with delicate animated sparkle.'],
  ['Bronze Muse', 'Rich bronze warmth for a confident editorial look.'],
  ['Rose Gold', 'Pink-gold highlights with a refined glam finish.'],
  ['Natural Light', 'Balanced brightness and soft healthy color.'],
  ['Velvet Skin', 'Smooth low-contrast color for a soft velvet portrait.'],
  ['Ruby Red', 'Ruby warmth with vivid lips and a bold glow.'],
  ['Aqua Fresh', 'Cool aqua brightness for a clean refreshed look.'],
  ['Mauve Mood', 'Elegant mauve tones with gentle evening contrast.'],
  ['Buttercream', 'Creamy warm highlights for a soft cheerful portrait.'],
  ['Pink Champagne', 'Light sparkling pink with a celebratory glow.'],
  ['Electric Glam', 'Bright neon accents for a modern beauty look.'],
  ['Cocoa Glow', 'Rich cocoa warmth with soft golden highlights.'],
  ['Crystal Clear', 'Cool clarity and bright clean contrast.'],
  ['Tangerine Tint', 'Fresh orange warmth for an energetic portrait.'],
  ['Plum Velvet', 'Deep plum color with a luxurious soft finish.'],
  ['Mint Beauty', 'Fresh mint tint with a cool luminous glow.'],
  ['Dewy Morning', 'Soft bright morning light with gentle sparkle.'],
  ['Satin Shine', 'Polished satin highlights and subtle rosy color.'],
  ['Candlelight', 'Warm intimate lighting for a cozy elegant look.'],
  ['Festival Face', 'Playful vivid color with animated beauty sparkle.'],
  ['Editorial White', 'Crisp editorial brightness with clean contrast.'],
];

const classicSeeds: LensSeed[] = [
  ['Classic Mono', 'Timeless black-and-white portrait contrast.'],
  ['Sepia Story', 'Warm sepia tones inspired by vintage photographs.'],
  ['Film Grain', 'Cinematic muted color with a subtle film feeling.'],
  ['Noir Shadow', 'Dramatic black-and-white shadows for a detective mood.'],
  ['Polaroid Day', 'Bright nostalgic color inspired by instant film.'],
  ['Retro 60s', 'Soft faded colors with a cheerful 1960s character.'],
  ['Retro 70s', 'Warm amber tones and gentle vintage contrast.'],
  ['VHS Memory', 'Cool retro video color with soft contrast.'],
  ['Analog Blue', 'Faded blue film tones for a calm old-camera look.'],
  ['Faded Summer', 'Sun-washed vintage warmth with low contrast.'],
  ['Cinema Warm', 'Warm cinematic highlights and rich shadows.'],
  ['Cinema Cool', 'Cool theatrical color with polished contrast.'],
  ['Copper Film', 'Copper and amber film tones with a classic finish.'],
  ['Silver Screen', 'Clean monochrome inspired by classic cinema.'],
  ['Old Newspaper', 'High-contrast monochrome for a print-like mood.'],
  ['Sepia Portrait', 'Soft portrait sepia with gentle highlight warmth.'],
  ['Kodak Summer', 'Bright nostalgic colors with sunny warmth.'],
  ['Slide Film', 'Saturated slide-film color with crisp detail.'],
  ['Darkroom Red', 'Deep red darkroom mood with rich contrast.'],
  ['Midnight Film', 'Cool dark film tones for a late-night portrait.'],
  ['Golden Negative', 'Golden inverted-film feeling with bright highlights.'],
  ['Dusty Rose Film', 'Faded rose film colors for a nostalgic mood.'],
  ['Chrome Classic', 'Cool metallic contrast with a clean analog feel.'],
  ['Instant Flash', 'Direct flash brightness with punchy vintage color.'],
  ['Travel Journal', 'Warm documentary color for memory-making moments.'],
  ['Old Hollywood', 'Elegant monochrome contrast with movie-star polish.'],
  ['Café Film', 'Cozy brown film tones for a relaxed café mood.'],
  ['Summer 1999', 'Bright playful late-90s color and soft contrast.'],
  ['Winter Film', 'Cool pale colors for a quiet winter portrait.'],
  ['Classic Teal', 'Balanced teal and amber cinematic color.'],
  ['Classic Amber', 'Rich amber warmth with vintage depth.'],
  ['Classic Rose', 'Soft rose film color with gentle highlights.'],
  ['Classic Mint', 'Faded mint tones for a fresh analog look.'],
  ['Classic Violet', 'Subtle violet shadows with cinematic polish.'],
  ['Classic Cream', 'Creamy highlights and soft old-photo warmth.'],
  ['Classic Contrast', 'Crisp classic contrast for expressive portraits.'],
  ['Classic Fade', 'Low-contrast faded color with nostalgic softness.'],
  ['Classic Flashback', 'Bright memory-like color with a retro finish.'],
];

const styleSeeds: LensSeed[] = [
  ['Neon Nights', 'Electric neon color for a glowing night look.'],
  ['Cyber Grid', 'Futuristic cyan and violet energy with crisp contrast.'],
  ['Pastel Dream', 'Soft pastel gradient styling with gentle sparkle.'],
  ['Streetwear', 'Bold urban contrast for a confident street style.'],
  ['Sunset Haze', 'Pink-orange atmospheric color with warm glow.'],
  ['Ocean Blue', 'Clean blue color for a calm modern portrait.'],
  ['Purple Pulse', 'Vibrant purple styling with a rhythmic glow.'],
  ['Green Screen', 'Fresh green color with bright studio energy.'],
  ['Monochrome Pop', 'Minimal monochrome with one bold color accent.'],
  ['Glitch Mood', 'Digital contrast and playful color-channel energy.'],
  ['Disco Glow', 'Colorful party light with animated sparkle.'],
  ['Soft Academia', 'Warm muted tones for a bookish editorial style.'],
  ['Cottagecore', 'Soft greens and creams for a cozy pastoral mood.'],
  ['Dark Academia', 'Deep brown shadows with refined moody contrast.'],
  ['Y2K Shine', 'Bright nostalgic color with glossy early-digital energy.'],
  ['Kawaii Pop', 'Cheerful pink and cyan styling with soft glow.'],
  ['Royal Velvet', 'Rich jewel tones for a regal portrait style.'],
  ['Tropical Heat', 'Bright tropical color with energetic warmth.'],
  ['Arctic Light', 'Cool icy tones with clean luminous contrast.'],
  ['Desert Minimal', 'Warm sand tones with a clean modern finish.'],
  ['Urban Rain', 'Cool rainy-night colors with reflective contrast.'],
  ['Studio White', 'Bright neutral studio styling with polished clarity.'],
  ['Studio Black', 'Dark studio styling with elegant controlled contrast.'],
  ['Holographic', 'Iridescent color shifts for a futuristic portrait.'],
  ['Prism Light', 'Rainbow highlights with a clean fashion finish.'],
  ['Graffiti Color', 'Punchy street-art color with bold energy.'],
  ['Minimal Beige', 'Soft beige styling for a calm editorial portrait.'],
  ['Ruby Night', 'Deep red evening style with luminous accents.'],
  ['Sapphire Mood', 'Elegant sapphire blue for a modern night look.'],
  ['Emerald Mood', 'Rich emerald color with a fresh luxury feel.'],
  ['Silver Future', 'Cool silver styling with clean futuristic contrast.'],
  ['Golden Future', 'Warm gold styling with bright modern polish.'],
];

const makeLens = (category: LensCategory, [name, description]: LensSeed, index: number): Lens => {
  const accentColor = COLORS[index % COLORS.length];
  const id = `${category}-${slugify(name)}`;
  const isDistortion = category === 'funny' || category === 'creature' || (category === 'animal' && index % 5 === 0);
  const distortionTypes = ['bulge', 'pinch', 'stretch_h', 'stretch_v'] as const;
  const targets = ['face', 'eyes', 'mouth', 'jaw', 'forehead'] as const;
  const config: LensConfig = {
    colorFilter: {
      tint: accentColor,
      glow: accentColor,
      contrast: 1.02 + (index % 4) * 0.06,
      saturation: 1.05 + (index % 5) * 0.08,
      brightness: 0.98 + (index % 3) * 0.03,
    },
    animation: {
      sparkle: index % 3 === 0,
      wiggle: category === 'funny' || category === 'animal',
      pulseSpeed: 0.6 + (index % 5) * 0.2,
    },
  };

  if (isDistortion) {
    config.distortion = {
      type: distortionTypes[index % distortionTypes.length],
      targetRegion: targets[index % targets.length],
      intensity: 0.18 + (index % 5) * 0.08,
      radius: 0.32 + (index % 4) * 0.06,
    };
  }

  if (category === 'animal' && index % 3 === 0) {
    config.overlays = [{ element: index % 2 ? 'bunny_ears' : 'puppy_ears', anchor: 'forehead', scale: 0.8 }];
  } else if (category === 'creature' && index % 4 === 0) {
    config.overlays = [{ element: 'alien_antennae', anchor: 'forehead', scale: 0.7, color: accentColor }];
  } else if (category === 'beauty' && index % 2 === 0) {
    config.overlays = [{ element: 'blush', anchor: 'leftEye', scale: 0.8, color: accentColor }];
  }

  const effectType = config.distortion && config.overlays ? 'hybrid' : config.distortion ? 'distortion' : config.overlays ? 'overlay' : 'color_filter';
  const iconNames: Record<LensCategory, string[]> = {
    funny: ['happy-outline', 'sunny-outline', 'sad-outline', 'sparkles-outline'],
    animal: ['paw-outline', 'leaf-outline', 'heart-outline', 'fish-outline'],
    creature: ['flame-outline', 'planet-outline', 'moon-outline', 'skull-outline'],
    beauty: ['rose-outline', 'heart-outline', 'sparkles-outline', 'color-palette-outline'],
    classic: ['film-outline', 'camera-outline', 'image-outline', 'contrast-outline'],
    style: ['color-palette-outline', 'flash-outline', 'star-outline', 'diamond-outline'],
    background: ['image-outline'],
    ar: ['sparkles-outline'],
  };

  return {
    id,
    name,
    category,
    description,
    supportedCamera: 'both',
    effectType,
    iconName: iconNames[category][index % iconNames[category].length],
    accentColor,
    config,
  };
};

export const EXPANDED_LENSES: Lens[] = [
  ...funnySeeds.map((seed, index) => makeLens('funny', seed, index)),
  ...animalSeeds.map((seed, index) => makeLens('animal', seed, index)),
  ...creatureSeeds.map((seed, index) => makeLens('creature', seed, index)),
  ...beautySeeds.map((seed, index) => makeLens('beauty', seed, index)),
  ...classicSeeds.map((seed, index) => makeLens('classic', seed, index)),
  ...styleSeeds.map((seed, index) => makeLens('style', seed, index)),
];
