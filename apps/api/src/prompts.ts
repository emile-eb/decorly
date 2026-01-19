import type { Env } from './env.js';

export type InteriorChoices = {
  roomType?: string; // e.g., Living Room
  style?: string; // e.g., Modern or Custom (with customStyle)
  customStyle?: string;
  palette?: { label?: string; colors?: string[] };
};

export type BuildPromptInput = {
  domain: 'interior' | 'floor' | 'garden' | 'paint' | 'exterior' | 'declutter';
  choices: any;
  analysis?: unknown; // optional analysis json from vision
};

export async function buildPrompt(env: Env, input: BuildPromptInput) {
  const { domain, choices } = input;

  // Build core lines
  const lines: string[] = [];
  if (domain === 'interior') {
    // If an override text is provided, use it verbatim for the interior long prompt
    const override = env.INTERIOR_PROMPT_OVERRIDE_TEXT?.trim();
    if (override) {
      lines.push(override);
      // Always include explicit style/palette lines even with override
      const styleText = choices.style === 'Custom' ? (choices.customStyle || '') : (choices.style || '');
      if (!styleText) throw new Error('Missing style for interior prompt');
      if (styleText) lines.push(`Target style: ${styleText}.`);
      const paletteLabelOv = (choices.palette?.label as string | undefined) || (choices.palette as string | undefined) || (choices.palette_label as string | undefined);
      const paletteColorsOv = (choices.palette?.colors as string[] | undefined) || (choices.palette_colors as string[] | undefined);
      if (paletteLabelOv) lines.push(`Use this color palette: ${paletteLabelOv}.`);
      if (paletteColorsOv?.length) lines.push(`Palette colors: ${paletteColorsOv.join(', ')}.`);
    } else {
      const styleText = choices.style === 'Custom' ? (choices.customStyle || '') : (choices.style || '');
      if (!styleText) throw new Error('Missing style for interior prompt');
      const STYLE = styleText; // no fallback; style must be provided by client
      const bulk = [
        `Restyle this exact room photo into a ${STYLE} interior. Preserve the architecture and geometry: do not change walls, windows, doors, ceiling, or built-in elements. Preserve the camera angle, perspective, and framing exactly. Keep the same layout and keep major furniture in the same positions and approximate sizes. Only update finishes, colors, textiles, decor, and furniture styling within the existing footprints. Keep lighting direction and time of day consistent with the original photo. Photorealistic, high detail.`,
        `Do not: add or remove windows/doors, change wall positions, change ceiling height, change floor plan, widen the room, create a new room, change the viewpoint, add extra rooms, or introduce impossible reflections. Do not turn it into a different house.`
      ].join("\n\n");
      lines.push(bulk);
      // Append palette guidance if provided by the user
      const paletteLabel = (choices.palette?.label as string | undefined) || (choices.palette as string | undefined) || (choices.palette_label as string | undefined);
      const paletteColors = (choices.palette?.colors as string[] | undefined) || (choices.palette_colors as string[] | undefined);
      if (paletteLabel) lines.push(`Use this color palette: ${paletteLabel}.`);
      if (paletteColors?.length) lines.push(`Palette colors: ${paletteColors.join(', ')}.`);
    }
  } else if (domain === 'floor') {
    lines.push('You are an expert interior designer and flooring specialist.');
    const ft = (choices.floorType as string | undefined)?.trim();
    const ftLower = (ft || '').toLowerCase();
    const isRug = !!ftLower && ftLower.includes('rug');

    if (isRug) {
      // Rug-specific variant
      lines.push(`Remove the existing rug and replace it with: ${ft}. If no rug is present, place this rug appropriately in the scene.`);
      if (choices.materialDesc) lines.push(`Material reference: ${choices.materialDesc}`);
      lines.push('Keep the existing flooring, walls, baseboards/trim, cabinetry, doors, and all other non‑rug elements unchanged.');
      lines.push('Preserve room geometry and camera angle exactly.');
      lines.push('Match scene lighting, shadows, and reflections to the original image.');
      lines.push('Avoid changing furniture layout; ensure rug placement and scale feel natural (e.g., under front furniture legs where appropriate) and maintain clearances at thresholds.');
    } else {
      // Standard floor replacement
      if (ft) lines.push(`Replace the existing floor with: ${ft}.`);
      if (choices.materialDesc) lines.push(`Material reference: ${choices.materialDesc}`);
      lines.push('Preserve room geometry and unedited areas (walls, baseboards, cabinetry) exactly.');
      lines.push('If a rug is present in the scene, keep the rug unchanged.');
      lines.push('Maintain correct perspective, scale, and alignment of planks/tiles with the room.');
      lines.push('Match existing lighting, reflections, and shadows; blend seams naturally.');
      lines.push('Avoid changing furniture layout; ensure transitions to rugs/thresholds look realistic.');
    }
  }
  else if (domain === 'garden') {
    lines.push('You are an expert landscape/garden designer.');
    const areaType = (choices.areaType as string | undefined) || (choices.area_type as string | undefined);
    const style = (choices.style as string | undefined) || (choices.gardenStyle as string | undefined);
    const features = (choices.features as string[] | undefined) || [];

    if (areaType) lines.push(`Area type: ${areaType}.`);
    if (style) lines.push(`Garden style: ${style}.`);
    if (features.length) lines.push(`Include the following features: ${features.join(', ')}.`);

    // Keep the photographed space dimensions and layout
    lines.push('Keep the dimensions of the space shown in the picture. Preserve boundaries, house footprint, and hardscape layout.');
    lines.push('Do not alter overall geometry; maintain correct perspective and proportions relative to existing elements.');
    lines.push('Retain existing grading and terrain: do not level, regrade, or alter slopes/elevation; keep the ground profile the same.');

    // General realism guidance
    lines.push('Ensure plant selections and placements feel cohesive with the style and listed features.');
    lines.push('Match scene lighting and shadows; avoid artifacts and text.');
  }
  else if (domain === 'paint') {
    lines.push('You are an expert interior paint color consultant.');
    const color = choices.color as { label?: string; hex?: string } | undefined;
    if (color?.label || color?.hex) {
      const pieces = [] as string[];
      if (color.label) pieces.push(color.label);
      if (color.hex) pieces.push(`(${color.hex})`);
      lines.push(`Apply wall paint color: ${pieces.join(' ')}.`);
    }
    // Keep the photographed space geometry and proportions
    lines.push('Keep the dimensions of the space shown in the picture. Do not change room layout, openings, or built-ins.');
    // Default assumptions for MVP
    lines.push('Paint only the walls; keep ceilings and trim clean and free of bleed.');
    lines.push('Do not alter windows/doors, furniture, flooring, or decor.');
    lines.push('Maintain realistic finish and lighting; avoid reflections or artifacts inconsistent with the scene.');
  }
  else if (domain === 'exterior') {
    lines.push('You are an expert exterior/facade designer.');
    const houseType = (choices.houseType as string | undefined) || (choices.house_type as string | undefined);
    const style = (choices.style as string | undefined) || (choices.homeStyle as string | undefined);
    const paletteLabel = choices.palette || choices.palette_label;
    const paletteColors = choices.palette_colors as string[] | undefined;

    if (houseType) lines.push(`House type: ${houseType}.`);
    if (style) lines.push(`Exterior style: ${style}.`);
    if (paletteLabel) lines.push(`Color palette: ${paletteLabel}.`);
    if (paletteColors?.length) lines.push(`Palette colors: ${paletteColors.join(', ')}.`);

    // Constraints to preserve structure and realism
    lines.push('Preserve facade geometry, roof shape/pitch, window and door openings, and overall building footprint.');
    lines.push('Do not add/remove openings, stories, or major architectural elements; do not change massing.');
    lines.push('Keep driveway, paths, and major hardscape locations the same.');
    lines.push('Maintain perspective and proportions; match scene lighting, shadows, and reflections.');
    lines.push('Adjust only finishes, materials, and colors (e.g., siding, trim, shutters, front door, roofing, stone/brick accents).');
    lines.push('Avoid artifacts, text, and unrealistic edges.');
  }
  else if (domain === 'declutter') {
    lines.push('You are an expert interior organizer. Declutter this photo without changing the room’s structure or core furnishings.');
    lines.push('Remove visible clutter: loose items, trash, toys, laundry, boxes, countertop and tabletop piles, floor clutter, excess toiletries, tangled cords/cables.');
    lines.push('Tidy surfaces: neatly group essentials; clear open surfaces where reasonable; hide small items in drawers/baskets/cabinets (not visible).');
    lines.push('Keep all architecture and major furniture exactly the same (walls, doors, windows, built-ins, cabinets, sofas, tables, beds, appliances).');
    lines.push('Keep wall art, lighting fixtures, and rugs unless they are clearly small movable clutter; do not add or remove furniture.');
    lines.push('Preserve layout, perspective, materials, colors, and finishes; do not repaint or restyle; do not change flooring or decor style.');
    lines.push('Maintain scene lighting, shadows, and reflections; avoid artifacts, watermarks, or text.');
    // Optional hints if provided on choices
    const focusAreas = (choices.areas as string[] | undefined) || (choices.focus_areas as string[] | undefined) || [];
    const keepList = (choices.keep as string[] | undefined) || (choices.keep_list as string[] | undefined) || [];
    if (focusAreas.length) lines.push(`Focus areas: ${focusAreas.join(', ')}.`);
    if (keepList.length) lines.push(`Keep list (never remove): ${keepList.join(', ')}.`);
  }

  return lines.filter(Boolean).join('\n');
}
