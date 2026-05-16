"""
Blender Python script to create a basketball.

Run from Blender's scripting tab or via:
  blender --background --python basketball.py
"""

import bpy
import math


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for collection in bpy.data.collections:
        bpy.data.collections.remove(collection)


def create_basketball_material():
    mat = bpy.data.materials.new(name="Basketball")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")

    # Orange basketball color
    bsdf.inputs["Base Color"].default_value = (0.8, 0.3, 0.05, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.85
    bsdf.inputs["Specular IOR Level"].default_value = 0.3

    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return mat


def create_seam_material():
    mat = bpy.data.materials.new(name="Seam")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")

    # Dark brown/black seam color
    bsdf.inputs["Base Color"].default_value = (0.05, 0.02, 0.01, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.9

    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return mat


def add_seam_curve(points, thickness=0.012, name="Seam"):
    """Create a seam from a list of (x, y, z) tuples along a sphere surface."""
    curve_data = bpy.data.curves.new(name=name, type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = thickness
    curve_data.bevel_resolution = 4
    curve_data.use_fill_caps = True

    spline = curve_data.splines.new("NURBS")
    spline.points.add(len(points) - 1)
    spline.use_endpoint_u = True
    spline.use_cyclic_u = True

    for i, (x, y, z) in enumerate(points):
        spline.points[i].co = (x, y, z, 1.0)

    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    return obj


def seam_circle(axis="z", angle_offset=0.0, tilt=0.0, segments=64, radius=1.002):
    """Generate points for a great-circle seam, optionally tilted."""
    pts = []
    for i in range(segments):
        theta = 2 * math.pi * i / segments + angle_offset
        if axis == "z":
            x = radius * math.cos(theta) * math.cos(tilt)
            y = radius * math.sin(theta)
            z = radius * math.cos(theta) * math.sin(tilt)
        elif axis == "x":
            y = radius * math.cos(theta) * math.cos(tilt)
            z = radius * math.sin(theta)
            x = radius * math.cos(theta) * math.sin(tilt)
        else:  # y
            x = radius * math.cos(theta) * math.cos(tilt)
            z = radius * math.sin(theta)
            y = radius * math.cos(theta) * math.sin(tilt)
        pts.append((x, y, z))
    return pts


def wavy_seam(plane="xz", wave_amp=0.3, segments=128, radius=1.002):
    """Generate the characteristic wavy basketball seam."""
    pts = []
    for i in range(segments):
        theta = 2 * math.pi * i / segments
        wave = wave_amp * math.sin(2 * theta)
        if plane == "xz":
            x = radius * math.cos(theta)
            y = radius * math.sin(wave)
            z = radius * math.sin(theta) * math.cos(wave)
        else:  # yz
            y = radius * math.cos(theta)
            x = radius * math.sin(wave)
            z = radius * math.sin(theta) * math.cos(wave)
        # Project back onto sphere
        length = math.sqrt(x**2 + y**2 + z**2)
        pts.append((radius * x / length, radius * y / length, radius * z / length))
    return pts


def create_basketball():
    clear_scene()

    # --- Ball ---
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=1.0, segments=64, ring_count=32, location=(0, 0, 0)
    )
    ball = bpy.context.active_object
    ball.name = "Basketball"

    # Smooth shading
    bpy.ops.object.shade_smooth()

    ball_mat = create_basketball_material()
    ball.data.materials.append(ball_mat)

    # Subdivision for better roundness
    sub = ball.modifiers.new("Subdivision", "SUBSURF")
    sub.levels = 2

    # --- Seams ---
    seam_mat = create_seam_material()

    # Two perpendicular wavy seams (the classic basketball pattern)
    seam_pts_xz = wavy_seam(plane="xz", wave_amp=0.28)
    seam_pts_yz = wavy_seam(plane="yz", wave_amp=0.28)

    seam1 = add_seam_curve(seam_pts_xz, name="Seam_XZ")
    seam2 = add_seam_curve(seam_pts_yz, name="Seam_YZ")

    seam1.data.materials.append(seam_mat)
    seam2.data.materials.append(seam_mat)

    # --- Camera ---
    bpy.ops.object.camera_add(location=(3.5, -3.5, 2.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(60), 0, math.radians(45))
    bpy.context.scene.camera = cam

    # --- Light ---
    bpy.ops.object.light_add(type="SUN", location=(5, 5, 8))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(30), math.radians(15), 0)

    bpy.ops.object.light_add(type="AREA", location=(-3, -3, 4))
    fill = bpy.context.active_object
    fill.data.energy = 50.0

    # --- Render settings ---
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 128
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.filepath = "/tmp/basketball_render.png"

    print("Basketball created successfully.")
    print("To render: bpy.ops.render.render(write_still=True)")


if __name__ == "__main__":
    create_basketball()
    # Uncomment to render immediately:
    # bpy.ops.render.render(write_still=True)
