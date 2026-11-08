# shared helpers for KayKit -> Goldstack builds (run with Blender-as-python)
import bpy, math, mathutils
def load(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    for o in list(bpy.data.objects):
        if o.name.startswith('Icosphere'): bpy.data.objects.remove(o)
    return [o for o in bpy.data.objects if o.type=='ARMATURE'][0]
def cells(o, cols=8, rows=4):
    uv=o.data.uv_layers.active.data; c={}
    for p in o.data.polygons:
        u=sum(uv[i].uv.x for i in p.loop_indices)/len(p.loop_indices); v=sum(uv[i].uv.y for i in p.loop_indices)/len(p.loop_indices)
        k=(min(cols-1,int(u*cols)), min(rows-1,int((1-v)*rows)))
        c[k]=c.get(k,0)+1
    return dict(sorted(c.items(),key=lambda kv:-kv[1]))
def setup_render(res=512, target=(0,0,0.9), dist=4.2, elev=14, azim=30):
    sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=24; sc.cycles.device='CPU'
    sc.render.resolution_x=res; sc.render.resolution_y=res; sc.render.film_transparent=False
    w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(0.75,0.85,0.95,1); w.node_tree.nodes['Background'].inputs[1].default_value=1.0
    sun=bpy.data.lights.new('sun','SUN'); sun.energy=3.0; so=bpy.data.objects.new('sun',sun); sc.collection.objects.link(so); so.rotation_euler=(math.radians(50),0,math.radians(35))
    cam=bpy.data.cameras.new('cam'); cam.lens=50; co=bpy.data.objects.new('cam',cam); sc.collection.objects.link(co); sc.camera=co
    a=math.radians(azim); e=math.radians(elev); t=mathutils.Vector(target)
    co.location=t+mathutils.Vector((math.sin(a)*math.cos(e)*dist, -math.cos(a)*math.cos(e)*dist, math.sin(e)*dist))
    co.rotation_euler=(t-co.location).to_track_quat('-Z','Y').to_euler()
    return co
def pose_at(arm, action, frame):
    arm.animation_data_create(); arm.animation_data.action=bpy.data.actions[action]
    try: arm.animation_data.action_slot=arm.animation_data.action.slots[0]
    except Exception: pass
    bpy.context.scene.frame_set(frame)
def render(path):
    bpy.context.scene.render.filepath=path; bpy.ops.render.render(write_still=True)
