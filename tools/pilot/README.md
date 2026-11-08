# v102 pilot character build (Blender as a Python module)

Rebuilds `assets/models/kay_ronin-*.glb` and `kay_bandit-*.glb` from the CC0 KayKit Adventurers pack.

1. `pip install bpy` (Blender 5.2) into a venv; clone https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0
2. `python3 tex.py <knight_texture.png> ronin_tex.png '<cell remap json>'` (see the commands used in the commit message of v102)
3. `python build.py ronin` and `python build.py bandit` (paths at the top of build.py)
4. `npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 512`
5. Copy to `assets/models/` with an 8-character content hash in the name and update `KAY_DEFS` in goldstack-keep-game.js.
