"""Render the COAI brand sculpture locally with Blender; no external services."""
import bpy
import math
from pathlib import Path
from mathutils import Vector, Matrix

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 700
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = True
scene.world.color = (0.15, 0.15, 0.15)

def material(name, color, metallic, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    shader = nodes.new('ShaderNodeBsdfPrincipled')
    output = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(shader.outputs['BSDF'], output.inputs['Surface'])
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    return mat

gold = material('COAI champagne gold', (0.72, 0.46, 0.16), 0.85, 0.24)
blue = material('COAI blue iris', (0.045, 0.36, 0.55), 0.55, 0.19)
black = material('COAI pupil', (0.004, 0.012, 0.018), 0.15, 0.16)

curve = bpy.data.curves.new('Open signature ring', 'CURVE')
curve.dimensions = '3D'
curve.bevel_depth = 0.15
curve.bevel_resolution = 8
spline = curve.splines.new('POLY')
spline.points.add(160)
for i, point in enumerate(spline.points):
    angle = math.pi / 2 - (228 / 42) * i / 160
    point.co = (1.05 * math.cos(angle), 1.05 * math.sin(angle), 0, 1)
ring = bpy.data.objects.new('Gold open ring', curve)
bpy.context.collection.objects.link(ring)
ring.data.materials.append(gold)

def sphere(name, location, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True

for angle in [math.pi/2, math.pi/2 - 228/42]:
    sphere('Rounded ring end', (1.05*math.cos(angle), 1.05*math.sin(angle), 0), (0.15,)*3, gold)
sphere('Blue eye', (0, 0, 0), (0.275, 0.275, 0.17), blue)
sphere('Pupil', (0, 0, 0.165), (0.12, 0.12, 0.035), black)

# Keep the opening in the upper-left, as on the approved COAI mark.
rotation = Matrix.Rotation(math.radians(135), 4, 'Z')
bpy.context.view_layer.update()
for obj in list(scene.objects):
    if obj.type in {'MESH', 'CURVE'}:
        obj.matrix_world = rotation @ obj.matrix_world

def aim(obj, target=(0,0,0)):
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z', 'Y').to_euler()
for name, loc, energy, size in [('Softbox',(-3,4,5),700,4), ('Rim',(3,1,2),950,3), ('Fill',(-2,-3,2),350,2)]:
    bpy.ops.object.light_add(type='AREA', location=loc)
    lamp = bpy.context.object
    lamp.name = name
    lamp.data.energy = energy
    lamp.data.shape = 'DISK'
    lamp.data.size = size
    aim(lamp)
bpy.ops.object.camera_add(location=(0.7,0.3,7))
scene.camera = bpy.context.object
scene.camera.data.type = 'ORTHO'
scene.camera.data.ortho_scale = 4.1
aim(scene.camera)
scene.render.filepath = str(Path(__file__).resolve().parents[1] / 'public/brand/coai-sculpture-3d.png')
bpy.ops.wm.save_as_mainfile(filepath='/tmp/coai-brand-sculpture.blend')
bpy.ops.render.render(write_still=True)
