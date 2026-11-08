# Build a Goldstack pilot character from a KayKit character.
# usage (Blender-as-python): python -I build.py ronin|bandit
import sys, math, bpy, bmesh, mathutils
sys.path.insert(0, '/home/claude/bltools')
from kk import load, setup_render, pose_at, render

WHICH = sys.argv[1]
D = '/home/claude/dl/kaykit/adv/addons/kaykit_character_pack_adventures/Characters/gltf/'
OUT = '/home/claude/pilot/'
CELL = {'straw': 0, 'lacquer': 1, 'gold': 2, 'steel': 3, 'crimson': 4, 'leather': 5, 'cream': 6, 'indigo': 7}

SPEC = {
    'ronin': dict(src='Knight', tex='ronin_tex.png',
                  drop=['Knight_Helmet', 'Knight_Cape', '1H_Sword_Offhand', '2H_Sword', 'Badge_Shield',
                        'Rectangle_Shield', 'Round_Shield', 'Spike_Shield'],
                  clips=['Idle', '2H_Melee_Idle', 'Running_A', 'Walking_A', '1H_Melee_Attack_Slice_Diagonal',
                         '1H_Melee_Attack_Slice_Horizontal', '1H_Melee_Attack_Chop', '2H_Melee_Attack_Spin',
                         'Hit_A', 'Death_A', 'Cheer', 'Spellcast_Raise']),
    'bandit': dict(src='Rogue_Hooded', tex='bandit_tex.png',
                   drop=['1H_Crossbow', '2H_Crossbow', 'Throwable', 'Knife_Offhand'],
                   clips=['Idle', 'Running_A', 'Walking_A', '1H_Melee_Attack_Stab', '1H_Melee_Attack_Chop',
                          'Hit_A', 'Death_A', 'Death_B']),
}[WHICH]


def uv_paint(obj, cell, lo=0.15, hi=0.85):
    """Map every face of a new part onto one custom swatch in row 3, shading top-light to bottom-dark by height."""
    me = obj.data
    if not me.uv_layers: me.uv_layers.new(name='UVMap')
    uv = me.uv_layers.active.data
    zs = [v.co.z for v in me.vertices]; z0, z1 = min(zs), max(zs); span = (z1 - z0) or 1
    u = (CELL[cell] + 0.5) / 8
    for p in me.polygons:
        for li in p.loop_indices:
            z = me.vertices[me.loops[li].vertex_index].co.z
            t = (z - z0) / span                      # 1 at top
            v = 0.25 * (1 - (lo + (hi - lo) * (1 - t)))  # row 3 spans v 0..0.25 (image bottom)
            uv[li].uv = (u, v)


def remap_cells(obj, mapping):
    """Move faces that sit in palette cell (col,row) onto a custom swatch, keeping their place inside the cell."""
    uv = obj.data.uv_layers.active.data
    for p in obj.data.polygons:
        u = sum(uv[i].uv.x for i in p.loop_indices) / len(p.loop_indices); v = sum(uv[i].uv.y for i in p.loop_indices) / len(p.loop_indices)
        key = (min(7, int(u * 8)), min(3, int((1 - v) * 4)))
        if key not in mapping: continue
        c, r = key; dst = CELL[mapping[key]]
        for li in p.loop_indices:
            fu = uv[li].uv.x * 8 - c; fv = (uv[li].uv.y - (1 - (r + 1) / 4)) * 4
            uv[li].uv = ((dst + fu) / 8, fv * 0.25)


def new_obj(name, bm, mat):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    me.materials.append(mat)
    return o


def world_bbox(o):
    pts = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
    return (mathutils.Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))),
            mathutils.Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts))))


def attach_to_bone(o, arm, bone):
    """Keep o where it is in the rest pose but parent it to a bone (same as the KayKit accessories)."""
    mw = o.matrix_world.copy()
    o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = bone
    bpy.context.view_layer.update(); o.matrix_world = mw


arm = load(D + SPEC['src'] + '.glb')
arm.data.pose_position = 'REST'
bpy.context.view_layer.update()
for o in list(bpy.data.objects):
    if o.type == 'MESH' and o.name in SPEC['drop']: bpy.data.objects.remove(o)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
mat = meshes[0].data.materials[0]
img = bpy.data.images.load(OUT + SPEC['tex']); img.pack()
for n in mat.node_tree.nodes:
    if n.type == 'TEX_IMAGE': n.image = img; n.interpolation = 'Closest'

if WHICH == 'ronin':
    for leg in ('Knight_LegLeft', 'Knight_LegRight'): remap_cells(bpy.data.objects[leg], {(3, 0): 'lacquer'})   # dark hakama
    head = bpy.data.objects['Knight_Head']; lo, hi = world_bbox(head)
    cx, cy = (lo.x + hi.x) / 2, (lo.y + hi.y) / 2
    # kasa (conical straw hat): the signature shape seen from the top-down camera
    bm = bmesh.new(); R = (hi.x - lo.x) * 0.72; Hh = R * 0.55
    bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=R, radius2=0.0, depth=Hh)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(cx, cy + 0.02, hi.z - (hi.z - lo.z) * 0.24 + Hh / 2))
    kasa = new_obj('Kasa', bm, mat); uv_paint(kasa, 'straw', 0.1, 0.7)
    # a crimson band where the hat meets the head
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=12, radius1=R * 0.62, radius2=R * 0.60, depth=Hh * 0.22)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(cx, cy + 0.02, hi.z - (hi.z - lo.z) * 0.24 + Hh * 0.08))
    band = new_obj('KasaBand', bm, mat); uv_paint(band, 'crimson')
    for o in (kasa, band): attach_to_bone(o, arm, 'head')

    # katana, built in the old sword's local space so it sits in the hand slot the same way
    sw = bpy.data.objects['1H_Sword']; c = [mathutils.Vector(v) for v in sw.bound_box]
    mn = mathutils.Vector((min(v.x for v in c), min(v.y for v in c), min(v.z for v in c)))
    mx = mathutils.Vector((max(v.x for v in c), max(v.y for v in c), max(v.z for v in c)))
    ext = mx - mn; ax = max(range(3), key=lambda i: ext[i])
    sgn = 1 if abs(mx[ax]) >= abs(mn[ax]) else -1
    L = max(abs(mx[ax]), abs(mn[ax])) * 1.08
    side = [i for i in range(3) if i != ax]; wide = max(side, key=lambda i: ext[i]); thin = [i for i in side if i != wide][0]
    def box(a0, a1, w, t, curve=0.0, cell='steel', segs=1):
        bm = bmesh.new()
        prev = None
        for s in range(segs + 1):
            f = s / segs; a = a0 + (a1 - a0) * f; off = curve * f * f
            ring = []
            for dw, dt in ((-w, -t), (w, -t), (w, t), (-w, t)):
                v = [0.0, 0.0, 0.0]; v[ax] = a * sgn; v[wide] = dw + off; v[thin] = dt
                ring.append(bm.verts.new(v))
            if prev:
                for k in range(4): bm.faces.new((prev[k], prev[(k + 1) % 4], ring[(k + 1) % 4], ring[k]))
            else: bm.faces.new(ring[::-1])
            prev = ring
        bm.faces.new(prev)
        o = new_obj('k', bm, mat); uv_paint(o, cell); return o
    s = L
    parts = [box(-0.24 * s, 0.03 * s, 0.035 * s * 0.9, 0.035 * s * 0.9, cell='lacquer'),          # wrapped handle
             box(0.03 * s, 0.06 * s, 0.075 * s, 0.075 * s, cell='gold'),                            # tsuba
             box(0.06 * s, 0.92 * s, 0.06 * s, 0.016 * s, curve=0.07 * s, cell='steel', segs=4)]  # curved blade
    for p in parts:
        p.parent = sw.parent; p.parent_type = sw.parent_type; p.parent_bone = sw.parent_bone
        p.matrix_parent_inverse = sw.matrix_parent_inverse.copy(); p.matrix_basis = sw.matrix_basis.copy()
    bpy.data.objects.remove(sw)

bpy.context.view_layer.update()
# merge every part into one skinned mesh: rigid accessories get a single 100% weight to their bone
body = [o for o in bpy.data.objects if o.type == 'MESH' and o.name.endswith('_Body')][0]
for o in [o for o in bpy.data.objects if o.type == 'MESH']:
    if o.parent_type == 'BONE':
        bone = o.parent_bone; mw = o.matrix_world.copy()
        o.parent = None; o.matrix_world = mw
        bpy.context.view_layer.objects.active = o
        for x in bpy.data.objects: x.select_set(x == o)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        vg = o.vertex_groups.new(name=bone); vg.add([v.index for v in o.data.vertices], 1.0, 'REPLACE')
    elif o.parent is None and o is not body:
        mw = o.matrix_world.copy(); o.matrix_world = mw
for x in bpy.data.objects: x.select_set(x.type == 'MESH')
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
body.name = WHICH
for p in body.data.polygons: p.use_smooth = False
tris = sum(len(p.vertices) - 2 for p in body.data.polygons)

# keep only the clips the game uses
for a in list(bpy.data.actions):
    if a.name not in SPEC['clips']: bpy.data.actions.remove(a)
arm.data.pose_position = 'POSE'
print('BUILD', WHICH, 'triangles', tris, 'clips', [a.name for a in bpy.data.actions])

# preview renders: idle and an attack
for nm, act, fr in (('idle', 'Idle', 12), ('atk', SPEC['clips'][4], 10)):
    pose_at(arm, act, fr); setup_render(420, target=(0, 0, 0.85), dist=5.2, elev=24, azim=28) if nm == 'idle' else None
    render(OUT + f'{WHICH}_{nm}.png')
arm.animation_data.action = None
for pb in arm.pose.bones: pb.matrix_basis = mathutils.Matrix()
for o in list(bpy.data.objects):
    if o.type in ('CAMERA', 'LIGHT'): bpy.data.objects.remove(o)

bpy.ops.export_scene.gltf(filepath=OUT + f'kay_{WHICH}.glb', export_format='GLB', export_animations=True,
                          export_animation_mode='ACTIONS', export_optimize_animation_size=True,
                          export_force_sampling=True, export_image_format='AUTO', export_yup=True,
                          export_apply=False, export_skins=True, export_morph=False, export_lights=False,
                          export_cameras=False)
print('EXPORTED', OUT + f'kay_{WHICH}.glb')
