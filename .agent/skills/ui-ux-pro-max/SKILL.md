---
name: ui-ux-pro-max
description: AI-powered design intelligence with 50+ styles, 95+ color palettes, and automated design system generation. Use this skill when the user asks for design systems, UI styles, color palettes, or specific industry design advice.
---

# UI/UX Pro Max

This skill uses a Python-based reasoning engine to generate professional design systems and UI recommendations.

## Usage

To use this skill, you run the python script located in `scripts/search.py`.

### Generate Design System

When the user asks for a design system or UI plan for a project:

```bash
python .agent/skills/ui-ux-pro-max/scripts/search.py "YOUR SEARCH QUERY" --design-system -p "PROJECT_NAME"
```

Example:

```bash
python .agent/skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness" --design-system -p "Serenity Spa"
```

### Domain-Specific Search

For specific design elements:

```bash
# Colors
python .agent/skills/ui-ux-pro-max/scripts/search.py "pastel soothing" --domain color

# Typography
python .agent/skills/ui-ux-pro-max/scripts/search.py "modern sans serif" --domain typography

# UI Patterns
python .agent/skills/ui-ux-pro-max/scripts/search.py "dashboard layout" --domain pattern
```

### Stack Specific

```bash
python .agent/skills/ui-ux-pro-max/scripts/search.py "responsive navbar" --stack react
```

## Output

The script will output the design recommendations in the terminal. You should read this output and then implement the recommendations or present them to the user.
