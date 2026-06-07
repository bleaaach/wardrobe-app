---
name: "illustration-gen"
description: "Generates cute illustration images using Trae's text_to_image API. Invoke when user needs food, clothing, or lifestyle emoji-style illustrations for UI decoration, empty states, or hero sections. Supports animated GIF-style sequences."
---

# Illustration Generator

Generates warm, organic, emoji-style illustrations that match the Nourish-app aesthetic (cream backgrounds, soft shadows, hand-drawn feeling).

## API Endpoint

Use Trae's built-in image generation API:
```
https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt={URL_ENCODED_PROMPT}&image_size={SIZE}
```

## Prompt Rules

1. **Style keywords** (always include):
   - `cute 3d render`, `claymorphism`, `soft pastel colors`, `cream background`, `kawaii`, `emoji style`, `subtle drop shadow`, `studio lighting`

2. **Subject examples**:
   - Clothing: `cute 3d render of a cozy sweater, claymorphism, soft pastel colors, cream background, emoji style`
   - Food: `cute 3d render of an avocado half, claymorphism, soft pastel colors, cream background, kawaii`
   - Objects: `cute 3d render of a calendar, claymorphism, soft pastel colors, emoji style`

3. **Sizes**:
   - Icons: `square` (512x512)
   - Hero: `portrait_4_3` or `square_hd`
   - Banners: `landscape_4_3`

## Animation Sequence Generation

For animated illustrations (floating, bouncing), generate 3-4 frames with slightly different positions:
- Frame 1: normal position
- Frame 2: slightly higher (`floating up`)
- Frame 3: slight rotation (`tilted`)

Use `react-native-reanimated` to cycle through frames or apply transforms.

## Usage in Code

```tsx
// Static image
<Image source={{ uri: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square` }} />

// Animated floating emoji
<AnimatedEmoji prompt="cute 3d render of a strawberry" size={80} animation="float" />
```

## Best Practices

- Always URL-encode the prompt
- Use `square` size for emoji-style icons (80-120dp display size)
- Cache generated images to avoid repeated generation
- Prefer pastel, warm color palettes to match app theme
